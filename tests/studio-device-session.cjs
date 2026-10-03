/* Exercise the real bundled Supabase client with a simulated Auth/backend.
   Passwords here are test fixtures; no real credentials or sessions are used. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PW_EXECUTABLE});
 let context=await browser.newContext(),expired=false,offline=false,role='owner',refreshes=0;
 const base=process.env.EDITOR_BASE||'http://127.0.0.1:8766';
 const user={id:'11111111-1111-4111-8111-111111111111',email:'test@example.test',aud:'authenticated',role:'authenticated'};
 const token=()=>({access_token:'test-access',refresh_token:'test-refresh',expires_in:expired?-10:3600,token_type:'bearer',user});
 async function backend(c){await c.route('https://kxsuzgpnvtepsyhkezin.supabase.co/**',async r=>{
  const url=r.request().url();
  if(offline)return r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Temporary outage'})});
  let data;if(url.includes('/token')){if(url.includes('refresh_token')){refreshes++;expired=false;}data=token();}
  else if(url.includes('/user'))data=user;
  else if(url.includes('/logout'))return r.fulfill({status:204});
  else if(url.includes('/tov_studio_memberships'))data=role?{role}:null;
  else throw Error('Unexpected backend request');
  await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });}
 await backend(context);let page=await context.newPage();
 await page.goto(base+'/editor-preview/');await page.waitForURL('**/studio/?next=*');
 await page.locator('#email').fill('test@example.test');await page.locator('#password').fill('fixture-password');await page.locator('#submit').click();await page.waitForURL('**/editor-preview/');await page.locator('.tov-nav').waitFor();
 await page.reload();await page.locator('.tov-nav').waitFor();assert(page.url().endsWith('/editor-preview/'));
 // Recreate a browser context with disk-equivalent saved storage and expired access.
 const state=await context.storageState();const saved=state.origins[0].localStorage.find(x=>x.name==='tov-studio-auth-v1');
 const session=JSON.parse(saved.value);session.expires_at=Math.floor(Date.now()/1000)-10;saved.value=JSON.stringify(session);
 await context.close();context=await browser.newContext({storageState:state});await backend(context);page=await context.newPage();
 await page.goto(base+'/studio/');await page.waitForURL('**/editor-preview/');await page.locator('.tov-nav').waitFor();assert(refreshes>0);
 offline=true;await page.reload();await page.getByRole('button',{name:'Try again'}).waitFor();assert(page.url().endsWith('/editor-preview/'));assert(await page.evaluate(()=>!!localStorage.getItem('tov-studio-auth-v1')));
 offline=false;await page.getByRole('button',{name:'Try again'}).click();await page.locator('.tov-nav').waitFor();
 // Revoked membership never grants access from a remembered workspace.
 role=null;await page.reload();await page.waitForURL('**/studio/?next=*');await page.getByText('This account has no TOV access.',{exact:false}).waitFor();assert(await page.locator('#login').isHidden());
 role='owner';await page.reload();await page.waitForURL('**/editor-preview/');await page.getByRole('button',{name:'Log out'}).click();await page.waitForURL('**/studio/');await page.locator('#login').waitFor();assert(!(await page.evaluate(()=>localStorage.getItem('tov-studio-auth-v1'))));
 await page.goto(base+'/editor-preview/');await page.waitForURL('**/studio/?next=*');await page.locator('#login').waitFor();
 await browser.close();console.log('Device session journeys passed: login, reload, reopen/refresh, offline retry, revoked role, explicit logout. Simulated backend; real bundled SDK.');
})().catch(e=>{console.error(e);process.exit(1)});
