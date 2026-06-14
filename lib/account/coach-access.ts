import { resolveUserSubscription } from '@/lib/account/subscription-resolution';
import { createClient } from '@/lib/supabase/server';
import { SUBSCRIPTION_COOKIE, PLAN_COOKIE } from '@/lib/admin';
import { cookies } from 'next/headers';

export async function hasCoachAccess(email: string | null | undefined): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const cookieStore = await cookies();
  const resolved = await resolveUserSubscription(
    supabase,
    user.id,
    email ?? user.email,
    cookieStore.get(SUBSCRIPTION_COOKIE)?.value,
    cookieStore.get(PLAN_COOKIE)?.value
  );

  return resolved.active;
}
