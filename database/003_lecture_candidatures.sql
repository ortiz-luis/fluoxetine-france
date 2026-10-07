alter policy read_approved_candidates on public.pharmacy_candidates to anon;
drop policy read_own_candidates on public.pharmacy_candidates;
create policy read_candidates_authenticated on public.pharmacy_candidates for select to authenticated using (moderation='approved' or (select auth.uid())=user_id);
