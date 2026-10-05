(function(root){
 'use strict';
 const REPOSITORY='ortiz-luis/fluoxetine-france';
 async function loadReports(){
  const all=[];
  for(let page=1;page<=10;page++){
   const response=await fetch(`https://api.github.com/repos/${REPOSITORY}/issues?state=open&sort=created&direction=desc&per_page=100&page=${page}`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'});
   if(!response.ok)throw Error('GitHub indisponible'); const issues=await response.json();
   if(!Array.isArray(issues))throw Error('Réponse GitHub invalide'); all.push(...issues); if(issues.length<100)break;
  }
  return all;
 }
 function issueUrl(pharmacy,status){
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const payload={schema:2,pharmacyId:pharmacy.id,status,date};
  const body=`## Réponse téléphonique\n\nPharmacie : ${pharmacy.name}\nAdresse : ${pharmacy.address}\n\n<!-- fluoxetine-report:v2 -->\n\`\`\`json\n${JSON.stringify(payload,null,2)}\n\`\`\`\n`;
  const u=new URL(`https://github.com/${REPOSITORY}/issues/new`);u.search=new URLSearchParams({template:'report.md',title:`[${status}] ${pharmacy.name} · ${date}`,body}).toString();return u.toString();
 }
 function candidateUrl(p){const body=`## Pharmacie proposée\n\nNom : ${p.name}\nAdresse : ${p.address}\nTéléphone : ${p.phone}\nCoordonnées : ${p.lat}, ${p.lng}\n\nMerci de vérifier cette pharmacie avant de publier.\n`;const u=new URL(`https://github.com/${REPOSITORY}/issues/new`);u.search=new URLSearchParams({template:'candidate.md',title:`[Pharmacie à vérifier] ${p.name}`,body}).toString();return u.toString();}
 root.PharmacyCommunity={enabled:true,loadReports,issueUrl,candidateUrl,repository:REPOSITORY};
})(window);

