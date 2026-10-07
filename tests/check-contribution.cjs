const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const C=require('../assets/core.js'),box={window:{},URL,URLSearchParams,Intl,Date};
vm.runInNewContext(fs.readFileSync(require.resolve('../assets/community.js'),'utf8'),box);
const S=box.window.PharmacyCommunity,p={id:'910010263',name:'Pharmacie des Deux Gares',address:'43 Avenue Carnot, 91300 Massy'},catalog=new Map([[p.id,p]]);
for(const status of ['plenty','limited','none'])for(const method of ['phone','visit','other']){
 const url=new URL(S.issueUrl(p,status,method)),body=url.searchParams.get('body');
 assert.equal(url.hostname,'github.com');assert.ok(!body.includes('```'));assert.ok(!body.includes('schema'));assert.ok(!body.includes('pharmacyId'));
 const issue={number:20,state:'open',created_at:'2026-10-07T13:00:00Z',user:{login:'participant'},body};
 const report=C.parseGithubIssue(issue,catalog,new Date('2026-10-07T14:00:00Z'));
 assert.equal(report.status,status);assert.equal(report.method,method);assert.equal(report.participantId,'participant');assert.equal(report.reportedAt,'2026-10-07T13:00:00.000Z');
 assert.equal(C.parseGithubIssue({...issue,body:body+'\nDate : 2099-12-31'},catalog,new Date('2026-10-07T14:00:00Z')).date,'2026-10-07');
 assert.equal(C.parseGithubIssue({...issue,state:'closed'},catalog),null);
 assert.equal(C.parseGithubIssue({...issue,labels:[{name:'invalide'}]},catalog),null);
 assert.equal(C.parseGithubIssue({...issue,body:body.replace('ortiz-luis.github.io','example.com')},catalog),null);
 assert.equal(C.parseGithubIssue({...issue,body:body.replace(p.id,'000000000')},catalog),null);
}
const candidate={...p,id:'community-exemple',postcode:'91300',city:'Massy',phone:'+33169201277',lat:48.724303,lng:2.260258};
const proposal={number:30,state:'open',body:new URL(S.candidateUrl(candidate)).searchParams.get('body'),labels:[{name:'pharmacie-validée'}]};
assert.equal(C.parseGithubCandidate(proposal).id,candidate.id);assert.equal(C.parseGithubCandidate({...proposal,labels:[]}),null);assert.ok(!proposal.body.includes('```'));
console.log('9 parcours de contribution : champs français, dates et identité serveur, modération et identifiants vérifiés. PASS');
