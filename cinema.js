/* cinema.js: the moving layer for the cinema pages. Reveals, the hero stage settling into place, the sticky phone
   switching screens as the story scrolls, the nav going light over light sections, and the lead form's thank-you.
   The page is complete without it. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // reveals
  var rv = document.querySelectorAll(".rv");
  if (reduce || !("IntersectionObserver" in window)) {
    rv.forEach(function (e) { e.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    rv.forEach(function (e, i) { e.style.transitionDelay = Math.min(i % 6, 4) * 60 + "ms"; io.observe(e); });
  }

  // hero stage settles when it comes into view
  var stage = document.getElementById("stage");
  if (stage) {
    if (reduce) stage.classList.add("in");
    else setTimeout(function () { stage.classList.add("in"); }, 250);
  }

  // sticky phone: which step is nearest the middle of the screen decides which screen shows
  var steps = document.querySelectorAll(".story .step");
  var apps = document.querySelectorAll(".phone .app");
  function pick() {
    var mid = window.innerHeight * 0.5, best = null, bestD = 1e9;
    steps.forEach(function (s) {
      var r = s.getBoundingClientRect(), c = r.top + r.height / 2, d = Math.abs(c - mid);
      if (d < bestD) { bestD = d; best = s; }
    });
    steps.forEach(function (s) { s.classList.toggle("on", s === best); });
    var want = best ? best.getAttribute("data-step") : "site";
    apps.forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-app") === want); });
  }
  if (steps.length) {
    var t;
    window.addEventListener("scroll", function () { if (!t) t = requestAnimationFrame(function () { pick(); t = null; }); }, { passive: true });
    pick();
  }

  // nav goes light over light sections
  var nav = document.getElementById("cnav");
  var lights = document.querySelectorAll("section.light, .light");
  function navTone() {
    var y = 30, light = false;
    lights.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) light = true; });
    nav.classList.toggle("light", light);
  }
  if (nav && lights.length) { window.addEventListener("scroll", navTone, { passive: true }); navTone(); }

  // lead form result
  var q = new URLSearchParams(location.search).get("lead");
  if (q === "ok") { var f = document.getElementById("leadform"); if (f) f.style.display = "none"; var ok = document.getElementById("thanks"); if (ok) { ok.style.display = "block"; ok.scrollIntoView({ block: "center" }); } }
  if (q === "missing") { var m = document.getElementById("missing"); if (m) { m.style.display = "block"; m.scrollIntoView({ block: "center" }); } }
})();
