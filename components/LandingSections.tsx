'use client';

import AssistanceSection from '@/components/AssistanceSection';
import LandingNewsletter from '@/components/LandingNewsletter';
import { getPublicPricingPlans, SEMESTER_DISCOUNT_PERCENT, formatSemesterBillingHint } from '@/lib/stripe/plans';
import type { BillingPeriod } from '@/lib/stripe';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';

interface LandingSectionsProps {
  onOpenQuiz?: () => void;
}

interface HeroProps extends LandingSectionsProps {
  userEmail?: string | null;
  onOpenLogin?: () => void;
}

const LANDING_TRUST_ITEMS = [
  'Plan adapté à ton profil',
  'Coach disponible 24/7',
  'Parcours progressif 180 jours',
  'Sans engagement',
] as const;

const LANDING_SOCIAL_PROOF = [
  { value: '4 min', label: 'pour ton profil' },
  { value: '180 j', label: 'de parcours guidé' },
  { value: '24 h', label: 'Premium offertes' },
  { value: '0 €', label: 'pour commencer' },
] as const;

const JOURNEY_PIPELINE = [
  { icon: '🎯', label: 'Quiz', desc: '9 questions sur toi' },
  { icon: '◎', label: 'Analyse du profil', desc: 'Forces & personnalité' },
  { icon: '◈', label: 'Choix du business', desc: 'SaaS, freelance, OFM…' },
  { icon: '🗺️', label: 'Plan 180 jours', desc: 'Tâches jour par jour' },
  { icon: '🧠', label: 'Coach IA quotidien', desc: 'Guidé étape par étape' },
  { icon: '🏙️', label: 'Évolution', desc: 'Ville & progression' },
] as const;

const GAMIFICATION_HIGHLIGHTS = [
  {
    icon: '👤',
    title: 'Personnage qui évolue',
    desc: 'Ton avatar fondateur grandit avec ton régularité et tes victoires.',
  },
  {
    icon: '🏗️',
    title: 'Ville qui se construit',
    desc: 'Chaque action coach et parcours débloque des bâtiments dans ton empire.',
  },
  {
    icon: '📈',
    title: 'Progression visible',
    desc: 'Jours cochés, chapitres, XP : tu voyez concrètement avancer.',
  },
] as const;

export function LandingOfferStrip({
  userEmail = null,
  onOpenQuiz,
}: {
  userEmail?: string | null;
  onOpenQuiz?: () => void;
}) {
  if (userEmail) return null;

  return (
    <section className="landing-offer-strip landing-only-desktop" aria-label="Offre de lancement">
      <div className="container landing-offer-strip-inner">
        <div className="landing-offer-strip-copy">
          <span className="landing-offer-strip-tag">Offre newsletter</span>
          <p>
            <strong>24 h de Premium offertes</strong> (coach IA + parcours complet + Ma ville).
            Sans carte bancaire. 1 essai par compte.
          </p>
        </div>
        <div className="landing-offer-strip-actions">
          <Link href="/#newsletter" className="btn btn-primary">
            Tester le coach IA Premium 24h
          </Link>
          {onOpenQuiz ? (
            <button type="button" className="btn btn-outline" onClick={onOpenQuiz}>
              Créer mon plan gratuitement
            </button>
          ) : (
            <Link href="/?quiz=1" className="btn btn-outline">
              Créer mon plan gratuitement
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function Hero({ onOpenQuiz, userEmail = null, onOpenLogin }: HeroProps) {
  return (
    <section className="hero landing-hero">
      <div className="hero-glow" aria-hidden="true">
        <span className="hero-orb hero-orb--1" />
        <span className="hero-orb hero-orb--2" />
        <span className="hero-orb hero-orb--3" />
      </div>
      <div className="container hero-grid">
        <div className="hero-content hero-reveal">
          <div className="badge">
            <span className="badge-dot" />
            Parcours entrepreneurial · 180 jours
          </div>
          <h1>
            Passe de zéro idée à ton premier business en 180 jours{' '}
            <em>avec un coach IA qui te donne chaque jour la prochaine action.</em>
          </h1>
          <ul className="hero-benefits landing-only-desktop">
            <li>Découvre quel business correspond à ton profil</li>
            <li>L&apos;IA crée un plan personnalisé sur 180 jours</li>
            <li>Le coach tu accompagne au quotidien, étape par étape</li>
          </ul>
          <div className="hero-cta">
            <a
              href="#quiz"
              className="btn btn-primary btn-lg landing-cta-primary"
              id="hero-quiz-cta"
              onClick={(e) => {
                e.preventDefault();
                onOpenQuiz?.();
              }}
            >
              Créer mon plan gratuitement
            </a>
            {!userEmail ? (
              <Link
                href="/#newsletter"
                className="btn btn-outline btn-lg landing-cta-secondary landing-only-desktop"
              >
                Tester le coach IA Premium 24h
              </Link>
            ) : (
              <Link href="/espace" className="btn btn-outline btn-lg landing-cta-secondary">
                Accéder à mon espace
              </Link>
            )}
          </div>
          <p className="hero-cta-note landing-mobile-trust">
            Sans carte · Accès immédiat · Essai 24 h
          </p>
          <ul className="landing-trust-row landing-only-desktop" aria-label="Garanties">
            {LANDING_TRUST_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <ul className="landing-social-proof" aria-label="Points clés">
            {LANDING_SOCIAL_PROOF.map((item) => (
              <li key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
          {!userEmail && (
            <div className="hero-free-hint landing-only-desktop">
              <span className="hero-free-hint-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2L12 17l-6.3 4 2.3-7.2-6-4.6h7.6L12 2z" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="hero-free-hint-body">
                <strong>Passe de l&apos;idée à l&apos;action, sans tu perdre</strong>
                <p>
                  Quiz gratuit en 4 minutes, profil entrepreneurial, modèle business adapté et
                  aperçu du parcours. Puis testez Premium 24 h pour le coach IA et Ma ville.
                </p>
                {onOpenLogin ? (
                  <button type="button" className="hero-free-hint-link" onClick={onOpenLogin}>
                    Créer un compte gratuit
                    <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <Link href="/login" className="hero-free-hint-link">
                    Créer un compte gratuit
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
              </div>
            </div>
          )}
          <div className="hero-stats landing-only-desktop">
            <div className="stat">
              <strong>180</strong>
              <span>jours de parcours</span>
            </div>
            <div className="stat">
              <strong>8</strong>
              <span>étapes coach</span>
            </div>
            <div className="stat">
              <strong>24/7</strong>
              <span>coach IA</span>
            </div>
          </div>
        </div>
        <div className="hero-visual hero-reveal hero-reveal--late landing-only-desktop">
          <div className="chat-window hero-chat-float">
            <div className="chat-header">
              <div className="chat-avatar">BA</div>
              <div>
                <strong>BuildrAI Coach</strong>
                <span className="online online--pulse">Jour 12. Chapitre 1</span>
              </div>
            </div>
            <div className="chat-messages">
              <div className="message bot hero-chat-msg hero-chat-msg--1">
                <p>
                  Je reprends ton parcours : tu es sur le positionnement. Tu hésites entre deux
                  accroches pour ta landing ?
                </p>
              </div>
              <div className="message user hero-chat-msg hero-chat-msg--2">
                <p>
                  Oui. J&apos;ai mon persona et mon offre SaaS, mais je ne sais pas laquelle
                  choisir.
                </p>
              </div>
              <div className="message bot hero-chat-msg hero-chat-msg--3">
                <p>
                  Parfait. Voici 3 accroches pour tes clients idéaux, plus la structure de
                  ta page d&apos;accueil. On coche la tâche du jour ensuite ?
                </p>
              </div>
            </div>
            <div className="chat-input">
              <input type="text" placeholder="Pose ton question..." disabled />
              <button type="button" aria-label="Envoyer">
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Parcours produit : différenciation vs simple chatbot + gamification */
export function LandingJourney({ onOpenQuiz }: LandingSectionsProps = {}) {
  return (
    <section className="landing-section landing-section--journey" id="journey">
      <div className="landing-journey-glow" aria-hidden="true" />
      <div className="container">
        <div className="section-header landing-section-header landing-section-header--center">
          <span className="section-tag">La méthode BuildrAI</span>
          <h2>Plus qu&apos;un chatbot IA : un parcours complet</h2>
          <p className="landing-section-intro landing-only-desktop">
            De ton profil à ton empire entrepreneurial — chaque étape est connectée,
            personnalisée et visible. Tu ne discutez pas avec une IA : tu construisez
            ton business.
          </p>
        </div>

        <div className="landing-journey-flow" aria-label="Parcours BuildrAI">
          {JOURNEY_PIPELINE.map((step, index) => (
            <article
              key={step.label}
              className="landing-journey-node animate-on-scroll"
              style={{ '--journey-i': index } as CSSProperties}
            >
              <div className="landing-journey-node-icon">{step.icon}</div>
              <strong>{step.label}</strong>
              <span>{step.desc}</span>
              {index < JOURNEY_PIPELINE.length - 1 && (
                <span className="landing-journey-connector" aria-hidden="true" />
              )}
            </article>
          ))}
        </div>

        <div className="landing-gamification">
          <header className="landing-gamification-head animate-on-scroll">
            <span className="section-tag">Motivation intégrée</span>
            <h3>Ta progression devient visible</h3>
            <p>
              BuildrAI gamifie ton lancement pour que chaque jour compte — sans perdre le
              sérieux du parcours business.
            </p>
          </header>
          <div className="landing-gamification-grid">
            {GAMIFICATION_HIGHLIGHTS.map((item) => (
              <article key={item.title} className="landing-gamification-card animate-on-scroll">
                <span className="landing-gamification-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="landing-journey-cta animate-on-scroll">
          {onOpenQuiz ? (
            <button type="button" className="btn btn-primary btn-lg landing-cta-primary" onClick={onOpenQuiz}>
              Créer mon plan gratuitement
            </button>
          ) : (
            <Link href="/?quiz=1" className="btn btn-primary btn-lg landing-cta-primary">
              Créer mon plan gratuitement
            </Link>
          )}
          <Link href="/#newsletter" className="btn btn-outline btn-lg landing-only-desktop">
            Tester le coach IA Premium 24h
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LandingTrust() {
  return (
    <section className="landing-trust-band landing-only-desktop" aria-label="Réassurance">
      <div className="container">
        <ul className="landing-trust-band-grid">
          {LANDING_TRUST_ITEMS.map((item) => (
            <li key={item} className="landing-trust-band-item animate-on-scroll">
              <span className="landing-trust-band-icon" aria-hidden="true">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

type FeatureTier = 'free' | 'premium' | 'accelerator';

const FEATURE_TIER_LABELS: Record<FeatureTier, string> = {
  free: 'Gratuit',
  premium: 'Premium. 29 €',
  accelerator: 'Accelerator. 79 €',
};

const FEATURE_GROUPS: {
  tier: FeatureTier;
  title: string;
  subtitle: string;
  items: { icon: string; title: string; desc: string }[];
}[] = [
  {
    tier: 'free',
    title: 'Gratuit. Pour démarrer',
    subtitle: 'Questionnaire, profil et aperçu du parcours. Sans carte bancaire.',
    items: [
      {
        icon: '🎯',
        title: 'Quiz entrepreneurial',
        desc: '9 questions : profil, budget, niveau et modèles business adaptés (SaaS, freelance, e-commerce…).',
      },
      {
        icon: '◎',
        title: 'Profil & modèles',
        desc: 'Scores de compatibilité et choix libre du modèle. Pas seulement le top 3 du quiz.',
      },
      {
        icon: '◈',
        title: 'Espace personnel',
        desc: 'Vue d\'ensemble, profil détaillé et bloc-notes dès la création de compte.',
      },
    ],
  },
  {
    tier: 'premium',
    title: 'Premium. 29 €/mois',
    subtitle: 'Coach IA, parcours 180 jours, Ma ville et suivi d\'activité.',
    items: [
      {
        icon: '🧠',
        title: 'Coach IA avec mémoire',
        desc: '8 étapes guidées (idée, offre, pitch, prix, lancement…) et mode synchronisé au jour J.',
      },
      {
        icon: '🗺️',
        title: 'Parcours 180 jours',
        desc: '6 chapitres de 30 jours, tâches quotidiennes. Parcours complet accessible dès l\'abonnement.',
      },
      {
        icon: '🏙️',
        title: 'Ma ville',
        desc: 'Avatar, vue isométrique, XP et bâtiments débloqués avec ta progression.',
      },
      {
        icon: '📊',
        title: 'Activité & notes',
        desc: 'Messages coach, régularité, séries et bloc-notes persistant.',
      },
    ],
  },
  {
    tier: 'accelerator',
    title: 'Accelerator. 79 €/mois',
    subtitle: 'Tout Premium, plus analyse hebdo et bibliothèque complète.',
    items: [
      {
        icon: '◐',
        title: 'Analyse hebdomadaire',
        desc: 'Bilan IA chaque semaine, aligné sur ton parcours et tes échanges coach.',
      },
      {
        icon: '▧',
        title: 'Bibliothèque ressources',
        desc: '22+ templates, scripts et prompts prêts à copier. Par phase et par chapitre.',
      },
    ],
  },
];

export function Features({ onOpenQuiz }: LandingSectionsProps = {}) {
  return (
    <section className="features landing-section landing-section--features" id="features">
      <div className="container">
        <div className="section-header landing-section-header">
          <span className="section-tag">Ton espace</span>
          <h2>Tout ce dont tu as besoin pour avancer</h2>
          <p className="landing-section-intro landing-only-desktop">
            Commence gratuitement, testez Premium 24 h, puis abonne-toi quand tu es prêt.
          </p>
        </div>

        <div className="landing-feature-groups">
          {FEATURE_GROUPS.map((group) => (
            <div key={group.tier} className={`landing-feature-group landing-feature-group--${group.tier}${group.tier === 'accelerator' ? ' landing-only-desktop' : ''}`}>
              <header className="landing-feature-group-head">
                <span className={`feature-tier feature-tier--${group.tier}`}>
                  {FEATURE_TIER_LABELS[group.tier]}
                </span>
                <h3>{group.title}</h3>
                <p>{group.subtitle}</p>
              </header>
              <div className="features-grid landing-features-grid">
                {group.items.map((f) => (
                  <article key={f.title} className="feature-card animate-on-scroll">
                    <div className="feature-icon">{f.icon}</div>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="landing-features-foot">
          {onOpenQuiz ? (
            <button type="button" className="landing-inline-link landing-inline-link--button" onClick={onOpenQuiz}>
              Faire le quiz gratuit →
            </button>
          ) : (
            <Link href="/?quiz=1" className="landing-inline-link">
              Faire le quiz gratuit →
            </Link>
          )}
          {' · '}
          <Link href="/#pricing" className="landing-inline-link">
            Voir les tarifs →
          </Link>
        </p>
      </div>
    </section>
  );
}

export function How({ onOpenQuiz }: LandingSectionsProps = {}) {
  const steps = [
    {
      num: '01',
      title: 'Découvre ton profil entrepreneurial',
      desc: '9 questions en 4 minutes : personnalité, budget, niveau tech. Tu savez enfin quel type de business te correspond.',
    },
    {
      num: '02',
      title: 'Recevez ton stratégie personnalisée',
      desc: 'Analyse de profil, modèles business adaptés (SaaS, freelance, e-commerce…) et plan 180 jours calibré sur ton choix.',
    },
    {
      num: '03',
      title: 'Avance chaque jour avec ton coach IA',
      desc: 'Micro-étapes concrètes, outils recommandés, mémoire de ton projet. Le coach connaît ton parcours jour J.',
    },
    {
      num: '04',
      title: 'Construis ton empire entrepreneurial',
      desc: 'Cochez tes jours, débloquez Ma ville, suivez ta progression. De l\'idée aux premiers clients, sans tu perdre.',
    },
  ];

  return (
    <section className="how landing-section landing-section--how" id="how">
      <div className="container">
        <div className="section-header landing-section-header">
          <span className="section-tag">Comment ça marche</span>
          <h2>De l&apos;idée à l&apos;action, étape par étape</h2>
          <p>
            Une expérience de lancement structurée — pas une simple conversation avec une IA.
            Commence gratuitement, testez Premium 24 h, avancez à ton rythme.
          </p>
        </div>
        <div className="landing-steps">
          {steps.map((s) => (
            <article key={s.num} className="landing-step animate-on-scroll">
              <div className="landing-step-marker">
                <span className="step-number">{s.num}</span>
              </div>
              <div className="landing-step-body">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="landing-how-cta">
          {onOpenQuiz ? (
            <button type="button" className="btn btn-primary btn-lg landing-cta-primary" onClick={onOpenQuiz}>
              Créer mon plan gratuitement
            </button>
          ) : (
            <Link href="/?quiz=1" className="btn btn-primary btn-lg landing-cta-primary">
              Créer mon plan gratuitement
            </Link>
          )}
          <Link href="/#newsletter" className="btn btn-outline btn-lg landing-only-desktop">
            Tester le coach IA Premium 24h
          </Link>
        </div>
      </div>
    </section>
  );
}

interface PricingProps {
  onOpenLogin?: () => void;
  userEmail?: string | null;
}

export function Pricing({ onOpenLogin, userEmail = null }: PricingProps = {}) {
  const [isSemester, setIsSemester] = useState(false);
  const period: BillingPeriod = isSemester ? 'semester' : 'monthly';
  const plans = getPublicPricingPlans(period);

  return (
    <section className="pricing landing-section landing-section--pricing" id="pricing">
      <div className="container">
        <div className="section-header landing-section-header">
          <span className="section-tag">Tarifs</span>
          <h2>Des formules simples et transparentes</h2>
          <p className="landing-section-intro landing-only-desktop">
            Gratuit pour découvrir ton profil. Premium pour construire. Accelerator pour
            accélérer avec analyse et ressources.
          </p>
        </div>
        <div className="pricing-toggle">
          <span className={`toggle-label${!isSemester ? ' active' : ''}`}>Mensuel</span>
          <button
            type="button"
            className={`toggle-switch${isSemester ? ' semester' : ''}`}
            aria-label="Basculer mensuel/semestriel"
            onClick={() => setIsSemester(!isSemester)}
          >
            <span className="toggle-knob" />
          </button>
          <span className={`toggle-label${isSemester ? ' active' : ''}`}>
            Semestriel <em>-{SEMESTER_DISCOUNT_PERCENT}%</em>
          </span>
        </div>
        <div className="pricing-grid pricing-grid--3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`price-card animate-on-scroll${plan.popular ? ' popular' : ''}${plan.isFree ? ' is-free' : ''}`}
            >
              {plan.popular && <div className="popular-badge">Le plus populaire</div>}
              {plan.isFree && <div className="popular-badge is-free-badge">Gratuit à vie</div>}
              <div className="price-header">
                <h3>{plan.name}</h3>
                <p>{plan.desc}</p>
              </div>
              <div className="price-amount">
                {plan.isFree ? (
                  <span className="amount amount--free">0 €</span>
                ) : (
                  <>
                    <span className="currency">€</span>
                    <span className="amount">{isSemester ? plan.semester : plan.monthly}</span>
                    <span className="period">/mois</span>
                    {isSemester && (
                      <span className="period period--hint">{formatSemesterBillingHint()}</span>
                    )}
                  </>
                )}
              </div>
              <ul className="price-features">
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {plan.isFree ? (
                userEmail ? (
                  <Link href="/espace" className={`btn ${plan.ctaClass} btn-block`}>
                    Accéder à mon espace
                  </Link>
                ) : onOpenLogin ? (
                  <button
                    type="button"
                    className={`btn ${plan.ctaClass} btn-block`}
                    onClick={onOpenLogin}
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link href={plan.href} className={`btn ${plan.ctaClass} btn-block`}>
                    {plan.cta}
                  </Link>
                )
              ) : plan.id === 'starter' && !userEmail ? (
                <>
                  <Link href={plan.href} className={`btn ${plan.ctaClass} btn-block`}>
                    {plan.cta}
                  </Link>
                  <Link href="/#newsletter" className="price-trial-link">
                    Ou essai Premium 24 h gratuit →
                  </Link>
                </>
              ) : (
                <Link href={plan.href} className={`btn ${plan.ctaClass} btn-block`}>
                  {plan.cta}
                </Link>
              )}
            </article>
          ))}
        </div>
        <ul className="landing-pricing-trust landing-pricing-trust--compact" aria-label="Engagements">
          <li>✓ Sans engagement</li>
          <li>✓ Paiement sécurisé Stripe</li>
          <li>✓ Résiliation en un clic</li>
          <li>✓ Semestriel −30 %</li>
        </ul>
      </div>
    </section>
  );
}

export function FAQ() {
  const items = [
    {
      q: 'Comment tester Premium avant de payer ?',
      a: 'Inscris-toi à la newsletter : tu recevez 24 h d\'accès Premium (coach IA, parcours complet, Ma ville) sans carte bancaire. À la fin, retour automatique au plan Gratuit. 1 essai par compte.',
      open: true,
    },
    {
      q: 'Que comprend le plan gratuit ?',
      a: 'Le questionnaire entrepreneurial, l\'analyse de profil, les modèles business adaptés, un aperçu du parcours et ton espace personnel (vue d\'ensemble, profil, bloc-notes). Le coach IA, le parcours détaillé et Ma ville complète nécessitent Premium.',
    },
    {
      q: 'Quelle différence entre Premium (29 €) et Accelerator (79 €) ?',
      a: 'Premium inclut le coach IA illimité avec mémoire, le parcours 180 jours, Ma ville gamifiée et le suivi d\'activité. Accelerator ajoute l\'analyse hebdomadaire approfondie et la bibliothèque complète de ressources (templates, scripts, prompts IA).',
    },
    {
      q: 'Comment fonctionne le parcours 180 jours ?',
      a: '6 chapitres de 30 jours, calibrés sur ton modèle business (SaaS, freelance, e-commerce…). Chaque jour a une tâche concrète. Le coach IA se synchronise au jour J. Les 6 chapitres sont accessibles dès ton abonnement Premium.',
    },
    {
      q: 'Qu\'est-ce que Ma ville ?',
      a: 'Un espace gamifié en vue isométrique : créez ton avatar fondateur, gagnez de l\'XP, débloquez des bâtiments au fil de tes actions coach et parcours. C\'est ton empire visuel qui grandit avec ton projet.',
    },
    {
      q: 'L\'IA remplace-t-elle un vrai mentor ?',
      a: 'Non. BuildrAI complète l\'humain : disponible 24h/24 pour le quotidien (offre, pitch, pricing, lancement), pendant que tes mentors restent utiles pour le réseau et les gros choix stratégiques.',
    },
    {
      q: 'Puis-je annuler à tout moment ?',
      a: 'Absolument. Pas d\'engagement, pas de frais cachés. Annule en un clic depuis ton espace client. Tu conservez l\'accès jusqu\'à la fin de la période payée.',
    },
    {
      q: 'Mes données sont-elles en sécurité ?',
      a: 'Tes données restent associées à ton compte. Tu peux gérer tes notes, ton profil et ton abonnement depuis ton espace personnel.',
    },
  ];

  return (
    <section className="faq landing-section landing-section--faq" id="faq">
      <div className="container">
        <div className="section-header landing-section-header">
          <span className="section-tag">FAQ</span>
          <h2>Questions fréquentes</h2>
          <p className="landing-section-intro landing-only-desktop">Tout ce qu&apos;il faut savoir avant de commencer.</p>
        </div>
        <div className="faq-list">
          {items.map((item, index) => (
            <details
              key={item.q}
              className={`faq-item${index >= 4 ? ' landing-only-desktop' : ''}`}
              open={item.open}
            >
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

interface LandingAssistanceProps {
  userEmail?: string | null;
}

export function Assistance({ userEmail = null }: LandingAssistanceProps) {
  return (
    <section className="assistance assistance--landing landing-only-desktop">
      <div className="container">
        <AssistanceSection userEmail={userEmail} variant="embedded" />
      </div>
    </section>
  );
}

interface CTAProps {
  onOpenQuiz?: () => void;
  userEmail?: string | null;
}

export function CTA({ onOpenQuiz, userEmail = null }: CTAProps = {}) {
  return (
    <section className="cta landing-section landing-section--cta">
      <div className="container">
        <div className="cta-box landing-cta-box">
          <span className="section-tag">Prêt à lancer ?</span>
          <h2>Passe de l&apos;idée à l&apos;action dès aujourd&apos;hui</h2>
          <p className="landing-section-intro landing-only-desktop">
            Crée ton plan personnalisé en 4 minutes, testez le coach IA Premium 24 h sans
            carte bancaire, puis avancez jour après jour — sans engagement.
          </p>
          <div className="landing-cta-actions">
            {onOpenQuiz ? (
              <button type="button" className="btn btn-primary btn-lg landing-cta-primary" onClick={onOpenQuiz}>
                Créer mon plan gratuitement
              </button>
            ) : (
              <Link href="/?quiz=1" className="btn btn-primary btn-lg landing-cta-primary">
                Créer mon plan gratuitement
              </Link>
            )}
            {!userEmail ? (
              <Link href="/#newsletter" className="btn btn-outline btn-lg landing-only-desktop">
                Tester le coach IA Premium 24h
              </Link>
            ) : (
              <Link href="/espace" className="btn btn-outline btn-lg landing-only-desktop">
                Mon espace
              </Link>
            )}
          </div>
          <span className="cta-note landing-only-desktop">
            Plan adapté à ton profil · Coach 24/7 · Parcours 180 jours · Sans engagement
          </span>
          {!userEmail && (
            <LandingNewsletter userEmail={userEmail} variant="compact" />
          )}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a href="/" className="logo">
            <span className="logo-icon">◈</span>
            BuildrAI
          </a>
          <p>Un parcours entrepreneurial structuré — du profil à l&apos;action, avec un coach IA à tes côtés.</p>
        </div>
        <div className="footer-links">
          <h4>Produit</h4>
          <ul>
            <li><a href="#features">Outils</a></li>
            <li><a href="#pricing">Tarifs</a></li>
            <li><a href="#journey">La méthode</a></li>
            <li><a href="#how">Comment ça marche</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>Espace client</h4>
          <ul>
            <li><Link href="/login">Connexion</Link></li>
            <li><Link href="/espace">Mon espace</Link></li>
            <li><Link href="/?quiz=1">Quiz gratuit</Link></li>
            <li><Link href="/assistance">Assistance</Link></li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>Contact</h4>
          <ul>
            <li><Link href="/assistance">Centre d&apos;aide</Link></li>
            <li><a href="mailto:Buildraimail@gmail.com">Buildraimail@gmail.com</a></li>
            <li><a href="#pricing">Premium. 29 €</a></li>
            <li><a href="#pricing">Accelerator. 79 €</a></li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© 2026 BuildrAI. Tous droits réservés.</p>
        <div className="footer-social">
          <a href="#" aria-label="LinkedIn">in</a>
          <a href="#" aria-label="Twitter">𝕏</a>
          <a href="#" aria-label="YouTube">▶</a>
        </div>
      </div>
    </footer>
  );
}

export function ScrollAnimations() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      const node = el as HTMLElement;
      node.style.opacity = '0';
      node.style.transform = 'translateY(24px)';
      node.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
