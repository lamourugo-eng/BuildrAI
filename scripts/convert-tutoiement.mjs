/**
 * Convertit le vouvoiement → tutoiement dans les chaînes UI (TS/TSX).
 * Exclut : templates email pros (business-library), legacy, node_modules, tests API.
 *
 * Usage : node scripts/convert-tutoiement.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(import.meta.dirname, '..');

const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  'legacy',
  '.git',
]);

const SKIP_FILES = new Set([
  'lib/auth/app-origin.ts',
  'scripts/test-coach-token-budget.mjs',
]);

/** Remplacements du plus spécifique au plus général */
const REPLACEMENTS = [
  // Impératifs / formules courantes
  ['Connectez-vous', 'Connecte-toi'],
  ['connectez-vous', 'connecte-toi'],
  ['Inscrivez-vous', 'Inscris-toi'],
  ['inscrivez-vous', 'inscris-toi'],
  ['Réinitialisez votre', 'Réinitialise ton'],
  ['Répondez à', 'Réponds à'],
  ['Répondez ', 'Réponds '],
  ['Commencez le', 'Commence le'],
  ['Commencez ', 'Commence '],
  ['Choisissez ', 'Choisis '],
  ['Créez ', 'Crée '],
  ['Passez à', 'Passe à'],
  ['Passez ', 'Passe '],
  ['Débloquez ', 'Débloque '],
  ['Complétez le', 'Complète le'],
  ['Complétez ', 'Complète '],
  ['Faites le', 'Fais le'],
  ['Faites la', 'Fais la'],
  ['Faites ', 'Fais '],
  ['Décrivez ', 'Décris '],
  ['Avancez ', 'Avance '],
  ['Poursuivez ', 'Poursuis '],
  ['Construisez ', 'Construis '],
  ['Inscrivez ', 'Inscris '],
  ['Validez ', 'Valide '],
  ['Définissez ', 'Définis '],
  ['Structurez ', 'Structure '],
  ['Testez ', 'Teste '],
  ['Recopiez ', 'Recopie '],
  ['Copiez ', 'Copie '],
  ['Mettez à jour', 'Mets à jour'],
  ['Mettez en', 'Mets en'],
  ['Utilisez ', 'Utilise '],
  ['Consultez ', 'Consulte '],
  ['Explorez ', 'Explore '],
  ['Découvrez ', 'Découvre '],
  ['Comparez ', 'Compare '],
  ['Gérez ', 'Gère '],
  ['Annulez ', 'Annule '],
  ['Confirmez ', 'Confirme '],
  ['Vérifiez ', 'Vérifie '],
  ['Personnalisez ', 'Personnalise '],
  ['Activez ', 'Active '],
  ['Démarrez ', 'Démarre '],
  ['Lancez ', 'Lance '],
  ['Rejoignez ', 'Rejoins '],
  ['Abonnez-vous', 'Abonne-toi'],
  ['abonnez-vous', 'abonne-toi'],
  ['Souscrivez', 'Souscris'],
  ['souscrivez', 'souscris'],
  ['Essayez ', 'Essaie '],
  ['Refaites ', 'Refais '],
  ['Retournez ', 'Retourne '],
  ['Cliquez ', 'Clique '],
  ['cliquez ', 'clique '],
  ['Sélectionnez ', 'Sélectionne '],
  ['Téléchargez ', 'Télécharge '],
  ['Partagez ', 'Partage '],
  ['Notez ', 'Note '],
  ['Sauvegardez ', 'Sauvegarde '],
  ['Importez ', 'Importe '],
  ['Exportez ', 'Exporte '],
  ['Relancez ', 'Relance '],
  ['Redéployez', 'Redéploie'],
  ['Redémarrez ', 'Redémarre '],

  // Phrases / pronoms
  ['Où vous en êtes', 'Où tu en es'],
  ['où vous en êtes', 'où tu en es'],
  ['ce que vous avez', 'ce que tu as'],
  ['Ce que vous avez', 'Ce que tu as'],
  ['quoi faire ensuite', 'quoi faire ensuite'],
  ['Comment pouvons-nous vous aider', 'Comment puis-je t\'aider'],
  ['pouvons-nous vous', 'puis-je te'],
  ['Je vous guide', 'Je te guide'],
  ['Je vous accompagne', 'Je t\'accompagne'],
  ['Je vous explique', 'Je t\'explique'],
  ['je vous explique', 'je t\'explique'],
  ['Je vous aide', 'Je t\'aide'],
  ['Content de vous revoir', 'Content de te revoir'],
  ['content de vous revoir', 'content de te revoir'],
  ['Ravi de vous revoir', 'Ravi de te revoir'],
  ['pour vous lancer', 'pour te lancer'],
  ['pour vous', 'pour toi'],
  ['Pour vous', 'Pour toi'],
  ['avec vous', 'avec toi'],
  ['chez vous', 'chez toi'],
  ['de vous', 'de toi'],
  ['à vous', 'à toi'],
  ['vous validez', 'tu valides'],
  ['Vous validez', 'Tu valides'],
  ['vous correspond', 'te correspond'],
  ['Vous correspond', 'Te correspond'],
  ['vous correspond le mieux', 'te correspond le mieux'],
  ['vous correspond le plus', 'te correspond le plus'],
  ['vous êtes', 'tu es'],
  ['Vous êtes', 'Tu es'],
  ['vous avez', 'tu as'],
  ['Vous avez', 'Tu as'],
  ['vous pouvez', 'tu peux'],
  ['Vous pouvez', 'Tu peux'],
  ['vous voulez', 'tu veux'],
  ['Vous voulez', 'Tu veux'],
  ['vous devez', 'tu dois'],
  ['vous allez', 'tu vas'],
  ['Vous allez', 'Tu vas'],
  ['vous recevrez', 'tu recevras'],
  ['Vous recevrez', 'Tu recevras'],
  ['vous obtiendrez', 'tu obtiendras'],
  ['Vous obtiendrez', 'Tu obtiendras'],
  ['vous trouverez', 'tu trouveras'],
  ['vous serez', 'tu seras'],
  ['vous restez', 'tu restes'],
  ['vous gardez', 'tu gardes'],
  ['vous changez', 'tu changes'],
  ['vous pourrez', 'tu pourras'],
  ['Vous pourrez', 'Tu pourras'],
  ['si vous ', 'si tu '],
  ['Si vous ', 'Si tu '],
  ['quand vous ', 'quand tu '],
  ['Quand vous ', 'Quand tu '],
  ['lorsque vous ', 'lorsque tu '],
  ['Lorsque vous ', 'Lorsque tu '],
  ['que vous ', 'que tu '],
  ['Que vous ', 'Que tu '],
  ['avant de vous', 'avant de te'],
  ['Après votre', 'Après ton'],
  ['après votre', 'après ton'],
  ['pendant votre', 'pendant ton'],
  ['Pendant votre', 'Pendant ton'],
  ['dans votre', 'dans ton'],
  ['Dans votre', 'Dans ton'],
  ['sur votre', 'sur ton'],
  ['Sur votre', 'Sur ton'],
  ['de votre', 'de ton'],
  ['De votre', 'De ton'],
  ['à votre', 'à ton'],
  ['À votre', 'À ton'],
  ['en fonction de votre', 'en fonction de ton'],
  ['adapté à votre', 'adapté à ton'],
  ['adaptés à votre', 'adaptés à ton'],
  ['adaptée à votre', 'adaptée à ton'],
  ['calibré sur votre', 'calibré sur ton'],
  ['calibrés sur votre', 'calibrés sur ton'],
  ['personnalisé pour votre', 'personnalisé pour ton'],
  ['personnalisés pour votre', 'personnalisés pour ton'],
  ['réservée à votre', 'réservée à ton'],
  ['réservé à votre', 'réservé à ton'],
  ['aligné sur votre', 'aligné sur ton'],
  ['alignée sur votre', 'alignée sur ton'],
  ['alignés sur vos', 'alignés sur tes'],
  ['synchronisé au jour J', 'synchronisé au jour J'],
  ['Vous pourrez changer', 'Tu pourras changer'],
  ['vous pourrez changer', 'tu pourras changer'],

  // votre/vos → ton/ta/tes (féminins courants d'abord)
  ['Votre formule actuelle', 'Ta formule actuelle'],
  ['votre formule actuelle', 'ta formule actuelle'],
  ['Votre formule Premium', 'Ta formule Premium'],
  ['votre formule Premium', 'ta formule Premium'],
  ['Votre formule et', 'Ta formule et'],
  ['votre formule et', 'ta formule et'],
  ['Votre formule', 'Ta formule'],
  ['votre formule', 'ta formule'],
  ['Votre profil entrepreneurial', 'Ton profil entrepreneurial'],
  ['votre profil entrepreneurial', 'ton profil entrepreneurial'],
  ['Votre profil', 'Ton profil'],
  ['votre profil', 'ton profil'],
  ['Votre espace', 'Ton espace'],
  ['votre espace', 'ton espace'],
  ['Votre parcours', 'Ton parcours'],
  ['votre parcours', 'ton parcours'],
  ['Votre plan', 'Ton plan'],
  ['votre plan', 'ton plan'],
  ['Votre projet', 'Ton projet'],
  ['votre projet', 'ton projet'],
  ['Votre modèle', 'Ton modèle'],
  ['votre modèle', 'ton modèle'],
  ['Votre idée', 'Ton idée'],
  ['votre idée', 'ton idée'],
  ['Votre avatar', 'Ton avatar'],
  ['votre avatar', 'ton avatar'],
  ['Votre progression', 'Ta progression'],
  ['votre progression', 'ta progression'],
  ['Votre empire', 'Ton empire'],
  ['votre empire', 'ton empire'],
  ['Votre ville', 'Ta ville'],
  ['votre ville', 'ta ville'],
  ['Votre offre', 'Ton offre'],
  ['votre offre', 'ton offre'],
  ['Votre page', 'Ta page'],
  ['votre page', 'ta page'],
  ['Votre site', 'Ton site'],
  ['votre site', 'ton site'],
  ['Votre bilan', 'Ton bilan'],
  ['votre bilan', 'ton bilan'],
  ['Votre coach', 'Ton coach'],
  ['votre coach', 'ton coach'],
  ['Votre aide', 'Ton aide'],
  ['votre aide', 'ton aide'],
  ['Votre compte', 'Ton compte'],
  ['votre compte', 'ton compte'],
  ['Votre budget', 'Ton budget'],
  ['votre budget', 'ton budget'],
  ['Votre business', 'Ton business'],
  ['votre business', 'ton business'],
  ['Votre activité', 'Ton activité'],
  ['votre activité', 'ton activité'],
  ['Votre direction', 'Ta direction'],
  ['votre direction', 'ta direction'],
  ['Votre transformation', 'Ta transformation'],
  ['votre transformation', 'ta transformation'],
  ['Votre prochaine', 'Ta prochaine'],
  ['votre prochaine', 'ta prochaine'],
  ['Votre choix', 'Ton choix'],
  ['votre choix', 'ton choix'],
  ['Votre cap', 'Ta direction'],
  ['votre cap', 'ta direction'],
  ['Votre façon', 'Ta façon'],
  ['votre façon', 'ta façon'],
  ['Votre contexte', 'Ton contexte'],
  ['votre contexte', 'ton contexte'],
  ['Votre message', 'Ton message'],
  ['votre message', 'ton message'],
  ['Votre mot de passe', 'Ton mot de passe'],
  ['votre mot de passe', 'ton mot de passe'],
  ['Votre email', 'Ton email'],
  ['votre email', 'ton email'],
  ['Votre abonnement', 'Ton abonnement'],
  ['votre abonnement', 'ton abonnement'],
  ['Votre inscription', 'Ton inscription'],
  ['votre inscription', 'ton inscription'],
  ['Votre première', 'Ta première'],
  ['votre première', 'ta première'],
  ['Votre semaine', 'Ta semaine'],
  ['votre semaine', 'ta semaine'],
  ['Vos idées', 'Tes idées'],
  ['vos idées', 'tes idées'],
  ['Vos notes', 'Tes notes'],
  ['vos notes', 'tes notes'],
  ['Vos clients', 'Tes clients'],
  ['vos clients', 'tes clients'],
  ['Vos prix', 'Tes prix'],
  ['vos prix', 'tes prix'],
  ['Vos premiers', 'Tes premiers'],
  ['vos premiers', 'tes premiers'],
  ['Vos retours', 'Tes retours'],
  ['vos retours', 'tes retours'],
  ['Vos contraintes', 'Tes contraintes'],
  ['vos contraintes', 'tes contraintes'],
  ['Vos questions', 'Tes questions'],
  ['vos questions', 'tes questions'],
  ['Vos résultats', 'Tes résultats'],
  ['vos résultats', 'tes résultats'],
  ['Vos données', 'Tes données'],
  ['vos données', 'tes données'],
  ['Vos réponses', 'Tes réponses'],
  ['vos réponses', 'tes réponses'],
  ['Vos objectifs', 'Tes objectifs'],
  ['vos objectifs', 'tes objectifs'],
  ['Vos actions', 'Tes actions'],
  ['vos actions', 'tes actions'],
  ['Vos échanges', 'Tes échanges'],
  ['vos échanges', 'tes échanges'],
  ['Vos points forts', 'Tes points forts'],
  ['vos points forts', 'tes points forts'],
  ['Vos CGU', 'Tes CGU'],
  ['vos CGU', 'tes CGU'],
  ['Vos ', 'Tes '],
  ['vos ', 'tes '],
  ['Votre ', 'Ton '],
  ['votre ', 'ton '],
  ['On vous propose', 'On te propose'],
  [' on vous ', ' on te '],
  [' vous ', ' tu '],
  ['Listez ', 'Liste '],
  ['Rédigez ', 'Rédige '],
  ['Détaillez ', 'Détaille '],
  ['Affichez ', 'Affiche '],
  ['Relisez ', 'Relis '],
  ['Intégrez ', 'Intègre '],
  ['Proposez ', 'Propose '],
  ['Justifiez ', 'Justifie '],
  ['Calculez ', 'Calcule '],
  ['Préparez ', 'Prépare '],
  ['Décidez ', 'Décide '],
  ['Écrivez ', 'Écris '],
  ['Placez ', 'Place '],
  ['Adaptez ', 'Adapte '],
  ['Précisez ', 'Précise '],
  ['Identifiez ', 'Identifie '],
  ['Ciblez ', 'Cible '],
  ['Formulez ', 'Formule '],
  ['Nommez ', 'Nomme '],
  ['Liez ', 'Lie '],
  ['Promettez ', 'Promets '],
  ['Chiffrez ', 'Chiffre '],
  ['Spécialisez ', 'Spécialise '],
  ['Ajoutez ', 'Ajoute '],
  ['Contactez ', 'Contacte '],
  ['Posez ', 'Pose '],
  ['Programmez ', 'Programme '],
  ['Enregistrez ', 'Enregistre '],
  ['Documentez ', 'Documente '],
  ['Analysez ', 'Analyse '],
  ['Comparez ', 'Compare '],
  ['Mesurez ', 'Mesure '],
  ['Publiez ', 'Publie '],
  ['Envoyez ', 'Envoie '],
  ['Planifiez ', 'Planifie '],
  ['Organisez ', 'Organise '],
  ['Standardisez ', 'Standardise '],
  ['Automatisez ', 'Automatise '],
  ['Déléguez ', 'Délègue '],
  ['Recrutez ', 'Recrute '],
  ['Testez ', 'Teste '],
  ['Lancez ', 'Lance '],
  ['Optimisez ', 'Optimise '],
  ['Réutilisez ', 'Réutilise '],
  ['Simplifiez ', 'Simplifie '],
  ['Priorisez ', 'Priorise '],
  ['Fixez ', 'Fixe '],
  ['Notez ', 'Note '],
  ['Répondez ', 'Réponds '],
  ['Partagez ', 'Partage '],
  ['Demandez ', 'Demande '],
  ['Suivez ', 'Suis '],
  ['Vérifiez ', 'Vérifie '],
  ['Affinez ', 'Affine '],
  ['Construisez ', 'Construis '],
  ['Définissez ', 'Définis '],
  ['Validez ', 'Valide '],
  ['Structurez ', 'Structure '],
  ['\nVous ', '\nTu '],
  ['. Vous ', '. Tu '],
  ['? Vous ', '? Tu '],
  ['! Vous ', '! Tu '],
];

/** Zones template email à ne pas convertir (l'utilisateur les envoie à ses prospects). */
function isEmailTemplateLine(line) {
  if (!line.includes('template:') && !line.includes('subject:') && !line.includes('body:')) {
    if (
      /Je vous propose|Bien à vous|Qu'avez-vous|Auriez-vous|Pourriez-vous|Seriez-vous|N'hésitez pas à me dire|cordialement/i.test(
        line
      ) &&
      line.trim().startsWith("'")
    ) {
      return true;
    }
  }
  return (
    line.includes('template:') ||
    line.includes('subject:') ||
    (line.includes('body:') && line.includes('vous'))
  );
}

function convertContent(content, relPath) {
  const skipEmailTemplates = relPath.replace(/\\/g, '/') === 'lib/resources/business-library.ts';
  const lines = content.split('\n');
  const out = lines.map((line) => {
    if (skipEmailTemplates && isEmailTemplateLine(line)) return line;
    let next = line;
    for (const [from, to] of REPLACEMENTS) {
      if (next.includes(from)) next = next.split(from).join(to);
    }
    return next;
  });
  return out.join('\n');
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(ROOT, full).replace(/\\/g, '/');
    if (SKIP_DIRS.has(name)) continue;
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, files);
    } else if (/\.(tsx?|mjs)$/.test(name) && !SKIP_FILES.has(rel)) {
      files.push(full);
    }
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  if (rel.startsWith('scripts/convert-tutoiement')) continue;
  const before = readFileSync(file, 'utf8');
  const after = convertContent(before, rel);
  if (after !== before) {
    writeFileSync(file, after, 'utf8');
    changed++;
    console.log('✓', rel);
  }
}

console.log(`\n${changed} fichier(s) mis à jour.`);
