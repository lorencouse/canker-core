-- Constrain sores.view to the three mouth-map views and x/y to 0-100.
--
-- The server action now refuses anything else (utils/sore-payload.ts), but
-- these rows feed published aggregates, so the table holds the line too.
-- The constraint names are the ones Postgres gives the inline checks in
-- schema.sql, so a fresh database and a migrated one end up identical.
--
-- Existing rows are brought inside the constraints first, the same way the
-- app already treats them: getSores() reads an unknown view as 'front', and a
-- point outside its view's box was never drawable. To see what will change:
--
--   select id, view, x, y from sores
--    where view not in ('front', 'cheeks', 'lips')
--       or x not between 0 and 100 or y not between 0 and 100;
--
-- Re-runnable. Take a pg_dump first, then apply by hand against production
-- (see docs/DEPLOYMENT.md, "Schema changes").

begin;

update sores set view = 'front' where view not in ('front', 'cheeks', 'lips');
update sores set x = least(100, greatest(0, x)) where x not between 0 and 100;
update sores set y = least(100, greatest(0, y)) where y not between 0 and 100;

alter table sores drop constraint if exists sores_view_check;
alter table sores add constraint sores_view_check check (view in ('front', 'cheeks', 'lips'));
alter table sores drop constraint if exists sores_x_check;
alter table sores add constraint sores_x_check check (x between 0 and 100);
alter table sores drop constraint if exists sores_y_check;
alter table sores add constraint sores_y_check check (y between 0 and 100);

commit;
