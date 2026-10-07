const fs=require('node:fs'),path=require('node:path');
const {PGlite}=require('@electric-sql/pglite');
const root=path.resolve(__dirname,'..');
const users=[{id:'11111111-1111-4111-8111-111111111111',name:'alice',githubId:'1001'},{id:'22222222-2222-4222-8222-222222222222',name:'bob',githubId:'1002'}];
async function database(){
 const db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb);
 create table auth.identities(user_id uuid references auth.users(id),provider text,provider_id text,identity_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated;`);
 for(const u of users){await db.query('insert into auth.users values($1,$2)',[u.id,JSON.stringify({user_name:u.name})]);await db.query('insert into auth.identities values($1,$2,$3,$4)',[u.id,'github',u.githubId,JSON.stringify({user_name:u.name,sub:u.githubId})]);}
 for(const f of ['001_partage.sql','002_repertoire_initial.sql','seed_reports.sql'])await db.exec(fs.readFileSync(path.join(root,'database',f),'utf8'));
 return db;
}
async function asRole(db,role,uid,sql,args=[]){
 return db.transaction(async tx=>{await tx.exec('set local role '+role);await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[uid||'']);return tx.query(sql,args);});
}
module.exports={database,asRole,users,root};
