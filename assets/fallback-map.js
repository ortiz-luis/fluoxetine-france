(function(root){
 'use strict';
 // Fond raster et points sur canvas pour les appareils sans accélération WebGL.
 function create(container,select){
  if(!root.L)throw Error('Leaflet indisponible');
  const el=document.getElementById(container);el.replaceChildren();el.classList.remove('maplibregl-map');
  const m=L.map(el,{preferCanvas:true,zoomControl:false,minZoom:2,maxZoom:19}).setView([48.82,2.3472],9.5);
  L.control.zoom({zoomInTitle:'Zoomer',zoomOutTitle:'Dézoomer'}).addTo(m);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(m);
  const renderer=L.canvas({padding:0.3}),points=L.layerGroup().addTo(m),clusters=L.layerGroup().addTo(m);
  const data={grey:[],reported:[]};let timer,position;
  const circle=(f)=>{
   const c=f.geometry.coordinates;
   const point=L.circleMarker([c[1],c[0]],{renderer,radius:m.getZoom()>=14?12:7,color:f.properties.status==='unknown'?'#7d9487':'#ffffff',weight:2,fillColor:f.properties.colour,fillOpacity:0.95}).addTo(points);
   point.on('click',()=>select(f.properties.id));
   if(m.getZoom()>=15)point.bindTooltip(root.PharmacyCore.escape(f.properties.name),{direction:'top',opacity:0.95});
  };
  function draw(){
   clearTimeout(timer);points.clearLayers();clusters.clearLayers();const bounds=m.getBounds().pad(0.05),zoom=m.getZoom(),visible=f=>bounds.contains([f.geometry.coordinates[1],f.geometry.coordinates[0]]);
   const grey=data.grey.filter(visible);
   if(zoom>13){grey.forEach(circle);}
   else{
    const cells=new Map();for(const f of grey){const p=m.project([f.geometry.coordinates[1],f.geometry.coordinates[0]],zoom),key=Math.floor(p.x/54)+':'+Math.floor(p.y/54);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(f);}
    for(const group of cells.values()){
     if(group.length===1){circle(group[0]);continue;}
     const lat=group.reduce((s,f)=>s+f.geometry.coordinates[1],0)/group.length,lng=group.reduce((s,f)=>s+f.geometry.coordinates[0],0)/group.length;
     const marker=L.marker([lat,lng],{icon:L.divIcon({className:'fallback-cluster',html:String(group.length),iconSize:[42,42],iconAnchor:[21,21]}),title:group.length+' pharmacies — touchez pour zoomer'}).addTo(clusters);
     marker.on('click',()=>m.setView([lat,lng],Math.min(zoom+2,15)));
    }
   }
   data.reported.filter(visible).forEach(circle);
  }
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(draw,30);};m.on('moveend zoomend',schedule);
  const adapter={
   isFallback:true,
   getSource(id){return {setData(value){data[id==='pharmacies-grey'?'grey':'reported']=value.features;schedule();}};},
   getCenter(){const p=m.getCenter();return {lat:p.lat,lng:p.lng};},
   getBounds(){const b=m.getBounds();return {contains(c){return b.contains([c[1],c[0]]);}};},
   jumpTo({center,zoom}){m.setView([center[1],center[0]],zoom??m.getZoom());return adapter;},
   fitBounds(bounds,options={}){const a=Array.isArray(bounds)?bounds:bounds.toArray();m.fitBounds(a.map(c=>[c[1],c[0]]),{padding:[options.padding||25,options.padding||25],maxZoom:options.maxZoom??19,animate:false});return adapter;},
   on(event,callback){m.on(event,callback);return adapter;},
   resize(){m.invalidateSize({pan:false});},
   project(c){return m.latLngToContainerPoint([c[1],c[0]]);},
   markPosition(lat,lng){if(position)m.removeLayer(position);position=L.circleMarker([lat,lng],{renderer,radius:7,color:'#fff',weight:3,fillColor:'#3579a8',fillOpacity:1,interactive:false}).addTo(m);}
  };
  return adapter;
 }
 root.PharmacyFallback={create};
})(window);
