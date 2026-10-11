(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  $('#year').textContent = new Date().getFullYear();

  // Mobile navigation
  const menuToggle = $('#menuToggle'), nav = $('#nav');
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open);
  });
  $$('.nav-link').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false');
  }));

  // Gentle starfield canvas
  const canvas = $('#starfield'), ctx = canvas.getContext('2d');
  let stars = [], width = 0, height = 0;
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth; height = Math.min(900, Math.max(600, document.documentElement.scrollHeight * .38));
    canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({length: Math.min(115, Math.floor(width / 8))}, () => ({x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.2+.25,a:Math.random()*.55+.12,s:Math.random()*.006+.001}));
  }
  function drawStars() {
    ctx.clearRect(0,0,width,height);
    stars.forEach(star => { star.a += star.s; if(star.a > .72 || star.a < .12) star.s *= -1; ctx.beginPath(); ctx.arc(star.x,star.y,star.r,0,Math.PI*2); ctx.fillStyle = `rgba(177,207,255,${star.a})`; ctx.fill(); });
    requestAnimationFrame(drawStars);
  }
  resizeCanvas(); drawStars(); window.addEventListener('resize', resizeCanvas);

  // Reveal content as it enters view
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if(entry.isIntersecting){ entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
  }), {threshold:.12});
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`; revealObserver.observe(el); });

  // Active navigation link
  const sections = $$('main section[id]');
  const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if(entry.isIntersecting){ $$('.nav-link').forEach(link => link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id)); }
  }), {rootMargin:'-35% 0px -55% 0px'});
  sections.forEach(section => sectionObserver.observe(section));

  // Card spotlight + subtle tilt on pointer devices
  $$('.play-card[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = e.clientX-r.left, y = e.clientY-r.top;
      card.style.setProperty('--mx', `${x}px`); card.style.setProperty('--my', `${y}px`);
      if(e.pointerType === 'mouse' && window.innerWidth > 900){ card.style.transform = `perspective(800px) rotateX(${((y/r.height)-.5)*-2.4}deg) rotateY(${((x/r.width)-.5)*2.4}deg) translateY(-2px)`; }
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  // Orb toy
  const orb = $('#toyOrb'), orbToy = $('#orbToy'); let energy = 0;
  function changeOrb(){ energy = (energy + 1) % 4; orb.className = 'toy-orb' + (energy ? ` energy-${energy}` : ''); const names=['Calm energy','Solar energy','Ocean energy','Cosmic energy']; showToast(names[energy]); }
  orbToy.addEventListener('click', changeOrb); orbToy.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); changeOrb(); } }); $('#orbButton').addEventListener('click', changeOrb);

  // Color lab
  const colorPreview = $('#colorPreview'), colorHex = $('#colorHex');
  function setColor(color){ colorPreview.style.setProperty('--preview', color); colorHex.textContent = color.toUpperCase(); $$('.swatch').forEach(s => s.classList.toggle('selected', s.dataset.color.toUpperCase() === color.toUpperCase())); }
  $$('.swatch').forEach(s => s.addEventListener('click', () => setColor(s.dataset.color)));
  $('#randomColor').addEventListener('click', () => { const colors=$$('.swatch').map(s=>s.dataset.color); setColor(colors[Math.floor(Math.random()*colors.length)]); });

  // Reaction time mini-game
  const target=$('#reactionTarget'), reactionText=$('#reactionText'), reactionHint=$('#reactionHint'), reactionMessage=$('#reactionMessage'), reactionBest=$('#reactionBest'), reactionStatus=$('.reaction-status');
  let gameState='idle', startTimer=null, startedAt=0, best=null;
  try { best = Number(localStorage.getItem('nexora-reaction-best')) || null; } catch(e) {}
  function updateBest(){ reactionBest.textContent = best ? `BEST ${best}ms` : 'BEST —'; }
  updateBest();
  function startReaction(){ clearTimeout(startTimer); gameState='waiting'; target.className='reaction-target waiting'; reactionText.textContent='WAIT…'; reactionHint.textContent='Tap only when it turns green'; reactionMessage.textContent='Stay focused.'; reactionStatus.innerHTML='<i style="background:#ffb454"></i> WAITING'; startTimer=setTimeout(()=>{ if(gameState!=='waiting')return; gameState='go'; startedAt=performance.now(); target.className='reaction-target go'; reactionText.textContent='TAP NOW'; reactionHint.textContent='GO GO GO'; reactionMessage.textContent='Quick!'; reactionStatus.innerHTML='<i style="background:#4bf4a5"></i> GO'; }, 1000 + Math.random()*2600); }
  target.addEventListener('click', () => {
    if(gameState==='idle' || gameState==='done' || gameState==='early'){ startReaction(); return; }
    if(gameState==='waiting'){ clearTimeout(startTimer); gameState='early'; target.className='reaction-target'; reactionText.textContent='TOO SOON'; reactionHint.textContent='Patience, pilot.'; reactionMessage.textContent='You jumped the signal. Tap to retry.'; reactionStatus.innerHTML='<i style="background:#ff75c8"></i> FALSE START'; return; }
    if(gameState==='go'){ const elapsed=Math.round(performance.now()-startedAt); gameState='done'; target.className='reaction-target'; reactionText.textContent=`${elapsed} ms`; reactionHint.textContent=elapsed<220?'Lightning reflexes!':elapsed<320?'Nice reaction!':'You can go faster.'; reactionMessage.textContent='Tap the target to try again.'; reactionStatus.innerHTML='<i></i> COMPLETE'; if(!best||elapsed<best){best=elapsed;updateBest();try{localStorage.setItem('nexora-reaction-best',String(best));}catch(e){} showToast('New personal best: '+elapsed+' ms!');} }
  });
  $('#reactionReset').addEventListener('click', () => { clearTimeout(startTimer); gameState='idle'; target.className='reaction-target'; reactionText.textContent='START'; reactionHint.textContent='How fast are you?'; reactionMessage.textContent='Press start when ready.'; reactionStatus.innerHTML='<i></i> READY'; });

  // Project filters
  $$('.filter').forEach(button => button.addEventListener('click', () => {
    $$('.filter').forEach(b => b.classList.toggle('active', b === button));
    const filter=button.dataset.filter;
    $$('.project-card').forEach(card => card.classList.toggle('filtered-out', filter!=='all' && card.dataset.category!==filter));
  }));

  // Project detail modal
  const projectData = {
    nova:{num:'PROJECT FILE / 001',title:'Nova / Studio',description:'A sleek concept for a creative studio website. Nova pairs a confident editorial layout with soft gradients, floating shapes, and a clear path from first impression to action.',tags:['Web design','Responsive UI','Visual concept']},
    pulse:{num:'PROJECT FILE / 002',title:'Pulse / Frequency',description:'An interactive playground concept inspired by sound, rhythm, and motion. Pulse imagines a digital space where visuals respond to the feeling of a beat.',tags:['Interaction','Motion design','Play']},
    level:{num:'PROJECT FILE / 003',title:'Level Up / Identity',description:'A bold visual identity direction built around gaming culture, sharp typography, electric color, and the feeling of unlocking your next achievement.',tags:['Graphic design','Typography','Gaming']},
    nexora:{num:'PROJECT FILE / 004',title:'NEXORA / Playground',description:'The home base for the curious: tiny web experiments, playful interactions, and concept worlds in one neon-lit digital space. This page is the first playable version.',tags:['HTML','CSS','JavaScript','Interactive']}
  };
  const modal=$('#projectModal'); let lastFocus=null;
  function openProject(key){const data=projectData[key];if(!data)return;lastFocus=document.activeElement;$('#modalEyebrow').textContent=data.num;$('#modalTitle').textContent=data.title;$('#modalDescription').textContent=data.description;$('#modalTags').innerHTML=data.tags.map(tag=>`<span>${tag}</span>`).join('');modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');$('#modalClose').focus();}
  function closeProject(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');if(lastFocus)lastFocus.focus();}
  $$('.project-card').forEach(card=>{card.addEventListener('click',()=>openProject(card.dataset.project));card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openProject(card.dataset.project);}});});
  $('#modalClose').addEventListener('click',closeProject);$('#modalDone').addEventListener('click',closeProject);modal.addEventListener('click',e=>{if(e.target===modal)closeProject();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('open'))closeProject();});

  let toastTimer; function showToast(message){const toast=$('#toast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),1900);}

  // Hero parallax, intentionally subtle
  const heroVisual=$('#heroVisual');
  heroVisual.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||window.innerWidth<800)return;const r=heroVisual.getBoundingClientRect();const rx=(e.clientY-r.top)/r.height-.5,ry=(e.clientX-r.left)/r.width-.5;const planet=$('.planet',heroVisual);planet.style.transform=`translate(${ry*9}px,${rx*-8}px) rotateY(${ry*10}deg) rotateX(${rx*-8}deg)`;});
  heroVisual.addEventListener('pointerleave',()=>{$('.planet',heroVisual).style.transform='';});
})();
