'use client';

import { getRoadmapCompletionPercent, loadRoadmapProgress } from '@/lib/account/roadmap-storage';
import { hasGrowthAccess } from '@/lib/account/feature-access';
import {
  getUnlockedRoadmapMonths,
  loadSubscriptionMeta,
} from '@/lib/account/subscription-storage';
import type { PlanId } from '@/lib/stripe';
import { getPhaseById } from '@/lib/coach/journey';
import { loadCoachMemory } from '@/lib/coach/memory-storage';
import {
  getBusinessResourceLibrary,
  type LibraryCategory,
  type LibraryResource,
} from '@/lib/resources/business-library';
import {
  CATEGORY_GUIDES,
  getResourceUi,
  HOW_IT_WORKS_STEPS,
  PREMIUM_VALUE_BLOCKS,
  RESOURCE_FAQ,
  type ResourceCategoryId,
} from '@/lib/resources/library-guides';
import { resolveCurrentRoadmapStep } from '@/lib/quiz/current-roadmap-step';
import { businessProfiles, type BusinessId } from '@/lib/quiz/data';
import { TOTAL_ROADMAP_DAYS } from '@/lib/quiz/roadmap-program';
import { loadChosenBusiness, loadQuizProfile } from '@/lib/quiz/profile-storage';
import { BUSINESS_CHANGED_EVENT } from '@/lib/quiz/switch-business';
import { useEntrepreneurCopy } from '@/components/EntrepreneurCopyProvider';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface ResourceLibraryProps {
  isSubscribed: boolean;
  serverPlanId?: PlanId | null;
  isGrowth?: boolean;
}

function LockedPreview() {
  const steps = Object.values(CATEGORY_GUIDES);
  return (
    <>
      <section className="resource-value-grid" aria-label="Contenu inclus">
        {PREMIUM_VALUE_BLOCKS.map((block) => (
          <article key={block.title} className="resource-value-card">
            <span className="resource-value-icon" aria-hidden="true">
              {block.icon}
            </span>
            <strong>{block.title}</strong>
            <p>{block.desc}</p>
          </article>
        ))}
      </section>
      <div className="lib-path-preview">
        {steps.map((step) => (
          <article key={step.step} className="lib-path-card">
            <span className="lib-path-step">{step.step}</span>
            <strong>{step.shortTitle}</strong>
            <p>{step.beginnerLine}</p>
          </article>
        ))}
      </div>
    </>
  );
}

function HowItWorks() {
  return (
    <section className="resource-how-works" aria-label="Comment utiliser la bibliothèque">
      <h3>Comment utiliser cette bibliothèque</h3>
      <ol className="resource-how-steps">
        {HOW_IT_WORKS_STEPS.map((item) => (
          <li key={item.step}>
            <span className="resource-how-num">{item.step}</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ResourceSyncPanel({ businessId }: { businessId: BusinessId }) {
  const { step, completed, percent, coachPhase, phaseName } = useMemo(() => {
    const resolved = resolveCurrentRoadmapStep(businessId, true);
    const progress = loadRoadmapProgress();
    const done =
      progress?.businessId === businessId ? progress.completedDays.length : 0;
    const unlocked = resolved.unlockedDays;
    const phase = loadCoachMemory(businessId)?.coachingPhase ?? 1;
    return {
      step: resolved,
      completed: done,
      percent: getRoadmapCompletionPercent(
        progress?.businessId === businessId ? progress.completedDays : [],
        unlocked
      ),
      coachPhase: phase,
      phaseName: getPhaseById(phase)?.name ?? 'Plan coach',
    };
  }, [businessId]);

  return (
    <section className="resource-sync-panel" aria-label="Lien avec ton parcours">
      <div className="resource-sync-head">
        <span className="resource-sync-kicker">Synchronisé avec ton espace</span>
        <p>
          Les ressources complètent ton <strong>parcours {TOTAL_ROADMAP_DAYS} jours</strong> et
          ton <strong>coach en 8 phases</strong>. Pas un substitut.
        </p>
      </div>
      <div className="resource-sync-metrics">
        <Link href="/espace?section=parcours" className="resource-sync-metric-link">
          <article className="resource-sync-metric">
            <span>Parcours</span>
            <strong>
              J{step.day.day}/{TOTAL_ROADMAP_DAYS}
            </strong>
            <p>
              {completed} jours cochés. {percent} % du débloqué
            </p>
          </article>
        </Link>
        <Link href="/espace?section=coach" className="resource-sync-metric-link">
          <article className="resource-sync-metric">
            <span>Coach</span>
            <strong>Étape {coachPhase}/8</strong>
            <p>{phaseName}</p>
          </article>
        </Link>
        <article className="resource-sync-metric">
          <span>Bibliothèque</span>
          <strong>4 étapes</strong>
          <p>Idée → Lancer → IA → Croissance</p>
        </article>
      </div>
    </section>
  );
}

function ResourceFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="resource-faq" aria-label="Questions fréquentes">
      <h3>Questions fréquentes</h3>
      <div className="resource-faq-list">
        {RESOURCE_FAQ.map((item, index) => (
          <details
            key={item.q}
            className="resource-faq-item"
            open={openIndex === index}
            onToggle={(e) => {
              if ((e.target as HTMLDetailsElement).open) setOpenIndex(index);
            }}
          >
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function ResourceCard({ resource }: { resource: LibraryResource }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ui = getResourceUi(resource.id);

  async function handleCopy() {
    if (!resource.template) return;
    try {
      await navigator.clipboard.writeText(resource.template);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <article className={`lib-card${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="lib-card-top"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="lib-card-icon" aria-hidden="true">
          {ui.icon}
        </span>
        <span className="lib-card-main">
          <span className="lib-card-badges">
            <span className="lib-badge">{ui.badge}</span>
            <span className="lib-badge lib-badge--muted">{ui.format}</span>
            {resource.timeEstimate && (
              <span className="lib-badge lib-badge--time">⏱ {resource.timeEstimate}</span>
            )}
          </span>
          <strong className="lib-card-title">{resource.title}</strong>
          <span className="lib-card-desc">{resource.description}</span>
        </span>
        <span className="lib-card-action" aria-hidden="true">
          {open ? 'Fermer' : 'Ouvrir'}
        </span>
      </button>

      {open && (
        <div className="lib-card-body">
          <div className="lib-how-to-use">
            <span className="lib-how-to-use-label">📖 Comment l&apos;utiliser</span>
            <p>{resource.howToUse}</p>
          </div>

          {(resource.coachPhase || resource.roadmapChapter) && (
            <div className="lib-card-links">
              {resource.coachPhase && (
                <span className="lib-card-link-tag">
                  Coach. Phase {resource.coachPhase}/8
                  {getPhaseById(resource.coachPhase)?.name
                    ? `. ${getPhaseById(resource.coachPhase)!.name}`
                    : ''}
                </span>
              )}
              {resource.roadmapChapter && (
                <span className="lib-card-link-tag">
                  Parcours. Chapitre {resource.roadmapChapter}
                </span>
              )}
            </div>
          )}

          <div className="lib-beginner-tip">
            <span className="lib-beginner-tip-label">💡 Conseil débutant</span>
            <p>{ui.beginnerTip}</p>
          </div>

          {resource.items && resource.items.length > 0 && (
            <ol className="lib-numbered-list">
              {resource.items.map((item) => (
                <li key={item}>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          )}

          {resource.template && (
            <div className="lib-template-block">
              <div className="lib-template-head">
                <span>Contenu prêt à utiliser</span>
                {resource.copyable && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => void handleCopy()}
                  >
                    {copied ? '✓ Copié !' : 'Copier tout'}
                  </button>
                )}
              </div>
              <pre>{resource.template}</pre>
              {resource.copyable && (
                <p className="lib-template-hint">
                  Collez dans un document ou le coach IA. Complète les [crochets], puis cochez
                  le jour parcours correspondant.
                </p>
              )}
            </div>
          )}

          <div className="lib-card-footer">
            <Link href="/espace?section=coach" className="lib-card-footer-link">
              Demander au coach d&apos;adapter →
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}

export default function ResourceLibrary({
  isSubscribed,
  serverPlanId = null,
  isGrowth: isGrowthFromServer = false,
}: ResourceLibraryProps) {
  const { copy } = useEntrepreneurCopy();
  const [isGrowth, setIsGrowth] = useState(isGrowthFromServer);
  const [businessId, setBusinessId] = useState<BusinessId | null>(null);
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [activeTab, setActiveTab] = useState<ResourceCategoryId>('idea');

  const refresh = useCallback(() => {
    setIsGrowth(isGrowthFromServer || hasGrowthAccess(isSubscribed, serverPlanId));
    const profile = loadQuizProfile();
    const id = (loadChosenBusiness() ?? profile?.topBusinessId) as BusinessId | undefined;
    if (id && businessProfiles[id]) {
      setBusinessId(id);
      setCategories(getBusinessResourceLibrary(id));
    } else {
      setBusinessId(null);
      setCategories([]);
    }
  }, [isSubscribed, serverPlanId, isGrowthFromServer]);

  useEffect(() => {
    refresh();
    const onBusinessChanged = () => refresh();
    window.addEventListener(BUSINESS_CHANGED_EVENT, onBusinessChanged);
    return () => window.removeEventListener(BUSINESS_CHANGED_EVENT, onBusinessChanged);
  }, [refresh]);

  const activeBiz = businessId ? businessProfiles[businessId] : null;
  const resourceCount = categories.reduce((sum, cat) => sum + cat.resources.length, 0);
  const activeCategory = categories.find((c) => c.id === activeTab);
  const activeGuide = CATEGORY_GUIDES[activeTab];

  if (!isSubscribed) {
    return (
      <div className="resource-hub resource-hub--locked">
        <header className="resource-hub-hero">
          <div className="resource-hub-glow" aria-hidden="true" />
          <div className="resource-hub-hero-inner">
            <span className="resource-hub-kicker">Business Accelerator</span>
            <h2>Bibliothèque de ressources</h2>
            <p>
              Templates, scripts, prompts et checklists expliqués pas à pas. Le complément
              idéal du coach IA et du parcours 180 jours. Inclus dans la formule{' '}
              <strong>79 €/mois</strong> (Premium 29 € = coach + parcours sans cette bibliothèque).
            </p>
          </div>
        </header>
        <LockedPreview />
        <Link href="/subscribe?plan=growth&period=monthly" className="btn btn-primary btn-lg">
          Passer à Business Accelerator. 79 €/mois
        </Link>
      </div>
    );
  }

  if (!isGrowth) {
    return (
      <div className="resource-hub resource-hub--locked">
        <header className="resource-hub-hero">
          <div className="resource-hub-glow" aria-hidden="true" />
          <div className="resource-hub-hero-inner">
            <span className="resource-hub-kicker">{copy.resources.lockedKicker}</span>
            <h2>{copy.resources.lockedTitle}</h2>
            <p>{copy.resources.lockedBody}</p>
          </div>
        </header>
        <LockedPreview />
        <Link href="/subscribe?plan=growth&period=monthly" className="btn btn-primary btn-lg">
          Passer à Business Accelerator
        </Link>
      </div>
    );
  }

  if (!activeBiz || categories.length === 0) {
    return (
      <div className="resource-hub">
        <section className="resource-hub-empty">
          <span className="resource-hub-empty-icon" aria-hidden="true">
            📚
          </span>
          <h3>Commence par définir ton profil</h3>
          <p>
            La bibliothèque s&apos;adapte à ton modèle business (freelance, SaaS, e-commerce…).
            Fais le questionnaire pour débloquer tes ressources personnalisées.
          </p>
          <Link href="/?quiz=1" className="btn btn-primary">
            Faire le questionnaire
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="resource-hub">
      <header className="resource-hub-hero">
        <div className="resource-hub-glow" aria-hidden="true" />
        <div className="resource-hub-hero-main">
          <div className="resource-hub-hero-copy">
            <span className="resource-hub-kicker">Business Accelerator. Bibliothèque complète</span>
            <h2>
              <span className="resource-hub-model-icon" aria-hidden="true">
                {activeBiz.icon}
              </span>
              Ressources {activeBiz.name}
            </h2>
            <p>
              {resourceCount} outils expliqués clairement. Templates, scripts, prompts et plans
              alignés sur ton parcours. Chaque ressource indique <strong>comment l&apos;utiliser</strong>,{' '}
              <strong>combien de temps</strong> prévoir et <strong>où ça s&apos;inscrit</strong> dans le
              coach et le parcours.
            </p>
          </div>
          <div className="resource-hub-stat">
            <strong>{resourceCount}</strong>
            <span>ressources</span>
          </div>
        </div>
      </header>

      <HowItWorks />

      {businessId && <ResourceSyncPanel businessId={businessId} />}

      <nav className="lib-path-nav" aria-label="Parcours ressources">
        {categories.map((cat) => {
          const guide = CATEGORY_GUIDES[cat.id as ResourceCategoryId];
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`lib-path-tab${isActive ? ' is-active' : ''}`}
              onClick={() => setActiveTab(cat.id as ResourceCategoryId)}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="lib-path-tab-step">{guide.step}</span>
              <span className="lib-path-tab-icon" aria-hidden="true">
                {cat.icon}
              </span>
              <span className="lib-path-tab-text">
                <strong>{guide.shortTitle}</strong>
                <span>{cat.resources.length} outils</span>
              </span>
            </button>
          );
        })}
      </nav>

      {activeCategory && activeGuide && (
        <div className="resource-hub-body">
          <section className="lib-category-intro">
            <div className="lib-category-intro-icon" aria-hidden="true">
              {activeCategory.icon}
            </div>
            <div>
              <h3>
                Étape {activeGuide.step}. {activeCategory.title}
              </h3>
              <p className="lib-category-intro-lead">{activeGuide.beginnerLine}</p>
              <p className="lib-category-intro-when">
                <strong>Quand l&apos;utiliser ?</strong> {activeGuide.whenToUse}
              </p>
              <p className="lib-category-intro-map">
                <strong>Lien parcours :</strong> {activeGuide.roadmapChapters}
                <br />
                <strong>Lien coach :</strong> {activeGuide.coachPhases}
              </p>
            </div>
          </section>

          <div className="lib-cards-grid">
            {activeCategory.resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </div>
      )}

      <ResourceFaq />
    </div>
  );
}
