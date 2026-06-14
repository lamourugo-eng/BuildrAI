import AssistanceSection from '@/components/AssistanceSection';
import AuthShell from '@/components/AuthShell';
import DashboardHeader from '@/components/DashboardHeader';
import { resolveUserSubscription } from '@/lib/account/subscription-resolution';
import { isAdminEmail, PLAN_COOKIE, SUBSCRIPTION_COOKIE } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Suspense } from 'react';

export const metadata = {
  title: 'Assistance. BuildrAI',
  description: 'Centre d\'aide BuildrAI. Support pour visiteurs et clients.',
};

export default async function AssistancePage() {
  let userEmail: string | null = null;
  let isAdmin = false;
  let isSubscribed = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    userEmail = user?.email ?? null;
    isAdmin = isAdminEmail(userEmail);

    const cookieStore = await cookies();
    if (user) {
      const resolved = await resolveUserSubscription(
        supabase,
        user.id,
        user.email,
        cookieStore.get(SUBSCRIPTION_COOKIE)?.value,
        cookieStore.get(PLAN_COOKIE)?.value
      );
      isSubscribed = resolved.active;
    }
  } catch {
    /* Supabase non configuré */
  }

  const content = (
    <div className="container assistance-page-container">
      <AssistanceSection
        userEmail={userEmail}
        isSubscribed={isSubscribed}
        variant="page"
      />
    </div>
  );

  if (userEmail) {
    return (
      <>
        <Suspense fallback={null}>
          <DashboardHeader
            email={userEmail}
            accountMode
            isAdmin={isAdmin}
            isSubscribed={isSubscribed}
          />
        </Suspense>
        <main className="dashboard-main account-main">{content}</main>
      </>
    );
  }

  return <AuthShell>{content}</AuthShell>;
}
