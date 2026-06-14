import AdminPanel from '@/components/AdminPanel';
import DashboardHeader from '@/components/DashboardHeader';
import { resolveUserSubscription } from '@/lib/account/subscription-resolution';
import { isAdminEmail, PLAN_COOKIE, SUBSCRIPTION_COOKIE } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const metadata = {
  title: 'Admin. BuildrAI',
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/admin');
  }

  if (!isAdminEmail(user.email)) {
    redirect('/espace');
  }

  const cookieStore = await cookies();
  const resolved = await resolveUserSubscription(
    supabase,
    user.id,
    user.email,
    cookieStore.get(SUBSCRIPTION_COOKIE)?.value,
    cookieStore.get(PLAN_COOKIE)?.value
  );

  return (
    <>
      <Suspense fallback={null}>
        <DashboardHeader
          email={user.email ?? null}
          isAdmin
          accountMode
          isSubscribed={resolved.active}
        />
      </Suspense>
      <main className="dashboard-main account-main">
        <div className="container">
          <AdminPanel
            email={user.email ?? ''}
            isSubscribed={resolved.active}
            currentPlanId={resolved.planId}
          />
        </div>
      </main>
    </>
  );
}
