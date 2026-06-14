'use client';

import Link from 'next/link';

const CONTACT_EMAIL = 'Buildraimail@gmail.com';

const VISITOR_TOPICS = [
  {
    q: 'Comment découvrir mon profil entrepreneurial ?',
    a: 'Le questionnaire est gratuit et accessible sans compte. Depuis l\'accueil, clique sur « Découvrir mon profil » et réponds aux 9 questions.',
  },
  {
    q: 'Dois-je créer un compte ?',
    a: 'Non pour le questionnaire. Un compte est utile pour sauvegarder ton profil, gérer un abonnement et accéder à ton espace personnel.',
  },
  {
    q: 'Que comprend le plan gratuit ?',
    a: 'Le questionnaire, l\'analyse de ton profil, les modèles business adaptés et un aperçu de parcours. Le coach IA et le parcours détaillé sont inclus dans les abonnements payants.',
  },
  {
    q: 'Le coach IA est-il gratuit ?',
    a: 'Non. Le coach IA est inclus dans les abonnements Premium et Premium. Business Accelerator. Un plan gratuit permet de découvrir ton profil sans carte bancaire.',
  },
  {
    q: 'Je n\'arrive pas à créer mon compte',
    a: 'Vérifie que ton mot de passe fait au moins 6 caractères. Si tu ne reçois pas l\'email de confirmation, attends une heure (limite d\'envoi) ou contacte-nous.',
  },
];

const ACCOUNT_TOPICS = [
  {
    q: 'Où retrouver mon profil et mon espace ?',
    a: 'Connecte-toi puis ouvre « Mon espace » (/espace). Ton profil entrepreneurial et ton tableau de bord y sont accessibles.',
  },
  {
    q: 'Comment débloquer le coach IA ?',
    a: 'Depuis ton espace, section Abonnement, ou la page Tarifs. Choisis une formule Premium ou Business Accelerator.',
  },
  {
    q: 'Mot de passe oublié',
    a: 'Sur la page Connexion, utilise « Mot de passe oublié ? ». Si l\'email n\'arrive pas, contacte-nous depuis l\'assistance une fois abonné Premium.',
  },
  {
    q: 'Comment annuler mon abonnement ?',
    a: 'Espace → Abonnement → « Gérer ou résilier mon abonnement ». Le portail Stripe sécurisé s\'ouvre pour annuler en un clic. Tu conserves l\'accès jusqu\'à la fin de la période payée.',
  },
];

const PREMIUM_TOPICS = [
  {
    q: 'Le coach ne répond pas',
    a: 'Vérifie ta connexion et réessaie. Si le problème persiste, déconnecte-toi puis reconnecte-toi. Contacte directement le créateur du site par email en précisant l\'heure de l\'incident.',
  },
  {
    q: 'Ma progression n\'est pas sauvegardée',
    a: 'L\'historique du coach est lié à ton compte et ton modèle business actif. Vérifie que tu es connecté avec le bon email.',
  },
  {
    q: 'Comment nous contacter ?',
    a: `Utilise la section « Une question sans réponse ? » en bas de cette page. Tu contactes directement le créateur du site (${CONTACT_EMAIL}), réservé aux abonnés Premium.`,
  },
];

interface AssistanceSectionProps {
  userEmail?: string | null;
  isSubscribed?: boolean;
  variant?: 'page' | 'embedded' | 'dashboard';
}

export default function AssistanceSection({
  userEmail = null,
  isSubscribed = false,
  variant = 'page',
}: AssistanceSectionProps) {
  const isLoggedIn = Boolean(userEmail);
  const contactMailSubject = encodeURIComponent('Assistance abonné. BuildrAI');
  const contactMailBody = encodeURIComponent(
    userEmail
      ? `Bonjour,\n\nMon compte : ${userEmail}\n\nMa question :\n`
      : 'Bonjour,\n\nMa question :\n'
  );
  const contactMailto = `mailto:${CONTACT_EMAIL}?subject=${contactMailSubject}&body=${contactMailBody}`;
  const rootClass =
    variant === 'dashboard'
      ? 'assistance-section assistance-section--dashboard'
      : variant === 'embedded'
        ? 'assistance-section assistance-section--embedded'
        : 'assistance-section assistance-section--page';

  return (
    <div className={rootClass} id={variant === 'embedded' ? 'assistance' : undefined}>
      {variant !== 'dashboard' && (
        <header className="assistance-header">
          <span className="section-tag">Assistance</span>
          <h2>Comment puis-je t'aider ?</h2>
          <p>
            {isLoggedIn
              ? `Connecté en tant que ${userEmail}. Retrouve ici les réponses aux questions les plus fréquentes.`
              : 'Que tu ayez un compte ou non, trouve rapidement une réponse. Les abonnés Premium peuvent écrire directement au créateur du site.'}
          </p>
        </header>
      )}

      {variant === 'dashboard' && (
        <p className="account-panel-intro">
          {isSubscribed
            ? 'Besoin d\'aide ? Consulte les guides ci-dessous ou contacte directement le créateur du site par email. Réponse sous 24 à 48 h ouvrées.'
            : 'Besoin d\'aide ? Consulte les guides ci-dessous. Le contact par email (directement avec le créateur du site) est réservé aux abonnés Premium.'}
        </p>
      )}

      <div className="assistance-status-row">
        <article className={`assistance-status-card${!isLoggedIn ? ' is-active' : ''}`}>
          <span className="assistance-status-label">Sans compte</span>
          <strong>Questionnaire & découvertes</strong>
          <p>Profil entrepreneurial gratuit, tarifs et FAQ.</p>
        </article>
        <article className={`assistance-status-card${isLoggedIn && !isSubscribed ? ' is-active' : ''}`}>
          <span className="assistance-status-label">Avec compte</span>
          <strong>Espace personnel</strong>
          <p>Profil sauvegardé, abonnement et connexion.</p>
        </article>
        <article className={`assistance-status-card${isSubscribed ? ' is-active' : ''}`}>
          <span className="assistance-status-label">Abonné</span>
          <strong>Coach IA & premium</strong>
          <p>Coach, activité, ma ville et facturation.</p>
        </article>
      </div>

      <div className="assistance-grid">
        <section className="assistance-panel">
          <h3>Visiteur. Sans compte</h3>
          <div className="assistance-faq-list">
            {VISITOR_TOPICS.map((item) => (
              <details key={item.q} className="faq-item assistance-faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <div className="assistance-quick-links">
            <Link href="/" className="btn btn-outline btn-sm">
              Questionnaire gratuit
            </Link>
            <Link href="/#pricing" className="btn btn-ghost btn-sm">
              Voir les tarifs
            </Link>
            <Link href="/login" className="btn btn-ghost btn-sm">
              Créer un compte
            </Link>
          </div>
        </section>

        <section className="assistance-panel">
          <h3>Client. Avec compte</h3>
          <div className="assistance-faq-list">
            {ACCOUNT_TOPICS.map((item) => (
              <details key={item.q} className="faq-item assistance-faq-item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
          <div className="assistance-quick-links">
            {isLoggedIn ? (
              <>
                <Link href="/espace" className="btn btn-outline btn-sm">
                  Mon espace
                </Link>
                <Link href="/espace?section=abonnement" className="btn btn-ghost btn-sm">
                  Gérer l&apos;abonnement
                </Link>
              </>
            ) : (
              <Link href="/login" className="btn btn-primary btn-sm">
                Se connecter
              </Link>
            )}
          </div>
        </section>

        {(isSubscribed || variant !== 'dashboard') && (
          <section className="assistance-panel">
            <h3>Abonné. Coach & premium</h3>
            {!isSubscribed && variant !== 'dashboard' && (
              <p className="assistance-panel-note">
                Ces ressources concernent les abonnés. Débloque le coach IA depuis la page Tarifs.
              </p>
            )}
            <div className="assistance-faq-list">
              {PREMIUM_TOPICS.map((item) => (
                <details key={item.q} className="faq-item assistance-faq-item">
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
            {isSubscribed && (
              <div className="assistance-quick-links">
                <Link href="/espace?section=coach" className="btn btn-outline btn-sm">
                  Ouvrir le coach
                </Link>
                <Link href="/espace?section=abonnement" className="btn btn-ghost btn-sm">
                  Facturation
                </Link>
              </div>
            )}
          </section>
        )}
      </div>

      {isSubscribed ? (
        <aside className="assistance-contact assistance-contact--premium">
          <div className="assistance-contact-text">
            <span className="assistance-contact-badge">Abonnés Premium</span>
            <h3>Une question sans réponse ?</h3>
            <p>
              L&apos;assistance par email tu met en contact direct avec le créateur de BuildrAI.
              Écris à <a href={contactMailto}>{CONTACT_EMAIL}</a> en indiquant ton email de
              compte. Réponse sous 24 à 48 h ouvrées.
            </p>
          </div>
          <a href={contactMailto} className="btn btn-primary">
            Contacter le créateur
          </a>
        </aside>
      ) : (
        <aside className="assistance-contact assistance-contact--locked">
          <div className="assistance-contact-text">
            <span className="assistance-contact-badge is-locked">Abonnés Premium</span>
            <h3>Une question sans réponse ?</h3>
            <p>
              Le contact par email (directement avec le créateur du site) est réservé aux abonnés
              Premium et Business Accelerator. Consulte les FAQ ci-dessus ou passe à une formule
              payante pour lui écrire.
            </p>
          </div>
          <Link
            href={isLoggedIn ? '/espace?section=abonnement' : '/#pricing'}
            className="btn btn-outline"
          >
            Voir les formules
          </Link>
        </aside>
      )}

      {variant === 'embedded' && (
        <p className="assistance-more">
          <Link href="/assistance">Voir toute l&apos;assistance →</Link>
        </p>
      )}
    </div>
  );
}
