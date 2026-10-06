(function(root) {
 'use strict';
 const STATUSES=['plenty','limited','none','available'];
 const LABELS={plenty:'Oui, en quantité',limited:'Oui, mais peu',none:'Non disponible',available:'Disponible · quantité non précisée',unknown:'À renseigner'};
 function parisDate(now=new Date()) {
  const parts=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const get=type=>parts.find(p=>p.type===type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
 }
 function validDate(value,now=new Date()) {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const d=new Date(value+'T12:00:00Z');
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value&&value>='2026-01-01'&&value<=parisDate(now);
 }
 function normalize(v){return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
 function escape(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function phone(v){let n=String(v).replace(/[\s.()\-]/g,'');if(/^0\d{9}$/.test(n))n='+33'+n.slice(1);if(/^00\d{9,15}$/.test(n))n='+'+n.slice(2);return /^\+\d{9,15}$/.test(n)?n:'';}
 function displayPhone(v){const n=String(v).replace(/\D/g,'');return /^0\d{9}$/.test(n)?n.match(/.{2}/g).join(' '):String(v);}
 function parseReport(r,catalog,now=new Date()){
  if(!r||!STATUSES.includes(r.status))return null;
  const pharmacyId=r.pharmacy_id||r.pharmacyId,date=r.call_date||r.date,created=r.created_at||r.reportedAt;
  if(typeof pharmacyId!=='string'||!catalog.has(pharmacyId)||!validDate(date,now)||!Number.isFinite(Date.parse(created)))return null;
  const method=['phone','visit','other'].includes(r.method)?r.method:'other';
  return {id:String(r.id),pharmacyId,status:r.status,date,reportedAt:new Date(created).toISOString(),source:r.source||'community',participantId:r.participant_id||r.participantId||null,method};
 }
 function parseGithubIssue(issue,catalog,now=new Date()){
  if(!issue||issue.state!=='open'||issue.pull_request||typeof issue.body!=='string')return null;
  if(issue.labels?.some(label=>['invalid','invalide','spam','doublon'].includes(typeof label==='string'?label:label.name)))return null;
  const match=issue.body.match(/<!-- fluoxetine-report:v2 -->\s*```json\s*([\s\S]*?)\s*```/);
  if(!match)return null; let value; try{value=JSON.parse(match[1]);}catch{return null;}
  if(value.schema!==2||!Number.isFinite(Date.parse(issue.created_at)))return null;
  const published=new Date(issue.created_at);
  return parseReport({id:'github-'+issue.number,pharmacyId:value.pharmacyId,status:value.status,date:parisDate(published),created_at:issue.created_at,source:'community',participantId:issue.user?.login||null,method:value.method},catalog,now);
 }
 function latestReports(reports){const out=new Map();for(const r of reports){const old=out.get(r.pharmacyId);if(!old||r.date>old.date||(r.date===old.date&&r.reportedAt>old.reportedAt))out.set(r.pharmacyId,r);}return out;}
 function hasPosition(p){return Boolean(p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=85&&Math.abs(p.lng)<=180);}
 function validPharmacy(p){return Boolean(p&&typeof p.id==='string'&&p.id.length<=80&&typeof p.name==='string'&&p.name.trim().length>=2&&p.name.length<=200&&typeof p.address==='string'&&p.address.length>=8&&p.address.length<=350&&/^\d{5}$/.test(p.postcode)&&typeof p.city==='string'&&p.city.length>=2&&p.city.length<=100&&(hasPosition(p)||(p.lat===null&&p.lng===null))&&(p.phone===''||phone(p.phone)));}
 function personCount(reports){return new Set(reports.map(r=>r.participantId).filter(Boolean)).size;}
 function parseGithubCandidate(issue){
  if(!issue||issue.state!=='open'||issue.pull_request||typeof issue.body!=='string'||!issue.labels?.some(label=>(typeof label==='string'?label:label.name)==='pharmacie-validée'))return null;
  const match=issue.body.match(/<!-- fluoxetine-pharmacy:v1 -->\s*```json\s*([\s\S]*?)\s*```/);if(!match)return null;
  let value;try{value=JSON.parse(match[1]);}catch{return null;}
  if(value.schema!==1||value.officine!==true||!validPharmacy(value.pharmacy)||!hasPosition(value.pharmacy)||!/^community-[a-zA-Z0-9-]+$/.test(value.pharmacy.id))return null;
  const p=value.pharmacy;return {id:p.id,name:p.name,address:p.address,postcode:p.postcode,city:p.city,phone:p.phone,lat:p.lat,lng:p.lng,source:'Ajout communautaire vérifié'};
 }
 function isStale(r,now=new Date()){return Boolean(r&&now.getTime()-Date.parse(r.reportedAt)>48*60*60*1000);}
 function distanceKm(a,b){const rad=Math.PI/180,dlat=(b.lat-a.lat)*rad,dlng=(b.lng-a.lng)*rad,x=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlng/2)**2;return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
 function fromRow(r){return {id:r.id,name:r.name,address:r.address,postcode:r.postcode,city:r.city,phone:r.phone||'',lat:Number(r.latitude),lng:Number(r.longitude),source:'Ajout communautaire',approximate:false};}
 const api={STATUSES,LABELS,parisDate,validDate,normalize,escape,phone,displayPhone,parseReport,parseGithubIssue,parseGithubCandidate,latestReports,validPharmacy,hasPosition,personCount,isStale,distanceKm,fromRow};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PharmacyCore=api;
})(typeof window!=='undefined'?window:globalThis);
