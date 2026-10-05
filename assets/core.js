(function(root) {
 'use strict';
 const STATUSES=['plenty','limited','none','available'];
 const LABELS={plenty:'Oui, en quantité',limited:'Oui, mais peu',none:'Non disponible',available:'Disponible · quantité non précisée',unknown:'Pas encore appelée'};
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
  return {id:String(r.id),pharmacyId,status:r.status,date,reportedAt:new Date(created).toISOString(),source:r.source||'community',participantId:r.participant_id||r.participantId||null};
 }
 function parseGithubIssue(issue,catalog,now=new Date()){
  if(!issue||issue.state!=='open'||issue.pull_request||typeof issue.body!=='string')return null;
  const match=issue.body.match(/<!-- fluoxetine-report:v2 -->\s*```json\s*([\s\S]*?)\s*```/);
  if(!match)return null; let value; try{value=JSON.parse(match[1]);}catch{return null;}
  if(value.schema!==2||!Number.isFinite(Date.parse(issue.created_at)))return null;
  const published=new Date(issue.created_at);
  return parseReport({id:'github-'+issue.number,pharmacyId:value.pharmacyId,status:value.status,date:parisDate(published),created_at:issue.created_at,source:'community',participantId:issue.user?.login||null},catalog,now);
 }
 function latestReports(reports){const out=new Map();for(const r of reports){const old=out.get(r.pharmacyId);if(!old||r.date>old.date||(r.date===old.date&&r.reportedAt>old.reportedAt))out.set(r.pharmacyId,r);}return out;}
 function validPharmacy(p){return Boolean(p&&typeof p.id==='string'&&p.id.length<=80&&typeof p.name==='string'&&p.name.trim().length>=2&&p.name.length<=160&&typeof p.address==='string'&&p.address.length>=8&&p.address.length<=250&&/^\d{5}$/.test(p.postcode)&&typeof p.city==='string'&&p.city.length>=2&&p.city.length<=100&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180&&(p.phone===''||phone(p.phone)));}
 function fromRow(r){return {id:r.id,name:r.name,address:r.address,postcode:r.postcode,city:r.city,phone:r.phone||'',lat:Number(r.latitude),lng:Number(r.longitude),source:'Ajout communautaire',approximate:false};}
 const api={STATUSES,LABELS,parisDate,validDate,normalize,escape,phone,displayPhone,parseReport,parseGithubIssue,latestReports,validPharmacy,fromRow};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PharmacyCore=api;
})(typeof window!=='undefined'?window:globalThis);
