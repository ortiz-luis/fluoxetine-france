(function(root){
 'use strict';
 const cfg=root.COMMUNITY_CONFIG||{},C=root.PharmacyCore;
 const enabled=/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(cfg.url||'')&&Boolean(cfg.publishableKey)&&Boolean(root.supabase);
 const client=enabled?root.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true},global:{fetch:(input,init={})=>fetch(input,{...init,signal:init.signal?AbortSignal.any([init.signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)})}}):null;
 const fields='id,pharmacy_id,status,method,created_at,call_date,participant_id,participant_key,source';
 const candidateFields='id,name,address,postcode,city,phone,latitude,longitude,officine,moderation,created_at,participant_id,participant_key';
 let user=null,lastRows=[];const histories=new Map(),historyRequests=new Map();
 const ready=client?client.auth.getSession().then(({data,error})=>{if(error)throw error;user=data.session?.user||null;return user;}):Promise.resolve(null);
 if(client)client.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;setTimeout(()=>root.dispatchEvent(new CustomEvent('community-auth')),0);});
 function identity(u=user){return u?.identities?.find(x=>x.provider==='github');}
 function displayName(){const d=identity()?.identity_data;return d?.user_name||d?.preferred_username||'Participant connecté';}
 function errorMessage(error){
  if(error?.code==='P0001')return error.message;
  if(['42501','PGRST301','PGRST302'].includes(error?.code)||error?.status===401)return 'Reconnectez-vous avec GitHub pour publier votre information.';
  if(error?.code==='23503')return 'Cette pharmacie doit être vérifiée avant de recevoir un signalement.';
  return 'La publication n’a pas pu être confirmée. Vérifiez votre connexion et réessayez : aucun doublon ne sera créé.';
 }
 function requireBackend(){if(!enabled)throw Error('Le partage depuis la carte n’est pas encore activé. Votre information n’a pas été publiée.');}
 async function authenticatedUser(){requireBackend();await ready;const {data,error}=await client.auth.getUser();if(error||!identity(data.user))throw Object.assign(Error('Connectez-vous avec GitHub pour publier votre information.'),{code:'LOGIN_REQUIRED'});user=data.user;return user;}
 async function signIn(pharmacyId){
  requireBackend();const target=new URL(location.pathname,location.origin);if(pharmacyId)sessionStorage.setItem('pharmacy-last-view',pharmacyId);
  const {data,error}=await client.auth.signInWithOAuth({provider:'github',options:{redirectTo:target.href,scopes:'read:user',skipBrowserRedirect:true}});
  if(error||!data.url)throw Error('La connexion GitHub est indisponible pour le moment. Réessayez plus tard.');
  location.assign(data.url);
 }
 async function signOut(){if(!client)return;const {error}=await client.auth.signOut();if(error)throw Error('Déconnexion impossible pour le moment. Réessayez.');user=null;}
 async function pages(table,select,order,filter){
  const rows=[];for(let from=0;;from+=1000){let query=client.from(table).select(select).order(order).range(from,from+999);if(filter)query=filter(query);const {data,error}=await query;if(error)throw error;rows.push(...data);if(data.length<1000)break;}return rows;
 }
 async function loadReports(){
  if(!enabled){const response=await fetch('data/legacy-reports.json');if(!response.ok)throw Error('Informations initiales indisponibles');return {reports:await response.json(),pharmacies:[]};}
  const [reports,candidates]=await Promise.all([pages('latest_reports','*','pharmacy_id'),pages('pharmacy_candidates',candidateFields,'id',q=>q.eq('moderation','approved'))]);
  const old=new Map(lastRows.map(r=>[r.pharmacy_id,r]));
  for(const r of reports){const previous=old.get(r.pharmacy_id);if(!previous||previous.id!==r.id||previous.report_count!==r.report_count)histories.delete(r.pharmacy_id);}
  for(const id of histories.keys())if(!reports.some(r=>r.pharmacy_id===id))histories.delete(id);
  lastRows=reports;
  const all=new Map(reports.map(r=>[r.id,r]));for(const h of histories.values())if(Date.now()-h.time<60000)for(const r of h.rows)if(!all.has(r.id))all.set(r.id,r);
  return {reports:[...all.values()],pharmacies:candidates.map(C.fromRow).map(p=>({...p,source:'Ajout communautaire vérifié'}))};
 }
 async function loadHistory(id){
  if(!enabled)return [];
  const cached=histories.get(id);if(cached&&Date.now()-cached.time<60000)return cached.rows;
  if(historyRequests.has(id))return historyRequests.get(id);
  const request=pages('stock_reports',fields,'created_at',q=>q.eq('pharmacy_id',id)).then(rows=>{histories.set(id,{rows,time:Date.now()});return rows;}).finally(()=>historyRequests.delete(id));historyRequests.set(id,request);return request;
 }
 function keyFor(u){const i=identity(u),d=i?.identity_data;const id=i?.provider_id||d?.sub;return id?'github:'+id:null;}
 async function insertOnce(table,payload,select){
  const u=await authenticatedUser();let {data,error}=await client.from(table).insert(payload).select(select).single();
  if(error?.code==='23505'){
   const existing=await client.from(table).select(select).eq('id',payload.id).maybeSingle();
   if(!existing.error&&existing.data?.participant_key===keyFor(u)&&Object.keys(payload).every(k=>existing.data[k]===payload[k]))return existing.data;
  }
  if(error)throw Error(errorMessage(error));
  if(!data||!Number.isFinite(Date.parse(data.created_at)))throw Error('La publication n’a pas pu être confirmée. Réessayez.');return data;
 }
 async function saveReport(action){
  const payload={id:action.id,pharmacy_id:action.pharmacyId,status:action.status,method:action.method||'other'};
  if(!['plenty','limited','none'].includes(payload.status)||!['phone','visit','other'].includes(payload.method))throw Error('Choisissez une réponse valide.');
  return insertOnce('stock_reports',payload,fields);
 }
 async function saveCandidate(p){
  if(!C.validPharmacy(p)||!C.hasPosition(p))throw Error('Vérifiez les coordonnées de la pharmacie.');
  return insertOnce('pharmacy_candidates',{id:p.id,name:p.name,address:p.address,postcode:p.postcode,city:p.city,phone:p.phone,latitude:p.lat,longitude:p.lng,officine:true},candidateFields);
 }
 root.PharmacyCommunity={enabled,ready,loadReports,loadHistory,saveReport,saveCandidate,signIn,signOut,displayName,hasUser:()=>Boolean(identity()),errorMessage};
})(window);
