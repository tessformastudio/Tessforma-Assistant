// Basic interactivity + preloader + simple form stub
document.addEventListener('DOMContentLoaded', ()=> {
  // Preloader hide after 900ms
  setTimeout(()=> {
    const pre = document.getElementById('preloader');
    if(pre) pre.style.opacity = 0;
    setTimeout(()=> pre && pre.remove(), 500);
  }, 900);
});

// simple contact form -> opens WhatsApp with content if user prefers
function handleFormSubmit(e){
  e.preventDefault();
  const f = e.target;
  const name = f.name.value.trim();
  const message = f.message.value.trim();
  const contact = f.contact.value.trim();
  if(!name || !message) { alert('Please enter name and message'); return false; }

  const payload = `Hello Tessforma, I am ${encodeURIComponent(name)}. Project: ${encodeURIComponent(message)}. Contact: ${encodeURIComponent(contact)}`;
  // open whatsapp with pre-filled message
  const wa = `https://wa.me/2349018341741?text=${payload}`;
  window.open(wa, '_blank');
  f.reset();
  return false;
      }
