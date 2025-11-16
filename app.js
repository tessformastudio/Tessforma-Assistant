/* Tessforma Assistant - client-side only
   - Voice input (Web Speech API)
   - Typing indicator
   - Quick replies
   - Multi-language support (en,de,yo)
   - Simple caching of services.json
*/

/* ---------- CONFIG ---------- */
const SERVICES_URL = 'data/services.json';          // create data/services.json
const CONFIG_URL   = 'data/assistant-config.json'; // create data/assistant-config.json

/* ---------- DOM ---------- */
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const micBtn  = document.getElementById('mic-btn');
const resetBtn = document.getElementById('reset-btn');
const scrollBtn = document.getElementById('scroll-bottom');
const toggleTheme = document.getElementById('toggle-theme');
const langSelect = document.getElementById('lang-select');
const quickActions = document.getElementById('quick-actions');
const servicesList = document.getElementById('services-list');
const academyList  = document.getElementById('academy-list');
const chatStatus = document.getElementById('chat-status');

/* ---------- STATE ---------- */
let SERVICES = [];               // loaded from services.json
let CONFIG = {};                 // loaded from assistant-config.json
let lang = localStorage.getItem('tess_lang') || 'en';
let recognition = null;
let listening = false;
let sessionMemory = {};          // temporary in-memory memory for session

/* ---------- UTILS ---------- */
function t(key, fallback){
  // Very small i18n: look up translations in CONFIG.translations
  if(CONFIG.translations && CONFIG.translations[lang] && CONFIG.translations[lang][key]){
    return CONFIG.translations[lang][key];
  }
  return fallback || key;
}
function el(tag, cls){ const e=document.createElement(tag); if(cls) e.className=cls; return e; }
function appendBot(text){ addMessage(text,'bot'); }
function appendUser(text){ addMessage(text,'user'); }

/* ---------- MESSAGE RENDER ---------- */
function addMessage(text, who='bot', meta={}){
  const wrapper = el('div', 'message fade-in ' + (who==='bot'?'bot':'user'));
  wrapper.innerHTML = `<div>${escapeHtml(text)}</div>`;
  if(meta.small) {
    const s = el('div','small');
    s.textContent = meta.small;
    wrapper.appendChild(s);
  }
  chatMessages.appendChild(wrapper);
  autoScroll();
}

/* escape user content */
function escapeHtml(unsafe){
  return String(unsafe)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

/* ---------- TYPING INDICATOR ---------- */
function showTyping(){
  const elT = el('div','message bot fade-in');
  elT.id='typing-indicator';
  elT.innerHTML = `<div class="typing">...</div>`;
  chatMessages.appendChild(elT);
  autoScroll();
}
function hideTyping(){
  const t = document.getElementById('typing-indicator');
  if(t) t.remove();
}

/* ---------- SCROLL ---------- */
function autoScroll(){
  chatMessages.scrollTop = chatMessages.scrollHeight;
  scrollBtn.hidden = true;
}
chatMessages.addEventListener('scroll', () => {
  const distanceFromBottom = chatMessages.scrollHeight - chatMessages.clientHeight - chatMessages.scrollTop;
  scrollBtn.hidden = distanceFromBottom < 60;
});
scrollBtn.addEventListener('click', autoScroll);

/* ---------- VOICE (Web Speech API) ---------- */
function setupSpeech(){
  try{
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRecognition) { micBtn.style.display='none'; return; }
    recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = ()=>{ listening=true; micBtn.classList.add('listening'); chatStatus.textContent='Listening...'; }
    recognition.onend = ()=>{ listening=false; micBtn.classList.remove('listening'); chatStatus.textContent='Ready'; }
    recognition.onerror = (e)=>{ listening=false; micBtn.classList.remove('listening'); chatStatus.textContent='Error'; console.error(e); }
    recognition.onresult = (ev) => {
      const txt = ev.results[0][0].transcript;
      chatInput.value = txt;
      handleSend();
    };
  }catch(err){
    console.warn('Speech not available', err);
    micBtn.style.display='none';
  }
}
micBtn.addEventListener('click', ()=>{
  if(!recognition) return;
  if(listening){ recognition.stop(); }
  else {
    recognition.lang = lang;
    recognition.start();
  }
});

/* ---------- MULTI-LANG ---------- */
function applyLanguage(){
  langSelect.value = lang;
  document.documentElement.lang = lang;
  // Update static labels (minimal)
  document.getElementById('hero-title').textContent = t('hero.title','Your Creative Assistant — Studio & Academy');
  document.getElementById('hero-sub').textContent = t('hero.sub','Quickly get pricing, see samples, request a quote, or enroll in Tessforma Academy.');
  document.getElementById('services-title').textContent = t('studio.title','Studio Services');
  document.getElementById('academy-title').textContent = t('academy.title','Tessforma Academy');
  // update recognition
  if(recognition) recognition.lang = lang;
}

/* ---------- LOAD SERVICES ---------- */
async function loadJSON(url){
  try{
    const res = await fetch(url, {cache:'no-store'});
    if(!res.ok) throw new Error('Failed load');
    return await res.json();
  }catch(err){
    console.warn('Failed to fetch', url, err);
    return null;
  }
}
async function loadData(){
  // try cache first (localStorage)
  const cachedServices = localStorage.getItem('tess_services_v1');
  if(cachedServices){
    try{ SERVICES = JSON.parse(cachedServices); renderServices(); }catch(e){}
  }
  const loaded = await loadJSON(SERVICES_URL);
  if(loaded){
    SERVICES = loaded;
    localStorage.setItem('tess_services_v1', JSON.stringify(SERVICES));
    renderServices();
  } else {
    // fallback if nothing loaded
    if(!SERVICES || SERVICES.length===0) {
      SERVICES = [
        {category:'Studio', items:[
          {id:'logo', title:'Logo Design', price:'₦8,000 — ₦30,000', description:'Modern logos, 2-3 options.'},
          {id:'flyer', title:'Flyer / Poster', price:'₦2,000 — ₦8,000', description:'Print/digital flyers.'}
        ]},
        {category:'Academy', items:[
          {id:'lessons', title:'Online Lessons', price:'From ₦1,500/hr', description:'Tailored lessons.'}
        ]}
      ];
      renderServices();
    }
  }
  // config file
  const cfg = await loadJSON(CONFIG_URL);
  if(cfg) {
    CONFIG = cfg;
    applyLanguage();
  }
}

/* ---------- RENDER SERVICES ---------- */
function renderServices(){
  servicesList.innerHTML='';
  academyList.innerHTML='';
  SERVICES.forEach(group => {
    const container = group.category && group.category.toLowerCase().includes('studio') ? servicesList : academyList;
    group.items.forEach(item => {
      const it = document.createElement('div');
      it.className='item';
      it.innerHTML = `<h4>${item.title}</h4><p class="small">${item.description || ''}</p><p class="small"><strong>${item.price || ''}</strong></p>
                      <div style="margin-top:8px"><button class="btn accent quick-ask" data-id="${item.id}">${t('ask','Ask')}</button>
                      <button class="btn outline show-sample" data-id="${item.id}">${t('sample','Sample')}</button></div>`;
      container.appendChild(it);
    });
  });
  // attach handlers on quick ask
  document.querySelectorAll('.quick-ask').forEach(b=>{
    b.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id;
      chatInput.value = `I need ${id} pricing`;
      handleSend();
    });
  });
  document.querySelectorAll('.show-sample').forEach(b=>{
    b.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id;
      showSample(id);
    });
  });
  // build quick action buttons
  quickActions.innerHTML = '';
  const quick = [
    {k:'logo', label:t('quick.logo','I want a logo')},
    {k:'book', label:t('quick.book','Book formatting')},
    {k:'enroll', label:t('quick.enroll','Enroll in Academy')}
  ];
  quick.forEach(q=>{
    const btn = document.createElement('button');
    btn.textContent = q.label;
    btn.addEventListener('click', ()=>{
      chatInput.value = q.label;
      handleSend();
    });
    quickActions.appendChild(btn);
  });
}

/* ---------- SAMPLE / ORDER HELP ---------- */
function showSample(id){
  showTyping();
  setTimeout(()=>{
    hideTyping();
    appendBot(`Here are sample ideas for ${id}. (You can ask: 'show me samples for ${id}')`);
  }, 600);
}

/* ---------- CHAT LOGIC (very small rule-based engine) ---------- */
function simpleBotResponse(message){
  // Lowercase message for easier matching
  const m = String(message || '').toLowerCase();
  // Intent: logo pricing
  if(/logo/.test(m) && /price|pricing|cost|how much|fee/.test(m)) {
    return `We create modern logos starting from ₦8,000. Would you like to see samples or request a quote?`;
  }
  if(/logo/.test(m) && /sample|example|show/.test(m)) {
    return `Here are logo sample ideas: minimalist, wordmark, emblem. Tell me which style you prefer.`;
  }
  if(/book|format/.test(m)) {
    return `Book formatting packages start from ₦5,000 for e-book layouts. Would you like a quote?`;
  }
  if(/academy|enroll|course/.test(m)) {
    return `Tessforma Academy offers online classes — send 'Enroll' + age group, or ask for the syllabus.`;
  }
  if(/contact|whatsapp|email|order/.test(m)) {
    return `You can contact us directly on WhatsApp: +234 901 834 1741 or email tessformastudio@gmail.com. Would you like me to open WhatsApp for you?`;
  }
  if(/help|what can you do|services/.test(m)) {
    return `I can help with: logo design, flyer/posters, book formatting, website creation, video editing, content writing, and Academy enrollment. Ask a service name for details.`;
  }
  // fallback
  return `Sorry, I didn't fully catch that. Try: "logo pricing", "show samples", "enroll academy" or ask for "contact".`;
}

/* ---------- HANDLE SEND ---------- */
async function handleSend(){
  const text = chatInput.value.trim();
  if(!text) return;
  appendUser(text);
  chatInput.value='';
  showTyping();
  // small simulated "thinking" time, then respond
  setTimeout(()=>{
    hideTyping();
    // simple rule-based response
    const reply = simpleBotResponse(text);
    appendBot(reply);
    sessionMemory.lastQuery = text;
  }, 650);
}

/* ---------- RESET CONVERSATION ---------- */
function resetConversation(){
  chatMessages.innerHTML='';
  appendBot(t('welcome','Hello 👋 Welcome to Tessforma Assistant — how can we help today?'));
  sessionMemory = {};
}

/* ---------- THEME ---------- */
function setupTheme(){
  const saved = localStorage.getItem('tess_theme');
  if(saved) document.documentElement.setAttribute('data-theme', saved);
  toggleTheme.addEventListener('click', ()=>{
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('tess_theme', next);
    toggleTheme.textContent = next==='light' ? '🌙' : '☀️';
  });
}

/* ---------- LANG SELECT ---------- */
langSelect.addEventListener('change', (e)=>{
  lang = e.target.value;
  localStorage.setItem('tess_lang', lang);
  applyLanguage();
});

/* ---------- OFFLINE DETECTION ---------- */
window.addEventListener('offline', ()=> {
  appendBot('You are offline. The assistant will still provide basic help from cached data.');
});
window.addEventListener('online', ()=> {
  appendBot('Back online. Data refreshed.');
  loadData();
});

/* ---------- EVENTS ---------- */
sendBtn.addEventListener('click', handleSend);
chatInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') handleSend(); });
resetBtn.addEventListener('click', resetConversation);

/* ---------- INIT ---------- */
async function init(){
  // initial messages
  resetConversation();
  // load services and config
  await loadData();
  // set language UI
  applyLanguage();
  // setup speech
  setupSpeech();
  // theme
  setupTheme();
  // attach quick sample buttons (already part of renderServices)
  appendBot(t('hint','Tip: Try "logo pricing" or "enroll academy" to get started.'));
}
init();
