import Pricing from '@/components/ui/Pricing/Pricing';
import { createClient } from '@/utils/supabase/server';
import {
  getProducts,
  getSubscription,
  getUser
} from '@/utils/supabase/queries';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Redirect } from 'next';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createClient();
  const [user, products, subscription] = await Promise.all([
    getUser(supabase),
    getProducts(supabase),
    getSubscription(supabase)
  ]);

  return (
    <div className="home-hero flex flex-row flex-wrap justify-around items-center bg-primary">
      <div className="hero-left flex items-center align-middle ">
        <div className="hero-text text-center bg-white text-black p-10 rounded-lg m-12 max-w-sm">
          <h1>Canker Core</h1>
          <p className="my-7 text-lg font-semibold">
            Manage, Track, and Treat <br /> Your Canker Sores.
          </p>
          <Link href="/my-sores">
            <Button className="p-6 font-bold text-xl bg-secondary text-white rounded-lg">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
      <div className="hero-right">
        <Image
          src="/images/home/canker-core-banner-650.png"
          alt="hero image"
          width={650}
          height={650}
        />
      </div>
    </div>
  );
}
