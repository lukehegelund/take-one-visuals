/* A dedicated storage key keeps TOV sessions separate from other apps on this origin.
   Only the publishable key belongs here; role changes remain administrator-only. */
window.tovAuth = supabase.createClient('https://kxsuzgpnvtepsyhkezin.supabase.co', 'sb_publishable_zaGdbtHtVWyqYKcqACaRBQ_5oevEq_y', {auth:{storageKey:'tov-studio-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
window.tovMembership = async function(){
 const {data:{user},error}=await tovAuth.auth.getUser();
 if(error||!user)return null;
 const result=await tovAuth.from('tov_studio_memberships').select('role').eq('user_id',user.id).maybeSingle();
 if(result.error)throw Error('Unable to check TOV access. Please try again.');
 return result.data ? {user,role:result.data.role}:null;
};
