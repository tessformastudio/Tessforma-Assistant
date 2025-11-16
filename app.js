/* app.js - Tessforma Assistant v2
   Requires: services.json and assistant-config.json loaded as global variables.
   Place in repo root alongside index.html and style.css
*/

(() => {
  // Basic config from assistant-config.json (global var)
  const CONFIG = window.assistantConfig || {
    brand: "Tessforma Studio",
    whatsapp: "2349018341741",
    email: "tessformastudio@gmail.com"
  };

  // Messages UI
  const messages = document.getElementById("messages");
  const chatForm = document.getElementById("chatForm");
  const userInput = document.getElementById("userInput");
  const suggestionsEl = document.getElementById("suggestions");
  const serviceGrid = document.getElementById("serviceGrid");
  const academyList = document.getElementById("academyList");

  // Smart suggestion templates (editable)
  const SUGGESTIONS = {
    logo: ["Logo pricing", "Show logo samples", "Order a logo"],
    bookformat: ["Book formatting price", "Samples for books", "Order book formatting"],
    enroll: ["Enroll in A1 course", "Academy pricing", "Request syllabus"]
  };

  // Helper: show message
  function pushMessage(text, who="assistant"){
    const el = document.createElement("div");
    el.className = `msg ${who==='user'?'user':'assistant'} fade-in`;
    el.innerText = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  // Typing simulation
  function typeThenRespond(text, delay=700){
    const typing = document.createElement("div");
    typing.className = "msg assistant fade-in";
    typing.innerHTML = `<div class="typing"></div>`;
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;
    setTimeout(() => {
      typing.remove();
      pushMessage(text,"assistant");
    }, delay);
  }

  // Load services into grid (services.json global var)
  function renderServices(){
    const list = window.servicesData || [];
    serviceGrid.innerHTML = "";
    list.forEach(s => {
      const card = document.createElement("div");
      card.className = "service fade-in";
      card.innerHTML = `<h4>${s.title}</h4><p>${s.description}</p><div><strong>From: ${s.price}</strong></div>
        <button class="btn" data-action="order" data-id="${s.id}">Order / Quote</button>`;
      serviceGrid.appendChild(card);
    });

    // academy section
    const academy = window.servicesDataAcademy || [];
    academyList.innerHTML = "";
    academy.forEach(a => {
      const el = document.createElement("div");
      el.className = "service fade-in";
      el.innerHTML = `<h4>${a.title}</h4><p>${a.description}</p><div><strong>Fee: ${a.price}</strong></div>
        <button class="btn" data-action="enroll" data-id="${a.id}">Enroll</button>`;
      academyList.appendChild(el);
    });
  }

  // Smart reply / routing engine
  function handleIntent(text){
    const t = text.toLowerCase();
    // quick matches
    if(t.includes("logo")) return routeTo("logo");
    if(t.includes("book") || t.includes("format")) return routeTo("bookformat");
    if(t.includes("enroll") || t.includes("academy") || t.includes("course")) return routeTo("enroll");
    if(t.includes("price") || t.includes("cost") || t.includes("how much") ) return priceLookup(t);
    if(t.includes("portfolio") || t.includes("sample")) return showPortfolio();
    if(t.includes("hello") || t.includes("hi")) return greeting();
    // fallback
    return typeThenRespond("I can help with logo design, flyers, book formatting, banners, and Academy enrollment. Try: 'Logo pricing' or 'Enroll in A1'.");
  }

  // Routes
  function routeTo(key){
    if(SUGGESTIONS[key]){
      // reply with quick options and contact buttons
      const msg = {
        logo: "We create modern logos starting from ₦8,000. Would you like to see samples or request a quote?",
        bookformat: "Book & eBook formatting (print-ready) from ₦6,000. How many pages is the book?",
        enroll: "Tessforma Academy offers tailored classes for learners. Which program are you interested in? A1 Graphic Design or Academy Enrollment?"
      }[key] || "Here are some options.";
      typeThenRespond(msg, 900);
      showSuggestions(key);
    } else {
      typeThenRespond("Sorry — I didn't understand. Try 'logo pricing' or 'order a logo'.");
    }
  }

  // Price lookup: simple extraction
  function priceLookup(text){
    // look for service words in servicesData
    const all = (window.servicesData || []).concat(window.servicesDataAcademy || []);
    for(const s of all){
      const title = s.title.toLowerCase();
      if(text.includes(title.split(" ")[0])){ // match by first word
        return typeThenRespond(`${s.title} — Price: ${s.price}. To order: click Order / Quote or message us on WhatsApp.`);
      }
    }
    return typeThenRespond("Please tell me which service. For example 'logo pricing' or 'flyer price'.");
  }

  // portfolio (shows a quick message with WhatsApp CTA)
  function showPortfolio(){
    typeThenRespond("You can view our portfolio and sample works on our social channels. Would you like me to open WhatsApp so you can request samples?");
    showActionButtons([{
      label: "Open WhatsApp",
      action: () => openWhatsApp("Hi Tessforma, please send me portfolio samples.")
    }]);
  }

  // greeting
  function greeting(){ typeThenRespond(`Hello! I'm Tessforma Assistant. I can help you with design services and Academy enrollment — or just say "logo pricing".`); }

  // suggestions display
  function showSuggestions(key){
    suggestionsEl.innerHTML = "";
    const opts = SUGGESTIONS[key] || [];
    opts.forEach(o=>{
      const b = document.createElement("button");
      b.innerText = o;
      b.onclick = () => {
        pushMessage(o,"user");
        handleIntent(o);
      };
      suggestionsEl.appendChild(b);
    });
  }

  // general action buttons below assistant
  function showActionButtons(items){
    suggestionsEl.innerHTML = "";
    items.forEach(it=>{
      const b = document.createElement("button");
      b.innerText = it.label;
      b.onclick = it.action;
      suggestionsEl.appendChild(b);
    });
  }

  // open WhatsApp with message
  function openWhatsApp(msg){
    const base = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(base, "_blank");
  }

  // Attach events
  chatForm.addEventListener("submit", e=>{
    e.preventDefault();
    const text = userInput.value.trim();
    if(!text) return;
    pushMessage(text,"user");
    userInput.value = "";
    // simulated typing then respond
    setTimeout(()=> handleIntent(text), 350);
  });

  // quick CTA buttons in hero
  document.querySelectorAll(".quick-cta button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const k = btn.getAttribute("data-suggest");
      pushMessage(btn.innerText,"user");
      handleIntent(btn.getAttribute("data-suggest"));
    });
  });

  // service/order buttons (event delegation)
  document.addEventListener("click", (e)=>{
    const btn = e.target.closest("button");
    if(!btn) return;
    const action = btn.dataset.action;
    if(action === "order"){
      const id = btn.dataset.id;
      const svc = (window.servicesData || []).find(s=>s.id==id);
      if(svc){
        typeThenRespond(`To start ${svc.title}, we require a 50% deposit. Do you want to begin?`);
        showActionButtons([
          {label: "Pay 50% / Start (WhatsApp)", action: ()=> openWhatsApp(`Hello Tessforma, I want to order: ${svc.title}. Price: ${svc.price}.`)},
          {label: "Send brief", action: ()=> openWhatsApp(`Hello Tessforma, here's my brief for ${svc.title}: `)}
        ]);
      }
    } else if(action === "enroll"){
      const id = btn.dataset.id;
      const course = (window.servicesDataAcademy || []).find(c=>c.id==id);
      if(course){
        typeThenRespond(`Enroll in ${course.title} — Fee ${course.price}. Want to register?`);
        showActionButtons([
          {label:"Register (WhatsApp)", action: ()=> openWhatsApp(`Hello Tessforma Academy, I'd like to enroll in ${course.title}.`)},
          {label:"Syllabus", action: ()=> openWhatsApp(`Hello Tessforma Academy, please send syllabus for ${course.title}.`)}
        ]);
      }
    }
  });

  // initial startup UI
  function startup(){
    // render services
    renderServices();
    // show welcome popup message
    setTimeout(()=> {
      pushMessage(`Hello 👋 Welcome to Tessforma Assistant — how can we help you today?`, "assistant");
      showActionButtons([
        {label:"I need a logo", action: ()=> { pushMessage("I need a logo","user"); handleIntent("logo"); }},
        {label:"See Services", action: ()=> { pushMessage("Show services","user"); typeThenRespond("Scroll to the Services section or click any Order button."); }},
        {label:"Academy / Enroll", action: ()=> { pushMessage("I want to enroll","user"); handleIntent("enroll"); }}
      ]);
    }, 600);
  }

  // run startup
  document.addEventListener("DOMContentLoaded", startup);
})();
