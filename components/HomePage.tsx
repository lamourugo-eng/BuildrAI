'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import LoginModal from './LoginModal';
import Quiz from './Quiz';
import SiteTopbar from './SiteTopbar';
import LandingStickyCta from '@/components/LandingStickyCta';
import LandingNewsletter from '@/components/LandingNewsletter';
import {
  CTA,
  Assistance,
  FAQ,
  Features,
  Footer,
  Hero,
  How,
  LandingOfferStrip,
  Pricing,
  ScrollAnimations,
} from './LandingSections';

interface HomePageProps {
  userEmail?: string | null;
  initialQuizActive?: boolean;
}

export default function HomePage({
  userEmail = null,
  initialQuizActive = true,
}: HomePageProps) {
  const searchParams = useSearchParams();
  const [quizActive, setQuizActive] = useState(initialQuizActive);
  const [quizKey, setQuizKey] = useState(0);
  const [loginOpen, setLoginOpen] = useState(false);

  const openSite = useCallback(() => {
    setQuizActive(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const openQuiz = useCallback(() => {
    setQuizActive(true);
    setQuizKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const navigateSection = useCallback((hash: string) => {
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (searchParams.get('quiz') === '1') {
      setQuizActive(true);
      setQuizKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [searchParams]);

  const rootClass = quizActive ? 'page-root quiz-active' : 'page-root quiz-done';

  return (
    <div className={rootClass}>
      {quizActive && (
        <SiteTopbar
          variant="quiz"
          userEmail={userEmail}
          onGoHome={openSite}
          onOpenQuiz={openQuiz}
          onOpenLogin={() => setLoginOpen(true)}
          onNavigateSection={navigateSection}
        />
      )}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <Quiz key={quizKey} onSkip={openSite} onExplore={openSite} />
      {!quizActive && (
        <SiteTopbar
          variant="landing"
          userEmail={userEmail}
          onOpenQuiz={openQuiz}
          onOpenLogin={() => setLoginOpen(true)}
          onNavigateSection={navigateSection}
        />
      )}
      <div className="site-content" id="site-content">
        <main className="landing-page">
          <Hero
            onOpenQuiz={openQuiz}
            userEmail={userEmail}
            onOpenLogin={() => setLoginOpen(true)}
          />
          <LandingOfferStrip userEmail={userEmail} onOpenQuiz={openQuiz} />
          <How onOpenQuiz={openQuiz} />
          <Features onOpenQuiz={openQuiz} />
          <Pricing onOpenLogin={() => setLoginOpen(true)} userEmail={userEmail} />
          <LandingNewsletter userEmail={userEmail} />
          <FAQ />
          <Assistance userEmail={userEmail} />
          <CTA onOpenQuiz={openQuiz} userEmail={userEmail} />
        </main>
        <Footer />
        <LandingStickyCta onOpenQuiz={openQuiz} enabled={!quizActive} />
        <ScrollAnimations />
      </div>
    </div>
  );
}
