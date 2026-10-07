-- Import administratif des 15 publications existantes ; aucune date réinventée.
begin;
alter table public.stock_reports disable trigger prepare_stock;
insert into public.stock_reports(id,pharmacy_id,status,method,created_at,participant_id,participant_key,source) values
('initial-750024101','750024101','plenty','phone','2026-10-05T10:00:40.685Z',null,null,'initial-phone-survey'),
('initial-750024002','750024002','plenty','phone','2026-10-05T10:02:03.066Z',null,null,'initial-phone-survey'),
('initial-750010563','750010563','plenty','phone','2026-10-05T10:05:52.035Z',null,null,'initial-phone-survey'),
('initial-750011884','750011884','plenty','phone','2026-10-05T10:07:08.848Z',null,null,'initial-phone-survey'),
('initial-750011843','750011843','plenty','phone','2026-10-05T10:10:32.952Z',null,null,'initial-phone-survey'),
('initial-750010522','750010522','plenty','phone','2026-10-05T10:18:13.464Z',null,null,'initial-phone-survey'),
('initial-750009276','750009276','plenty','phone','2026-10-05T10:20:03.150Z',null,null,'initial-phone-survey'),
('initial-750013096','750013096','plenty','phone','2026-10-05T10:30:55.405Z',null,null,'initial-phone-survey'),
('initial-750010084','750010084','plenty','phone','2026-10-05T10:31:41.504Z',null,null,'initial-phone-survey'),
('initial-750008815','750008815','plenty','phone','2026-10-05T10:36:57.418Z',null,null,'initial-phone-survey'),
('initial-750011801','750011801','plenty','phone','2026-10-05T10:37:38.287Z',null,null,'initial-phone-survey'),
('initial-750024622','750024622','plenty','phone','2026-10-05T10:44:21.184Z',null,null,'initial-phone-survey'),
('initial-750024804','750024804','plenty','phone','2026-10-05T10:47:01.573Z',null,null,'initial-phone-survey'),
('github-2','920007846','available','other','2026-10-05T13:30:57Z','ortiz-luis','github:63545750','legacy-github'),
('github-1','920007911','available','other','2026-10-05T13:30:56Z','ortiz-luis','github:63545750','legacy-github')
on conflict do nothing;
alter table public.stock_reports enable trigger prepare_stock;
commit;
