-- Drop the Stripe billing tables.
--
-- They came with the SaaS starter this app began from and were never used:
-- no product was ever created, no checkout was ever wired up, and the webhook
-- route, sync code and Stripe env vars have been removed from the app. The
-- tables go too, so schema.sql describes what the app actually reads.
--
-- Apply by hand against production (see docs/DEPLOYMENT.md, "Schema changes").

begin;

drop table if exists subscriptions;
drop table if exists prices;
drop table if exists products;
drop table if exists customers;

drop type if exists subscription_status;
drop type if exists pricing_plan_interval;
drop type if exists pricing_type;

commit;
