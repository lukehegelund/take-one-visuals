/* Each section has two coverage levels; footage rotates across three distinct weddings. */
(async function init(){
const response=await fetch('shots.json');if(!response.ok)throw new Error('Shotlist unavailable');
const groups=await response.json(),shots=groups.flatMap(g=>g.shots),ids=new Set(shots.map(s=>s.id));
const key='tov-camb-checklist-v1';let captured=new Set();
try{captured=new Set(JSON.parse(localStorage.getItem(key)||'[]').filter(id=>ids.has(id)))}catch{}
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
const list=document.querySelector('#shotlist'),players=[];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slotNames=['Venue wide','Ceremony detail','Rings / dress','Bride prep','Groom prep','Portrait reveal','Groom on camera','Reaction / handoff','Bride-vow pictures','Aisle / anticipation','Kiss & cheer','Reception','Closing wide'];
/* This miniature is a story map of the approved template, not a fixed seconds grid. */
function timeline(shot){
 const slots=shot.editor.slots;let picture='';
 for(let i=0;i<13;i++){const x=62+i*44,selected=slots.includes(i);picture+=`<rect data-slot="${i}" x="${x}" y="70" width="41" height="40" rx="3" fill="${selected?'#e6c587':'#59675d'}" stroke="${selected?'#fff2d2':'#879589'}" stroke-width="${selected?2:0.5}"/><text x="${x+20.5}" y="94" text-anchor="middle" fill="${selected?'#282c26':'#e4ebe4'}" font-size="12">${i+1}</text>`}
 return `<svg class="template-thumb" viewBox="0 0 650 210" role="img" aria-label="Wedding film timeline. Highlighted placement: ${escape(slots.map(i=>slotNames[i]).join(', '))}"><title>${escape(shot.title)}: ${escape(slots.map(i=>slotNames[i]).join(', '))}</title><rect width="650" height="210" rx="7" fill="#252c28"/><text x="20" y="26" fill="#e7eee7" font-size="14">WEDDING FILM · TEMPLATE</text><text x="62" y="56" fill="#b1bdb1" font-size="11">INTRO</text><text x="194" y="56" fill="#b1bdb1" font-size="11">VOW-LED PICTURE</text><text x="502" y="56" fill="#b1bdb1" font-size="11">RECEPTION</text><text x="590" y="56" fill="#b1bdb1" font-size="11">END</text><text x="18" y="94" fill="#aabbad" font-size="12">V1</text>${picture}<text x="18" y="134" fill="#aabbad" font-size="12">A1</text><rect x="62" y="119" width="482" height="22" rx="3" fill="#567494"/><rect x="546" y="119" width="86" height="22" rx="3" fill="#698fb0"/><text x="78" y="134" fill="white" font-size="11">Music builds → kiss → cheer</text><text x="549" y="134" fill="white" font-size="9">Reception song</text><text x="18" y="163" fill="#aabbad" font-size="12">A2</text><rect x="194" y="148" width="176" height="22" rx="3" fill="#856693"/><text x="215" y="163" fill="white" font-size="11">Groom vows</text><rect x="414" y="148" width="88" height="22" rx="3" fill="#9874a7"/><text x="422" y="163" fill="white" font-size="10">Bride vows</text><text x="18" y="192" fill="#aabbad" font-size="12">A3</text><rect x="502" y="177" width="42" height="22" rx="3" fill="#6a8869"/><text x="550" y="192" fill="#b7c6b8" font-size="10">Natural sound</text></svg>`;
}
function save(){try{localStorage.setItem(key,JSON.stringify([...captured]))}catch{}updateProgress()}
function updateProgress(){const essentials=shots.filter(s=>s.category==='essential');const done=essentials.filter(s=>captured.has(s.id)).length;const ideas=shots.filter(s=>s.category==='ideas'&&captured.has(s.id)).length;document.querySelector('#progress').textContent=`${done} / ${essentials.length} essentials captured${ideas?` · ${ideas} other ideas`:''}`}
function play(player){const v=player.video;if(!v.getAttribute('src'))v.src=player.shot.variations[player.index].src;v.muted=true;v.play().catch(()=>{})}
function select(player,index){player.index=index;const variant=player.shot.variations[index],v=player.video;v.poster=variant.poster;v.src=variant.src;player.caption.textContent=variant.wedding;player.count.textContent=`${index+1} / 3`;player.dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));if(player.visible&&((!paused&&player.manual!=='pause')||player.manual==='play'))play(player)}
const observer=new IntersectionObserver(entries=>{for(const entry of entries){const player=players.find(p=>p.video===entry.target);player.visible=entry.isIntersecting;if(player.visible&&!paused&&player.manual!=='pause')play(player);else if(!player.visible)player.video.pause()}},{threshold:0.2});
for(const [sectionIndex,group] of groups.entries()){
 const link=document.createElement('a');link.href='#'+group.id;link.textContent=group.name;document.querySelector('.day-nav').append(link);
 const section=document.createElement('section');section.id=group.id;
 section.innerHTML=`<div class="section-head"><span>0${sectionIndex+1}</span><h2>${escape(group.name)}</h2></div><p class="section-note">${escape(group.note)}</p><div class="coverage-tabs" role="tablist" aria-label="${escape(group.name)} coverage"></div>`;
 const tabs=[];
 for(const [category,label] of [['essential','Essential shots'],['ideas','Other ideas']]){
  const selected=category==='essential',subset=group.shots.filter(s=>s.category===category),tab=document.createElement('button');
  tab.type='button';tab.id=`${group.id}-${category}-tab`;tab.setAttribute('role','tab');tab.setAttribute('aria-selected',String(selected));tab.setAttribute('aria-controls',`${group.id}-${category}`);tab.tabIndex=selected?0:-1;tab.innerHTML=`${label} <span>${subset.length}</span>`;
  const panel=document.createElement('div');panel.id=`${group.id}-${category}`;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.hidden=!selected;panel.className='grid';
  const choose=()=>{for(const pair of tabs){const active=pair.tab===tab;pair.tab.setAttribute('aria-selected',String(active));pair.tab.tabIndex=active?0:-1;pair.panel.hidden=!active;if(!active)pair.panel.querySelectorAll('video').forEach(v=>v.pause())}};
  tab.addEventListener('click',choose);tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?tabs[0]:event.key==='End'?tabs.at(-1):tabs.find(t=>t.tab!==tab);next.tab.click();next.tab.focus()}});
  tabs.push({tab,panel});section.querySelector('.coverage-tabs').append(tab);
  for(const shot of subset){
   const variant=shot.variations[0],card=document.createElement('article');card.className='shot';card.dataset.id=shot.id;
   card.innerHTML=`<div class="media"><video muted playsinline preload="none" poster="${escape(variant.poster)}" aria-label="Example: ${escape(shot.title)}"></video><span class="variation-count">1 / 3</span><button type="button" class="clip-toggle" aria-label="Play example: ${escape(shot.title)}">Play clip</button></div><div class="copy"><div class="variation-bar"><span class="wedding-label">${escape(variant.wedding)}</span><div class="variation-dots" aria-label="Wedding examples">${shot.variations.map((v,i)=>`<button type="button" aria-pressed="${i===0}" aria-label="Example ${i+1}: ${escape(v.wedding)}">${i+1}</button>`).join('')}</div></div><label class="label"><input type="checkbox" aria-label="Captured: ${escape(shot.title)}"><h3>${escape(shot.title)}</h3></label><p class="cue">${escape(shot.cue)}</p><details class="editor-placement"><summary aria-label="Timeline placement: ${escape(shot.title)}"><svg viewBox="0 0 20 16" aria-hidden="true"><rect x="1" y="1" width="18" height="14" rx="2"/><path d="M4 5h5m2 0h5M4 10h9"/></svg> In the edit</summary><div class="editor-panel">${timeline(shot)}<small class="track-legend">V1 Picture · A1 Music · A2 Vows · A3 Natural sound</small><p class="slot-label">${escape(shot.editor.slots.map(i=>`${i+1}. ${slotNames[i]}`).join(' · '))}</p><p>${escape(shot.editor.description)}</p><small>Template story order; shot lengths follow the music and moments.</small></div></details></div>`;
   const checkbox=card.querySelector('input');checkbox.checked=captured.has(shot.id);card.classList.toggle('done',checkbox.checked);checkbox.addEventListener('change',()=>{checkbox.checked?captured.add(shot.id):captured.delete(shot.id);card.classList.toggle('done',checkbox.checked);save()});
   const player={shot,video:card.querySelector('video'),button:card.querySelector('.clip-toggle'),caption:card.querySelector('.wedding-label'),count:card.querySelector('.variation-count'),dots:[...card.querySelectorAll('.variation-dots button')],index:0,visible:false,manual:null};players.push(player);
   player.dots.forEach((dot,i)=>dot.addEventListener('click',()=>select(player,i)));
   player.button.addEventListener('click',()=>{if(player.video.paused){player.manual='play';play(player)}else{player.manual='pause';player.video.pause()}});
   player.video.addEventListener('play',()=>{player.button.textContent='Pause clip';player.button.setAttribute('aria-label',`Pause example: ${shot.title}`)});
   player.video.addEventListener('pause',()=>{player.button.textContent='Play clip';player.button.setAttribute('aria-label',`Play example: ${shot.title}`)});
   // A→B→C→A keeps the card looping without repeating one wedding indefinitely.
   player.video.addEventListener('ended',()=>select(player,(player.index+1)%3));
   player.video.addEventListener('error',()=>{player.button.textContent='Retry clip';player.video.removeAttribute('src')});
   panel.append(card);observer.observe(player.video);
  }
  section.append(panel);
 }
 list.append(section);
}
const pause=document.querySelector('#pause');function updatePause(){pause.textContent=paused?'Resume clips':'Pause all clips'}
pause.addEventListener('click',()=>{paused=!paused;for(const p of players){p.manual=null;if(paused)p.video.pause();else if(p.visible)play(p)}updatePause()});
document.querySelector('#reset').addEventListener('click',()=>{if(!confirm('Clear the captured shots on this device?'))return;captured.clear();document.querySelectorAll('.shot input').forEach(c=>c.checked=false);document.querySelectorAll('.shot').forEach(c=>c.classList.remove('done'));save()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)players.forEach(p=>p.video.pause());else if(!paused)players.filter(p=>p.visible&&p.manual!=='pause').forEach(play)});
updateProgress();updatePause();
})().catch(()=>{document.querySelector('#shotlist').innerHTML='<p class="load-error">The shotlist could not load. Refresh the page to try again.</p>'});
