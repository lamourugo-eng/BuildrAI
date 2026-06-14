import HomePage from '@/components/HomePage';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ quiz?: string; landing?: string }>;
}) {
  const params = await searchParams;
  let userEmail: string | null = null;
  let user = null;

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
    userEmail = authUser?.email ?? null;
  } catch {
    /* Supabase non configuré */
  }

  const showPublicHome = params.quiz === '1' || params.landing === '1';

  if (user && !showPublicHome) {
    redirect('/espace');
  }

  const initialQuizActive = params.quiz === '1';

  return <HomePage userEmail={userEmail} initialQuizActive={initialQuizActive} />;
}
