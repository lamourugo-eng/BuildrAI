import AdminSubscribeBypass from '@/components/AdminSubscribeBypass';
import SubscribeCheckout from '@/components/SubscribeCheckout';
import { isAdminEmail } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import type { BillingPeriod, PlanId } from '@/lib/stripe';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Finaliser l\'abonnement. BuildrAI',
};

const VALID_PLANS: PlanId[] = ['starter', 'growth'];

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; period?: string }>;
}) {
  const params = await searchParams;
  const plan = (params.plan as PlanId) || 'growth';
  const period = (
    params.period === 'semester' || params.period === 'yearly' ? 'semester' : 'monthly'
  ) as BillingPeriod;

  if (!VALID_PLANS.includes(plan)) {
    redirect('/#pricing');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/subscribe&plan=${plan}&period=${period}`);
  }

  return (
    <main className="auth-page">
      <div className="container auth-container">
        <span className="section-tag">Paiement</span>
        <h1>Finalisez ton abonnement</h1>
        <p className="auth-subtitle">
          Dernière étape avant d&apos;accéder à toutes les fonctionnalités premium.
        </p>
        <SubscribeCheckout plan={plan} period={period} email={user.email ?? ''} />
        {isAdminEmail(user.email) && (
          <AdminSubscribeBypass planId={plan} period={period} />
        )}
        <Link href="/admin" className="btn btn-ghost auth-back">
          ← Panneau admin
        </Link>
        <Link href="/espace" className="btn btn-ghost auth-back">
          ← Retour à mon espace
        </Link>
      </div>
    </main>
  );
}
