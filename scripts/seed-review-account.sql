-- Demo history for the App Review / Play review account, so the reviewer's
-- map, charts and Insights have something to show. Run it only after the
-- owner has created the account (docs/store/review-account.md):
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v email=appreview@cankercore.com \
--     -f scripts/seed-review-account.sql
--
-- It replaces that one account's sores, daily logs and check-ins, and refuses
-- any address that is not an appreview…@cankercore.com account. Dates are
-- relative to today, so re-running it before a new review keeps it current.
\set ON_ERROR_STOP on
begin;
create temp table review_user on commit drop as
  select id from "user"
  where email = :'email' and email ~ '^appreview[a-z0-9]*@cankercore\.com$';
do $$ begin
  if (select count(*) from review_user) <> 1 then
    raise exception 'no appreview…@cankercore.com account with that email';
  end if;
end $$;
update "user" set "onboardedAt" = coalesce("onboardedAt", now())
  where id = (select id from review_user);
delete from sores where user_id=(select id from review_user);
delete from day_logs where user_id=(select id from review_user);
delete from check_ins where user_id=(select id from review_user);
-- sore(id, view, x, y, zone, start day offset, healed offset or null, sizes, pains)
create temp table s (id text, view text, x float8, y float8, zone text, d0 int, healed int, sizes float8[], pains int[]) on commit drop;
insert into s values
 ('review-cheek-old','cheeks',27,46,'Left cheek',-46,-37,'{3,4,4.5,4,3,2.5,2,1.5,1}','{5,7,7,6,4,3,2,2,1}'),
 ('review-tongue','front',53,60,'Tongue',-29,-21,'{2.5,3,3,2.5,2,1.5,1,1}','{4,6,5,4,3,2,1,1}'),
 ('review-lip','lips',46,74,'Lower lip',-13,-5,'{4,5,4.5,3.5,2.5,2,1.5,1}','{6,8,6,5,3,2,2,1}'),
 ('review-cheek','cheeks',26,44,'Left cheek',-4,null,'{3,3.5,3,2.5,2}','{6,7,5,4,3}');
insert into sores(id,user_id,view,x,y,zone,created_at,healed_at)
 select id,(select id from review_user),view,x,y,zone,(current_date + d0 + time '09:00') at time zone 'America/Los_Angeles',
   case when healed is null then null else (current_date + healed + time '20:00') at time zone 'America/Los_Angeles' end from s;
insert into readings(id,sore_id,recorded_at,size,pain)
 select s.id||'-'||i, s.id, (current_date + s.d0 + (i-1) + time '09:30') at time zone 'America/Los_Angeles', s.sizes[i], s.pains[i]
 from s, generate_subscripts(s.sizes,1) i;
update readings set note='Stung with coffee' where id='review-lip-2';
update readings set note='Feels smaller today' where id='review-cheek-4';
-- daily logs for 30 days
insert into day_logs(user_id,day,triggers,treatments,note,sleep_hours,sleep_quality,sleep_source,stress,food_answered,health_answered)
 select (select id from review_user), current_date - g,
  case g when 5 then '{Poor sleep,Stress}' when 6 then '{Spicy food,Coffee}' when 14 then '{Poor sleep,Bit my cheek or lip}' when 15 then '{Coffee}' when 30 then '{Poor sleep,Stress}' when 9 then '{Coffee}' when 22 then '{Spicy food}' else '{}' end::text[],
  case when g in (1,2,3,12,13,14,15) then '{Salt-water rinse,Numbing gel}' when g in (4,11) then '{Salt-water rinse}' else '{}' end::text[],
  null, (6 + (g*37 % 9)/4.0)::numeric(4,2), 3 + (g % 3) - 1, case when g % 2 = 0 then 'apple_health' else 'manual' end, 1 + (g*13 % 4), true, true
 from generate_series(1,30) g;
insert into check_ins(user_id,day,status) select (select id from review_user), current_date - g, 'done' from generate_series(1,12) g;
insert into check_ins(user_id,day,status) select (select id from review_user), current_date - g, 'done' from generate_series(14,30) g;
commit;
