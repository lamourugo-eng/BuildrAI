import Link from 'next/link';
import { BILLING_PLANS, SEMESTER_DISCOUNT_PERCENT } from '@/lib/stripe/plans';

interface CoachPaywallProps {
  loggedIn?: boolean;
}

const premiumPlan = BILLING_PLANS.find((p) => p.id === 'starter')!;
const growthPlan = BILLING_PLANS.find((p) => p.id === 'growth')!;

export default function CoachPaywall({ loggedIn = false }: CoachPaywallProps) {
  const subscribeHref = loggedIn
    ? '/subscribe?plan=starter&period=monthly'
    : '/login?redirect=/subscribe&plan=starter&period=monthly';

  const growthHref = loggedIn
    ? '/subscribe?plan=growth&period=monthly'
    : '/login?redirect=/subscribe&plan=growth&period=monthly';

  return (
    <div className="coach-paywall">
      <div className="coach-paywall-card">
        <div className="coach-paywall-glow" aria-hidden="true" />
        <span className="section-tag">Coach IA. Premium</span>
        <h2>Débloque ton coach personnel</h2>
        <p className="coach-paywall-price">
          {premiumPlan.monthly} €<small>/mois</small>
          <span className="coach-paywall-price-note">
            ou {premiumPlan.semester} €/mois en semestriel (−{SEMESTER_DISCOUNT_PERCENT} %)
          </span>
        </p>
        <p>
          Le coach IA est réservé aux abonnés Premium. Crée un compte gratuit pour découvrir
          ton profil, puis passez à Premium quand tu es prêt à construire.
        </p>
        <ul className="coach-paywall-features">
          <li>Coach IA illimité. Mémoire de ton parcours</li>
          <li>Tous les modèles business au choix (pas seulement le top 3 du quiz)</li>
          <li>Parcours complet sur 180 jours (6 chapitres), accessible dès l&apos;abonnement</li>
          <li>Plan d&apos;action en 8 étapes avec outils concrets</li>
          <li>Recommandations adaptées à ton niveau tech et budget</li>
        </ul>
        <div className="coach-paywall-actions">
          <Link href={subscribeHref} className="btn btn-primary btn-lg">
            Choisir Premium. {premiumPlan.monthly} €/mois
          </Link>
          <Link href="/#pricing" className="btn btn-outline">
            Voir les tarifs
          </Link>
        </div>
        <p className="coach-paywall-growth">
          Besoin d&apos;aller plus loin ?{' '}
          <Link href={growthHref}>
            Business Accelerator. {growthPlan.monthly} €/mois
          </Link>{' '}
          : analyse hebdo, bibliothèque de ressources et parcours avancé.
        </p>
      </div>
    </div>
  );
}
