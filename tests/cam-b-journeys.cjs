// Test the shooter's tabs, wedding rotation, editor context, and saved checklist.
const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const os=require('node:os');
(async()=>{const browser=await chromium.launch({headless:true});let checks=0;const base=process.env.CAM_B_BASE||'http://127.0.0.1:8765';
for(const width of [1280,390]){
 const page=await browser.newPage({viewport:{width,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/cam-b/');await page.waitForSelector('.shot');assert.equal(await page.locator('.shot').count(),43);checks++;
 const data=await page.evaluate(async()=>fetch('shots.json').then(r=>r.json()));
 for(const g of data){assert(g.shots.some(s=>s.category==='essential')&&g.shots.some(s=>s.category==='ideas'));checks++;for(const shot of g.shots){assert.equal(shot.variations.length,3);assert.equal(new Set(shot.variations.map(v=>v.wedding_key)).size,3);checks++;}}
 assert.equal(data.find(g=>g.id==='golden-hour').shots.length,12);checks++;
 for(const shot of data.flatMap(g=>g.shots).filter(s=>s.event)){assert.equal(shot.category,'essential');assert.match(await page.locator(`.shot[data-id="${shot.id}"] .event-guidance`).textContent(),/entire moment.*uninterrupted/);checks++;}
 assert.match(await page.locator('meta[name=robots]').getAttribute('content'),/noindex/);checks++;
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks++;
 for(const group of data){
  for(const category of ['essential','ideas']){
   const tab=page.locator(`#${group.id}-${category}-tab`);await tab.click();assert.equal(await tab.getAttribute('aria-selected'),'true');assert.equal(await page.locator(`#${group.id}-${category}`).isVisible(),true);checks++;
   for(const shot of group.shots.filter(s=>s.category===category)){
    const card=page.locator(`.shot[data-id="${shot.id}"]`),video=card.locator('video');await video.scrollIntoViewIfNeeded();
    await page.waitForFunction(el=>el.readyState>=2&&!el.paused&&el.currentTime>0,await video.elementHandle());
    for(let variant=0;variant<3;variant++){
     await card.locator('.variation-dots button').nth(variant).click();await page.waitForFunction((el)=>el.readyState>=2&&el.currentTime>0,await video.elementHandle());
     assert.equal(await video.evaluate(el=>el.muted&&el.playsInline&&!el.error),true);assert.equal(await card.locator('.variation-count').textContent(),`${variant+1} / 3`);checks++;
     const source=await video.getAttribute('src');await video.evaluate(el=>el.currentTime=el.duration-.08);
     await page.waitForFunction(({el,source})=>el.getAttribute('src')!==source,{el:await video.elementHandle(),source});
     assert.equal(await card.locator('.variation-count').textContent(),`${(variant+1)%3+1} / 3`);checks++;
    }
    await card.locator('summary').click();assert.equal(await card.locator('.template-thumb').isVisible(),true);assert.equal(await card.locator('.template-thumb rect[data-slot][stroke-width="2"]').count(),shot.editor.slots.length);assert(await card.locator('.editor-panel').textContent());checks++;
    await card.locator('summary').click();
   }
  }
  // Tab changes hide and pause the other panel, without mixing coverage levels.
  await page.locator(`#${group.id}-essential-tab`).click();assert.equal(await page.locator(`#${group.id}-ideas video`).evaluateAll(v=>v.every(x=>x.paused)),true);checks++;
 }
 await page.locator('#arrival-essential-tab').click();await page.locator('#arrival-essential summary').nth(0).click();await page.locator('#arrival-essential summary').nth(1).click();await page.waitForFunction(()=>document.querySelectorAll('details[open]').length===1);assert.equal(await page.locator('#arrival-essential details').nth(0).getAttribute('open'),null);checks++;await page.locator('#arrival-essential summary').nth(1).click();
 const first=page.locator('#arrival-essential input').first();await first.check();await page.reload();await page.waitForSelector('.shot');assert.equal(await first.isChecked(),true);checks++;
 const keyboard=page.locator('#arrival-essential-tab');await keyboard.focus();await keyboard.press('ArrowRight');assert.equal(await page.locator('#arrival-ideas-tab').getAttribute('aria-selected'),'true');checks++;await page.locator('#arrival-ideas-tab').press('ArrowLeft');checks++;
 await page.getByRole('button',{name:'Pause all clips',exact:true}).click();assert.equal(await page.locator('video').evaluateAll(v=>v.every(x=>x.paused)),true);checks++;
 await page.getByRole('button',{name:'Resume clips',exact:true}).click();checks++;
 await page.locator('.day-nav a').last().click();assert.equal(new URL(page.url()).hash,'#reception');checks++;
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Reset checklist'}).click();assert.equal(await page.locator('input:checked').count(),0);checks++;
 await page.goto(base+'/');assert.equal(await page.locator('a[href*="cam-b"]').count(),0);checks++;
 await page.goto(base+'/cam-b/');await page.waitForSelector('.shot');await page.locator('.day-nav a').first().click();await page.locator('#arrival-essential summary').first().click();
 const screenshot=path.join(process.env.SCREENSHOT_DIR||os.tmpdir(),`cam-b-${width}.png`);await page.screenshot({path:screenshot});assert.deepEqual(errors,[]);checks++;await page.close();
}
const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(base+'/cam-b/');await reduced.waitForSelector('.shot');assert.equal(await reduced.locator('video').evaluateAll(v=>v.every(x=>x.paused)),true);checks++;await browser.close();console.log(`3 journeys, ${checks} checks, all green`)
})().catch(e=>{console.error(e);process.exit(1)});
