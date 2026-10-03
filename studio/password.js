/* Consume invitation/recovery credentials only here, never in the ordinary login
   or tool gates. Remove them from the address bar before any async work. */
const $=id=>document.getElementById(id);
// A second email link opened in this same tab must be consumed as a new flow.
window.addEventListener('hashchange',()=>{if(location.hash)location.reload();});
const incoming=new URLSearchParams(location.hash.slice(1));
const hasLink=!!location.hash;
history.replaceState(null,'',location.pathname);
let verifiedUser=null;
const pendingKey='tov-password-pending-user';
function requestLink(message){$('status').textContent=message;$('set-password').hidden=true;$('request-link').hidden=false;}
async function prepare(){
 try{
  if(hasLink){
   sessionStorage.removeItem(pendingKey);
   if(incoming.has('error')||!['invite','recovery'].includes(incoming.get('type'))||!incoming.get('access_token')||!incoming.get('refresh_token'))throw Error('invalid-link');
   const {error}=await tovAuth.auth.setSession({access_token:incoming.get('access_token'),refresh_token:incoming.get('refresh_token')});
   if(error)throw error;
  }else if(!sessionStorage.getItem(pendingKey)){requestLink('Enter your account email to get a password link. New members need an invitation from Luke first.');return;}
  const {data:{user},error}=await tovAuth.auth.getUser();
  if(error||!user||(!hasLink&&user.id!==sessionStorage.getItem(pendingKey)))throw Error('invalid-session');
  verifiedUser=user.id;sessionStorage.setItem(pendingKey,user.id);
  $('status').textContent=`Choose a password for ${user.email}. Use at least 8 characters.`;$('set-password').hidden=false;
 }catch{sessionStorage.removeItem(pendingKey);requestLink('This link has expired or is invalid. Request a new password link below, or ask Luke for a new invitation.');}
}
$('set-password').onsubmit=async e=>{
 e.preventDefault();if(!verifiedUser)return;
 const password=$('new-password').value;
 if(password!==$('confirm-password').value){$('status').textContent='The passwords do not match.';return;}
 if(password.length<8){$('status').textContent='Use at least 8 characters.';return;}
 $('save-password').disabled=true;
 try{
  // Recheck identity so another tab cannot change which account gets updated.
  const {data:{user},error:identityError}=await tovAuth.auth.getUser();
  if(identityError||user?.id!==verifiedUser)throw Error('session-changed');
  const {error}=await tovAuth.auth.updateUser({password});
  if(error){$('status').textContent=error.code==='weak_password'?'Choose a stronger password and try again.':'Unable to save your password. Request a new link and try again.';return;}
  $('set-password').reset();sessionStorage.removeItem(pendingKey);
  $('set-password').hidden=true;$('status').textContent='Password saved. Opening your workspace…';location.replace('/studio/');
 }catch{$('status').textContent='Unable to save your password. Please try again or request a new link.';}
 finally{$('save-password').disabled=false;}
};
$('request-link').onsubmit=async e=>{
 e.preventDefault();$('send-link').disabled=true;
 try{
  const {error}=await tovAuth.auth.resetPasswordForEmail($('reset-email').value.trim(),{redirectTo:new URL('/studio/password.html',location.origin).href});
  $('status').textContent=error?'Unable to send the link. Please try again later.':'If this email has an account, a password link will arrive shortly. Check your spam folder too.';
 }catch{$('status').textContent='Unable to send the link. Please try again later.';}
 finally{$('send-link').disabled=false;}
};
prepare();
