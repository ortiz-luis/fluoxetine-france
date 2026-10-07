-- À exécuter dans un projet dédié à la carte, jamais dans une autre application.
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
create table public.known_pharmacies(id text primary key check(id ~ '^([0-9]{9}|2[AB][0-9]{7})$' or id ~ '^community-[0-9a-f-]{36}$'));
create table public.stock_reports(
 id text primary key,
 pharmacy_id text not null references public.known_pharmacies(id),
 status text not null check(status in ('plenty','limited','none','available')),
 method text not null default 'other' check(method in ('phone','visit','other')),
 created_at timestamptz not null default clock_timestamp(),
 call_date date generated always as ((created_at at time zone 'Europe/Paris')::date) stored,
 user_id uuid references auth.users(id) on delete set null,
 participant_id text, participant_key text,
 source text not null default 'community' check(source in ('community','initial-phone-survey','legacy-github')),
 hidden boolean not null default false
);
create index latest_stock_by_pharmacy on public.stock_reports(pharmacy_id,created_at desc,id desc) where not hidden;
create index stock_by_user on public.stock_reports(user_id,created_at desc);
create table public.pharmacy_candidates(
 id text primary key check(id ~ '^community-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
 name text not null check(length(trim(name)) between 2 and 160),
 address text not null check(length(trim(address)) between 8 and 250),
 postcode text not null check(postcode ~ '^[0-9]{5}$'),
 city text not null check(length(trim(city)) between 2 and 100),
 phone text not null check(phone ~ '^\+[0-9]{9,15}$'),
 latitude double precision not null check(latitude between -85 and 85 and latitude not in ('NaN','Infinity','-Infinity')),
 longitude double precision not null check(longitude between -180 and 180 and longitude not in ('NaN','Infinity','-Infinity')),
 officine boolean not null check(officine),
 moderation text not null default 'pending' check(moderation in ('pending','approved','rejected')),
 created_at timestamptz not null default clock_timestamp(),
 user_id uuid references auth.users(id) on delete set null,
 participant_id text, participant_key text
);
create index candidates_by_user on public.pharmacy_candidates(user_id,created_at desc);
create index approved_candidates on public.pharmacy_candidates(id) where moderation='approved';
-- L'identité vient d'auth.identities (OAuth), jamais des métadonnées modifiables.
-- Fonction privée, non exposée : contrôle d'identité explicite, droits EXECUTE révoqués.
create function private.prepare_contribution() returns trigger language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); ident record;
begin
 if actor is null then raise exception 'Connectez-vous avec GitHub.' using errcode='42501'; end if;
 if tg_table_schema<>'public' or tg_table_name not in ('stock_reports','pharmacy_candidates') then raise exception 'Action non autorisée.' using errcode='42501'; end if;
 select provider_id,identity_data into ident from auth.identities where user_id=actor and provider='github' limit 1;
 if not found or coalesce(ident.identity_data->>'user_name',ident.identity_data->>'preferred_username','') !~ '^[A-Za-z0-9-]{1,39}$' then raise exception 'Une identité GitHub vérifiée est nécessaire.' using errcode='42501'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,0));
 new.user_id := actor;
 new.participant_id := coalesce(ident.identity_data->>'user_name',ident.identity_data->>'preferred_username');
 new.participant_key := 'github:' || ident.provider_id;
 new.created_at := clock_timestamp();
 if tg_table_name='stock_reports' then
  if new.id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or new.status not in ('plenty','limited','none') then raise exception 'Signalement invalide.' using errcode='22023'; end if;
  if (select count(*) from public.stock_reports where user_id=actor and created_at>clock_timestamp()-interval '5 minutes')>=40 then raise exception 'Beaucoup de contributions en peu de temps. Réessayez dans quelques minutes.' using errcode='P0001'; end if;
  new.hidden:=false; new.source:='community';
 else
  if (select count(*) from public.pharmacy_candidates where user_id=actor and created_at>clock_timestamp()-interval '24 hours')>=5 then raise exception 'Réessayez demain pour proposer une autre pharmacie.' using errcode='P0001'; end if;
  new.moderation:='pending';
 end if;
 return new;
end;
$$;
revoke all on function private.prepare_contribution() from public,anon,authenticated;
create trigger prepare_stock before insert on public.stock_reports for each row execute function private.prepare_contribution();
create trigger prepare_candidate before insert on public.pharmacy_candidates for each row execute function private.prepare_contribution();
-- Aucun participant ne peut approuver une proposition : UPDATE n'est pas accordé.
create function private.register_approved_pharmacy() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.moderation='approved' then insert into public.known_pharmacies(id) values(new.id) on conflict do nothing;
 elsif old.moderation='approved' then update public.stock_reports set hidden=true where pharmacy_id=new.id;
 end if;
 return new;
end;
$$;
revoke all on function private.register_approved_pharmacy() from public,anon,authenticated;
create trigger approve_candidate after update of moderation on public.pharmacy_candidates for each row execute function private.register_approved_pharmacy();
alter table public.known_pharmacies enable row level security;
alter table public.stock_reports enable row level security;
alter table public.pharmacy_candidates enable row level security;
revoke all on public.known_pharmacies,public.stock_reports,public.pharmacy_candidates from anon,authenticated;
grant select on public.known_pharmacies to anon,authenticated;
grant select(id,pharmacy_id,status,method,created_at,call_date,participant_id,participant_key,source) on public.stock_reports to anon,authenticated;
grant insert(id,pharmacy_id,status,method) on public.stock_reports to authenticated;
grant select(id,name,address,postcode,city,phone,latitude,longitude,officine,moderation,created_at,participant_id,participant_key) on public.pharmacy_candidates to anon,authenticated;
grant insert(id,name,address,postcode,city,phone,latitude,longitude,officine) on public.pharmacy_candidates to authenticated;
create policy read_directory on public.known_pharmacies for select to anon,authenticated using(true);
create policy read_visible_reports on public.stock_reports for select to anon,authenticated using(not hidden);
create policy insert_own_reports on public.stock_reports for insert to authenticated with check((select auth.uid())=user_id and source='community' and not hidden);
create policy read_approved_candidates on public.pharmacy_candidates for select to anon,authenticated using(moderation='approved');
create policy read_own_candidates on public.pharmacy_candidates for select to authenticated using((select auth.uid())=user_id);
create policy insert_own_candidates on public.pharmacy_candidates for insert to authenticated with check((select auth.uid())=user_id and moderation='pending');
-- Une seule ligne par pharmacie ; l'historique est chargé séparément.
create view public.latest_reports with(security_invoker=true) as
 with counts as (select pharmacy_id,count(*)::integer as report_count,count(distinct participant_key)::integer as participant_count from public.stock_reports group by pharmacy_id)
 select distinct on(r.pharmacy_id) r.id,r.pharmacy_id,r.status,r.method,r.created_at,r.call_date,r.participant_id,r.participant_key,r.source,c.report_count,c.participant_count
 from public.stock_reports r join counts c using(pharmacy_id) order by r.pharmacy_id,r.created_at desc,r.id desc;
revoke all on public.latest_reports from anon,authenticated;
grant select on public.latest_reports to anon,authenticated;
