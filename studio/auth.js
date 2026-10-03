/* A dedicated storage key keeps TOV sessions separate from other apps on this origin.
   Only the publishable key belongs here; role changes remain administrator-only. */
window.tovAuth = supabase.createClient('https://kxsuzgpnvtepsyhkezin.supabase.co', 'sb_publishable_zaGdbtHtVWyqYKcqACaRBQ_5oevEq_y', {auth:{storageKey:'tov-studio-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
window.tovMembership = async function(){
 // Restore and refresh the device session before validating access with the server.
 const {data:{session},error:sessionError}=await tovAuth.auth.getSession();
 if(sessionError)throw Error('Unable to restore your login. Please try again.');
 if(!session)return null;
 const {data:{user},error}=await tovAuth.auth.getUser();
 if(error)throw Error('Unable to check your login. Please try again.');
 if(!user)return null;
 const result=await tovAuth.from('tov_studio_memberships').select('role').eq('user_id',user.id).maybeSingle();
 if(result.error)throw Error('Unable to check TOV access. Please try again.');
 return result.data ? {user,role:result.data.role}:null;
};

// Remember only the destination, never passwords or a cached authorization role.
window.tovDestination = function(role, requested){
 const paths={ '/editor-preview/':['owner','editor'], '/cam-b/':['owner','shooter'] };
 let saved;try{saved=localStorage.getItem('tov-last-workspace');}catch{}
 for(const path of [requested,saved])if(paths[path]?.includes(role))return path;
 return role==='editor'?'/editor-preview/':'/cam-b/';
};
