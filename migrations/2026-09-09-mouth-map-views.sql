-- Mouth map: replace the single photo diagram with three flat views.
--
-- Sores now record which view they were plotted on (front | cheeks | lips) and
-- their x/y as percentages of that view's drawing box. Rows from the old
-- diagram are remapped onto the Front view: the mouth opening in the old image
-- spanned roughly x 25-75% and y 10-90%, and the interior of the new Front
-- view spans x 11.5-88.5% and y 3.5-97.5%. The zone label is recomputed by the
-- app on read, so it is left as is here.
--
-- Apply by hand against production (see docs/DEPLOYMENT.md, "Schema changes").

begin;

alter table sores add column if not exists view text not null default 'front';

update sores
set x = least(88.5, greatest(11.5, 11.5 + (x - 25) / 50 * 77)),
    y = least(97.5, greatest(3.5, 3.5 + (y - 10) / 80 * 94))
where view = 'front'
  and x is not null and y is not null
  and exists (
    select 1 from information_schema.columns
    where table_name = 'sores' and column_name = 'gums'
  );

alter table sores drop column if exists gums;

commit;
