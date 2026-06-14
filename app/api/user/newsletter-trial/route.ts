import {
  clearSubscriptionCookies,
  setActiveSubscriptionCookies,
} from '@/lib/account/subscription-cookies';
import { resolveUserSubscription } from '@/lib/account/subscription-resolution';
import {
  isMissingUserProfileTable,
  startNewsletterTrialInDb,
  upsertNewsletterPreference,
} from '@/lib/account/user-profile';
import { getErrorMessage } from '@/lib/errors';
import { getStripeSubscriptionSnapshot } from '@/lib/stripe/subscription-sync';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Inscription newsletter + essai Premium 24 h (plan starter. 29 €/mois).
 * POST { newsletterOptIn: boolean }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const newsletterOptIn = body.newsletterOptIn === true;

    if (!newsletterOptIn) {
      await upsertNewsletterPreference(supabase, user.id, user.email ?? null, false);
      return NextResponse.json({ ok: true, newsletterOptIn: false, active: false });
    }

    const stripeSnapshot = user.email
      ? await getStripeSubscriptionSnapshot(user.email)
      : { active: false };

    const { profile, trial } = await startNewsletterTrialInDb(
      supabase,
      user.id,
      user.email ?? null,
      { stripeActive: stripeSnapshot.active }
    );

    if (!trial.ok) {
      const messages: Record<string, string> = {
        already_used: 'Ton essai gratuit 24 h a déjà été utilisé.',
        stripe_active: 'Tu as déjà un abonnement actif.',
        no_opt_in: 'Acceptez la newsletter pour activer l\'essai.',
      };
      return NextResponse.json({
        ok: true,
        newsletterOptIn: true,
        active: stripeSnapshot.active,
        trialGranted: false,
        reason: trial.reason,
        message: messages[trial.reason] ?? undefined,
      });
    }

    const response = NextResponse.json({
      ok: true,
      newsletterOptIn: true,
      active: true,
      trialGranted: true,
      planId: 'starter',
      trialEndsAt: trial.trialEndsAt,
      trialStartedAt: trial.trialStartedAt,
    });

    setActiveSubscriptionCookies(response, 'starter');
    return response;
  } catch (err) {
    const message = getErrorMessage(err);
    if (isMissingUserProfileTable(message)) {
      return NextResponse.json(
        {
          error:
            'Profils utilisateur indisponibles. Exécutez supabase/migrations/004_user_profiles.sql',
          code: 'TABLES_MISSING',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Statut essai / newsletter pour l'espace client. */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
    }

    const resolved = await resolveUserSubscription(
      supabase,
      user.id,
      user.email,
      undefined,
      undefined
    );

    return NextResponse.json({
      newsletterOptIn: resolved.newsletterOptIn,
      trialActive: resolved.source === 'trial',
      trialEndsAt: resolved.trialEndsAt,
      trialExpired: resolved.trialExpired,
      active: resolved.active,
      planId: resolved.planId,
    });
  } catch (err) {
    const message = getErrorMessage(err);
    if (isMissingUserProfileTable(message)) {
      return NextResponse.json({ newsletterOptIn: false, trialActive: false });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
