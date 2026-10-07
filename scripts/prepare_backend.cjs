// Prépare le répertoire autorisé et importe les anciennes publications sans changer leurs dates.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/bootstrap.js'),'utf8'),context);
const base=context.window.PHARMACY_DATA;
const national=JSON.parse(fs.readFileSync(path.join(root,'data/national.json'),'utf8'));
const ids=[...new Set([...base.pharmacies,...national.pharmacies].map(p=>p.id))].sort();
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
fs.writeFileSync(path.join(root,'database/002_repertoire_initial.sql'),`-- ${ids.length} identifiants rapprochés du répertoire national et des fiches initiales.\ninsert into public.known_pharmacies(id) values\n`+ids.map(id=>'('+quote(id)+')').join(',\n')+'\non conflict do nothing;\n');
const legacy=JSON.parse(fs.readFileSync(path.join(root,'data/legacy-reports.json'),'utf8'));
const rows=[...base.initialReports.map(r=>({id:r.id,pharmacy_id:r.pharmacyId,status:r.status,method:'phone',created_at:r.reportedAt,source:r.source})),...legacy];
const columns=['id','pharmacy_id','status','method','created_at','participant_id','participant_key','source'];
fs.writeFileSync(path.join(root,'database/seed_reports.sql'),'-- Import administratif des 15 publications existantes ; aucune date réinventée.\nbegin;\nalter table public.stock_reports disable trigger prepare_stock;\ninsert into public.stock_reports('+columns.join(',')+') values\n'+rows.map(r=>'('+columns.map(k=>r[k]==null?'null':quote(r[k])).join(',')+')').join(',\n')+'\non conflict do nothing;\nalter table public.stock_reports enable trigger prepare_stock;\ncommit;\n');
console.log(JSON.stringify({pharmacies:ids.length,historicalReports:rows.length}));
