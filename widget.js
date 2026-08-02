// MyDevKits chat widget: injected on every page.
(function(){
var st=document.createElement("style");st.textContent="\n#mdk-chat-btn{position:fixed;right:22px;bottom:22px;width:62px;height:62px;\n  border-radius:0;background:#0d1726 url('img/chat_astro.jpg') center/cover no-repeat;\n  cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.45);z-index:9998;\n  border:2px solid #35d399;padding:0}\n#mdk-chat-btn::after{content:'';position:absolute;right:-6px;top:-6px;width:14px;height:14px;\n  background:#35d399;border:2px solid #f6f8fb}\n#mdk-chat-btn:hover{filter:brightness(1.15)}\n#mdk-chat{position:fixed;right:22px;bottom:92px;width:330px;max-width:92vw;\n  background:#0d1726;border:1px solid #1f3a5c;border-radius:0;z-index:9999;\n  display:none;flex-direction:column;overflow:hidden;\n  box-shadow:0 12px 40px rgba(0,0,0,.55);font-family:'Segoe UI',system-ui,sans-serif}\n#mdk-chat.open{display:flex}\n#mdk-head{background:#0a1f3c;padding:14px 16px;border-bottom:1px solid #1f3a5c}\n#mdk-head b{color:#dbe4f3;font-size:15px}\n#mdk-head span{display:block;color:#8fa2bd;font-size:12px;margin-top:3px}\n#mdk-msgs{flex:1;max-height:300px;overflow-y:auto;padding:12px;display:flex;\n  flex-direction:column;gap:8px}\n.mdk-m{max-width:85%;padding:8px 12px;border-radius:0;font-size:13.5px;\n  line-height:1.45;white-space:pre-wrap;word-wrap:break-word}\n.mdk-v{align-self:flex-end;background:#35d399;color:#052018}\n.mdk-o{align-self:flex-start;background:#122036;color:#dbe4f3;border:1px solid #1f3a5c}\n#mdk-form{padding:10px;border-top:1px solid #1f3a5c;display:flex;flex-direction:column;gap:8px}\n#mdk-form input,#mdk-form textarea{background:#0a1220;border:1px solid #1f3a5c;\n  border-radius:0;color:#dbe4f3;padding:8px 10px;font-size:13px;outline:none;\n  font-family:inherit;resize:none}\n#mdk-form input:focus,#mdk-form textarea:focus{border-color:#7cd4fc}\n#mdk-send:active,#mdk-chat-btn:active{transform:translateY(1px)}\n#mdk-send{background:#35d399;color:#052018;border:none;border-radius:0;\n  padding:9px;font-weight:700;font-size:14px;cursor:pointer}\n#mdk-note{color:#5d738f;font-size:11px;text-align:center;padding-bottom:8px}\n#mdk-id{display:none;color:#5d738f;font-size:11px;padding:0 2px}\n#mdk-id a{color:#7cd4fc;cursor:pointer;text-decoration:underline}\n";
document.head.appendChild(st);
document.body.insertAdjacentHTML("beforeend",'</style>\n<button id="mdk-chat-btn" aria-label="Chat with us" title="Chat with us"></button>\n<div id="mdk-chat">\n  <div id="mdk-head" style="display:flex;align-items:center;gap:10px"><img src="img/chat_astro.jpg" alt="" style="width:36px;height:36px;border:1px solid #35d399">\n    <div><b>MyDevKits</b>\n    <span>Ask us anything. Replies usually land in a few minutes.</span></div></div>\n  <div id="mdk-msgs"></div>\n  <form id="mdk-form">\n    <div id="mdk-id"></div>\n    <input id="mdk-name" type="text" placeholder="Your name">\n    <input id="mdk-email" type="email" placeholder="Your email (so we can reply if you leave)">\n    <div style="color:#5d738f;font-size:10.5px;line-height:1.5;margin-top:-2px">By\n    sharing your email you agree we may contact you about your question and\n    send occasional MyDevKits release updates. No spam, unsubscribe anytime.</div>\n    <textarea id="mdk-text" rows="2" placeholder="Type your question..." required></textarea>\n    <button id="mdk-send" type="submit">Send</button>\n  </form>\n  <div id="mdk-note">Answered by a human - or instantly by our assistant, using human-approved replies. Built with our own kit, naturally.</div>\n</div>');
})();

(function(){
  var CHAT_URL="https://mydevkits-chat.jcarpinteria21.workers.dev";
  var btn=document.getElementById('mdk-chat-btn'),panel=document.getElementById('mdk-chat'),
      msgs=document.getElementById('mdk-msgs'),form=document.getElementById('mdk-form'),
      text=document.getElementById('mdk-text'),email=document.getElementById('mdk-email'),
      nameEl=document.getElementById('mdk-name');
  var convo=localStorage.getItem('mdk_convo');
  if(!convo){convo=Date.now().toString(36)+Math.random().toString(36).slice(2,12);
    localStorage.setItem('mdk_convo',convo);}
  var saved=localStorage.getItem('mdk_email');if(saved)email.value=saved;
  var savedName=localStorage.getItem('mdk_name');if(savedName)nameEl.value=savedName;
  var consentEl=null;Array.prototype.forEach.call(form.querySelectorAll('div'),function(d){if(d.id!=='mdk-id'&&d.textContent.indexOf('sharing your email')>-1)consentEl=d;});
  function paintIdentity(){
    var n=nameEl.value.trim(),em2=email.value.trim();
    var bar=document.getElementById('mdk-id');
    if(!(n&&em2)||!bar)return;
    nameEl.style.display='none';email.style.display='none';
    if(consentEl)consentEl.style.display='none';
    bar.style.display='block';
    bar.innerHTML='chatting as <b style="color:#dbe4f3">'+n.replace(/</g,'&lt;')+
      '</b> &middot; '+em2.replace(/</g,'&lt;')+' &nbsp;<a id="mdk-change">change</a>';
    document.getElementById('mdk-change').onclick=function(){
      bar.style.display='none';nameEl.style.display='';email.style.display='';
      if(consentEl)consentEl.style.display='';nameEl.focus();};
  }
  paintIdentity();
  var timer=null,lastCount=-1;
  btn.onclick=function(){panel.classList.toggle('open');
    if(panel.classList.contains('open')){poll();timer=setInterval(poll,8000);text.focus();}
    else clearInterval(timer);};
  function render(list){
    if(list.length===lastCount)return;lastCount=list.length;
    msgs.innerHTML='';
    list.forEach(function(m){var d=document.createElement('div');
      d.className='mdk-m '+(m.from==='visitor'?'mdk-v':'mdk-o');
      d.textContent=m.text;msgs.appendChild(d);});
    msgs.scrollTop=msgs.scrollHeight;}
  function poll(){
    if(CHAT_URL.indexOf('PASTE')===0)return;
    fetch(CHAT_URL+'/replies?convo='+convo).then(function(r){return r.json();})
      .then(function(d){if(d.messages)render(d.messages);}).catch(function(){});}
  form.onsubmit=function(e){
    e.preventDefault();
    var t=text.value.trim();if(!t)return;
    localStorage.setItem('mdk_email',email.value);
    localStorage.setItem('mdk_name',nameEl.value);
    paintIdentity();
    fetch(CHAT_URL+'/msg',{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({convo:convo,text:t,email:email.value,
        name:nameEl.value.trim()||(email.value?email.value.split('@')[0]:'')})})
      .then(function(){text.value='';poll();}).catch(function(){});
    var d=document.createElement('div');d.className='mdk-m mdk-v';
    d.textContent=t;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;};
})();


// Launch-list forms -> the same drop-box the chat uses -> the hub inbox.
(function(){
  var CHAT_URL="https://mydevkits-chat.jcarpinteria21.workers.dev";
  var forms=document.querySelectorAll('form.ll-form');
  Array.prototype.forEach.call(forms,function(f){
    f.onsubmit=function(e){
      e.preventDefault();
      var inp=f.querySelector('input[type=email]');
      var em=inp.value.trim();if(!em)return;
      var kit=f.getAttribute('data-kit')||'General';
      var btn=f.querySelector('button');btn.disabled=true;btn.textContent="Adding you...";
      var convo="launch-"+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
      fetch(CHAT_URL+"/msg",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({convo:convo,name:em.split('@')[0],email:em,
          text:"LAUNCH LIST SIGNUP\nKit: "+kit+"\nEmail: "+em+"\nPage: "+location.pathname})})
        .then(function(){
          var ok=document.createElement('div');ok.className='ll-ok';
          if(f.classList.contains('ll-center')){ok.style.marginLeft='auto';ok.style.marginRight='auto';ok.style.textAlign='center';}
          ok.textContent="You're on the list. One email when it launches - that's it.";
          f.parentNode.insertBefore(ok,f);f.style.display='none';
          var n=f.nextElementSibling;if(n&&n.classList.contains('ll-note'))n.style.display='none';
        })
        .catch(function(){btn.disabled=false;btn.textContent="Try again";});
    };
  });
})();

// Pre-order popup: any .po-btn opens it, tagged with that button's data-kit.
(function(){
  var CHAT_URL="https://mydevkits-chat.jcarpinteria21.workers.dev";
  var btns=document.querySelectorAll('.po-btn');
  if(!btns.length)return;
  document.body.insertAdjacentHTML('beforeend',
    '<div id="po-back"></div>'+
    '<div id="po-modal"><div class="pm-head"><b id="pm-title">Pre-order</b>'+
    '<button class="pm-x" id="pm-x" aria-label="Close">&times;</button></div>'+
    '<div class="pm-body"><p id="pm-copy"></p>'+
    '<form id="pm-form">'+
    '<input id="pm-name" type="text" required placeholder="Your name">'+
    '<input id="pm-email" type="email" required placeholder="you@business.com">'+
    '<textarea id="pm-note" rows="2" placeholder="Anything we should know? (optional)"></textarea>'+
    '<button class="btn btn-green" type="submit">Pre-order &middot; pay nothing today</button>'+
    '<div class="pm-fine">Pre-ordering is free and reserves your spot. No payment now, no obligation; '+
    'you get first access and the launch price when it ships. No spam, unsubscribe anytime.</div>'+
    '</form></div></div>');
  var back=document.getElementById('po-back'),modal=document.getElementById('po-modal'),
      title=document.getElementById('pm-title'),copy=document.getElementById('pm-copy'),
      form=document.getElementById('pm-form'),curKit='';
  function open(kit){curKit=kit;
    title.textContent='Pre-order · '+kit;
    copy.innerHTML='You’re pre-ordering <b>'+kit+'</b>. The kits with the most pre-orders get built and released first — your name literally moves it up the workshop line.';
    back.style.display='block';modal.style.display='block';
    document.getElementById('pm-name').focus();}
  function close(){back.style.display='none';modal.style.display='none';}
  Array.prototype.forEach.call(btns,function(b){
    b.addEventListener('click',function(){open(b.getAttribute('data-kit')||'a kit');});});
  back.onclick=close;document.getElementById('pm-x').onclick=close;
  form.onsubmit=function(e){
    e.preventDefault();
    var nm=document.getElementById('pm-name').value.trim(),
        em=document.getElementById('pm-email').value.trim(),
        nt=document.getElementById('pm-note').value.trim();
    var btn=form.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='Reserving...';
    var convo='preorder-'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
    fetch(CHAT_URL+'/msg',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({convo:convo,name:nm,email:em,
        text:'PRE-ORDER\nKit: '+curKit+'\nName: '+nm+'\nEmail: '+em+'\nNote: '+(nt||'(none)')+'\nPage: '+location.pathname})})
      .then(function(){
        modal.querySelector('.pm-body').innerHTML=
          '<p style="font-size:15px;color:var(--ink)"><b style="color:var(--green-dark)">You’re pre-ordered for '+curKit+'.</b><br><br>'+
          'No payment today. You’ll get first access and the launch price the moment it ships — and your vote just moved it up the build queue.</p>'+
          '<button class="btn btn-ghost" style="width:100%" onclick="document.getElementById(\'po-back\').click()">Done</button>';})
      .catch(function(){btn.disabled=false;btn.textContent='Try again';});};
})();

// "What should we build next" box -> the inbox.
(function(){
  var CHAT_URL="https://mydevkits-chat.jcarpinteria21.workers.dev";
  var f=document.getElementById('suggest-form');
  if(!f)return;
  f.onsubmit=function(e){
    e.preventDefault();
    var want=document.getElementById('sg-want').value.trim(),
        em=document.getElementById('sg-email').value.trim();
    var btn=f.querySelector('button');btn.disabled=true;btn.textContent='Sending...';
    var convo='kitidea-'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);
    fetch(CHAT_URL+'/msg',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({convo:convo,name:em?em.split('@')[0]:'visitor',email:em,
        text:'KIT REQUEST\nWants: '+want+'\nEmail: '+(em||'(none)')})})
      .then(function(){
        var ok=document.createElement('div');ok.className='ll-ok';
        ok.textContent='Got it. It goes straight to the workshop list — the most-requested build gets made next.';
        f.parentNode.insertBefore(ok,f);f.style.display='none';})
      .catch(function(){btn.disabled=false;btn.textContent='Try again';});};
})();
