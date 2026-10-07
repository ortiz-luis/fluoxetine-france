(function(root){
 'use strict';
 const REPOSITORY='ortiz-luis/fluoxetine-france';
 async function loadReports(){
  const all=[];
  for(let page=1;page<=10;page++){
   const response=await fetch(`https://api.github.com/repos/${REPOSITORY}/issues?state=open&sort=created&direction=desc&per_page=100&page=${page}`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store',signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error('GitHub indisponible'); const issues=await response.json();
   if(!Array.isArray(issues))throw Error('Réponse GitHub invalide'); all.push(...issues); if(issues.length<100)break;
  }
  return all;
 }
 function issueUrl(pharmacy,status,method='other'){
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const labels={plenty:'Oui, en quantité',limited:'Oui, mais peu',none:'Non disponible',available:'Disponible'};
  const methods={phone:'Appel téléphonique',visit:'Sur place',other:'Non précisé'};
  const fiche=new URL('https://ortiz-luis.github.io/fluoxetine-france/');fiche.searchParams.set('pharmacy',pharmacy.id);
  const body=`## Disponibilité de la fluoxétine\n\nPharmacie : ${pharmacy.name.replace(/[\r\n]/g,' ')}\nAdresse : ${pharmacy.address.replace(/[\r\n]/g,' ')}\nRéponse : ${labels[status]}\nInformation obtenue : ${methods[method]||methods.other}\n\nFiche : ${fiche.href}\n\nLa date, l’heure et le nom du participant sont enregistrés automatiquement lors de la publication.\n\nAprès publication, revenez sur la carte. Merci pour votre aide !\n`;
  const u=new URL(`https://github.com/${REPOSITORY}/issues/new`);u.search=new URLSearchParams({template:'report.md',title:`[${labels[status]}] ${pharmacy.name} · ${date}`,body}).toString();return u.toString();
 }
 function candidateUrl(p){const clean=s=>String(s).replace(/[\r\n]/g,' ');const position=new URL('https://www.openstreetmap.org/');position.search=new URLSearchParams({mlat:p.lat,mlon:p.lng,zoom:18});const body=`## Pharmacie à ajouter\n\nNom : ${clean(p.name)}\nAdresse : ${clean(p.address)}\nCode postal : ${p.postcode}\nCommune : ${clean(p.city)}\nTéléphone : ${p.phone}\nEmplacement : ${position.href}\nPharmacie d’officine : Oui\nRéférence de la proposition : ${p.id}\n\nCette proposition sera vérifiée avant son ajout à la carte. Merci pour votre aide !\n`;const u=new URL(`https://github.com/${REPOSITORY}/issues/new`);u.search=new URLSearchParams({template:'candidate.md',title:`[Pharmacie à vérifier] ${p.name}`,body}).toString();return u.toString();}
 root.PharmacyCommunity={enabled:true,loadReports,issueUrl,candidateUrl,repository:REPOSITORY};
})(window);
