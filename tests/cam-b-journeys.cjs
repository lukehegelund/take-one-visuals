// Exercises the crew member's complete viewing and checklist journey in a real browser.
const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');const os=require('node:os');
(async()=>{const browser=await chromium.launch({headless:true});let checks=0;const base=process.env.CAM_B_BASE||'http://127.0.0.1:8765';
for(const width of [1280,390]){const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/cam-b/');await page.waitForSelector('.shot');assert.equal(await page.locator('.shot').count(),24);checks++;
assert.match(await page.locator('meta[name=robots]').getAttribute('content'),/noindex/);checks++;
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks++;
for(const v of await page.locator('video').all()){await v.scrollIntoViewIfNeeded();await v.evaluate(async el=>{if(!el.src)el.src=el.dataset.src;el.muted=true;await el.play()});await page.waitForFunction(el=>el.readyState>=2&&el.currentTime>0,await v.elementHandle());assert.equal(await v.evaluate(el=>el.loop&&el.muted&&el.playsInline&&!el.error),true);checks++}
await page.locator('.shot input').first().check();await page.reload();await page.waitForSelector('.shot');assert.equal(await page.locator('.shot input').first().isChecked(),true);checks++;
await page.getByRole('button',{name:'Pause all clips',exact:true}).click();assert.equal(await page.locator('video').evaluateAll(v=>v.every(x=>x.paused)),true);checks++;
await page.getByRole('button',{name:'Resume clips',exact:true}).click();checks++;
await page.locator('.day-nav a').last().click();assert.equal(new URL(page.url()).hash,'#reception');checks++;
page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Reset checklist'}).click();assert.equal(await page.locator('input:checked').count(),0);checks++;
await page.goto(base+'/');assert.equal(await page.locator('a[href*="cam-b"]').count(),0);checks++;
await page.goto(base+'/cam-b/');await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR||os.tmpdir(),`cam-b-${width}.png`),fullPage:true});assert.deepEqual(errors,[]);checks++;await page.close()}
const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(base+'/cam-b/');await reduced.locator('video').first().scrollIntoViewIfNeeded();assert.equal(await reduced.locator('video').evaluateAll(v=>v.every(x=>x.paused)),true);checks++;await browser.close();console.log(`3 journeys, ${checks} checks, all green`)
})().catch(e=>{console.error(e);process.exit(1)});
