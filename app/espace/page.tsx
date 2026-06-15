import AccountSpace from '@/components/AccountSpace';
import DashboardHeader from '@/components/DashboardHeader';
import EntrepreneurCopyProvider from '@/components/EntrepreneurCopyProvider';
import { resolveUserSubscription } from '@/lib/account/subscription-resolution';
import { isAdminEmail, PLAN_COOKIE, SUBSCRIPTION_COOKIE } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const metadata = {
  title: 'Mon espace. BuildrAI',
};

export default async function EspacePage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    redirect('/login?redirect=/espace');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/espace');
  }

  const cookieStore = await cookies();
  const subscriptionCookie = cookieStore.get(SUBSCRIPTION_COOKIE)?.value;
  const planCookie = cookieStore.get(PLAN_COOKIE)?.value;
  const isAdmin = isAdminEmail(user.email);

  let resolved;
  try {
    resolved = await resolveUserSubscription(
      supabase,
      user.id,
      user.email,
      subscriptionCookie,
      planCookie
    );
  } catch {
    resolved = {
      active: false,
      planId: null,
      source: 'none' as const,
      trialEndsAt: null,
      trialExpired: false,
      newsletterOptIn: false,
    };
  }

  const isSubscribed = resolved.active;
  const serverPlanId = resolved.planId;
  const isGrowth = isSubscribed && serverPlanId === 'growth';

  return (
    <EntrepreneurCopyProvider>
      <Suspense fallback={null}>
        <DashboardHeader
          email={user.email ?? null}
          accountMode
          isAdmin={isAdmin}
          isSubscribed={isSubscribed}
          serverPlanId={serverPlanId}
          isGrowth={isGrowth}
        />
      </Suspense>
      <main className="dashboard-main account-main account-main--wide account-main--live">
        <div className="container">
          <Suspense fallback={<p>Chargement de ton espace…</p>}>
            <AccountSpace
              email={user.email ?? ''}
              isAdmin={isAdmin}
              isSubscribed={isSubscribed}
              serverPlanId={serverPlanId}
              isGrowth={isGrowth}
              trialEndsAt={resolved.trialEndsAt}
              trialExpired={resolved.trialExpired}
            />
          </Suspense>
        </div>
      </main>
    </EntrepreneurCopyProvider>
  );
}
