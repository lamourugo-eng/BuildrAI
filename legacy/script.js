// Header scroll effect
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
});

// Mobile menu
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

menuToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close mobile menu on link click
document.querySelectorAll('.nav-menu a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// Close mobile menu when resizing to desktop
window.addEventListener('resize', () => {
  if (window.innerWidth > 768 && nav.classList.contains('open')) {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
});

// Pricing toggle
const toggleSwitch = document.querySelector('.toggle-switch');
const toggleLabels = document.querySelectorAll('.toggle-label');
const amounts = document.querySelectorAll('.amount');
let isYearly = false;

toggleSwitch.addEventListener('click', () => {
  isYearly = !isYearly;
  toggleSwitch.classList.toggle('yearly', isYearly);

  toggleLabels.forEach(label => {
    label.classList.toggle('active', label.dataset.period === (isYearly ? 'yearly' : 'monthly'));
  });

  amounts.forEach(el => {
    el.textContent = isYearly ? el.dataset.yearly : el.dataset.monthly;
  });
});

// CTA form
document.getElementById('cta-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const email = input.value.trim();
  if (email) {
    input.value = '';
    input.placeholder = 'Merci ! Vérifiez votre boîte mail ✓';
    setTimeout(() => {
      input.placeholder = 'votre@email.com';
    }, 3000);
  }
});

// Intersection observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.feature-card, .price-card, .step').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ===== Personality Quiz =====
const businessProfiles = {
  saas: {
    id: 'saas',
    name: 'SaaS B2B',
    icon: '💻',
    description: 'Vous vendez un logiciel par abonnement à d\'autres entreprises. Revenus réguliers, possibilité de grandir vite.',
    traits: ['Réfléchi', 'Produit', 'Abonnement', 'Équipe'],
    examples: 'Notion, Slack, Pennylane',
    strengths: ['Revenus chaque mois, prévisibles', 'Peut grandir sans limite de lieu', 'Très intéressant pour les investisseurs'],
    challenges: ['Parfois long pour convaincre une entreprise', 'Il faut une bonne équipe technique', 'Beaucoup de concurrence'],
    firstSteps: ['Trouver un vrai problème que les entreprises paient pour résoudre', 'Faire une première version simple pour un petit marché', 'Avoir 5 à 10 clients payants avant de grandir'],
    metrics: { cost: 'Moyen', revenue: '3-6 mois', scale: 'Très forte', autonomy: 'Équipe' },
    whyMatch: 'Vous aimez réfléchir, structurer et construire un produit avec des revenus réguliers.'
  },
  freelance: {
    id: 'freelance',
    name: 'Freelance',
    icon: '🎯',
    description: 'Vous vendez votre savoir-faire seul. Peu de frais au départ, beaucoup de liberté.',
    traits: ['Libre', 'Expert', 'Souple', 'Solo'],
    examples: 'Consultant, designer, développeur',
    strengths: ['On peut commencer tout de suite', 'Vous décidez de tout', 'Plus vous travaillez, plus vous gagnez'],
    challenges: ['Revenus limités par votre temps', 'Il faut trouver des clients seul', 'Parfois des mois plus difficiles'],
    firstSteps: ['Expliquer votre offre en une phrase', 'Avoir une page LinkedIn ou un portfolio', 'Trouver 3 premiers clients dans votre entourage'],
    metrics: { cost: 'Très faible', revenue: '1-2 mois', scale: 'Moyenne', autonomy: 'Totale' },
    whyMatch: 'Vous voulez être libre et avancer à votre rythme, avec votre expertise.'
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce',
    icon: '🛍️',
    description: 'Vous vendez des produits directement aux clients sur internet. Créatif, rapide à tester.',
    traits: ['Créatif', 'Vente', 'Rapide', 'Marque'],
    examples: 'Mode, cosmétiques, produits de niche',
    strengths: ['On teste vite une idée produit', 'Une belle histoire de marque aide beaucoup', 'Contact direct avec le client'],
    challenges: ['Stock et livraison à gérer', 'Coût pour trouver des clients', 'Concurrence sur les grandes plateformes'],
    firstSteps: ['Choisir un produit ou une niche qui vous passionne', 'Lancer une précommande ou une petite collection', 'Soigner la marque et les réseaux sociaux'],
    metrics: { cost: 'Moyen', revenue: '2-4 mois', scale: 'Forte', autonomy: 'Souple' },
    whyMatch: 'Vous êtes créatif et vous aimez aller vite pour lancer une marque.'
  },
  agency: {
    id: 'agency',
    name: 'Agence',
    icon: '🤝',
    description: 'Vous aidez des clients sur des projets (web, marketing, RH…). Le bouche-à-oreille compte beaucoup.',
    traits: ['Contact', 'Équipe', 'Vente', 'Projets'],
    examples: 'Agence web, marketing, RH',
    strengths: ['Premier euro dès la première mission', 'On grandit grâce à la réputation', 'Le relationnel est votre force'],
    challenges: ['Dépendance aux clients', 'Moins de marge si mal organisé', 'Difficile de grandir sans embaucher'],
    firstSteps: ['Se spécialiser sur un type de client ou de service', 'Signer 2-3 premiers clients à prix doux', 'Noter comment vous travaillez pour grandir plus tard'],
    metrics: { cost: 'Faible', revenue: '1-3 mois', scale: 'Moyenne', autonomy: 'Équipe' },
    whyMatch: 'Vous aimez les gens et travailler en équipe sur des projets concrets.'
  },
  marketplace: {
    id: 'marketplace',
    name: 'Marketplace',
    icon: '🌐',
    description: 'Vous mettez en contact ceux qui offrent et ceux qui cherchent (comme Airbnb). Gros potentiel, plus difficile au début.',
    traits: ['Réseau', 'Grandir', 'Audace', 'Plateforme'],
    examples: 'Airbnb, Etsy, Doctolib',
    strengths: ['Plus il y a d\'utilisateurs, plus c\'est utile', 'Peut devenir très grand', 'Tout le monde y gagne'],
    challenges: ['Au début : peu d\'offre ou peu de demande', 'Souvent cher à lancer', 'Il faut inspirer confiance'],
    firstSteps: ['Commencer par un seul côté (offre ou demande)', 'Lancer dans une ville ou un petit marché', 'Avis, paiements sécurisés, garanties'],
    metrics: { cost: 'Élevé', revenue: '6-12 mois', scale: 'Exceptionnelle', autonomy: 'Réseau' },
    whyMatch: 'Vous êtes audacieux et vous aimez connecter les gens.'
  },
  impact: {
    id: 'impact',
    name: 'Impact / social',
    icon: '🌱',
    description: 'Votre entreprise aide la société ou la planète, tout en gagnant de l\'argent.',
    traits: ['Mission', 'Utile', 'Communauté', 'Sens'],
    examples: 'Recyclage, inclusion, éducation',
    strengths: ['Motivation très forte', 'Clients fidèles qui partagent vos valeurs', 'Aides et fonds dédiés existent'],
    challenges: ['Trouver le bon équilibre impact / rentabilité', 'Bien expliquer votre mission', 'Parfois plus lent au départ'],
    firstSteps: ['Définir clairement l\'impact que vous voulez avoir', 'Vérifier que les clients paient pour le produit ET la cause', 'Rejoindre un réseau d\'entrepreneurs engagés'],
    metrics: { cost: 'Variable', revenue: '3-6 mois', scale: 'Forte', autonomy: 'Mission' },
    whyMatch: 'Ce qui compte pour vous, c\'est d\'avoir un impact positif.'
  },
  consulting: {
    id: 'consulting',
    name: 'Consulting',
    icon: '📊',
    description: 'Vous conseillez des entreprises sur la stratégie, la finance ou l\'organisation. Peu de risque, bonnes marges.',
    traits: ['Expert', 'Méthode', 'Confiance', 'Précis'],
    examples: 'Stratégie, finance, organisation',
    strengths: ['Bonnes marges dès le début', 'Pas besoin de créer un produit', 'La confiance protège votre activité'],
    challenges: ['Il faut se faire connaître', 'Dur de déléguer au début', 'Revenus limités sans autre offre'],
    firstSteps: ['Proposer 2-3 offres claires', 'Publier des conseils sur LinkedIn ou un blog', 'Transformer votre réseau en clients'],
    metrics: { cost: 'Très faible', revenue: '1-2 mois', scale: 'Moyenne', autonomy: 'Forte' },
    whyMatch: 'Vous êtes rigoureux et prudent — le conseil vous va bien.'
  },
  content: {
    id: 'content',
    name: 'Creator / média',
    icon: '🎬',
    description: 'Vous gagnez de l\'argent avec une audience : vidéos, newsletter, formations, partenariats.',
    traits: ['Créatif', 'Audience', 'Histoire', 'Solo'],
    examples: 'YouTube, newsletter, podcast, cours en ligne',
    strengths: ['Peu cher pour commencer', 'L\'audience grandit avec le temps', 'Plusieurs façons de gagner de l\'argent'],
    challenges: ['L\'argent arrive souvent après 6-12 mois', 'Il faut publier régulièrement', 'La visibilité change souvent'],
    firstSteps: ['Choisir une plateforme et un sujet précis', 'Publier 20 contenus avant de juger', 'Créer une newsletter pour garder votre audience'],
    metrics: { cost: 'Très faible', revenue: '4-8 mois', scale: 'Forte', autonomy: 'Totale' },
    whyMatch: 'Vous êtes créatif et vous aimez vous exprimer devant un public.'
  }
};

const dimensionLabels = [
  { key: 'risk', label: 'Rapport au risque', values: ['J\'ose', 'Équilibré', 'Prudent'] },
  { key: 'work', label: 'Façon de travailler', values: ['Seul', 'Équipe', 'Réseau'] },
  { key: 'motivation', label: 'Ce qui vous motive', values: ['Créer', 'Résoudre', 'Aider'] },
  { key: 'pace', label: 'Votre rythme', values: ['Rapide', 'Étape par étape', 'Souple'] },
  { key: 'strength', label: 'Votre force', values: ['Contact & vente', 'Technique', 'Créatif'] },
  { key: 'model', label: 'Type de revenus', values: ['Chaque mois', 'Par mission', 'En volume'] }
];

const quizQuestions = [
  {
    question: 'Face au risque, vous êtes plutôt…',
    options: [
      { icon: '🚀', label: 'J\'ose beaucoup', desc: 'J\'aime viser grand et tenter des choses nouvelles', scores: { marketplace: 3, ecommerce: 2, saas: 1 } },
      { icon: '⚖️', label: 'Équilibré', desc: 'Je réfléchis avant de me lancer', scores: { saas: 2, agency: 2, consulting: 1 } },
      { icon: '🛡️', label: 'Prudent', desc: 'J\'avance petit à petit, sans tout risquer', scores: { consulting: 3, freelance: 2, content: 1 } }
    ]
  },
  {
    question: 'Vous préférez travailler…',
    options: [
      { icon: '🧘', label: 'Seul', desc: 'Je décide de tout moi-même', scores: { freelance: 3, content: 2, consulting: 1 } },
      { icon: '👥', label: 'En petite équipe', desc: 'Avec quelques personnes de confiance', scores: { saas: 2, agency: 3, impact: 1 } },
      { icon: '🌍', label: 'En reliant des gens', desc: 'J\'aime mettre les bonnes personnes en contact', scores: { marketplace: 3, agency: 1, impact: 2 } }
    ]
  },
  {
    question: 'Ce qui vous motive le plus…',
    options: [
      { icon: '💡', label: 'Créer du nouveau', desc: 'Imaginer des produits ou des expériences', scores: { ecommerce: 2, content: 2, saas: 2 } },
      { icon: '🔧', label: 'Résoudre un problème', desc: 'Apporter des solutions concrètes', scores: { saas: 3, consulting: 2, agency: 1 } },
      { icon: '❤️', label: 'Aider / faire du bien', desc: 'Contribuer à un monde meilleur', scores: { impact: 3, content: 1, agency: 1 } }
    ]
  },
  {
    question: 'Votre rythme idéal…',
    options: [
      { icon: '⚡', label: 'Rapide', desc: 'Tester vite, corriger, avancer', scores: { ecommerce: 3, marketplace: 2, content: 1 } },
      { icon: '📈', label: 'Étape par étape', desc: 'Construire sur le long terme, bien organisé', scores: { saas: 3, consulting: 2, agency: 1 } },
      { icon: '🎨', label: 'Souple', desc: 'M\'adapter selon l\'envie et l\'inspiration', scores: { content: 3, freelance: 2, impact: 1 } }
    ]
  },
  {
    question: 'Votre plus grande force…',
    options: [
      { icon: '🗣️', label: 'Contact & vente', desc: 'Convaincre, négocier, créer des liens', scores: { agency: 3, marketplace: 2, consulting: 1 } },
      { icon: '⚙️', label: 'Technique', desc: 'Construire, améliorer, automatiser', scores: { saas: 3, ecommerce: 1, freelance: 1 } },
      { icon: '✍️', label: 'Créatif', desc: 'Raconter, dessiner, inspirer', scores: { content: 3, ecommerce: 2, impact: 1 } }
    ]
  },
  {
    question: 'Pour gagner de l\'argent, vous préférez…',
    options: [
      { icon: '🔄', label: 'Chaque mois (abonnement)', desc: 'Des revenus réguliers et prévisibles', scores: { saas: 3, content: 1, agency: 1 } },
      { icon: '💼', label: 'Par mission ou projet', desc: 'Facturer au temps ou à la prestation', scores: { freelance: 3, consulting: 2, agency: 2 } },
      { icon: '📦', label: 'En vendant beaucoup', desc: 'Beaucoup de ventes ou beaucoup d\'utilisateurs', scores: { ecommerce: 2, marketplace: 3, saas: 1 } }
    ]
  }
];

const profileLabels = {
  pioneer: {
    label: 'Aventurier',
    desc: 'Vous visez grand, vous osez et vous n\'avez pas peur de l\'inconnu.',
    traits: ['Visionnaire', 'Ambitieux', 'Tenace', 'Veut grandir']
  },
  builder: {
    label: 'Bâtisseur organisé',
    desc: 'Vous avancez avec méthode et vous pensez long terme.',
    traits: ['Réfléchi', 'Organisé', 'Patient', 'Orienté produit']
  },
  artisan: {
    label: 'Indépendant expert',
    desc: 'Vous travaillez bien seul et vous misez sur votre savoir-faire.',
    traits: ['Libre', 'Expert', 'Pratique', 'Souple']
  },
  connector: {
    label: 'Façonnier de liens',
    desc: 'Votre force : rassembler les bonnes personnes et créer des opportunités.',
    traits: ['À l\'écoute', 'Sociable', 'Bon négociateur', 'Esprit d\'équipe']
  },
  creator: {
    label: 'Créateur',
    desc: 'Votre énergie vient de la création, des idées et de votre image.',
    traits: ['Créatif', 'Expressif', 'Intuitif', 'Proche du public']
  },
  changemaker: {
    label: 'Engagé',
    desc: 'Vous entreprenez surtout pour avoir un impact positif et du sens.',
    traits: ['Engagé', 'À l\'écoute', 'Visionnaire', 'Guidé par une mission']
  }
};

let quizStep = 0;
let quizAnswers = [];

const quizIntro = document.getElementById('quiz-intro');
const quizQuestionsPanel = document.getElementById('quiz-questions');
const quizResultPanel = document.getElementById('quiz-result');
const quizProgressFill = document.getElementById('quiz-progress-fill');
const quizStepEl = document.getElementById('quiz-step');
const quizQuestionTitle = document.getElementById('quiz-question-title');
const quizOptionsEl = document.getElementById('quiz-options');
const quizBackBtn = document.getElementById('quiz-back');
const quizResultsGrid = document.getElementById('quiz-results-grid');
const quizProfileSummary = document.getElementById('quiz-profile-summary');
const quizDimensions = document.getElementById('quiz-dimensions');
const quizContainer = document.querySelector('.quiz-container');

function showQuizPanel(panel) {
  [quizIntro, quizQuestionsPanel, quizResultPanel].forEach(p => p.classList.add('hidden'));
  panel.classList.remove('hidden');
}

function renderQuestion() {
  const q = quizQuestions[quizStep];
  const progress = ((quizStep + 1) / quizQuestions.length) * 100;

  quizProgressFill.style.width = `${progress}%`;
  quizStepEl.textContent = `Question ${quizStep + 1} / ${quizQuestions.length}`;
  quizQuestionTitle.textContent = q.question;
  quizBackBtn.classList.toggle('hidden', quizStep === 0);

  quizOptionsEl.innerHTML = q.options.map((opt, i) => `
    <button type="button" class="quiz-option" data-index="${i}">
      <span class="quiz-option-icon">${opt.icon}</span>
      <span class="quiz-option-text">
        <strong>${opt.label}</strong>
        <span>${opt.desc}</span>
      </span>
    </button>
  `).join('');

  quizOptionsEl.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => selectAnswer(parseInt(btn.dataset.index, 10)));
  });
}

function selectAnswer(optionIndex) {
  quizAnswers[quizStep] = optionIndex;

  if (quizStep < quizQuestions.length - 1) {
    quizStep++;
    renderQuestion();
  } else {
    showResults();
  }
}

function calculateScores() {
  const scores = {};
  Object.keys(businessProfiles).forEach(key => { scores[key] = 0; });

  quizAnswers.forEach((answerIndex, qIndex) => {
    const option = quizQuestions[qIndex].options[answerIndex];
    if (option?.scores) {
      Object.entries(option.scores).forEach(([biz, pts]) => {
        scores[biz] = (scores[biz] || 0) + pts;
      });
    }
  });

  const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({ id, score }));

  return applyCompatibilityPercents(ranked);
}

function applyCompatibilityPercents(ranked) {
  const topScore = ranked[0].score || 1;
  const secondScore = ranked[1]?.score || 0;
  const dominance = topScore - secondScore;

  return ranked.map((item, index) => {
    let percent;
    const ratio = item.score / topScore;

    if (index === 0) {
      percent = Math.min(97, Math.max(91, 92 + dominance * 1.2 + (item.score >= 12 ? 3 : 0)));
    } else if (index === 1) {
      percent = Math.min(90, Math.max(84, Math.round(84 + ratio * 8 + dominance * 0.3)));
    } else if (index === 2) {
      percent = Math.min(86, Math.max(78, Math.round(78 + ratio * 10)));
    } else {
      percent = Math.max(68, Math.round(65 + ratio * 18));
    }

    return { ...item, percent: Math.round(percent) };
  });
}

function getAlignmentReasons(businessId) {
  const reasons = [];
  quizAnswers.forEach((answerIndex, qIndex) => {
    const option = quizQuestions[qIndex].options[answerIndex];
    const pts = option?.scores?.[businessId] || 0;
    if (pts >= 2) {
      reasons.push(`${dimensionLabels[qIndex].label} : ${option.label}`);
    }
  });
  return reasons.slice(0, 4);
}

function renderDimensions() {
  quizDimensions.innerHTML = dimensionLabels.map((dim, i) => {
    const answerIdx = quizAnswers[i] ?? 1;
    const intensity = answerIdx === 0 ? 85 : answerIdx === 1 ? 65 : 45;
    return `
      <div class="quiz-dimension">
        <div class="quiz-dimension-header">
          <span class="quiz-dimension-label">${dim.label}</span>
          <span class="quiz-dimension-value">${dim.values[answerIdx]}</span>
        </div>
        <div class="quiz-dimension-bar">
          <div class="quiz-dimension-fill" style="width: ${intensity}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderProfileSummary(topId, personality) {
  quizProfileSummary.innerHTML = `
    <span class="quiz-result-badge">Votre profil principal</span>
    <h3>${personality.label}</h3>
    <p class="profile-type">Très proche de : ${businessProfiles[topId].name}</p>
    <p class="profile-desc">${personality.desc}</p>
    <div class="quiz-profile-traits">
      ${personality.traits.map(t => `<span>${t}</span>`).join('')}
    </div>
  `;
}

function renderBusinessCard(item, rank) {
  const profile = businessProfiles[item.id];
  const isPrimary = rank === 0;
  const badges = ['Choix n°1 — Le plus adapté', 'Choix n°2 — Très bon match', 'Choix n°3 — À regarder aussi'];
  const alignments = getAlignmentReasons(item.id);
  const whyText = alignments.length
    ? `Ça vous va car : ${alignments.join(', ').toLowerCase()}. ${profile.whyMatch}`
    : profile.whyMatch;

  return `
    <article class="quiz-result-card ${isPrimary ? 'primary' : ''}">
      <span class="quiz-result-badge">${badges[rank]}</span>
      <div class="quiz-result-header">
        <h3>${profile.icon} ${profile.name}</h3>
        <div class="quiz-match-ring" style="--pct: ${item.percent}">
          <span>${item.percent}%</span>
        </div>
      </div>
      <div class="match-score">Compatibilité ${item.percent}% — ${item.percent >= 90 ? 'Très bon match' : item.percent >= 84 ? 'Bon match' : 'Match correct'}</div>
      <p class="quiz-why-you">${whyText}</p>
      <p>${profile.description}</p>
      <div class="quiz-result-metrics">
        <div class="quiz-metric"><strong>Argent au départ</strong><span>${profile.metrics.cost}</span></div>
        <div class="quiz-metric"><strong>Premiers revenus</strong><span>${profile.metrics.revenue}</span></div>
        <div class="quiz-metric"><strong>Potentiel de croissance</strong><span>${profile.metrics.scale}</span></div>
        <div class="quiz-metric"><strong>Liberté</strong><span>${profile.metrics.autonomy}</span></div>
      </div>
      <div class="quiz-result-tags">
        ${profile.traits.map(t => `<span>${t}</span>`).join('')}
        <span>Ex. ${profile.examples}</span>
      </div>
      <div class="quiz-result-section strengths">
        <h4>Vos points forts ici</h4>
        <ul>${profile.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div class="quiz-result-section challenges">
        <h4>À surveiller</h4>
        <ul>${profile.challenges.map(c => `<li>${c}</li>`).join('')}</ul>
      </div>
      <div class="quiz-result-section steps">
        <h4>Par où commencer</h4>
        <ul>${profile.firstSteps.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
    </article>
  `;
}

function getPersonalityType(topBusiness) {
  const map = {
    marketplace: 'pioneer',
    ecommerce: 'creator',
    saas: 'builder',
    agency: 'connector',
    freelance: 'artisan',
    consulting: 'builder',
    content: 'creator',
    impact: 'changemaker'
  };
  return profileLabels[map[topBusiness]] || profileLabels.builder;
}

function showResults() {
  const ranked = calculateScores();
  const top3 = ranked.slice(0, 3);
  const personality = getPersonalityType(top3[0].id);

  quizContainer.classList.add('quiz-result-view');
  renderProfileSummary(top3[0].id, personality);
  renderDimensions();
  quizResultsGrid.innerHTML = top3.map((item, i) => renderBusinessCard(item, i)).join('');

  showQuizPanel(quizResultPanel);
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function openSite() {
  document.body.classList.remove('quiz-active');
  document.body.classList.add('quiz-done');
  document.body.style.overflow = '';
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function openQuiz() {
  document.body.classList.add('quiz-active');
  document.body.classList.remove('quiz-done');
  document.body.style.overflow = '';
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  quizContainer.classList.remove('quiz-result-view');
  quizStep = 0;
  quizAnswers = [];
  showQuizPanel(quizIntro);
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function restartQuiz() {
  quizStep = 0;
  quizAnswers = [];
  showQuizPanel(quizQuestionsPanel);
  renderQuestion();
}

document.getElementById('quiz-start').addEventListener('click', () => {
  showQuizPanel(quizQuestionsPanel);
  renderQuestion();
});

document.getElementById('quiz-skip').addEventListener('click', openSite);
document.getElementById('quiz-explore').addEventListener('click', openSite);
document.getElementById('quiz-restart').addEventListener('click', restartQuiz);
document.getElementById('nav-quiz').addEventListener('click', (e) => {
  e.preventDefault();
  openQuiz();
});

const heroQuizCta = document.getElementById('hero-quiz-cta');
if (heroQuizCta) {
  heroQuizCta.addEventListener('click', (e) => {
    e.preventDefault();
    openQuiz();
  });
}

document.getElementById('quiz-cta-coach').addEventListener('click', () => {
  openSite();
});

quizBackBtn.addEventListener('click', () => {
  if (quizStep > 0) {
    quizStep--;
    renderQuestion();
  }
});
