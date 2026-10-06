/* Vérifications réelles du répertoire national et des parcours tactiles. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),http=require('node:http');
const root=path.resolve(__dirname,'..'),C=require('../assets/core.js');
const output=process.env.TEST_OUTPUT_DIR||path.join(root,'.test-results');fs.mkdirSync(output,{recursive:true});
const data=JSON.parse(fs.readFileSync(path.join(root,'data/national.json'))),box={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/bootstrap.js'),'utf8'),box);
const catalog=new Map([...box.window.PHARMACY_DATA.pharmacies,...data.pharmacies].map(p=>[p.id,p]));
assert.equal(data.pharmacies.length,19916);assert.equal(catalog.size,19917);
assert.equal(box.window.PHARMACY_DATA.pharmacies.length,849);assert.equal(box.window.PHARMACY_DATA.initialReports.length,13);
for(const p of data.pharmacies)assert.equal(C.validPharmacy(p),true,p.id+' invalide');
const massy=catalog.get('910010263');assert.match(massy.name,/Deux Gares/);assert.equal(C.phone(massy.phone),'+33169201277');assert.ok(C.hasPosition(massy));
function issue(number,id,status,author,created='2026-10-05T17:40:00Z',method='visit'){return {number,state:'open',user:{login:author},created_at:created,body:'<!-- fluoxetine-report:v2 -->\n```json\n'+JSON.stringify({schema:2,pharmacyId:id,status,method,date:'2026-01-01'})+'\n```'};}
const now=new Date('2026-10-05T18:00:00Z');
const old=issue(1,massy.id,'plenty','participant-a'),twice=issue(2,massy.id,'limited','participant-a','2026-10-05T17:45:00Z'),second=issue(3,massy.id,'none','participant-b','2026-10-05T17:50:00Z');
const reports=[old,twice,second].map(x=>C.parseGithubIssue(x,catalog,now));
assert.equal(C.personCount(reports),2);assert.equal(C.latestReports(reports).get(massy.id).status,'none');assert.equal(reports[0].date,'2026-10-05');assert.equal(reports[0].reportedAt,'2026-10-05T17:40:00.000Z');assert.equal(reports[0].method,'visit');
assert.equal(C.isStale(reports[0],new Date('2026-10-08T18:00:00Z')),true);
assert.equal(C.parseGithubIssue({...old,state:'closed'},catalog,now),null);
assert.equal(C.parseGithubIssue(issue(4,'does-not-exist','plenty','participant-c'),catalog,now),null);
const realIssues=[issue(91,'920007911','available','exemple','2026-10-05T13:30:56Z'),issue(92,'920007846','available','exemple','2026-10-05T13:30:57Z')];
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html');try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(8795,'127.0.0.1',r));
 const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
 const proxyUrl=process.env.HTTPS_PROXY||process.env.https_proxy;const proxy=proxyUrl?{server:new URL(proxyUrl).origin,bypass:'127.0.0.1,localhost',username:decodeURIComponent(new URL(proxyUrl).username)||undefined,password:decodeURIComponent(new URL(proxyUrl).password)||undefined}:undefined;
 const workspaceChrome=path.resolve(__dirname,'../../pharmacies_recherche/headless/chromium');
 const executablePath=process.env.TEST_CHROMIUM||(fs.existsSync(workspaceChrome)?workspaceChrome:chromium.executablePath());
 const browser=await chromium.launch({proxy,executablePath,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport,ignoreHTTPSErrors:true,geolocation:{latitude:48.724303,longitude:2.260258},permissions:['geolocation']});const page=await context.newPage();const errors=[],requests=[];
  const outgoing=[];context.on('request',r=>{if(r.url().startsWith('https://github.com/ortiz-luis/fluoxetine-france/issues/new'))outgoing.push(r.url());});
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>requests.push(r.url()+': '+r.failure()?.errorText));
  let consoleCount=0;page.on('console',message=>{if(['error','warning'].includes(message.type())&&consoleCount++<4)console.log('Console:',message.text().slice(0,350));});
  await page.addInitScript(()=>{Object.defineProperty(window,'maplibregl',{configurable:true,set(value){const Original=value.Map;value.Map=class extends Original{constructor(options){super(options);window.__testMap=this;}};Object.defineProperty(window,'maplibregl',{value,writable:true,configurable:true});}});});
  let fixture=realIssues;
  await page.route('https://api.github.com/repos/ortiz-luis/fluoxetine-france/issues?*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fixture)}));
  const started=Date.now();await page.goto('http://127.0.0.1:8795/?pharmacy=910010263');
  await page.waitForFunction(()=>document.querySelector('#catalogCount').textContent.includes('19\u202f917'),{timeout:20000});
  try{await page.waitForFunction(()=>document.querySelector('#map').dataset.ready==='true',null,{timeout:20000});}catch(e){console.log('Map debug:',await page.evaluate(()=>({maplibre:!!window.maplibregl,map:!!window.__testMap,canvas:!!document.querySelector('.maplibregl-canvas'),fallback:document.querySelector('#mapFallback').hidden,text:document.querySelector('#mapStatus').textContent})),errors,requests);await page.screenshot({path:path.join(output,'map-debug.png'),fullPage:true});throw e;}
  await page.waitForFunction(()=>document.querySelector('#positiveCount').textContent==='15');
  console.log('Chargement:',viewport,Date.now()-started,'ms');
  assert.match(await page.locator('#detail').innerText(),/Deux Gares/);assert.equal(await page.locator('#detail .phone').getAttribute('href'),'tel:+33169201277');
  await page.locator('#postcode').fill('67000');await page.locator('#goPostcode').click();await page.waitForTimeout(600);
  assert.match(await page.locator('#resultCount').innerText(),/pharmacie/);assert.ok(await page.locator('#pharmacyList .list-card').count()>0);
  const center=await page.evaluate(()=>window.__testMap.getCenter());assert.ok(center.lng>7&&center.lat>48);
  await page.locator('#locateMe').click();await page.waitForFunction(()=>document.querySelector('#mapStatus').textContent.includes('près de vous'));
  const position=await page.evaluate(()=>window.__testMap.getCenter());assert.ok(Math.abs(position.lat-48.724303)<0.001);
  // Toucher le vrai point de Massy sur la carte, sans passer par la liste.
  await page.waitForFunction(()=>window.__testMap.queryRenderedFeatures({layers:['pharmacy-points']}).some(f=>f.properties.id==='910010263'));
  const xy=await page.evaluate(()=>{const p=window.__testMap.project([2.260258,48.724303]);return {x:p.x,y:p.y};});
  await page.locator('.maplibregl-canvas').click({position:xy});await page.waitForFunction(()=>document.querySelector('#reportDialog').open);
  assert.match(await page.locator('#reportPharmacyName').innerText(),/Deux Gares/);
  assert.equal(await page.locator('#reportDialog button[name=answer]').count(),3);assert.equal(await page.locator('#reportDialog input[type=date]').count(),0);
  await page.locator('.method-options summary').click();await page.locator('input[name=method][value=visit]').check();
  const [popup]=await Promise.all([page.waitForEvent('popup'),page.locator('button[name=answer][value=plenty]').click()]);
  await popup.waitForLoadState('domcontentloaded',{timeout:15000}).catch(()=>{});const url=new URL(outgoing.at(-1));assert.equal(url.hostname,'github.com');assert.match(url.searchParams.get('body'),/910010263/);assert.match(url.searchParams.get('body'),/"method": "visit"/);assert.ok(!url.searchParams.get('body').includes('"date"'));assert.ok(!url.searchParams.get('body').includes('48.724303'));await popup.close();
  // Aucune publication fictive : l'API est simulée pour vérifier la synchronisation.
  fixture=[old,twice,second,...realIssues];await page.locator('#refresh').click();await page.waitForFunction(()=>document.querySelector('#detail').textContent.includes('participant-b'));
  assert.match(await page.locator('#detail').innerText(),/Non disponible/);assert.match(await page.locator('#detail').innerText(),/3 signalements · 2 comptes participants/);
  await page.reload();await page.waitForFunction(()=>document.querySelector('#detail').textContent.includes('participant-b'));
  await page.locator('#search').fill('Deux Gares Massy');await page.waitForFunction(()=>document.querySelectorAll('#pharmacyList .list-card').length===1);
  await page.locator('#pharmacyList .list-card').click();assert.equal(await page.locator('#reportDialog').evaluate(d=>d.open),true);await page.locator('#cancelReport').click();
  await page.locator('#search').fill('');await page.locator('#tabAll').click();assert.ok(await page.locator('#pharmacyList .list-card').count()<=40);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(output,'national-'+viewport.width+'.png'),fullPage:true});
  console.log(JSON.stringify({viewport,records:19917,plenty:15,domCards:await page.locator('#pharmacyList .list-card').count(),errors,failedRequests:requests.slice(0,5)}));await context.close();
 }
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1);});
