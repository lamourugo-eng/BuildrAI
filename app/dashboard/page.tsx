import CoachPaywall from '@/components/CoachPaywall';
import DashboardHeader from '@/components/DashboardHeader';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Coach IA. BuildrAI',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/espace');

  return (
    <>
      <DashboardHeader email={null} />
      <main className="dashboard-main">
        <div className="container">
          <CoachPaywall />
        </div>
      </main>
    </>
  );
}
