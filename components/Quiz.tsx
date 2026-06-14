'use client';

import { markQuizCompleted } from '@/lib/account/analytics-storage';
import {
  buildQuizProfileSnapshot,
  saveQuizProfile,
} from '@/lib/quiz/profile-storage';
import { syncQuizProfileToServer } from '@/lib/quiz/profile-sync';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import FreeRoadmapTeaser from '@/components/FreeRoadmapTeaser';
import { businessProfiles, quizQuestions } from '@/lib/quiz/data';
import {
  calculateScores,
  getAdaptedFirstSteps,
  getBudgetFit,
  getInvestmentAnswerIndex,
  getMatchLabel,
  getPersonalityType,
  getQuizLevels,
  resultBadges,
} from '@/lib/quiz/scoring';

type QuizPanel = 'intro' | 'questions' | 'result';

interface QuizProps {
  onSkip: () => void;
  onExplore: () => void;
  variant?: 'landing' | 'account';
  onProfileSaved?: () => void;
}

export default function Quiz({
  onSkip,
  onExplore,
  variant = 'landing',
  onProfileSaved,
}: QuizProps) {
  const [panel, setPanel] = useState<QuizPanel>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isResultView, setIsResultView] = useState(false);

  const question = quizQuestions[step];
  const progress = ((step + 1) / quizQuestions.length) * 100;

  function startQuiz() {
    setPanel('questions');
    setStep(0);
    setAnswers([]);
    setIsResultView(false);
  }

  function selectAnswer(optionIndex: number) {
    const nextAnswers = [...answers];
    nextAnswers[step] = optionIndex;
    setAnswers(nextAnswers);

    if (step < quizQuestions.length - 1) {
      setStep(step + 1);
    } else {
      setIsResultView(true);
      setPanel('result');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  function goBack() {
    if (step > 0) setStep(step - 1);
  }

  function restart() {
    setStep(0);
    setAnswers([]);
    setIsResultView(false);
    setPanel('questions');
  }

  const showQuizResults = panel === 'result';
  const ranked = showQuizResults ? calculateScores(answers) : [];
  const topResults = ranked.slice(0, 4);
  const personality = topResults[0] ? getPersonalityType(topResults[0].id) : null;
  const levels = showQuizResults ? getQuizLevels(answers) : null;

  useEffect(() => {
    if (panel !== 'result' || !topResults[0] || !personality || !levels) return;
    const investmentIndex = getInvestmentAnswerIndex(answers);
    const adaptedSteps = getAdaptedFirstSteps(
      topResults[0].id,
      investmentIndex
    );
    const snapshot = buildQuizProfileSnapshot(topResults, personality, levels, {
      firstSteps: adaptedSteps,
    });
    if (snapshot) {
      saveQuizProfile(snapshot);
      markQuizCompleted();
      void syncQuizProfileToServer(snapshot).then(() => {
        onProfileSaved?.();
      });
    }
  }, [panel, topResults, personality, levels, answers, onProfileSaved]);

  return (
    <section className="quiz" id="quiz">
      <div className="quiz-glow" />
      <div className={`container quiz-container${isResultView ? ' quiz-result-view' : ''}`}>
        {panel === 'intro' && (
          <div className="quiz-panel">
            <div className="quiz-intro-layout">
              <div>
                <span className="section-tag">Étape 1. Profil</span>
                <h1>
                  Trouvez le business
                  <br />
                  <em>fait pour vous</em>
                </h1>
                <p className="quiz-intro-text">
                  Répondez à 9 questions sur vous. On vous propose les types d&apos;entreprise qui
                  vous correspondent le mieux, en tenant compte de votre budget.
                </p>
                <div className="quiz-meta">
                  <span>⏱ Environ 4 minutes</span>
                  <span>📋 9 questions faciles</span>
                  <span>🎯 Résultat clair à la fin</span>
                </div>
                <button type="button" className="btn btn-primary btn-lg" onClick={startQuiz}>
                  Commencer le quiz gratuit
                </button>
                <button type="button" className="btn btn-ghost quiz-skip" onClick={onSkip}>
                  Voir le site d&apos;abord →
                </button>
              </div>
              <div className="quiz-preview">
                <h3>Ce que vous obtiendrez</h3>
                <div className="quiz-preview-step">
                  <span className="quiz-preview-num">1</span>
                  <div>
                    <strong>Votre profil</strong>
                    <span>Votre façon d&apos;être et vos points forts</span>
                  </div>
                </div>
                <div className="quiz-preview-step">
                  <span className="quiz-preview-num">2</span>
                  <div>
                    <strong>Votre entrepreneur</strong>
                    <span>Créé dans Ma ville après inscription. Gratuit</span>
                  </div>
                </div>
                <div className="quiz-preview-step">
                  <span className="quiz-preview-num">3</span>
                  <div>
                    <strong>4 types d&apos;activité (SaaS, freelance…)</strong>
                    <span>1 recommandé + 3 autres options avec score</span>
                  </div>
                </div>
                <div className="quiz-preview-step">
                  <span className="quiz-preview-num">4</span>
                  <div>
                    <strong>Plan d&apos;action</strong>
                    <span>Premières étapes concrètes pour vous lancer</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {panel === 'questions' && question && (
          <div className="quiz-panel">
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="quiz-step">
              Question {step + 1} / {quizQuestions.length}
            </span>
            <h2 className="quiz-question-title">{question.question}</h2>
            <div className="quiz-options">
              {question.options.map((opt, i) => (
                <button
                  key={opt.label}
                  type="button"
                  className="quiz-option"
                  onClick={() => selectAnswer(i)}
                >
                  <span className="quiz-option-icon">{opt.icon}</span>
                  <span className="quiz-option-text">
                    <strong>{opt.label}</strong>
                    <span>{opt.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            {step > 0 && (
              <button type="button" className="btn btn-outline quiz-back" onClick={goBack}>
                ← Question précédente
              </button>
            )}
          </div>
        )}

        {panel === 'result' && topResults[0] && personality && levels && (
          <div className="quiz-panel">
            <span className="section-tag">Vos résultats</span>
            <h2>Votre profil entrepreneurial</h2>

            <div className="quiz-profile-summary quiz-profile-summary--compact">
              <span className="quiz-result-badge">Votre profil</span>
              <h3>{personality.label}</h3>
              <p className="profile-desc">{personality.desc}</p>
              {levels.investment.label !== 'Non renseigné' && (
                <p className="quiz-investment-summary">
                  <strong>Budget :</strong> {levels.investment.label}. {levels.investment.desc}
                </p>
              )}
            </div>

            {(() => {
              const primary = topResults[0];
              const profile = businessProfiles[primary.id];
              const alternatives = topResults.slice(1);
              const investmentIndex = getInvestmentAnswerIndex(answers);
              const budgetFit =
                investmentIndex !== null
                  ? getBudgetFit(primary.id, investmentIndex)
                  : null;
              const adaptedSteps =
                investmentIndex !== null
                  ? getAdaptedFirstSteps(primary.id, investmentIndex)
                  : profile.firstSteps;

              return (
                <>
                  <h3 className="quiz-results-title">Votre modèle le plus adapté</h3>
                  <article className="quiz-result-card primary">
                    <span className="quiz-result-badge">{resultBadges[0]}</span>
                    <div className="quiz-result-header">
                      <h3>
                        {profile.icon} {profile.name}
                      </h3>
                      <div
                        className="quiz-match-ring"
                        style={{ '--pct': primary.percent } as CSSProperties}
                      >
                        <span>{primary.percent}%</span>
                      </div>
                    </div>
                    <p className="match-score">
                      {getMatchLabel(primary.percent)}. Ex. {profile.examples}
                    </p>
                    <p className="quiz-result-desc">{profile.description}</p>
                    {budgetFit && (
                      <div className={`quiz-budget-fit quiz-budget-fit--${budgetFit.fit}`}>
                        <h4>{budgetFit.title}</h4>
                        <p>{budgetFit.advice}</p>
                        <span className="quiz-budget-fit-meta">
                          Coût typique : {profile.metrics.cost}. Budget déclaré :{' '}
                          {levels.investment.label}
                        </span>
                      </div>
                    )}
                    {primary.id === 'saas' && (
                      <div className="quiz-b2-choice">
                        <h4>Quelle cible vous correspond ?</h4>
                        <div className="quiz-b2-options">
                          <div>
                            <strong>B2B</strong>
                            <span>Vendre aux entreprises. Tickets plus élevés, cycle plus long</span>
                          </div>
                          <div>
                            <strong>B2C</strong>
                            <span>Vendre aux particuliers. Volume plus grand, lancement plus rapide</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="quiz-result-section steps">
                      <h4>Par où commencer</h4>
                      <ul>
                        {adaptedSteps.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </article>

                  {alternatives.length > 0 && (
                    <details className="quiz-alternatives">
                      <summary>
                        Voir les autres options ({alternatives.length})
                      </summary>
                      <div className="quiz-alternatives-list">
                        {alternatives.map((item, i) => {
                          const alt = businessProfiles[item.id];
                          return (
                            <article key={item.id} className="quiz-result-card compact">
                              <span className="quiz-result-badge">{resultBadges[i + 1]}</span>
                              <div className="quiz-result-header">
                                <h3>
                                  {alt.icon} {alt.name}
                                </h3>
                                <div
                                  className="quiz-match-ring"
                                  style={{ '--pct': item.percent } as CSSProperties}
                                >
                                  <span>{item.percent}%</span>
                                </div>
                              </div>
                              <p className="match-score">
                                {getMatchLabel(item.percent)}. Ex. {alt.examples}
                              </p>
                              <p className="quiz-result-desc">{alt.description}</p>
                            </article>
                          );
                        })}
                      </div>
                    </details>
                  )}
                </>
              );
            })()}

            {(() => {
              const roadmapProfile = buildQuizProfileSnapshot(topResults, personality, levels, {
                firstSteps: getAdaptedFirstSteps(
                  topResults[0].id,
                  getInvestmentAnswerIndex(answers)
                ),
              });
              return (
                <FreeRoadmapTeaser
                  profile={roadmapProfile}
                  variant="quiz"
                  showUpgradeCta={false}
                />
              );
            })()}

            <div className="quiz-result-actions">
              {variant === 'account' ? (
                <>
                  <button type="button" className="btn btn-primary btn-lg" onClick={onExplore}>
                    Voir mon parcours
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-lg"
                    onClick={onSkip}
                  >
                    Retour au profil
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={restart}>
                    Refaire le questionnaire
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/login?redirect=${encodeURIComponent('/espace?section=ville')}&newsletter=1&tab=signup`}
                    className="btn btn-primary btn-lg"
                    onClick={onExplore}
                  >
                    Créer mon compte · essai 24 h offert
                  </Link>
                  <p className="quiz-result-hint">
                    Compte gratuit + option newsletter pour <strong>24 h Premium</strong> (coach, parcours, Ma ville).
                  </p>
                  <Link
                    href={`/login?redirect=${encodeURIComponent('/espace')}`}
                    className="btn btn-outline btn-lg"
                    onClick={onExplore}
                  >
                    Créer un compte sans essai
                  </Link>
                  <Link
                    href="/#pricing"
                    className="btn btn-ghost btn-lg"
                    onClick={onExplore}
                  >
                    Voir les tarifs
                  </Link>
                  <button type="button" className="btn btn-ghost" onClick={restart}>
                    Refaire le questionnaire
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
