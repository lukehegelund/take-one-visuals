/* Recap follows musical measures; prior opening and first eight reception slots stay exact. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
(async()=>{
 const old=JSON.parse(execFileSync('git',['show','6035ede:editor-preview/template.json'],{encoding:'utf8'}));
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/studio/gate.js*',r=>r.fulfill({contentType:'application/javascript',body:''}));await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>document.documentElement.classList.remove('tov-checking')));
 await page.goto((process.env.EDITOR_BASE||'http://127.0.0.1:8766')+'/editor-preview/');await page.waitForSelector('.clip');
 const data=await page.evaluate(()=>fetch('template.json').then(r=>r.json()));assert.equal(data.revision,'2026-10-03.10');
 for(const c of old.cards.filter(c=>c.start<144))assert.deepEqual(data.cards.find(x=>x.id===c.id),c);
 const reception=data.cards.filter(c=>c.track===6&&c.start>=120).sort((a,b)=>a.start-b.start),recap=reception.slice(8);
 assert.equal(reception.length,21);assert.equal(recap.length,13);assert.equal(data.grid.measures,61);assert.equal(data.duration,183);
 assert.deepEqual(recap.map(c=>c.recapMeasureCount),[.5,.5,.5,.5,1,1,2,1,1,1,.5,.5,3]);
 assert.deepEqual(recap.map(c=>c.recapCue),['Bride getting-ready close-up','Groom getting-ready / boutonniere','Bride/father first-look turn','Bride/father hug','Bride approaching groom for first look','Groom turns / reveal','Emotional first-look reaction / hold','Ceremony kiss','Grand entrance with cheers','Couple first-dance spin','Send-off walking through cheering guests','Send-off dip / kiss','Golden-hour field / walking closing shot']);
 assert.equal(recap[0].start,144);assert.equal(recap.at(-1).end,183);assert.equal(recap.at(-1).fadeOut,1);assert(!data.policies.plannedReceptionCrash);
 for(const id of ['3-reception-peak','4-reception-peak']){const c=data.cards.find(x=>x.id===id);assert.equal(c.start,144);assert.equal(c.end,183);assert.match(c.title,/GEAR 5/);}
 for(let i=0;i<21;i++){const c=reception[i];if(i)assert.equal(c.start,reception[i-1].end);assert.equal(c.takes.length,3);assert.equal(c.qualityControl.status,'pending');await page.locator('#scrub').evaluate((el,t)=>{el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}))},c.start+.1);assert.equal(await page.locator('.planning-track-6').getAttribute('data-card'),c.id);if(i>=8)assert.equal(await page.locator('.planning-track-6 h3').textContent(),c.recapCue);}
 assert.equal(await page.locator('#lanes select').count(),0);assert.equal(data.markers.length,5);assert(!data.markers.some(m=>/crash/i.test(m.name)));
 const picture=data.cards.filter(c=>c.track===6);assert.equal(new Set(picture.map(c=>c.takes[0].id)).size,44);assert(recap.every(c=>c.takes.every(t=>t.assignment==='pending'&&!t.src)));
 await page.click('#inspector-toggle');await page.locator('.clip[data-id="6-32"]').click();assert((await page.locator('#selection-detail').textContent()).includes('eating it together'));
 await page.locator('.clip[data-id="6-recap-3"]').click();assert((await page.locator('#selection-detail').textContent()).includes('Never invent first looks or send-offs'));
 await page.selectOption('#qc-status','pass');assert.equal(await page.locator('#qc-status').inputValue(),'pending');
 await page.locator('.clip[data-id="6-1"]').click();await page.fill('#qc-reason','Entire interval reviewed: exposure, intentional motion and correct transform.');await page.locator('#qc-reason').press('Tab');await page.check('#qc-reviewed');await page.selectOption('#qc-status','pass');assert.equal(await page.locator('#qc-status').inputValue(),'pass');await page.fill('#start','2');await page.locator('#start').press('Tab');assert.equal(await page.locator('#qc-status').inputValue(),'pending');
 assert.deepEqual(errors,[]);await browser.close();console.log('21-slot reception, exact 13-measure recap, unchanged opening/activity pair, truthful pending sources, Inspector and QC reset verified');
})().catch(e=>{console.error(e);process.exit(1)});
