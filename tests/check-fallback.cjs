const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://localhost').pathname.replace(/^\//,'')||'index.html');try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(8796,'127.0.0.1',r));
 const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
 const u=process.env.HTTPS_PROXY?new URL(process.env.HTTPS_PROXY):null,proxy=u?{server:u.origin,bypass:'127.0.0.1,localhost',username:decodeURIComponent(u.username)||undefined,password:decodeURIComponent(u.password)||undefined}:undefined;
 const executablePath=process.env.TEST_CHROMIUM||path.resolve(__dirname,'../../pharmacies_recherche/headless/chromium');
 const browser=await chromium.launch({proxy,executablePath,args:['--no-sandbox']});
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport,geolocation:{latitude:48.724303,longitude:2.260258},permissions:['geolocation']});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   Object.defineProperty(window,'maplibregl',{configurable:true,set(value){value.Map=class{constructor(){throw Error('WebGL désactivé pour vérifier le secours');}};Object.defineProperty(window,'maplibregl',{value,configurable:true});}});
   Object.defineProperty(window,'PharmacyFallback',{configurable:true,set(value){const original=value.create;value.create=function(...args){const m=original(...args);window.__testMap=m;return m;};Object.defineProperty(window,'PharmacyFallback',{value,configurable:true});}});
  });
  await page.route('https://api.github.com/repos/ortiz-luis/fluoxetine-france/issues?*',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  await context.route('https://github.com/ortiz-luis/fluoxetine-france/issues/new?*',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><p>Confirmation simulée, aucune publication.</p>'}));
  await page.goto('http://127.0.0.1:8796/?pharmacy=910010263',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#map').dataset.renderer==='leaflet'&&document.querySelector('#catalogCount').textContent.includes('19\u202f917'));
  assert.equal(await page.locator('#mapFallback').isVisible(),false);assert.equal(await page.locator('#locateMe').isEnabled(),true);
  await page.locator('#postcode').fill('67000');await page.locator('#goPostcode').click();const c=await page.evaluate(()=>window.__testMap.getCenter());assert.ok(c.lng>7&&c.lat>48);
  await page.locator('#locateMe').click();await page.waitForFunction(()=>document.querySelector('#mapStatus').textContent.includes('près de vous'));await page.waitForTimeout(150);
  const xy=await page.evaluate(()=>window.__testMap.project([2.260258,48.724303])),bounds=await page.locator('#map').boundingBox();await page.mouse.click(bounds.x+xy.x,bounds.y+xy.y);
  await page.waitForFunction(()=>document.querySelector('#reportDialog').open);assert.match(await page.locator('#reportPharmacyName').innerText(),/Deux Gares/);
  const [popup]=await Promise.all([page.waitForEvent('popup',{timeout:8000}),page.locator('button[name=answer][value=plenty]').click()]);await popup.close();assert.equal(await page.locator('#publicationHelp').isVisible(),true);
  await page.locator('#dismissPublication').click();await page.locator('#search').fill('Deux Gares Massy');await page.waitForFunction(()=>document.querySelectorAll('#pharmacyList .list-card').length===1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
  console.log(JSON.stringify({viewport,renderer:'Leaflet sans WebGL',postal:true,location:true,pointClick:true,contribution:true,errors}));await context.close();
 }
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1);});
