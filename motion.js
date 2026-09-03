/* ===========================================================================
   motion.js — the moving layer.

   Self contained, no library, no network. Pairs with motion.css.

   Guiding rule: the page must be complete and readable before this file runs
   and must stay complete if it never runs at all. Nothing here creates
   content. It only adds movement to content that is already there.
   ========================================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia &&
               window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;                       // asked for stillness, give stillness

  /* ---------------------------------------------------------------------
     1. Scroll reveals.

     IntersectionObserver rather than a scroll handler, because the browser
     does the work off the main thread and it costs nothing while idle.
     Anything already on screen at load is revealed immediately, so the top
     of the page is never blank waiting for a scroll that has not happened.
     --------------------------------------------------------------------- */
  function reveals() {
    var hero = document.querySelector(".panel");
    var targets = [];

    // Panels: the words rise, then the picture beside them.
    Array.prototype.forEach.call(document.querySelectorAll(".panel"), function (p) {
      var pitch = p.querySelector(".ppitch");
      var vis = p.querySelector(".pvisual");
      if (pitch) { pitch.classList.add("mdk-rise", "mdk-stagger"); targets.push(pitch); }
      if (vis) { vis.classList.add("mdk-rise"); targets.push(vis); }
    });

    // The hero has no .ppitch, so take its inner column directly.
    if (hero && !hero.querySelector(".ppitch")) {
      var col = hero.querySelector("div[style*='max-width']");
      if (col) {
        col.classList.add("mdk-rise", "mdk-stagger", "mdk-first");
        targets.push(col);
      }
    }

    // The promise grid and its heading.
    var promise = document.getElementById("promise");
    if (promise) {
      promise.classList.add("mdk-rise");
      targets.push(promise);
      var grid = promise.querySelector(".promises");
      if (grid) { grid.classList.add("mdk-stagger"); targets.push(grid); }
    }

    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {         // old browser, just show it
      targets.forEach(function (t) { t.classList.add("mdk-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("mdk-in");
        io.unobserve(e.target);                        // reveal once, then forget
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    targets.forEach(function (t) {
      // Already in view at load? Show it now rather than on the first scroll.
      var r = t.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) t.classList.add("mdk-in");
      else io.observe(t);
    });
  }

  /* ---------------------------------------------------------------------
     2. Scroll progress line.
     --------------------------------------------------------------------- */
  function progress() {
    var bar = document.createElement("div");
    bar.id = "mdk-prog";
    document.body.appendChild(bar);
    var ticking = false;
    function paint() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = Math.max(0, Math.min(100, pct)) + "%";
      ticking = false;
    }
    addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    paint();
  }

  /* ---------------------------------------------------------------------
     3. The hero network.

     Drifting points joined by lines when they come near each other. The
     cursor pushes the field gently, which is what makes it read as alive
     rather than as a looping background video.

     Three things keep it cheap:
       - point count scales with area, capped hard
       - device pixel ratio capped at 2
       - the loop stops entirely when the hero scrolls out of view or the
         tab is hidden, so it never burns a laptop battery in a background tab
     --------------------------------------------------------------------- */
  function network() {
    var hero = document.querySelector(".panel");
    if (!hero || !hero.querySelector(".heroglow")) return;   // only the hero panel

    var cv = document.createElement("canvas");
    cv.id = "mdk-net";
    cv.setAttribute("aria-hidden", "true");
    hero.insertBefore(cv, hero.firstChild);

    var ctx = cv.getContext("2d", { alpha: true });
    if (!ctx) return;

    var pts = [], w = 0, h = 0, dpr = 1, raf = 0, running = false;
    var mouse = { x: -9999, y: -9999 };
    var LINK = 132;                       // px between points before a line is drawn

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = hero.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // One point per ~13k square px, clamped. A phone gets about 24, a wide
      // desktop about 70, and nothing ever gets a number that stutters.
      var want = Math.round((w * h) / 13000);
      want = Math.max(18, Math.min(70, want));
      if (window.innerWidth < 700) want = Math.min(want, 30);

      while (pts.length > want) pts.pop();
      while (pts.length < want) {
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: 1.1 + Math.random() * 1.5
        });
      }
      for (var i = 0; i < pts.length; i++) {          // keep points inside a resize
        if (pts[i].x > w) pts[i].x = Math.random() * w;
        if (pts[i].y > h) pts[i].y = Math.random() * h;
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;

        // A soft push away from the cursor, falling off with distance.
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 16000 && d2 > 0.01) {
          var f = (1 - d2 / 16000) * 0.6;
          var d = Math.sqrt(d2);
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }
      }

      // Lines first so the dots sit on top of them.
      for (var a = 0; a < pts.length; a++) {
        for (var b = a + 1; b < pts.length; b++) {
          var ax = pts[a].x - pts[b].x, ay = pts[a].y - pts[b].y;
          var dist = Math.sqrt(ax * ax + ay * ay);
          if (dist > LINK) continue;
          var alpha = (1 - dist / LINK) * 0.30;
          ctx.strokeStyle = "rgba(53,211,153," + alpha.toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pts[a].x, pts[a].y);
          ctx.lineTo(pts[b].x, pts[b].y);
          ctx.stroke();
        }
      }

      for (var k = 0; k < pts.length; k++) {
        ctx.fillStyle = "rgba(61,144,186,.42)";
        ctx.beginPath();
        ctx.arc(pts[k].x, pts[k].y, pts[k].r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { if (running) { running = false; cancelAnimationFrame(raf); } }

    size();
    cv.classList.add("on");
    start();

    hero.addEventListener("mousemove", function (e) {
      var r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener("mouseleave", function () { mouse.x = mouse.y = -9999; });

    // Stop when it cannot be seen. Both of these matter on a laptop.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es[0].isIntersecting ? start() : stop();
      }, { threshold: 0 }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : start();
    });

    var rt;
    addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(size, 150);
    }, { passive: true });
  }

  function boot() { reveals(); progress(); network(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
