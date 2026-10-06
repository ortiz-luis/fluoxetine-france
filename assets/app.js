(function(){
 'use strict';
 const C=window.PharmacyCore,S=window.PharmacyCommunity,$=id=>document.getElementById(id),E=C.escape;
 const catalog=new Map(),searchIndex=new Map();
 let pharmacies=[],rawIssues=[],community=[],reports=new Map(),view='nearby',selectedId=null,limit=40;
 let syncing=false,nationalLoaded=false,nationalFailed=false,syncState='initial',map,mapReady=false,locationMarker;
 let reportId=null,addId=null,newMap,newMarker,newPosition=null,toastTimer,postalBusy=false;
 const initial=window.PHARMACY_DATA.initialReports;
 const colours={plenty:'#08784f',limited:'#add579',available:'#75b396',none:'#f4dfe5',unknown:'#d1dcd6',stale:'#ded6b5'};
 const dateFormatter=new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Paris'});
 const timeFormatter=new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Paris'});
 const dateLabel=d=>dateFormatter.format(new Date(d+'T12:00:00Z'));
 const dateTimeLabel=d=>timeFormatter.format(new Date(d));
 function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,6500);}
 function mergePharmacies(list,national=false){
  for(const item of list){
   if(!C.validPharmacy(item))continue;
   const old=catalog.get(item.id),p={...item};
   if(national&&old){p.name=old.name;p.phone=p.phone||old.phone;if(!C.hasPosition(p)&&C.hasPosition(old)){p.lat=old.lat;p.lng=old.lng;p.approximate=old.approximate;p.positionSource='Répertoire initial';}}
   catalog.set(p.id,p);searchIndex.set(p.id,C.normalize([p.name,p.address,p.postcode,p.city].join(' ')));
  }
  pharmacies=Array.from(catalog.values());
 }
 mergePharmacies(window.PHARMACY_DATA.pharmacies);
 function allReports(){return [...initial,...community].map(r=>C.parseReport(r,catalog)).filter(Boolean);}
 function historyFor(id){return allReports().filter(r=>r.pharmacyId===id).sort((a,b)=>b.reportedAt.localeCompare(a.reportedAt));}
 function latest(){return C.latestReports(allReports());}
 function positive(r){return r&&r.status!=='none'&&!C.isStale(r);}
 function statusFor(r){return r?(C.isStale(r)?'stale':r.status):'unknown';}
 function labelFor(r){return r?(C.isStale(r)?'À reconfirmer · '+C.LABELS[r.status]:C.LABELS[r.status]):C.LABELS.unknown;}
 function filteredReports(){const d=$('dateFilter').value;return C.latestReports(allReports().filter(r=>!d||r.date===d));}
 function statusMatches(p){const filter=$('statusFilter').value;return filter==='all'||filter===statusFor(reports.get(p.id));}
 function matches(p){const query=C.normalize($('search').value.trim());return statusMatches(p)&&(!query||query.split(/\s+/).every(word=>searchIndex.get(p.id).includes(word)));}
 function reportMarkup(r,id){
  if(!r)return '<div class="confirmation unconfirmed"><strong>À renseigner</strong><p>Vous connaissez le stock ? Partagez votre information.</p></div>';
  const history=historyFor(id),people=C.personCount(history);
  const author=x=>x.participantId?'Par '+E(x.participantId):x.source==='initial-phone-survey'?'Relevé initial':'Participant';
  const method=x=>x.source==='initial-phone-survey'||x.method==='phone'?'Appel téléphonique':x.method==='visit'?'Sur place':'Information partagée';
  return `<div class="confirmation ${statusFor(r)}"><strong>${E(labelFor(r))}</strong><p>Signalé le ${dateTimeLabel(r.reportedAt)}</p><small>${author(r)} · ${method(r)}</small>${C.isStale(r)?'<p>Ce signalement a plus de 48 h. Une nouvelle vérification peut aider.</p>':''}<small>${history.length} signalement${history.length>1?'s':''}${people?' · '+people+' compte'+(people>1?'s':'')+' participant'+(people>1?'s':''):''}</small>${history.length>1?'<details class="history"><summary>Voir l’historique</summary>'+history.slice(1,21).map(x=>`<div>${E(C.LABELS[x.status])} · ${dateTimeLabel(x.reportedAt)}<br>${author(x)} · ${method(x)}</div>`).join('')+(history.length>21?'<p>Les autres signalements sont consultables dans le dépôt public.</p>':'')+'</details>':''}</div>`;
 }
 function phoneMarkup(p){return p.phone?`<a class="phone" href="tel:${C.phone(p.phone)}">${E(C.displayPhone(p.phone))}</a>`:'<p class="missing-phone">Téléphone absent du répertoire. Vous pouvez partager une information obtenue sur place.</p>';}
 function positionNote(p){return (p.positionWarning?'<p class="dialog-note">'+E(p.positionWarning)+'</p>':p.approximate?'<p class="dialog-note">Position approximative dans la rue. Vérifiez l’adresse.</p>':!C.hasPosition(p)?'<p class="dialog-note">Emplacement exact à vérifier. Cette fiche peut être renseignée.</p>':'')+(p.directoryWarning?'<p class="dialog-note">'+E(p.directoryWarning)+'</p>':'')+(p.phoneSource?'<p class="dialog-note">Téléphone issu d’un ancien extrait FINESS : à vérifier.</p>':'');}
 function listItems(){
  const query=$('search').value.trim(),bounds=mapReady?map.getBounds():null,center=mapReady?map.getCenter():{lat:48.85,lng:2.35};
  const list=pharmacies.filter(p=>matches(p)&&(view!=='positive'||positive(reports.get(p.id)))&&(view!=='nearby'||query||!bounds||(C.hasPosition(p)&&bounds.contains([p.lng,p.lat]))));
  const distance=new Map(list.map(p=>[p.id,C.hasPosition(p)?C.distanceKm(center,p):Infinity]));
  list.sort((a,b)=>view==='positive'?(reports.get(b.id)?.reportedAt||'').localeCompare(reports.get(a.id)?.reportedAt||'')||distance.get(a.id)-distance.get(b.id):distance.get(a.id)-distance.get(b.id)||a.name.localeCompare(b.name,'fr'));
  return list;
 }
 function renderList(){
  const list=listItems();$('resultCount').textContent=`${list.length.toLocaleString('fr-FR')} pharmacie${list.length>1?'s':''}${view==='nearby'&&!$('search').value.trim()?' dans cette zone':''}`;
  $('pharmacyList').replaceChildren();$('showMore').hidden=list.length<=limit;
  if(!list.length)$('pharmacyList').innerHTML='<p class="empty">'+(view==='nearby'?'Rapprochez la carte ou recherchez un nom ou un code postal.':'Aucun résultat. Essayez « Toutes » ou effacez les filtres.')+'</p>';
  for(const p of list.slice(0,limit)){
   const r=reports.get(p.id),b=document.createElement('button');b.type='button';b.className='list-card '+statusFor(r)+(selectedId===p.id?' selected':'');b.dataset.id=p.id;
   b.innerHTML=`<h3>${E(p.name)}</h3><p>${E(p.address)}</p><span class="list-status">${E(labelFor(r))}</span>${!C.hasPosition(p)?'<small class="muted">Position à vérifier · fiche disponible</small>':''}`;
   b.addEventListener('click',()=>selectPharmacy(p.id,true,true));$('pharmacyList').append(b);
  }
 }
 const collection=features=>({type:'FeatureCollection',features});
 function mapData(){
  const grey=[],reported=[];
  for(const p of pharmacies){
   if(!C.hasPosition(p)||!statusMatches(p))continue;
   const r=reports.get(p.id),status=statusFor(r),f={type:'Feature',geometry:{type:'Point',coordinates:[p.lng,p.lat]},properties:{id:p.id,name:p.name,status,colour:colours[status]}};
   (r?reported:grey).push(f);
  }
  return {grey:collection(grey),reported:collection(reported)};
 }
 function renderMap(){if(!mapReady)return;const data=mapData();map.getSource('pharmacies-grey').setData(data.grey);map.getSource('pharmacies-reported').setData(data.reported);$('map').dataset.pharmacies=String(data.grey.features.length+data.reported.features.length);}
 function failMap(){mapReady=false;$('map').hidden=true;$('mapFallback').hidden=false;$('locateMe').disabled=true;$('resetMap').disabled=true;renderList();}
 function setupMap(){
  if(!window.maplibregl){failMap();return;}
  try{
   map=new maplibregl.Map({container:'map',style:'assets/map-style.json?v=20261005-national',center:[2.3472,48.82],zoom:9.5,minZoom:2,maxZoom:19,attributionControl:false,dragRotate:false,touchPitch:false,locale:{'Map.Title':'Carte des pharmacies','NavigationControl.ZoomIn':'Zoomer','NavigationControl.ZoomOut':'Dézoomer','AttributionControl.ToggleAttribution':'Afficher les attributions'}});
   map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-left');map.addControl(new maplibregl.AttributionControl({compact:true}),'bottom-right');map.touchZoomRotate.disableRotation();
   let fallbackStarted=false;
   map.on('error',()=>{if(!mapReady&&!fallbackStarted){fallbackStarted=true;setTimeout(()=>{if(!mapReady){map.setStyle({version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}},layers:[{id:'osm',type:'raster',source:'osm'}]});$('mapStatus').textContent='Fond de secours chargé. Les points ronds ouvrent les fiches.';}},1200);}});
   map.on('style.load',()=>{
    for(const layer of map.getStyle().layers||[]){if(layer['source-layer']==='poi'){map.removeLayer(layer.id);continue;}const field=layer.layout?.['text-field'];if(field&&JSON.stringify(field).includes('name'))map.setLayoutProperty(layer.id,'text-field',['coalesce',['get','name:fr'],['get','name_fr'],['get','name'],['get','name:latin'],'']);}
    if(map.getSource('pharmacies-grey'))return;
    const data=mapData();
    map.addSource('pharmacies-grey',{type:'geojson',data:data.grey,cluster:true,clusterMaxZoom:13,clusterRadius:38});map.addSource('pharmacies-reported',{type:'geojson',data:data.reported});
    map.addLayer({id:'pharmacy-clusters',type:'circle',source:'pharmacies-grey',filter:['has','point_count'],paint:{'circle-color':'#dce5df','circle-radius':['step',['coalesce',['get','point_count'],0],17,20,21,100,25],'circle-stroke-color':'#9caea4','circle-stroke-width':1.5}});
    map.addLayer({id:'pharmacy-cluster-count',type:'symbol',source:'pharmacies-grey',filter:['has','point_count'],layout:{'text-field':['get','point_count_abbreviated'],'text-font':['Noto Sans Regular'],'text-size':14},paint:{'text-color':'#345546'}});
    map.addLayer({id:'pharmacy-points',type:'circle',source:'pharmacies-grey',filter:['!',['has','point_count']],paint:{'circle-color':'#d1dcd6','circle-radius':['interpolate',['linear'],['zoom'],5,5,12,8,16,11],'circle-stroke-color':'#7d9487','circle-stroke-width':1.5,'circle-opacity':0.85}});
    map.addLayer({id:'pharmacy-reports',type:'circle',source:'pharmacies-reported',paint:{'circle-color':['get','colour'],'circle-radius':['interpolate',['linear'],['zoom'],5,6,12,9,16,12],'circle-stroke-color':'#fff','circle-stroke-width':2}});
    for(const [id,source] of [['pharmacy-grey-labels','pharmacies-grey'],['pharmacy-report-labels','pharmacies-reported']])map.addLayer({id,type:'symbol',source,minzoom:14,filter:['!',['has','point_count']],layout:{'text-field':['get','name'],'text-font':['Noto Sans Regular'],'text-size':13,'text-anchor':'top','text-offset':[0,1.1],'text-max-width':16},paint:{'text-color':'#244c3a','text-halo-color':'#fff','text-halo-width':2}});
    mapReady=true;$('map').dataset.ready='true';renderMap();renderList();if(selectedId){const p=catalog.get(selectedId);if(C.hasPosition(p))map.jumpTo({center:[p.lng,p.lat],zoom:16});}
    fetch('https://tiles.openfreemap.org/planet',{signal:AbortSignal.timeout(10000)}).then(r=>r.ok?r.json():null).then(info=>{if(info?.tiles?.length){const source=map.getSource('openmaptiles');const old=map.getStyle().sources.openmaptiles?.tiles;if(source&&JSON.stringify(old)!==JSON.stringify(info.tiles))source.setTiles(info.tiles);}}).catch(()=>{});
   });
   map.on('click',async event=>{
    if(!mapReady)return;
    const hit=map.queryRenderedFeatures([[event.point.x-13,event.point.y-13],[event.point.x+13,event.point.y+13]],{layers:['pharmacy-reports','pharmacy-points','pharmacy-clusters']});
    const unique=Array.from(new Map(hit.filter(f=>f.properties.id).map(f=>[f.properties.id,f])).values());
    if(unique.length){
     unique.sort((a,b)=>{const pa=map.project(a.geometry.coordinates),pb=map.project(b.geometry.coordinates);return (pa.x-event.point.x)**2+(pa.y-event.point.y)**2-(pb.x-event.point.x)**2-(pb.y-event.point.y)**2;});
     const near=unique.filter(f=>{const q=map.project(f.geometry.coordinates),first=map.project(unique[0].geometry.coordinates);return Math.hypot(q.x-first.x,q.y-first.y)<5;});
     if(near.length>1){$('chooseList').replaceChildren();for(const f of near){const p=catalog.get(f.properties.id),b=document.createElement('button');b.type='button';b.className='list-card';b.innerHTML=`<h3>${E(p.name)}</h3><p>${E(p.address)}</p>`;b.addEventListener('click',()=>{$('chooseDialog').close();selectPharmacy(p.id,false,true);});$('chooseList').append(b);}$('chooseDialog').showModal();}else selectPharmacy(unique[0].properties.id,false,true);return;
    }
    const cluster=hit.find(f=>f.properties.cluster_id!==undefined);if(cluster){try{const zoom=await map.getSource('pharmacies-grey').getClusterExpansionZoom(Number(cluster.properties.cluster_id));map.easeTo({center:cluster.geometry.coordinates,zoom:Math.min(zoom+0.3,16),duration:350});}catch{toast('Zoomez pour choisir une pharmacie.');}}
   });
   map.on('mousemove',event=>{if(mapReady)map.getCanvas().style.cursor=map.queryRenderedFeatures(event.point,{layers:['pharmacy-reports','pharmacy-points','pharmacy-clusters']}).length?'pointer':'';});
   let moveTimer;map.on('moveend',()=>{clearTimeout(moveTimer);moveTimer=setTimeout(()=>{if(view==='nearby'&&!$('search').value.trim())limit=40;renderList();},100);});if(window.ResizeObserver)new ResizeObserver(()=>map.resize()).observe($('map'));
  }catch(error){console.warn('Carte indisponible :',error);failMap();}
 }
 function renderDetail(){
  if(!selectedId||!catalog.has(selectedId)){$('detail').hidden=true;return;}
  const p=catalog.get(selectedId),r=reports.get(selectedId),directions=new URL('https://www.google.com/maps/dir/');directions.search=new URLSearchParams({api:'1',destination:p.address}).toString();
  $('detail').innerHTML=`<button class="icon-button detail-close" aria-label="Fermer la fiche">×</button><p class="eyebrow">${E(p.city)}</p><h2>${E(p.name)}</h2><p class="address">${E(p.address)}</p>${phoneMarkup(p)}${positionNote(p)}${reportMarkup(r,selectedId)}<div class="detail-actions"><button id="openReport" class="button primary">Mettre à jour le stock</button><a class="button secondary" href="${directions}" target="_blank" rel="noopener">Itinéraire</a></div>`;
  $('detail').hidden=false;$('detail').querySelector('.detail-close').addEventListener('click',()=>{selectedId=null;$('detail').hidden=true;renderList();updateUrl();});$('openReport').addEventListener('click',()=>openReport(selectedId));
 }
 function updateUrl(){if(location.protocol==='file:')return;const u=new URL(location.href);if(selectedId)u.searchParams.set('pharmacy',selectedId);else u.searchParams.delete('pharmacy');history.replaceState(null,'',u);}
 function selectPharmacy(id,move,edit=false){if(!catalog.has(id))return;selectedId=id;renderDetail();renderList();updateUrl();const p=catalog.get(id);if(move&&mapReady&&C.hasPosition(p))map.jumpTo({center:[p.lng,p.lat],zoom:16});if(edit)openReport(id);}
 function render(){
  reports=filteredReports();$('positiveCount').textContent=Array.from(latest().values()).filter(positive).length;$('tabPositiveCount').textContent=Array.from(reports.values()).filter(positive).length;
  for(const [id,v] of [['tabNearby','nearby'],['tabPositive','positive'],['tabAll','all']]){$(id).classList.toggle('active',view===v);$(id).setAttribute('aria-pressed',String(view===v));}
  const unlocated=pharmacies.filter(p=>!C.hasPosition(p)).length;$('catalogCount').textContent=pharmacies.length.toLocaleString('fr-FR')+' fiches'+(nationalLoaded?' · France':'');$('positionCount').textContent=nationalLoaded?`${(pharmacies.length-unlocated).toLocaleString('fr-FR')} points sur la carte · ${unlocated.toLocaleString('fr-FR')} fiches sans position, accessibles par la recherche`:'Chargement du répertoire national…';renderList();renderMap();renderDetail();updateSync();
 }
 function updateSync(){const texts={initial:'',loading:'Actualisation des contributions…',synced:'Contributions actualisées.',error:'Contributions indisponibles. Les derniers signalements chargés restent visibles.'};$('syncStatus').textContent=texts[syncState];$('nationalStatus').textContent=nationalFailed?'Le répertoire national n’a pas pu se charger. Réessayez avec « Actualiser ».':!nationalLoaded?'Chargement des fiches de toute la France…':'';$('refresh').disabled=syncing;}
 function parseCommunity(){
  for(const [id,p] of catalog)if(p.source==='Ajout communautaire vérifié'){catalog.delete(id);searchIndex.delete(id);}
  mergePharmacies(rawIssues.map(C.parseGithubCandidate).filter(Boolean));
  community=rawIssues.map(r=>C.parseGithubIssue(r,catalog)).filter(Boolean);
 }
 async function loadCommunity(){if(syncing)return;syncing=true;syncState='loading';updateSync();try{rawIssues=await S.loadReports();parseCommunity();syncState='synced';}catch{syncState='error';}finally{syncing=false;render();}}
 async function loadNational(){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{const response=await fetch('data/national.json?v=20261005-national',{signal:controller.signal});if(!response.ok)throw Error();const data=await response.json();if(data.pharmacies?.length<15000)throw Error();mergePharmacies(data.pharmacies,true);nationalLoaded=true;nationalFailed=false;parseCommunity();$('directoryDate').textContent='Répertoire FINESS du '+dateLabel(C.parisDate(new Date(data.metadata.generatedAt)))+'.';const activeIds=new Set(data.pharmacies.map(p=>p.id));for(const p of pharmacies)if(!activeIds.has(p.id)&&p.source==='Répertoire initial')p.directoryWarning='Fiche initiale absente de l’extrait actif FINESS : activité à vérifier.';const requested=new URLSearchParams(location.search).get('pharmacy');if(catalog.has(requested))selectPharmacy(requested,true,false);render();}
  catch{nationalFailed=true;render();}finally{clearTimeout(timer);}
 }
 function openReport(id){
  const p=catalog.get(id);if(!p)return;reportId=id;$('reportForm').reset();$('reportPharmacyName').textContent=p.name;$('reportPharmacyAddress').textContent=p.address;$('reportPharmacyPhone').hidden=!p.phone;if(p.phone){$('reportPharmacyPhone').textContent=C.displayPhone(p.phone);$('reportPharmacyPhone').href='tel:'+C.phone(p.phone);}$('reportLatest').innerHTML=reportMarkup(reports.get(id),id);$('reportPosition').innerHTML=positionNote(p);$('formError').hidden=true;$('reportDialog').showModal();
 }
 $('reportForm').addEventListener('submit',event=>{event.preventDefault();const status=event.submitter?.value;if(!['plenty','limited','none'].includes(status))return;const method=new FormData($('reportForm')).get('method')||'other';window.open(S.issueUrl(catalog.get(reportId),status,method),'_blank','noopener');$('reportDialog').close();toast('La fiche est prête. Publiez-la sur GitHub avec « Create » ou « Submit new issue ». La carte se mettra à jour après la publication.');});
 for(const id of ['closeDialog','cancelReport'])$(id).addEventListener('click',()=>$('reportDialog').close());$('closeChoose').addEventListener('click',()=>$('chooseDialog').close());
 for(const [id,v] of [['tabNearby','nearby'],['tabPositive','positive'],['tabAll','all']])$(id).addEventListener('click',()=>{view=v;limit=40;render();});
 let searchTimer;$('search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{limit=40;if($('search').value.trim())view='all';render();},180);});
 for(const id of ['statusFilter','dateFilter'])$(id).addEventListener('change',()=>{limit=40;render();});$('clearFilters').addEventListener('click',()=>{$('statusFilter').value='all';$('dateFilter').value='';limit=40;render();});$('showMore').addEventListener('click',()=>{limit+=40;renderList();});$('refresh').addEventListener('click',()=>{if(nationalFailed)loadNational();loadCommunity();});
 function clearForMap(){$('search').value='';$('statusFilter').value='all';$('dateFilter').value='';view='nearby';limit=40;render();}
 $('resetMap').addEventListener('click',()=>{clearForMap();if(mapReady)map.fitBounds([[-5.3,41.3],[9.7,51.15]],{padding:25,duration:400});});
 $('locateMe').addEventListener('click',()=>{if(!navigator.geolocation){$('mapStatus').textContent='Localisation indisponible. Utilisez votre code postal.';return;}$('locateMe').disabled=true;$('mapStatus').textContent='Recherche de votre position…';navigator.geolocation.getCurrentPosition(position=>{const {latitude:lat,longitude:lng}=position.coords;clearForMap();if(mapReady){map.jumpTo({center:[lng,lat],zoom:15});locationMarker?.remove();const dot=document.createElement('div');dot.className='user-location';dot.setAttribute('aria-hidden','true');locationMarker=new maplibregl.Marker({element:dot}).setLngLat([lng,lat]).addTo(map);dot.removeAttribute('role');dot.removeAttribute('tabindex');}$('mapStatus').textContent='Carte centrée près de vous. Touchez une pharmacie.';$('locateMe').disabled=false;},error=>{$('mapStatus').textContent=error.code===1?'Localisation non autorisée. Vous pouvez utiliser votre code postal.':'Position introuvable. Essayez votre code postal.';$('locateMe').disabled=false;},{enableHighAccuracy:false,timeout:10000,maximumAge:60000});});
 function zoomToPharmacies(list){if(!mapReady)return;const located=list.filter(C.hasPosition);if(!located.length)return;const bounds=new maplibregl.LngLatBounds();for(const p of located)bounds.extend([p.lng,p.lat]);map.fitBounds(bounds,{padding:35,maxZoom:15,duration:350});}
 $('postcodeForm').addEventListener('submit',async event=>{
  event.preventDefault();if(postalBusy)return;const code=$('postcode').value.trim();if(!/^\d{5}$/.test(code))return;postalBusy=true;$('goPostcode').disabled=true;clearForMap();$('search').value=code;view='all';render();
  const list=pharmacies.filter(p=>p.postcode===code);if(list.some(C.hasPosition)){zoomToPharmacies(list);$('mapStatus').textContent='Code postal '+code+' · touchez une pharmacie pour la renseigner.';}
  else{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{const u=new URL('https://data.geopf.fr/geocodage/search');u.search=new URLSearchParams({q:code,postcode:code,type:'municipality',index:'address',limit:'1'});const response=await fetch(u,{signal:controller.signal});if(!response.ok)throw Error();const data=await response.json(),f=data.features?.[0];if(!f||f.geometry?.type!=='Point'||f.properties?.postcode!==code)throw Error();if(mapReady)map.jumpTo({center:f.geometry.coordinates,zoom:13});$('mapStatus').textContent='Zone du code postal '+code+'. Les fiches disponibles sont dans la liste.';}catch{$('mapStatus').textContent=nationalLoaded?'Code postal introuvable. Recherchez le nom de la commune.':'Le répertoire charge encore. Réessayez dans quelques secondes.';}finally{clearTimeout(timer);}}
  postalBusy=false;$('goPostcode').disabled=false;
 });
 $('share').addEventListener('click',async()=>{try{if(navigator.share)await navigator.share({title:document.title,url:location.href});else{await navigator.clipboard.writeText(location.href);toast('Lien copié.');}}catch(e){if(e.name!=='AbortError')toast('Copiez le lien dans la barre d’adresse pour partager la carte.');}});
 function openAdd(){$('addForm').reset();addId='community-'+crypto.randomUUID();newPosition=null;$('newMap').hidden=true;$('positionHint').hidden=true;$('addressOptions').replaceChildren();$('geocodeStatus').textContent='';$('addError').hidden=true;$('addDialog').showModal();}
 $('addPharmacy').addEventListener('click',openAdd);for(const id of ['closeAdd','cancelAdd'])$(id).addEventListener('click',()=>$('addDialog').close());
 function setPosition(lat,lng){newPosition={lat,lng};$('newMap').hidden=false;$('positionHint').hidden=false;if(!window.L)return;if(!newMap){newMap=L.map('newMap',{scrollWheelZoom:false});L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(newMap);newMarker=L.marker([lat,lng],{draggable:true,icon:L.divIcon({className:'new-marker',html:'+',iconSize:[32,32],iconAnchor:[16,16]})}).addTo(newMap);newMarker.on('dragend',()=>{const p=newMarker.getLatLng();newPosition={lat:p.lat,lng:p.lng};});newMap.on('click',event=>{newMarker.setLatLng(event.latlng);newPosition={lat:event.latlng.lat,lng:event.latlng.lng};});}newMarker.setLatLng([lat,lng]);newMap.invalidateSize();newMap.setView([lat,lng],16);}
 for(const id of ['newAddress','newPostcode','newCity'])$(id).addEventListener('input',()=>{newPosition=null;$('newMap').hidden=true;$('positionHint').hidden=true;$('addressOptions').replaceChildren();});
 $('locateAddress').addEventListener('click',async()=>{const address=[$('newAddress').value,$('newPostcode').value,$('newCity').value].join(' ').trim();if(address.length<8){$('geocodeStatus').textContent='Renseignez d’abord l’adresse, le code postal et la commune.';return;}$('locateAddress').disabled=true;$('geocodeStatus').textContent='Recherche de l’adresse…';$('addressOptions').replaceChildren();newPosition=null;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{const u=new URL('https://data.geopf.fr/geocodage/search');u.search=new URLSearchParams({q:address,index:'address',limit:'3'});const response=await fetch(u,{signal:controller.signal});if(!response.ok)throw Error();const data=await response.json(),features=data.features?.filter(f=>f.geometry?.type==='Point'&&f.properties?.label);if(!features?.length)throw Error();$('geocodeStatus').textContent='Choisissez l’adresse correspondant à la pharmacie :';for(const f of features){const b=document.createElement('button');b.type='button';b.className='button secondary';b.textContent=f.properties.label;b.addEventListener('click',()=>{setPosition(f.geometry.coordinates[1],f.geometry.coordinates[0]);$('geocodeStatus').textContent='Adresse sélectionnée : '+f.properties.label;});$('addressOptions').append(b);}}catch{$('geocodeStatus').textContent='Adresse introuvable. Vérifiez-la puis réessayez.';}finally{clearTimeout(timer);$('locateAddress').disabled=false;}});
 $('addForm').addEventListener('submit',event=>{event.preventDefault();const p={id:addId,name:$('newName').value.trim(),address:$('newAddress').value.trim()+', '+$('newPostcode').value+' '+$('newCity').value.trim(),postcode:$('newPostcode').value,city:$('newCity').value.trim(),phone:C.phone($('newPhone').value),lat:newPosition?.lat,lng:newPosition?.lng};if(!newPosition||!p.phone||!C.validPharmacy(p)||!$('newOfficine').checked){$('addError').textContent='Vérifiez le téléphone et choisissez l’adresse sur la carte.';$('addError').hidden=false;return;}const duplicate=pharmacies.find(x=>x.phone&&C.phone(x.phone)===p.phone);if(duplicate){$('addError').textContent='Cette pharmacie figure déjà dans le répertoire : '+duplicate.name+'. Recherchez sa fiche.';$('addError').hidden=false;return;}window.open(S.candidateUrl(p),'_blank','noopener');$('addDialog').close();toast('La proposition est prête. Publiez-la sur GitHub pour permettre sa vérification.');});
 reports=filteredReports();setupMap();render();const requested=new URLSearchParams(location.search).get('pharmacy');if(catalog.has(requested))selectPharmacy(requested,false,false);loadNational();loadCommunity();
 if(S.enabled)setInterval(()=>{if(!document.hidden&&!$('reportDialog').open&&!$('addDialog').open)loadCommunity();},60000);
 window.addEventListener('focus',()=>{if(!syncing&&!$('reportDialog').open&&!$('addDialog').open)loadCommunity();});
})();
