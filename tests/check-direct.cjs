// Interface réelle + SDK Supabase réel + PostgreSQL local (PGlite).
// OAuth est simulé : ce test n'est pas une validation de la connexion de production.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {database,asRole,users,root}=require('./database-fixture.cjs');
const fields='id,pharmacy_id,status,method,created_at,call_date,participant_id,participant_key,source';
const restJSON=v=>JSON.stringify(v,(key,value)=>key==='call_date'&&typeof value==='string'?value.slice(0,10):value);
const encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
function session(u){const exp=Math.floor(Date.now()/1000)+3600;return {access_token:encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:u.id,exp,iat:exp-3600,aud:'authenticated',role:'authenticated',iss:'https://directtest.supabase.co/auth/v1',app_metadata:{provider:'github',providers:['github']}})+'.test-signature',refresh_token:'test-refresh-'+u.githubId,token_type:'bearer',expires_in:3600,expires_at:exp,user:{id:u.id,aud:'authenticated',role:'authenticated',email:u.name+'@example.invalid',app_metadata:{provider:'github',providers:['github']},user_metadata:{user_name:u.name},identities:[{id:u.githubId,identity_id:u.id,user_id:u.id,provider_id:u.githubId,provider:'github',identity_data:{user_name:u.name,sub:u.githubId}}],created_at:new Date().toISOString()}};}
(async()=>{
 const db=await database();const sessions=users.map(session),output=path.join(root,'.test-results');fs.mkdirSync(output,{recursive:true});
 const server=http.createServer((req,res)=>{let file=path.join(root,new URL(req.url,'http://localhost').pathname.replace(/^\//,'')||'index.html');try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(8797,'127.0.0.1',r));
 const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
 const browser=await chromium.launch({executablePath:process.env.TEST_CHROMIUM||path.resolve(root,'../pharmacies_recherche/headless/chromium'),args:['--no-sandbox','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 async function context(viewport,engine,initialUser){
  const c=await browser.newContext({viewport,geolocation:{latitude:48.724303,longitude:2.260258},permissions:['geolocation']});let challenge=null,dropNext=false;const requests=[],errors=[],posts=[];
  await c.route('**/assets/config.js?*',r=>r.fulfill({contentType:'text/javascript',body:"window.COMMUNITY_CONFIG={url:'https://directtest.supabase.co',publishableKey:'sb_publishable_test_fixture'};"}));
  await c.route('**/assets/map-style.json?*',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({version:8,sources:{},layers:[{id:'bg',type:'background',paint:{'background-color':'#edf1eb'}}]})}));
  await c.route('**://tile.openstreetmap.org/**',r=>r.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+X8VnWQAAAABJRU5ErkJggg==','base64')}));
  await c.route('https://directtest.supabase.co/**',async route=>{
   const req=route.request(),url=new URL(req.url()),hdr={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS','content-type':'application/json'};
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:hdr});
   const bearer=req.headers().authorization?.replace(/^Bearer /,'');const current=sessions.find(s=>s.access_token===bearer);const role=current?'authenticated':'anon',uid=current?.user.id;
   try{
    if(url.pathname==='/auth/v1/authorize'){challenge=url.searchParams.get('code_challenge');assert.equal(url.searchParams.get('provider'),'github');assert.equal(url.searchParams.get('redirect_to'),'http://127.0.0.1:8797/');return route.fulfill({status:200,contentType:'text/html',body:'Connexion GitHub simulée'});}
    if(url.pathname==='/auth/v1/token'){
     const body=req.postDataJSON();assert.equal(body.auth_code,'test-oauth-code');assert.equal(crypto.createHash('sha256').update(body.code_verifier).digest('base64url'),challenge);return route.fulfill({status:200,headers:hdr,body:JSON.stringify(sessions[0])});
    }
    if(url.pathname==='/auth/v1/user')return route.fulfill({status:current?200:401,headers:hdr,body:JSON.stringify(current?.user||{message:'Invalid JWT',code:'bad_jwt'})});
    const table=url.pathname.split('/').pop();assert.ok(['latest_reports','stock_reports','pharmacy_candidates'].includes(table));
    if(req.method()==='POST'){
     const p=req.postDataJSON();posts.push(p);const cols=Object.keys(p);assert.ok(cols.every(k=>/^[a-z_]+$/.test(k)));assert.ok(!cols.includes('created_at')&&!cols.includes('participant_id')&&!cols.includes('user_id'));
     const select=url.searchParams.get('select');assert.match(select,/^[a-z_,]+$/);
     const result=await asRole(db,role,uid,`insert into public.${table}(${cols.join(',')}) values(${cols.map((_,i)=>'$'+(i+1)).join(',')}) returning ${select}`,Object.values(p));
     if(dropNext){dropNext=false;return route.fulfill({status:503,headers:hdr,body:JSON.stringify({code:'TEMPORARY',message:'Réponse perdue après enregistrement (test)'})});}
     return route.fulfill({status:201,headers:hdr,body:restJSON(result.rows[0])});
    }
    const select=url.searchParams.get('select')||'*';assert.match(select,/^(\*|[a-z_,]+)$/);const wheres=[],args=[];
    for(const k of ['id','pharmacy_id','moderation'])if(url.searchParams.has(k)){const v=url.searchParams.get(k);assert.ok(v.startsWith('eq.'));args.push(v.slice(3));wheres.push(k+'=$'+args.length);}
    const order=url.searchParams.get('order')||'id.asc';assert.match(order,/^[a-z_]+\.(asc|desc)$/);const [column,direction]=order.split('.');const limit=Math.min(1000,Number(url.searchParams.get('limit')||1000)),offset=Number(url.searchParams.get('offset')||0);assert.ok(Number.isInteger(limit)&&Number.isInteger(offset));
    const result=await asRole(db,role,uid,`select ${select} from public.${table}${wheres.length?' where '+wheres.join(' and '):''} order by ${column} ${direction} limit ${limit} offset ${offset}`,args);
    const single=req.headers().accept?.includes('application/vnd.pgrst.object+json');return route.fulfill({status:200,headers:hdr,body:restJSON(single?result.rows[0]||null:result.rows)});
   }catch(e){const status=e.code==='23505'?409:e.code==='42501'?403:400;return route.fulfill({status,headers:hdr,body:JSON.stringify({code:e.code||'TEST',message:e.message,details:null,hint:null})});}
  });
  const page=await c.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('github.com'))requests.push(r.url());});let popups=0;page.on('popup',()=>popups++);
  await page.addInitScript(({engine,initialSession})=>{
   if(initialSession)localStorage.setItem('sb-directtest-auth-token',JSON.stringify(initialSession));
   Object.defineProperty(window,'maplibregl',{configurable:true,set(value){const Original=value.Map;value.Map=engine==='leaflet'?class{constructor(){throw Error('WebGL désactivé');}}:class extends Original{constructor(options){super(options);window.__testMap=this;}};Object.defineProperty(window,'maplibregl',{value,configurable:true});}});
   Object.defineProperty(window,'PharmacyFallback',{configurable:true,set(value){const original=value.create;value.create=function(...args){const m=original(...args);window.__testMap=m;return m;};Object.defineProperty(window,'PharmacyFallback',{value,configurable:true});}});
  },{engine,initialSession:initialUser==null?null:sessions[initialUser]});
  async function open(url='http://127.0.0.1:8797/?pharmacy=910010263'){
   await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('#map').dataset.ready==='true'&&document.querySelector('#catalogCount').textContent.includes('19\u202f917'));await page.waitForFunction(()=>document.querySelector('#syncStatus').textContent.includes('actualisées'));
  }
  return {c,page,open,errors,requests,posts,drop:()=>dropNext=true,popups:()=>popups};
 }
 for(const engine of (process.env.TEST_MAP_ENGINES||'maplibre,leaflet').split(','))for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  await db.query('delete from public.stock_reports where user_id is not null');
  const a=await context(viewport,engine,null);await a.open();
  await a.page.locator('#postcode').fill('67000');await a.page.locator('#goPostcode').click();await a.page.waitForFunction(()=>window.__testMap.getCenter().lng>7);let center=await a.page.evaluate(()=>window.__testMap.getCenter());assert.ok(center.lng>7&&center.lat>48);
  await a.page.locator('#locateMe').click();await a.page.waitForFunction(()=>document.querySelector('#mapStatus').textContent.includes('près de vous'));
  await a.page.locator('#map').scrollIntoViewIfNeeded();await a.page.waitForTimeout(150);
  const xy=await a.page.evaluate(()=>{const p=window.__testMap.project([2.260258,48.724303]);return {x:p.x,y:p.y};});const bounds=await a.page.locator('#map').boundingBox();await a.page.mouse.click(bounds.x+xy.x,bounds.y+xy.y);
  await a.page.waitForFunction(()=>document.querySelector('#reportDialog').open);assert.match(await a.page.locator('#reportPharmacyName').innerText(),/Deux Gares/);
  await a.page.locator('button[name=answer][value=plenty]').click();assert.equal(await a.page.locator('#reportLogin').isVisible(),true);assert.equal(a.posts.length,0);
  await a.page.locator('#loginForReport').click();await a.page.waitForURL('https://directtest.supabase.co/auth/v1/authorize**');assert.equal(a.popups(),0);
  await a.open('http://127.0.0.1:8797/?code=test-oauth-code');try{await a.page.waitForFunction(()=>document.querySelector('#detail').textContent.includes('alice')&&document.querySelector('#detail').textContent.includes('Oui, en quantité')&&!document.querySelector('#reportDialog').open);}catch(e){console.log('callback debug',await a.page.evaluate(()=>({account:document.querySelector('#accountStatus').textContent,detail:document.querySelector('#detail').textContent,error:document.querySelector('#formError').textContent,pending:sessionStorage.getItem('pharmacy-pending-contribution'),hasUser:window.PharmacyCommunity.hasUser(),toast:document.querySelector('#toast').textContent})),{posts:a.posts,errors:a.errors});throw e;}
  assert.equal(a.posts.length,1);let r=(await db.query("select * from public.stock_reports where pharmacy_id='910010263'")).rows;assert.equal(r.length,1);assert.ok(Math.abs(Date.now()-new Date(r[0].created_at).getTime())<10000);
  const b=await context(viewport,engine,1);await b.open();await b.page.locator('#openReport').click();await b.page.locator('button[name=answer][value=limited]').click();await b.page.waitForFunction(()=>!document.querySelector('#reportDialog').open&&document.querySelector('#detail').textContent.includes('bob'));
  const publicPage=await context(viewport,engine,null);await publicPage.open();assert.match(await publicPage.page.locator('#detail').innerText(),/2 signalements · 2 comptes participants/);assert.match(await publicPage.page.locator('#detail').innerText(),/Oui, mais peu/);await publicPage.page.locator('#detail .history summary').click();assert.match(await publicPage.page.locator('#detail').innerText(),/alice/);
  await a.page.locator('#openReport').click();a.drop();await a.page.clock.setFixedTime(new Date(Date.now()+20*60000));await a.page.locator('button[name=answer][value=none]').click();await a.page.waitForFunction(()=>!document.querySelector('#formError').hidden);
  assert.equal(await a.page.locator('#reportDialog').isVisible(),true);r=(await db.query("select * from public.stock_reports where pharmacy_id='910010263'")).rows;assert.equal(r.length,3);const id=r.find(x=>x.status==='none').id;
  await a.page.locator('button[name=answer][value=none]').click();await a.page.waitForFunction(()=>!document.querySelector('#reportDialog').open);r=(await db.query("select * from public.stock_reports where pharmacy_id='910010263'")).rows;assert.equal(r.length,3);assert.equal(r.find(x=>x.status==='none').id,id);assert.ok(Math.abs(Date.now()-new Date(r.find(x=>x.status==='none').created_at).getTime())<10000);
  await publicPage.page.reload({waitUntil:'domcontentloaded'});await publicPage.page.waitForFunction(()=>document.querySelector('#detail').textContent.includes('3 signalements · 2 comptes participants'));assert.match(await publicPage.page.locator('#detail').innerText(),/Non disponible/);
  for(const t of [a,b,publicPage]){assert.equal(await t.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(t.errors,[]);assert.deepEqual(t.requests,[]);assert.equal(t.popups(),0);}
  assert.ok(await publicPage.page.locator('#pharmacyList .list-card').count()<=40);
  await publicPage.page.screenshot({path:path.join(output,`direct-${engine}-${viewport.width}.png`),fullPage:true});
  console.log(JSON.stringify({engine,viewport,postal:true,location:true,pointClick:true,oauthClientFlow:true,sharedPostgres:true,persistence:true,serverClock:true,idempotentRetry:true,githubIssue:false,overflow:false}));for(const t of [a,b,publicPage])await t.c.close();
 }
 await browser.close();await new Promise(r=>server.close(r));await db.close();
})().catch(e=>{console.error({message:e.message,stack:e.stack});process.exit(1);});
