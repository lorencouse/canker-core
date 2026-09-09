/**
 * Stripe -> Postgres sync.
 *
 * Replaces utils/supabase/admin.ts. That module used the Supabase service-role
 * key to bypass RLS; here the app already connects as the owning role, so the
 * privileged client goes away entirely and these are plain SQL upserts.
 */
import { toDateTime } from '@/utils/helpers';
import { stripe } from '@/utils/stripe/config';
import { pool, queryOne } from '@/lib/db/pool';
import Stripe from 'stripe';

// Change to control trial period length
const TRIAL_PERIOD_DAYS = 0;

export const upsertProductRecord = async (product: Stripe.Product) => {
  await pool.query(
    `insert into products (id, active, name, description, image, metadata)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (id) do update set
       active = excluded.active,
       name = excluded.name,
       description = excluded.description,
       image = excluded.image,
       metadata = excluded.metadata`,
    [
      product.id,
      product.active,
      product.name,
      product.description ?? null,
      product.images?.[0] ?? null,
      JSON.stringify(product.metadata ?? {})
    ]
  );
  console.log(`Product inserted/updated: ${product.id}`);
};

export const upsertPriceRecord = async (
  price: Stripe.Price,
  retryCount = 0,
  maxRetries = 3
): Promise<void> => {
  try {
    await pool.query(
      `insert into prices (
         id, product_id, active, currency, type, unit_amount,
         interval, interval_count, trial_period_days, description, metadata
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (id) do update set
         product_id = excluded.product_id,
         active = excluded.active,
         currency = excluded.currency,
         type = excluded.type,
         unit_amount = excluded.unit_amount,
         interval = excluded.interval,
         interval_count = excluded.interval_count,
         trial_period_days = excluded.trial_period_days,
         description = excluded.description,
         metadata = excluded.metadata`,
      [
        price.id,
        typeof price.product === 'string' ? price.product : null,
        price.active,
        price.currency,
        price.type,
        price.unit_amount ?? null,
        price.recurring?.interval ?? null,
        price.recurring?.interval_count ?? null,
        price.recurring?.trial_period_days ?? TRIAL_PERIOD_DAYS,
        null,
        JSON.stringify(price.metadata ?? {})
      ]
    );
    console.log(`Price inserted/updated: ${price.id}`);
  } catch (err) {
    // Stripe can deliver price.created before product.created; retry so the
    // product row has time to land. (Postgres FK violation is SQLSTATE 23503.)
    const isForeignKeyViolation =
      typeof err === 'object' && err !== null && (err as { code?: string }).code === '23503';

    if (isForeignKeyViolation && retryCount < maxRetries) {
      console.log(`Retry attempt ${retryCount + 1} for price ID: ${price.id}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return upsertPriceRecord(price, retryCount + 1, maxRetries);
    }
    throw new Error(
      `Price insert/update failed${
        isForeignKeyViolation ? ` after ${maxRetries} retries` : ''
      }: ${(err as Error).message}`
    );
  }
};

export const deleteProductRecord = async (product: Stripe.Product) => {
  await pool.query('delete from products where id = $1', [product.id]);
  console.log(`Product deleted: ${product.id}`);
};

export const deletePriceRecord = async (price: Stripe.Price) => {
  await pool.query('delete from prices where id = $1', [price.id]);
  console.log(`Price deleted: ${price.id}`);
};

const upsertCustomerRecord = async (uuid: string, customerId: string) => {
  await pool.query(
    `insert into customers (id, stripe_customer_id)
     values ($1, $2)
     on conflict (id) do update set stripe_customer_id = excluded.stripe_customer_id`,
    [uuid, customerId]
  );
  return customerId;
};

const createCustomerInStripe = async (uuid: string, email: string) => {
  // Metadata key kept as-is so customers created before the migration still
  // resolve back to a user in the Stripe dashboard.
  const newCustomer = await stripe.customers.create({ metadata: { cankerUUID: uuid }, email });
  if (!newCustomer) throw new Error('Stripe customer creation failed.');
  return newCustomer.id;
};

export const createOrRetrieveCustomer = async ({
  email,
  uuid
}: {
  email: string;
  uuid: string;
}) => {
  const existingCustomer = await queryOne<{ stripe_customer_id: string | null }>(
    'select stripe_customer_id from customers where id = $1',
    [uuid]
  );

  let stripeCustomerId: string | undefined;
  if (existingCustomer?.stripe_customer_id) {
    const existingStripeCustomer = await stripe.customers.retrieve(
      existingCustomer.stripe_customer_id
    );
    stripeCustomerId = existingStripeCustomer.id;
  } else {
    const stripeCustomers = await stripe.customers.list({ email });
    stripeCustomerId = stripeCustomers.data.length > 0 ? stripeCustomers.data[0].id : undefined;
  }

  const stripeIdToInsert = stripeCustomerId ?? (await createCustomerInStripe(uuid, email));
  if (!stripeIdToInsert) throw new Error('Stripe customer creation failed.');

  if (existingCustomer && stripeCustomerId) {
    if (existingCustomer.stripe_customer_id !== stripeCustomerId) {
      await pool.query('update customers set stripe_customer_id = $1 where id = $2', [
        stripeCustomerId,
        uuid
      ]);
      console.warn('Customer record mismatched Stripe ID. Record updated.');
    }
    return stripeCustomerId;
  }

  console.warn('Customer record was missing. A new record was created.');
  return upsertCustomerRecord(uuid, stripeIdToInsert);
};

/** Copies the billing details from the payment method to the customer object. */
const copyBillingDetailsToCustomer = async (
  uuid: string,
  payment_method: Stripe.PaymentMethod
) => {
  const customer = payment_method.customer as string;
  const { name, phone, address } = payment_method.billing_details;
  if (!name || !phone || !address) return;

  // @ts-ignore Stripe's address type is wider than the update param
  await stripe.customers.update(customer, { name, phone, address });

  await pool.query(
    `update customers
     set billing_address = $1::jsonb,
         payment_method = $2::jsonb
     where id = $3`,
    [
      JSON.stringify(address),
      JSON.stringify(payment_method[payment_method.type as keyof Stripe.PaymentMethod] ?? {}),
      uuid
    ]
  );
};

export const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  createAction = false
) => {
  const customerData = await queryOne<{ id: string }>(
    'select id from customers where stripe_customer_id = $1',
    [customerId]
  );

  if (!customerData) {
    throw new Error(`Customer lookup failed for Stripe customer ${customerId}`);
  }

  const { id: uuid } = customerData;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method']
  });

  await pool.query(
    `insert into subscriptions (
       id, user_id, metadata, status, price_id, quantity, cancel_at_period_end,
       cancel_at, canceled_at, current_period_start, current_period_end,
       created, ended_at, trial_start, trial_end
     )
     values ($1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     on conflict (id) do update set
       user_id = excluded.user_id,
       metadata = excluded.metadata,
       status = excluded.status,
       price_id = excluded.price_id,
       quantity = excluded.quantity,
       cancel_at_period_end = excluded.cancel_at_period_end,
       cancel_at = excluded.cancel_at,
       canceled_at = excluded.canceled_at,
       current_period_start = excluded.current_period_start,
       current_period_end = excluded.current_period_end,
       created = excluded.created,
       ended_at = excluded.ended_at,
       trial_start = excluded.trial_start,
       trial_end = excluded.trial_end`,
    [
      subscription.id,
      uuid,
      JSON.stringify(subscription.metadata ?? {}),
      subscription.status,
      subscription.items.data[0].price.id,
      // @ts-ignore quantity lives on the subscription item in newer API versions
      subscription.quantity ?? subscription.items.data[0].quantity ?? null,
      subscription.cancel_at_period_end,
      subscription.cancel_at ? toDateTime(subscription.cancel_at).toISOString() : null,
      subscription.canceled_at ? toDateTime(subscription.canceled_at).toISOString() : null,
      toDateTime(subscription.current_period_start).toISOString(),
      toDateTime(subscription.current_period_end).toISOString(),
      toDateTime(subscription.created).toISOString(),
      subscription.ended_at ? toDateTime(subscription.ended_at).toISOString() : null,
      subscription.trial_start ? toDateTime(subscription.trial_start).toISOString() : null,
      subscription.trial_end ? toDateTime(subscription.trial_end).toISOString() : null
    ]
  );

  console.log(`Inserted/updated subscription [${subscription.id}] for user [${uuid}]`);

  if (createAction && subscription.default_payment_method && uuid) {
    await copyBillingDetailsToCustomer(
      uuid,
      subscription.default_payment_method as Stripe.PaymentMethod
    );
  }
};
