/* Tessforma Assistant - client-side app.js
   - Intent matching using model.json
   - Multilingual support via translations.json
   - Inline & sidebar payments
   - Dark mode & contrast fixes
   - Simple voice-to-text (browser) with fallback
*/

const CHAT = {
  messagesEl: null,
  inputEl: null,
  formEl: null,
  lang: 'en',
  model: null,
  translations: null,
  dark: false,
  services: null
};

function $(sel){return document.querySelector(sel)}
function createElement(tag, cls, text){ const e=document.createElement(tag); if(cls) e.className=cls; if(text) e.textContent=text; return e; }

/* Initialize */
window.addEventListener('DOMContentLoaded', async () => {
  CHAT.messagesEl = $('#chat-messages');
  CHAT.inputEl = $('#user-input');
  CHAT.formEl = $('#chat-form');

  // load model and translations (they're loaded as files but we can fetch)
  CHAT.model = await fetch('model.json').then(r=>r.json()).catch(()=>null);
  CHAT.translations = await fetch('translations.json').then(r=>r.json()).catch(()=>null);

  // UI hooks
  setupUI();
  welcomeMessage();
});

/* UI setup */
function setupUI(){
  // language select
  $('#lang-select').value = CHAT.lang;
  $('#lang-select').addEventListener('change', e=>{
    CHAT.lang = e.target.value;
    showSystem(`${t('language_changed')} (${CHAT.lang})`);
  });

  // dark toggle
  const darkToggle = $('#dark-toggle');
  darkToggle.checked = document.documentElement.classList.contains('dark');
  darkToggle.addEventListener('change', e=>{
    CHAT.dark = e.target.checked;
    document.documentElement.classList.toggle('dark', CHAT.dark);
    adjustContrast();
  });

  // nav buttons
  document.querySelectorAll('.nav-btn[data-intent]').forEach(btn=>{
    btn.addEventListener('click', ()=>handleIntent(btn.dataset.intent));
  });
  $('#help-btn').addEventListener('click', ()=>openContact());

  // payments
  $('#pay-card').addEventListener('click', ()=>openPay('card'));
  $('#pay-bank').addEventListener('click', ()=>openPay('bank'));
  document.getElementById('inline-payments').addEventListener('click', (ev)=>{
    if(ev.target.matches('.pay-inline')) openPay(ev.target.dataset.method);
  });

  // voice
  let recognition = null;
  if('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = CHAT.lang;
    recognition.interimResults = false;
    $('#voice-btn').addEventListener('click', ()=> {
      recognition.start();
      $('#voice-btn').textContent = '🎙️..';
    });
    recognition.onresult = (e) => {
      const t = e.results[0][0].transcript;
      $('#voice-btn').textContent = '🎤';
      CHAT.inputEl.value = t;
      CHAT.formEl.dispatchEvent(new Event('submit'));
    };
    recognition.onerror = ()=>{$('#voice-btn').textContent='🎤'};
  } else {
    $('#voice-btn').style.opacity = 0.5;
  }

  // form submit
  CHAT.formEl.addEventListener('submit', (e)=>{
    e.preventDefault();
    const text = CHAT.inputEl.value.trim();
    if(!text) return;
    pushUserMessage(text);
    CHAT.inputEl.value='';
    handleMessage(text);
  });

  // quick new chat
  document.querySelector('[data-action="new-chat"]').addEventListener('click', clearChat);

  // nav quick intents
  document.querySelectorAll('.nav-btn[data-intent]').forEach(btn=>{
    btn.addEventListener('click', ()=>handleIntent(btn.dataset.intent));
  });

  // keyboard: press Enter to send
  CHAT.inputEl.addEventListener('keydown', (e)=>{ if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); CHAT.formEl.dispatchEvent(new Event('submit')); } })
}

/* Helpers */
function t(key){
  if(CHAT.translations && CHAT.translations[CHAT.lang] && CHAT.translations[CHAT.lang][key]) return CHAT.translations[CHAT.lang][key];
  if(CHAT.translations && CHAT.translations['en'] && CHAT.translations['en'][key]) return CHAT.translations['en'][key];
  return key;
}
function pushUserMessage(text){
  const m = createElement('div','message user', text);
  CHAT.messagesEl.appendChild(m);
  scrollChat();
}
function pushAssistantMessage(text, html=false){
  const m = createElement('div','message assistant');
  if(html) m.innerHTML = text; else m.textContent = text;
  CHAT.messagesEl.appendChild(m);
  scrollChat();
}
function showSystem(text){
  const s = createElement('div','message assistant');
  s.style.opacity = 0.75;
  s.textContent = text;
  CHAT.messagesEl.appendChild(s);
  scrollChat();
}
function scrollChat(){ CHAT.messagesEl.scrollTop = CHAT.messagesEl.scrollHeight; }
function clearChat(){ CHAT.messagesEl.innerHTML=''; welcomeMessage(); }

/* Welcome */
function welcomeMessage(){
  pushAssistantMessage(t('welcome_message'));
  // show quick buttons inline
  document.getElementById('inline-payments').setAttribute('aria-hidden','false');
}

/* Intent handling */
async function handleIntent(intent){
  // consult model explicitly
  const intentObj = CHAT.model && CHAT.model.intents && CHAT.model.intents[intent];
  if(intentObj){
    // craft a helpful reply
    const reply = formatIntentReply(intentObj);
    pushAssistantMessage(reply, true);
    return;
  }
  pushAssistantMessage(t('sorry_no_understand'));
}

function formatIntentReply(intentObj){
  // generate a rich HTML reply with price range, CTA, and payment links
  const price = intentObj.price || '₦0';
  const html = `<strong>${intentObj.title}</strong><br>${intentObj.desc || ''}<br><em>${t('price')}: ${price}</em>
  <div style="margin-top:8px">
    <button class="pay-inline" onclick="openPay('card')">${t('pay_card')}</button>
    <button class="pay-inline" onclick="openPay('bank')">${t('pay_bank')}</button>
    <a class="nav-btn" href="https://wa.me/2349018341741?text=${encodeURIComponent('Hello, I want to order: '+intentObj.title)}" target="_blank">${t('contact_whatsapp')}</a>
  </div>`;
  return html;
}

/* Message processing (keyword + model) */
function handleMessage(text){
  // simple normalization
  const low = text.toLowerCase();

  // 1. direct keyword triggers
  const match = findBestIntent(low);
  if(match){ handleIntent(match); return; }

  // 2. fallback small talk / contact
  if(low.includes('price') || low.includes('how much')){ handleIntent('pricing'); return; }
  if(low.includes('enroll') || low.includes('academy')){ handleIntent('academy_enroll'); return; }
  if(low.includes('logo')){ handleIntent('service_logo'); return; }
  if(low.includes('flyer') || low.includes('poster')){ handleIntent('service_flyer'); return; }
  if(low.includes('help') || low.includes('support')){ openContact(); return; }

  // 3. no match -> ask clarifying question
  pushAssistantMessage(t('ask_clarify'));
}

/* Intent discovery using model */
function findBestIntent(text){
  if(!CHAT.model || !CHAT.model.intents) return null;
  let best=null, score=0;
  Object.keys(CHAT.model.intents).forEach(key=>{
    const intent = CHAT.model.intents[key];
    // check triggers
    if(!intent.triggers) return;
    intent.triggers.forEach(tr=>{
      if(text.includes(tr) && 1.2 > score){ best=key; score=1.2; }
    });
    // check keywords tokens
    if(intent.keywords){
      let count=0;
      intent.keywords.forEach(k=>{ if(text.includes(k)) count++; });
      if(count>score){ best=key; score=count; }
    }
  });
  return best;
}

/* Payment handlers */
function openPay(method){
  if(method==='card'){
    // open paystack checkout link in new tab (replace with your own paystack link)
    const payUrl = 'https://paystack.shop/pay/tessforma_pay';
    window.open(payUrl, '_blank');
  } else {
    // bank details
    const bankText = `${t('bank_transfer_instructions')}\nBank: OPay\nAccount: Adetiba Testimony\nAcc no: 9018341741`;
    alert(bankText);
  }
}

/* Contact open */
function openContact(){
  const msg = `${t('contact_header')}\n${t('whatsapp')}: +2349018341741\n${t('email')}: tessformastudio@gmail.com`;
  pushAssistantMessage(msg, false);
}

/* Contrast & dark adjustments */
function adjustContrast(){
  // ensure message texts remain readable in dark mode
  const style = getComputedStyle(document.documentElement);
  // no heavy calculations here, CSS variables handle colors
}

/* Expose some functions to global scope for inline onclick in replies */
window.openPay = openPay;
window.handleIntent = handleIntent;
