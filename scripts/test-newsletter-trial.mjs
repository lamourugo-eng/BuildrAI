/**
 * Tests manuels — logique essai newsletter 24 h + routes API (serveur local).
 * Usage : node scripts/test-newsletter-trial.mjs
 * Option : BASE_URL=http://localhost:3000 node scripts/test-newsletter-trial.mjs
 */

const TRIAL_MS = 24 * 60 * 60 * 1000;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function assert(condition, message) {
  if (!condition) {
    console.error('✗', message);
    process.exitCode = 1;
    return false;
  }
  console.log('✓', message);
  return true;
}

function isTrialWindowActive(profile) {
  if (!profile?.newsletter_opt_in || !profile?.trial_ends_at) return false;
  return new Date(profile.trial_ends_at).getTime() > Date.now();
}

function isTrialExpired(profile) {
  if (!profile?.trial_ends_at) return false;
  return new Date(profile.trial_ends_at).getTime() <= Date.now();
}

console.log('--- Logique essai 24 h ---');

const now = Date.now();
const activeProfile = {
  newsletter_opt_in: true,
  trial_ends_at: new Date(now + TRIAL_MS).toISOString(),
  trial_used: true,
};

assert(isTrialWindowActive(activeProfile), 'Essai actif quand trial_ends_at dans le futur');
assert(!isTrialExpired(activeProfile), 'Essai non expiré avant la fin');

const expiredProfile = {
  newsletter_opt_in: true,
  trial_ends_at: new Date(now - 1000).toISOString(),
  trial_used: true,
};

assert(!isTrialWindowActive(expiredProfile), 'Essai inactif après expiration');
assert(isTrialExpired(expiredProfile), 'Essai marqué expiré après trial_ends_at');

const durationHours = TRIAL_MS / 3_600_000;
assert(durationHours === 24, 'Durée essai = 24 heures');

console.log('\n--- Routes API (sans auth) ---');

async function testApiRoutes() {
  try {
    const trialPost = await fetch(`${BASE_URL}/api/user/newsletter-trial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newsletterOptIn: true }),
    });
    assert(trialPost.status === 401, `POST newsletter-trial sans login → 401 (reçu ${trialPost.status})`);

    const trialGet = await fetch(`${BASE_URL}/api/user/newsletter-trial`);
    assert(trialGet.status === 401, `GET newsletter-trial sans login → 401 (reçu ${trialGet.status})`);

    const syncPost = await fetch(`${BASE_URL}/api/subscription/sync-stripe`, { method: 'POST' });
    assert(syncPost.status === 401, `POST sync-stripe sans login → 401 (reçu ${syncPost.status})`);

    const home = await fetch(`${BASE_URL}/?landing=1`);
    assert(home.ok, `Landing accessible → ${home.status}`);
    const html = await home.text();
    assert(html.includes('id="newsletter"') || html.includes('24 h'), 'Landing contient la section newsletter');

    console.log('\nTous les tests exécutés.');
    if (process.exitCode) {
      console.log('\nCertains tests ont échoué.');
    } else {
      console.log('\nTous les tests sont passés.');
    }
  } catch (err) {
    console.error('\n⚠ Serveur non joignable sur', BASE_URL);
    console.error('  Lance `npm run dev` puis relancez ce script.');
    console.error('  Erreur:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}

void testApiRoutes();
