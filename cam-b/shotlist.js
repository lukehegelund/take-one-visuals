/* Shot order follows the day of filming, while the template describes edit order. */
const groups = [
 {id:'arrival',name:'Arrival & details',note:'Before guests arrive. Capture the room while it is still untouched.',shots:[
 [1,'Venue establishing wide','Show where the day takes place. Hold a clean wide; coordinate with Luke if a drone is needed.'],
 [12,'Empty ceremony space','Frame the arch, aisle and chairs. Capture a steady wide plus a closer detail.'],
 [2,'Rings & invitation','Find soft light. Keep the rings and lettering sharp; make one slow, deliberate move.'],
 [3,'Dress detail','Frame the whole dress, then its texture. Keep the background clean and leave time at each end.'],
 [19,'Reception details','Capture tables, flowers and personal touches before the room fills.']
 ]},
 {id:'prep',name:'Getting ready',note:'Small actions and real relationships give the film its personal moments.',shots:[
 [4,'Bride preparation','Capture an action, such as makeup or fastening the dress. Watch for the face and hands.'],
 [5,'Groom preparation','Capture the tie, jacket or boutonniere. Hold the action long enough for it to finish.'],
 [6,'Bride & parent moment','If a parent first look is planned, be ready before it starts. Stay through the expression and hug.'],
 [7,'Candid bride reaction','Look for laughter and conversation during preparation. Let the moment develop naturally.']
 ]},
 {id:'first-look',name:'First look & portraits',note:'If scheduled before the ceremony. Let Luke lead positioning and keep a complementary angle.',shots:[
 [8,'First look reaction','Be ready before the turn. Hold on the face, then stay through the embrace.'],
 [9,'Hands & partial reveal','Start with hands or a small detail of the couple. Keep the movement gentle and purposeful.'],
 [10,'Couple walking','Capture them walking together with faces visible. Leave room in their direction of travel.']
 ]},
 {id:'ceremony',name:'Ceremony',note:'Keep recording through key moments. Coordinate your angle with Luke before the processional.',shots:[
 [13,'Guests & family','Capture attentive faces before the ceremony. Find parents and close family in advance.'],
 [14,'Aisle walk & handoff','Hold the bride’s approach and arrival. Keep guests from blocking the frame where possible.'],
 [15,'Groom receiving the bride','Be on the groom before he sees her. Stay on his reaction instead of chasing the aisle camera.'],
 [16,'Vows & listening reaction','Hold a stable second angle on the speaker and listener. Keep expressions visible and avoid repositioning mid-vow.'],
 [17,'Ring exchange detail','If your assigned angle allows it, frame the hands and rings without crossing Cam A. Keep rolling.'],
 [18,'Pronouncement, kiss & cheer','Be ready before the invitation to kiss. Hold through the kiss and the full natural cheer.']
 ]},
 {id:'golden-hour',name:'Golden-hour portraits',note:'Follow the actual sunset window, even if these happen during the reception.',shots:[
 [11,'Faces, embrace & kiss','Use the warm light for a close portrait. Let the couple hold, laugh and kiss without rushing.'],
 [24,'Closing wide','Capture the couple within the landscape. Hold a clean ending; coordinate a walking-away or drone version with Luke.']
 ]},
 {id:'reception',name:'Reception & dancing',note:'Stay ready for spontaneous reactions, then gather varied movement for the energetic finish.',shots:[
 [20,'Toast reaction','Cover the couple’s faces while the speaker talks. Stay through laughter, tears and applause.'],
 [21,'First dance','Keep a stable second angle with both faces visible when possible. Stay through turns and the ending.'],
 [22,'Parent dance','Capture the relationship: faces, hands and the embrace. Avoid interrupting the lead camera’s view.'],
 [23,'Open dancing','Capture joyful faces and full actions. Mix a wider group with closer moments for variety.']
 ]}
];
const key='tov-camb-checklist-v1';let captured=new Set();
try{captured=new Set(JSON.parse(localStorage.getItem(key)||'[]'))}catch{}
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
const list=document.querySelector('#shotlist');let displayNumber=0;
for(const [index,group] of groups.entries()){
 const link=document.createElement('a');link.href='#'+group.id;link.textContent=group.name;document.querySelector('.day-nav').append(link);
 const section=document.createElement('section');section.id=group.id;
 section.innerHTML=`<div class="section-head"><span>0${index+1}</span><h2>${group.name}</h2></div><p class="section-note">${group.note}</p><div class="grid"></div>`;
 for(const [id,title,cue] of group.shots){
  const n=String(id).padStart(2,'0'),shown=String(++displayNumber).padStart(2,'0'),card=document.createElement('article');card.className='shot';card.dataset.id=id;
  card.innerHTML=`<div class="media"><video muted loop playsinline preload="none" poster="clips/${n}.jpg" data-src="clips/${n}.mp4" aria-label="Example: ${title}"></video><button type="button" class="clip-toggle" aria-label="Play example: ${title}">Play clip</button></div><div class="copy"><div class="number">SHOT ${shown}</div><label class="label"><input type="checkbox" aria-label="Captured: ${title}"><h3>${title}</h3></label><p class="cue">${cue}</p></div>`;
  const checkbox=card.querySelector('input');checkbox.checked=captured.has(id);card.classList.toggle('done',checkbox.checked);
  checkbox.addEventListener('change',()=>{checkbox.checked?captured.add(id):captured.delete(id);card.classList.toggle('done',checkbox.checked);try{localStorage.setItem(key,JSON.stringify([...captured]))}catch{}updateProgress()});
  const video=card.querySelector('video'),button=card.querySelector('.clip-toggle');
  button.addEventListener('click',()=>{if(video.paused){load(video);video.dataset.manual='play';video.play().catch(()=>{})}else{video.dataset.manual='pause';video.pause()}});
  video.addEventListener('play',()=>{button.textContent='Pause clip';button.setAttribute('aria-label',`Pause example: ${title}`)});
  video.addEventListener('pause',()=>{button.textContent='Play clip';button.setAttribute('aria-label',`Play example: ${title}`)});
  video.addEventListener('error',()=>{button.textContent='Retry clip';video.removeAttribute('src')});
  section.querySelector('.grid').append(card);
 }
 list.append(section);
}
function load(v){if(!v.getAttribute('src'))v.src=v.dataset.src;v.muted=true}
function updateProgress(){document.querySelector('#progress').textContent=`${captured.size} / 24 shots captured`}
/* Load and loop visible examples only, so a phone does not fetch the whole page at once. */
const observer=new IntersectionObserver(entries=>{for(const entry of entries){const v=entry.target;v.dataset.visible=entry.isIntersecting?'yes':'no';if(entry.isIntersecting&&!paused&&v.dataset.manual!=='pause'){load(v);v.play().catch(()=>{})}else if(!entry.isIntersecting)v.pause()}},{threshold:0.2});
document.querySelectorAll('video').forEach(v=>observer.observe(v));
const pause=document.querySelector('#pause');
function updatePause(){pause.textContent=paused?'Resume clips':'Pause all clips'}
pause.addEventListener('click',()=>{paused=!paused;document.querySelectorAll('video').forEach(v=>{delete v.dataset.manual;if(paused)v.pause();else if(v.dataset.visible==='yes'){load(v);v.play().catch(()=>{})}});updatePause()});
document.querySelector('#reset').addEventListener('click',()=>{if(!confirm('Clear the captured shots on this device?'))return;captured.clear();try{localStorage.removeItem(key)}catch{}document.querySelectorAll('input').forEach(c=>c.checked=false);document.querySelectorAll('.shot').forEach(c=>c.classList.remove('done'));updateProgress()});
updateProgress();updatePause();
