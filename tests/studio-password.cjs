/* Run the real SDK against a simulated Auth backend, never real passwords. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE});
 const context=await browser.newContext();
 const user={id:'11111111-1111-4111-8111-111111111111',email:'fixture@example.test',aud:'authenticated',role:'authenticated'};
 let updates=0,requests=0,fail=false,switched=false,role='shooter';
 await context.route('https://kxsuzgpnvtepsyhkezin.supabase.co/**',async r=>{
  const req=r.request(),url=req.url();let data=user,status=200;
  if(url.includes('/recover')){requests++;data={};}
  else if(url.includes('/user')&&req.method()==='PUT'){updates++;if(fail){status=422;data={code:'weak_password',message:'Weak password',weak_password:{reasons:['length']}};}}
  else if(url.includes('/user')&&switched)data={...user,id:'22222222-2222-4222-8222-222222222222'};
  else if(url.includes('/tov_studio_memberships'))data={role};
  await r.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 await context.route('http://tov.test/**',async r=>{
  let name=new URL(r.request().url()).pathname;if(name.endsWith('/'))name+='index.html';
  const file=path.join(__dirname,'..',name);const ext=path.extname(file);
  await r.fulfill({status:fs.existsSync(file)?200:404,contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[ext]||'text/plain',body:fs.existsSync(file)?fs.readFileSync(file):'missing'});
 });
 const page=await context.newPage();const jwt='e30.'+Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.fixture';
 const link=type=>'http://tov.test/studio/password.html#type='+type+'&access_token='+jwt+'&refresh_token=fixture';
 await page.goto(link('invite'));await page.locator('#set-password').waitFor();assert(!page.url().includes('#'));await page.reload();await page.locator('#set-password').waitFor();
 await page.locator('#new-password').fill('fixture-password');await page.locator('#confirm-password').fill('different-password');await page.locator('#save-password').click();await page.getByText('The passwords do not match.').waitFor();assert.equal(updates,0);
 await page.locator('#confirm-password').fill('fixture-password');fail=true;await page.locator('#save-password').click();await page.getByText('Choose a stronger password and try again.').waitFor();assert(await page.locator('#save-password').isEnabled());
 fail=false;await page.locator('#save-password').click();await page.waitForURL('**/cam-b/');assert.equal(updates,2);
 await page.goto('http://tov.test/studio/password.html#error=access_denied');await page.locator('#request-link').waitFor();assert(await page.locator('#set-password').isHidden());
 await page.locator('#reset-email').fill('fixture@example.test');await page.locator('#send-link').click();await page.getByText('If this email has an account,',{exact:false}).waitFor();assert.equal(requests,1);
 await page.goto(link('recovery'));await page.locator('#set-password').waitFor();switched=true;
 await page.locator('#new-password').fill('fixture-password');await page.locator('#confirm-password').fill('fixture-password');await page.locator('#save-password').click();await page.getByText('Unable to save your password.',{exact:false}).waitFor();assert.equal(updates,2);
 await browser.close();console.log('7 password journeys passed: invite, reload, mismatch, backend rejection/retry, save-to-shotlist, expired-link recovery, identity change. Real SDK; simulated backend.');
})().catch(e=>{console.error(e);process.exit(1)});
