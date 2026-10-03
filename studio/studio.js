/* Authentication and database membership are both required for workspace access. */
const $=id=>document.getElementById(id);
// Auth events and form submission can coincide; restore only once at a time.
let restoring=false;
async function refresh(){
 if(restoring)return;restoring=true;
 $('login').hidden=true;$('workspace').hidden=true;$('logout').hidden=true;$('retry').hidden=true;
 try{
  const member=await tovMembership();
  if(!member){const {data:{session}}=await tovAuth.auth.getSession();$('status').textContent=session?'This account has no TOV access. Contact Luke to be invited.':'Log in to open your shotlist and editor template.';$('login').hidden=!!session;$('logout').hidden=!session;return;}
  $('status').textContent=`Logged in as ${member.user.email}.`;
  if(member.role!=='couple')location.replace(tovDestination(member.role,new URLSearchParams(location.search).get('next')));
  $('workspace').hidden=false;$('logout').hidden=false;
  $('shotlist').hidden=!['owner','shooter'].includes(member.role);
  $('editor').hidden=!['owner','editor'].includes(member.role);
  if(member.role==='couple')$('status').textContent='Your couple workspace is not available yet.';
 }catch(e){$('status').textContent=e.message;$('retry').hidden=false;}finally{restoring=false;}
}
$('login').onsubmit=async e=>{e.preventDefault();$('submit').disabled=true;$('status').textContent='Logging in…';try{const {error}=await tovAuth.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});$('password').value='';if(error){$('status').textContent='Unable to log in. Check your email and password and try again.';return;}await refresh();}catch{$('status').textContent='Unable to reach login. Please try again.';}finally{$('submit').disabled=false;}};
$('logout').onclick=async()=>{const {error}=await tovAuth.auth.signOut({scope:'local'});if(error){$('status').textContent='Unable to log out. Please try again.';return;}await refresh();};
// Run outside the auth callback to avoid nesting auth calls inside its lock.
tovAuth.auth.onAuthStateChange(()=>setTimeout(refresh,0));refresh();

// Retry restoration without asking for the password or discarding the saved session.
$('retry').onclick=refresh;
window.addEventListener('online',refresh);
