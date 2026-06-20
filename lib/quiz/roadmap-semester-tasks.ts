import type { BusinessId } from '@/lib/quiz/data';
import type { MarketSegment } from '@/lib/quiz/market-segment';
import { businessUsesMarketSegment } from '@/lib/quiz/market-segment';
import { applyMarketSegmentToTasks } from '@/lib/quiz/market-segment-tasks';
import {
  pickWeeklyEnrichmentTask,
  TITLE_TASK_OVERLAYS,
  adaptGenericTasksToBusiness,
} from '@/lib/quiz/roadmap-business-overlays';
import {
  buildDenseDailyTasks,
  buildLegalExitTasks,
  resolveSpecialDayKey,
} from '@/lib/quiz/roadmap-legal-exit';

/** Tâches explicites pour les jours à titre fixe (mois 2–6). Clés = titre de base (avant overlay affichage). */
const TITLE_TASKS: Record<string, string[]> = {
  'Audit du premier mois': [
    'Liste tout ce que tu as lancé (page, offre, contacts, ventes)',
    'Classe chaque action : à garder / à améliorer / à abandonner',
    'Note ton KPI #1 du mois 1 (ventes, essais, RDV…)',
  ],
  'Ce qui a converti': [
    'Identifie le canal ou message qui a généré le plus de réponses positives',
    'Recopie le script ou contenu gagnant. Versionnez-le',
    'Planifie 3 répétitions de cette action cette semaine',
  ],
  'Ce qui a bloqué': [
    'Liste les 3 freins principaux (peur, temps, offre, technique…)',
    'Pour chaque frein : 1 micro-action de contournement demain',
    'Demande un retour externe sur le blocage #1',
  ],
  'Chiffre du pipeline': [
    'Comptez prospects chauds / tièdes / froids dans un tableau simple',
    'Estime la valeur totale du pipeline sur 30 jours',
    'Identifie les 5 dossiers à closer en priorité',
  ],
  'Nettoyer la liste prospects': [
    'Archive les contacts sans réponse depuis 30+ jours',
    'Requalifie chaque prospect restant : chaud / tiède / mort',
    'Garde uniquement les contacts avec prochaine action datée',
  ],
  'Relances personnalisées': [
    'Relance 5 prospects tièdes avec un angle nouveau (cas, insight, offre)',
    'Personnalise chaque message. Pas de copier-coller générique',
    'Planifie relance J+7 pour ceux sans réponse',
  ],
  'Script de relance J+7': [
    'Rédige un script J+7 en 3 parties : rappel contexte, valeur ajoutée, CTA',
    'Teste le script sur 3 prospects tièdes aujourd\'hui',
    'Note taux de réponse et ajuste l\'accroche',
  ],
  'Cartographier le parcours client': [
    'Dessine les étapes : découverte → achat → livraison → fidélisation',
    'Identifie où le client attend ou se perd',
    'Note 1 amélioration par étape (même petite)',
  ],
  'Point de friction n°1': [
    'Choisis la friction la plus fréquente (lenteur, doute, prix, technique…)',
    'Demande 2 retours clients ou prospects sur ce point précis',
    'Propose 1 correctif testable cette semaine',
  ],
  'Réponse aux objections récurrentes': [
    'Liste les 5 objections les plus entendues',
    'Rédige une réponse courte + preuve pour chacune',
    'Intègre-les dans ton script de vente ou ta FAQ',
  ],
  'Mini FAQ client': [
    'Note les 8 questions les plus posées par tes prospects',
    'Rédige des réponses claires (2–4 phrases chacune)',
    'Publie la FAQ sur ta page ou dans ton process de vente',
  ],
  'Email de suivi post-vente': [
    'Rédige un email J+1 après achat : remerciement + prochaine étape',
    'Inclus 1 ressource utile et 1 moyen de te contacter',
    'Programme l\'envoi ou crée un template réutilisable',
  ],
  'Demande d\'avis ou témoignage': [
    'Contacte 3 clients satisfaits avec une demande d\'avis précise',
    'Propose un format simple (2 phrases + note /5)',
    'Planifie où publier chaque témoignage reçu',
  ],
  'Ajuster prix ou packaging': [
    'Compare ton offre actuelle à 2 concurrents (prix + contenu)',
    'Teste 1 variation (palier, bonus ou essai) sur 3 prospects',
    'Note les réactions et décide garder / ajuster / annuler',
  ],
  'Test upsell léger': [
    'Identifie 1 complément logique à ton offre principale',
    'Propose-le à 3 clients existants avec un prix d\'introduction',
    'Mesure taux d\'acceptation et marge de l\'upsell',
  ],
  'Bundle ou option premium': [
    'Conçois un pack premium (offre de base + 1–2 extras)',
    'Fixe un prix bundle avec marge supérieure à l\'offre seule',
    'Teste le bundle auprès de 2 clients ou prospects chauds',
  ],
  'Documenter ton process de vente': [
    'Liste les étapes de ton cycle de vente de A à Z',
    'Pour chaque étape : objectif, durée, outil, livrable',
    'Identifie l\'étape où tu perds le plus de prospects',
  ],
  'Checklist livraison': [
    'Documente chaque étape de livraison client type',
    'Crée une checklist cochable réutilisable',
    'Teste-la sur la prochaine mission ou commande',
  ],
  'Modèle de proposition': [
    'Structure : contexte client → méthode → livrables → délais → prix',
    'Rédige un modèle à 80 % réutilisable',
    'Personnalise-le pour 1 prospect réel aujourd\'hui',
  ],
  'Choisir 1 canal à doubler': [
    'Compare tes 3 canaux par taux de réponse et coût',
    'Choisis 1 seul canal à intensifier ce mois',
    'Fixe un objectif chiffré (messages, posts, RDV…) sur 7 jours',
  ],
  'Plan contenu ou prospection 7j': [
    'Planifie 7 actions concrètes (1 par jour) sur ton canal prioritaire',
    'Prépare les contenus ou messages à l\'avance quand possible',
    'Bloque les créneaux dans ton agenda',
  ],
  'Automatiser 1 tâche répétitive': [
    'Choisis la tâche répétitive la plus chronophage',
    'Décide : outil no-code, template ou délégation',
    'Mets en place la version 1 aujourd\'hui (pas la version parfaite)',
  ],
  'Mesurer coût d\'acquisition': [
    'CAC = dépenses acquisition ÷ nouveaux clients ou essais',
    'Compare CAC par canal sur les 30 derniers jours',
    'Fixe un plafond CAC acceptable vs marge ou LTV estimée',
  ],
  'Objectif CA mois 2': [
    'Fixe un chiffre CA ou clients cible pour le mois',
    'Décompose en objectif hebdomadaire puis quotidien',
    'Identifie l\'action #1 qui soutient cet objectif demain',
  ],
  'Rituels hebdo (30 min)': [
    'Définis un créneau fixe chaque semaine pour piloter ton business',
    'Liste 4 questions à te poser à chaque rituel (pipeline, CA, blocages…)',
    'Bloque le créneau dans l\'agenda des 4 prochaines semaines',
  ],
  'Préparer le mois 3': [
    'Relis les bilans des semaines précédentes',
    'Choisis 3 actions non négociables pour le mois suivant',
    'Bloque les créneaux récurrents dans l\'agenda',
  ],
  'Audit canal #1': [
    'Exporte ou note les stats de ton meilleur canal (30 derniers jours)',
    'Calcule taux de réponse ou conversion approximatif',
    'Fixe un objectif chifré +20 % sur ce canal ce mois',
  ],
  'Objectif contacts semaine': [
    'Fixe un quota de contacts qualifiés pour la semaine',
    'Décompose en objectif par jour ouvré',
    'Prépare ta liste de cibles avant de commencer',
  ],
  '10 nouveaux messages': [
    'Envoie 10 messages outbound qualifiés aujourd\'hui',
    'Varie accroche et CTA sur 2 versions',
    'Note heure d\'envoi et taux de réponse en fin de journée',
  ],
  'Variante A/B message': [
    'Rédige 2 versions d\'accroche pour le même CTA',
    'Envoie chaque version à 5 prospects similaires',
    'Garde la version avec le meilleur taux de réponse',
  ],
  'Suivi des taux de réponse': [
    'Note taux de réponse par canal et par script cette semaine',
    'Identifie le message ou canal le plus performant',
    'Coupe ou pause ce qui performe sous 5 %',
  ],
  'Ajuster le script': [
    'Relis les objections reçues cette semaine',
    'Modifie ton script pour adresser les 2 objections principales',
    'Teste la nouvelle version sur 5 envois',
  ],
  'Publier ou partager 1 contenu utile': [
    'Produis 1 contenu utile pour ta cible (post, email, vidéo courte)',
    'Inclus un CTA clair vers ton offre',
    'Publie et note vues / clics / réponses',
  ],
  'Recycler un témoignage': [
    'Choisis 1 témoignage client existant',
    'Transforme-le en post, email ou visuel',
    'Publie avec un CTA vers ton offre',
  ],
  'Post ou email valeur': [
    'Rédige un contenu qui résout 1 problème précis de ta cible',
    'Structure : accroche → conseil actionnable → CTA',
    'Publie ou envoie à ta liste',
  ],
  'Répondre aux commentaires / DM': [
    'Réponds à tous les commentaires et DM en attente',
    'Propose 1 next step (RDV, ressource, offre) dans chaque réponse chaude',
    'Note les questions récurrentes pour ta FAQ',
  ],
  'Liste 5 idées contenu': [
    'Liste 5 sujets que ta cible cherche vraiment',
    'Pour chaque sujet : angle + format (post, email, vidéo)',
    'Priorise celui avec le plus fort potentiel conversion',
  ],
  'Calendrier éditorial 2 sem.': [
    'Planifie 6–8 contenus sur 2 semaines (dates + sujets + format)',
    'Prépare au moins 2 contenus à l\'avance',
    'Bloque les créneaux de création dans l\'agenda',
  ],
  'Lister 10 partenaires possibles': [
    'Liste 10 acteurs complémentaires (même audience, offre différente)',
    'Note pour chacun : audience, proposition de valeur, contact possible',
    'Priorise 3 partenaires les plus alignés',
  ],
  '3 messages partenariat': [
    'Rédige 3 messages de prise de contact partenariat personnalisés',
    'Propose un win-win concret en 5 lignes',
    'Envoie-les aujourd\'hui',
  ],
  'Proposition win-win': [
    'Formalise ta proposition partenariat : bénéfice pour eux + pour toi',
    'Inclus un premier test simple (webinar, bundle, intro croisée)',
    'Envoie à 2 partenaires prioritaires',
  ],
  'Activer le parrainage simple': [
    'Définis l\'incitation parrainage (réduction, bonus, accès…)',
    'Rédige un message que tes clients peuvent transférer',
    'Envoie-le à 5 clients fidèles',
  ],
  'Demander 2 introductions': [
    'Identifie 2 clients ou contacts qui peuvent te recommander',
    'Rédige un message de demande d\'intro court et précis',
    'Envoie avec un brouillon de message qu\'ils peuvent forwarder',
  ],
  'Suivi partenaires': [
    'Relance les partenaires contactés sans réponse',
    'Note statut de chaque piste : en cours / gagné / perdu',
    'Planifie next step pour chaque piste chaude',
  ],
  'Quota prospection quotidien': [
    'Fixe un quota quotidien réaliste (ex. 5 messages ou 2 RDV)',
    'Prépare ta liste de cibles la veille',
    'Coche chaque jour dans un tableau simple',
  ],
  'Pipeline visuel': [
    'Crée un tableau ou CRM simple : prospect → statut → next action',
    'Mets à jour tous les dossiers en cours',
    'Identifie les 3 dossiers à closer cette semaine',
  ],
  'Prioriser chaud / tiède / froid': [
    'Classe chaque prospect : chaud / tiède / froid',
    'Planifie une action différente par catégorie cette semaine',
    'Archive les contacts froids sans activité depuis 60 jours',
  ],
  '1 appel de vente minimum': [
    'Book ou mène au moins 1 appel de vente aujourd\'hui',
    'Prépare 5 questions de découverte + 1 CTA clair',
    'Note objections et next step en fin d\'appel',
  ],
  'Analyser pertes': [
    'Liste les 3 derniers prospects perdus et la raison',
    'Identifie un pattern (prix, timing, confiance, offre…)',
    'Définis 1 correctif à tester sur les prochains prospects',
  ],
  'Ajuster ciblage': [
    'Relis les profils de tes meilleurs clients vs prospects perdus',
    'Affine ta cible : secteur, taille, besoin, budget',
    'Mets à jour ta liste de prospection en conséquence',
  ],
  'Objectif mois 3': [
    'Fixe un objectif CA ou clients pour le mois 3',
    'Décompose en jalons hebdomadaires',
    'Identifie le levier principal (canal, offre, volume)',
  ],
  'Calculer marge par client / vente': [
    'Pour 3 clients ou ventes récentes : revenu − coûts directs = marge',
    'Identifie la marge % moyenne',
    'Repère 1 poste de coût à réduire sans dégrader la qualité',
  ],
  'Identifier clients les plus rentables': [
    'Classe tes clients par marge % et temps passé',
    'Identifie le top 20 % (rentables ET agréables)',
    'Note ce qu\'ils ont en commun (profil, offre, canal)',
  ],
  'Couper l\'offre non rentable': [
    'Liste tes offres ou SKU par marge et volume',
    'Identifie celle qui consomme du temps pour peu de marge',
    'Décide : augmenter prix, simplifier ou arrêter',
  ],
  'Tableau de bord marge simple': [
    'Crée un Google Sheet : CA, coûts, marge par mois',
    'Ajoute une formule marge % automatique',
    'Programme-toi un rappel mensuel pour le mettre à jour',
  ],
  'Temps passé par mission / commande': [
    'Chronomètre ou estime le temps réel sur 3 livraisons récentes',
    'Calcule revenu ÷ heures = taux horaire effectif',
    'Identifie l\'étape la plus chronophage',
  ],
  'Tâche à faible valeur n°1': [
    'Liste tes tâches récurrentes et leur impact business',
    'Identifie celle avec le plus faible ratio impact / temps',
    'Décide : supprimer, automatiser ou déléguer',
  ],
  'Cartographier process de A à Z': [
    'Documente chaque étape de ta livraison de A à Z',
    'Note durée et responsable par étape',
    'Repère les doublons ou étapes inutiles',
  ],
  'Standardiser 1 livrable récurrent': [
    'Choisis le livrable que tu produis le plus souvent',
    'Crée un template ou trame réutilisable',
    'Teste-le sur la prochaine livraison',
  ],
  'Modèle ou template réutilisable': [
    'Identifie 1 document que tu recrées à chaque fois',
    'Crée un template prêt à remplir (80 % fixe)',
    'Sauvegarde-le où tu travailles chaque jour',
  ],
  'Délai moyen de livraison': [
    'Mesure le délai réel sur 3 dernières livraisons',
    'Compare au délai promis au client',
    'Identifie 1 goulot pour réduire le délai',
  ],
  'Point de friction ops': [
    'Note où tu perds le plus de temps en ops (validation, attente, rework…)',
    'Propose 1 correctif testable cette semaine',
    'Mesure le gain de temps après correction',
  ],
  'Checklist qualité': [
    'Liste les critères de qualité avant livraison client',
    'Transforme-les en checklist cochable',
    'Applique-la sur la prochaine livraison',
  ],
  'Lister 3 tâches répétitives': [
    'Liste tes 3 tâches les plus répétitives cette semaine',
    'Estime le temps total perdu',
    'Priorise celle à automatiser ou déléguer en premier',
  ],
  'Automatiser ou déléguer 1 tâche': [
    'Choisis la tâche répétitive la plus chronophage',
    'Décide : outil no-code, template ou freelance',
    'Mets en place la version 1 aujourd\'hui. Pas la version parfaite',
  ],
  'Outil no-code ou CRM léger': [
    'Choisis 1 outil adapté (Notion, Airtable, HubSpot free, Pipedrive…)',
    'Configure un pipeline ou base minimum en 30 min',
    'Migre tes 10 prospects les plus chauds dedans',
  ],
  'Email ou séquence automatisée': [
    'Rédige une séquence de 3 emails (bienvenue, valeur, CTA)',
    'Configure l\'envoi automatique ou les rappels',
    'Teste sur toi-même avant activation',
  ],
  'Mesurer temps gagné': [
    'Compare temps passé avant / après automatisation ou délégation',
    'Note les heures gagnées par semaine',
    'Réinvestis ce temps en acquisition ou vente',
  ],
  'Documenter le nouveau process': [
    'Mets à jour ta documentation avec le process amélioré',
    'Partage-la si tu travailles avec un freelance ou associé',
    'Planifie une revue dans 30 jours',
  ],
  'Revue des 3 objectifs trimestre': [
    'Relis tes 3 objectifs du trimestre',
    'Note avancement : vert / orange / rouge pour chacun',
    'Ajuste ou abandonne ce qui n\'est plus pertinent',
  ],
  'Couper 1 initiative non prioritaire': [
    'Liste toutes tes initiatives en cours',
    'Choisis 1 à mettre en pause explicitement',
    'Communique la coupure si des parties prenantes sont impliquées',
  ],
  'Renforcer le canal #1': [
    'Identifie ton canal le plus rentable',
    'Double le volume ou le budget sur 7 jours',
    'Mesure l\'impact sur pipeline ou CA',
  ],
  'Plan d\'action 30 jours ciblé': [
    'Définis 1 objectif principal pour les 30 prochains jours',
    'Décompose en 4 jalons hebdomadaires',
    'Liste la première action concrète pour demain',
  ],
  'Aligner pricing et capacité': [
    'Estime ta capacité max de livraison par mois',
    'Compare à ton pricing actuel et à ta marge cible',
    'Ajuste prix ou volume pour rester rentable',
  ],
  'Préparer montée en charge': [
    'Liste ce qui casse en premier si tu doubles les clients',
    'Priorise 1 point à sécuriser (process, outil, délégation)',
    'Mets en place le correctif avant d\'accélérer',
  ],
  'Objectif mois 4': [
    'Fixe un objectif CA ou marge pour le mois 4',
    'Lie-le à ta capacité et ton pipeline actuel',
    'Identifie l\'action prioritaire de la semaine',
  ],
  '5 retours clients récurrents': [
    'Contacte 5 clients fidèles. Appel 15 min ou message voice',
    'Pose : « Qu\'est-ce qui manque ? » et « Que recommanderiez-vous ? »',
    'Note les demandes récurrentes non couvertes',
  ],
  'Demande non couverte n°1': [
    'Identifie la demande la plus répétée non couverte par ton offre',
    'Estime taille du marché et willingness to pay',
    'Esquisse une réponse (nouvelle offre, partenariat ou refus assumé)',
  ],
  'Sondage rapide (5 questions)': [
    'Rédige 5 questions courtes pour valider un besoin',
    'Envoie à 10 clients ou prospects via Typeform ou Google Forms',
    'Fixe une deadline de réponse de 48 h',
  ],
  'Analyser les patterns': [
    'Regroupe les retours clients par thème',
    'Identifie les 2 patterns les plus fréquents',
    'Décide : intégrer, tester ou ignorer chaque pattern',
  ],
  'Valider 1 opportunité': [
    'Choisis 1 opportunité (nouvelle offre, segment, canal)',
    'Définis un test minimal en 7 jours (5 conversations ou 3 ventes)',
    'Lance le test aujourd\'hui',
  ],
  'Esquisser offre #2': [
    'Décris l\'offre complémentaire en 5 lignes (cible, promesse, prix)',
    'Vérifie qu\'elle complète — ne cannibalise pas — l\'offre #1',
    'Identifie 3 clients à qui la proposer en test',
  ],
  'Nom & promesse offre complémentaire': [
    'Choisis un nom clair pour l\'offre #2',
    'Rédige la promesse en 1 phrase orientée résultat client',
    'Teste le wording auprès de 2 clients fidèles',
  ],
  'Pricing palier premium': [
    'Définis ce qui justifie un palier premium (plus de valeur, accès, vitesse…)',
    'Fixe un prix premium cohérent avec ta marge cible',
    'Présente-le à 2 prospects ou clients existants',
  ],
  'Pack ou abonnement récurrent': [
    'Conçois un pack ou abonnement avec revenu récurrent',
    'Calcule marge et engagement client minimum',
    'Rédige l\'argumentaire en 3 bullet points',
  ],
  'Page ou section dédiée': [
    'Crée une section ou page pour la nouvelle offre',
    'Inclus promesse, bénéfices, preuve sociale et CTA',
    'Partage le lien à 3 personnes pour feedback',
  ],
  'Argumentaire différenciation': [
    'Liste 3 raisons de te choisir vs alternatives',
    'Transforme-les en argumentaire court (30 secondes)',
    'Intègre-le dans tes scripts et ta page',
  ],
  'Test auprès de 3 clients fidèles': [
    'Présente l\'offre #2 à 3 clients fidèles',
    'Note objections, intérêt et prix acceptable',
    'Ajuste avant lancement plus large',
  ],
  'Calculer LTV simple': [
    'LTV ≈ panier moyen × fréquence d\'achat annuelle × durée relation (estimée)',
    'Compare LTV à ton coût d\'acquisition approximatif',
    'Décide si tu peux investir plus en acquisition',
  ],
  'Programme fidélité ou rétention': [
    'Définis 1 mécanique simple (points, bonus, accès VIP…)',
    'Rédige le message de lancement pour clients existants',
    'Fixe une métrique de succès (réachat, renouvellement…)',
  ],
  'Email win-back inactifs': [
    'Identifie les clients inactifs depuis 60+ jours',
    'Rédige un email win-back avec offre ou nouveauté',
    'Envoie à 5 inactifs et mesure le taux de retour',
  ],
  'Contenu marque (story, valeurs)': [
    'Rédige ton histoire fondateur en 5 lignes',
    'Liste 3 valeurs non négociables de ta marque',
    'Publie ou intègre sur ta page À propos',
  ],
  'Preuves sociales à jour': [
    'Collecte 3 témoignages ou logos clients récents',
    'Mets-les à jour sur ta page et tes supports de vente',
    'Supprime les preuves obsolètes ou faibles',
  ],
  'Actifs numériques documentés (revente)': [
    'Liste tes actifs : site, liste email, process, contrats, contenu…',
    'Estime la valeur ou le coût de reproduction de chacun',
    'Documente où ils sont stockés et qui y a accès',
  ],
  'Soft launch offre #2': [
    'Propose l\'offre #2 à un petit groupe (5–10 personnes max)',
    'Fixe un prix ou condition de lancement',
    'Note feedback et taux de conversion',
  ],
  'Mesurer taux d\'adoption': [
    'Compte combien de clients ont adopté la nouvelle offre',
    'Calcule taux d\'adoption vs base clients totale',
    'Identifie le profil type des early adopters',
  ],
  'Ajuster selon feedback': [
    'Relis tous les retours du soft launch',
    'Priorise 1–2 ajustements (prix, wording, contenu)',
    'Applique-les avant la prochaine vague',
  ],
  'Campagne bouche-à-oreille': [
    'Rédige un message que tes clients satisfaits peuvent partager',
    'Inclus une incitation claire (bonus, accès, remerciement)',
    'Envoie à 10 clients avec un CTA simple',
  ],
  'Renforcer identité visuelle / ton': [
    'Vérifie cohérence couleurs, typo et ton sur site + réseaux',
    'Corrige 1 incohérence visible aujourd\'hui',
    'Crée ou mets à jour un mini guide de marque (1 page)',
  ],
  'Plan croissance mois 6': [
    'Fixe 1 objectif principal pour le mois 6',
    'Liste 3 leviers (acquisition, rétention, offre #2…)',
    'Choisis le levier prioritaire et planifie 7 jours d\'actions',
  ],
  'Objectif mois 5': [
    'Fixe un objectif CA, rétention ou lancement pour le mois 5',
    'Vérifie cohérence avec ton pipeline actuel',
    'Identifie la première action de la semaine',
  ],
  'Tableau de bord semestre (CA, marge)': [
    'Consolide CA et marge mois 1 à 6 dans un seul document',
    'Visualise la courbe. Tendance hausse, plat ou baisse ?',
    'Note le mois le plus fort et le plus faible. Pourquoi',
  ],
  'Taux conversion par canal': [
    'Calcule conversion par canal (messages → RDV → vente)',
    'Identifie le canal le plus efficace',
    'Décide où réallouer ton temps la semaine prochaine',
  ],
  'Coût d\'acquisition réel': [
    'Additionne toutes tes dépenses acquisition sur 6 mois',
    'Divise par le nombre de clients acquis',
    'Compare au mois 1 : amélioration ou dégradation ?',
  ],
  'Clients acquis vs objectif': [
    'Compare clients réels vs objectif fixé au début du semestre',
    'Calcule l\'écart en %',
    'Identifie la cause principale (volume, conversion, ciblage…)',
  ],
  'Écarts : pourquoi ?': [
    'Liste les 3 écarts majeurs vs tes objectifs semestriels',
    'Pour chaque écart : cause racine (1 phrase)',
    'Propose 1 correction par écart',
  ],
  '3 décisions data-driven': [
    'Base-toi sur tes chiffres semestriels (pas ton intuition seule)',
    'Prends 3 décisions concrètes : continuer / arrêter / doubler',
    'Note-les par écrit avec deadline',
  ],
  'Taux de rétention / réachat': [
    'Calcule combien de clients reviennent ou réachètent',
    'Compare au mois 1 si possible',
    'Identifie 1 levier pour améliorer la rétention',
  ],
  'Interview 2 clients satisfaits': [
    'Prépare 5 questions (pourquoi vous, moment clé, amélioration)',
    'Mène 2 entretiens de 20 min',
    'Extrais 2 citations utilisables en preuve sociale',
  ],
  'Interview 1 client perdu': [
    'Contacte 1 client ou prospect perdu récemment',
    'Pose : pourquoi avez-vous choisi autre chose / reporté ?',
    'Note 1 leçon actionnable pour ton offre ou process',
  ],
  'Leçon produit n°1': [
    'Identifie la plus grande leçon sur ton offre ce semestre',
    'Note ce que tu ferais différemment au lancement',
    'Applique 1 correctif sur l\'offre actuelle',
  ],
  'Leçon vente n°1': [
    'Identifie la plus grande leçon commerciale du semestre',
    'Note script, canal ou ciblage à changer',
    'Teste le correctif sur 3 prospects',
  ],
  'Leçons ops & rétention. Synthèse': [
    'Synthétise tes leçons ops et rétention en 5 bullet points',
    'Priorise celle avec le plus d\'impact sur la marge',
    'Planifie 1 action correctrice ce mois',
  ],
  'Lister toutes tes tâches récurrentes': [
    'Liste toutes tes tâches hebdomadaires (30 min)',
    'Estime temps et impact business pour chacune',
    'Classe par ordre de délégabilité',
  ],
  '1ère tâche à déléguer': [
    'Choisis la 1ère tâche à déléguer (répétitive, faible valeur ajoutée)',
    'Rédige un brief clair : quoi, comment, critère de réussite',
    'Publie l\'annonce ou contacte 1 freelance',
  ],
  'Profil freelance / outil / associé': [
    'Définis le profil idéal pour t\'aider (compétences, budget, disponibilité)',
    'Liste 3 sources pour le trouver (Malt, Upwork, réseau…)',
    'Contacte ou shortlist 2 candidats',
  ],
  'Process documenté pour déléguer': [
    'Documente le process de la tâche à déléguer étape par étape',
    'Inclus exemples, outils et pièges à éviter',
    'Teste la doc en la relisant comme si tu étais nouveau',
  ],
  'Budget délégation mois 7': [
    'Estime le coût mensuel de la délégation prévue',
    'Vérifie que la marge le supporte',
    'Alloue le budget ou ajuste le périmètre délégué',
  ],
  'Risque n°1 si tu scales seul': [
    'Identifie le risque principal si tu doubles sans aide',
    'Propose 1 parade (process, outil, recrutement)',
    'Mets en place la parade avant d\'accélérer',
  ],
  'Vision à 6 mois (1 phrase)': [
    'Rédige : « Dans 6 mois, mon business sera… » (1 phrase)',
    'Vérifie alignement avec tes chiffres actuels. Réaliste ?',
    'Affiche cette phrase là où tu travailles chaque jour',
  ],
  '3 priorités stratégiques S2 & objectifs chiffrés': [
    'Liste 10 idées. Garde seulement 3 priorités pour le semestre 2',
    'Pour chaque priorité : 1 KPI chiffré et deadline trimestre',
    'Coupe explicitement ce qui n\'entre pas dans le top 3',
  ],
  'Roadmap trimestre 3 (high level)': [
    'Définis 3 jalons majeurs pour le trimestre 3',
    'Pour chaque jalon : résultat attendu et date',
    'Identifie la dépendance critique #1',
  ],
  'Métriques revente. Export 12 mois': [
    'Exporte CA, marge et croissance sur 12 mois',
    'Calcule tendance et saisonnalité',
    'Note 3 métriques qu\'un acquéreur regarderait',
  ],
  'Data room light. Due diligence': [
    'Rassemble contrats, métriques, process dans 1 dossier',
    'Vérifie que chaque doc est à jour',
    'Identifie 1 lacune à combler avant une vente',
  ],
  'Plan revente ou scale. 18 mois': [
    'Décide : viser revente, scale ou lifestyle business',
    'Rédige 3 étapes clés sur 18 mois pour cette voie',
    'Fixe la prochaine action dans les 7 jours',
  ],
  'Bilan semestriel. 180 jours & lancement mois 7': [
    'Synthétise victoires, échecs et chiffres clés du semestre',
    'Fixe 3 priorités pour le mois 7',
    'Bloque les créneaux de la première semaine du mois 7',
  ],
  'Bilan semaine. Rétention': [
    'Compte clients ou comptes actifs vs inactifs depuis 14 jours',
    'Identifie la cause #1 de désengagement (onboarding, support, prix…)',
    'Planifie 1 action rétention concrète pour les 3 prochains jours',
  ],
  'Bilan offre actuelle': [
    'Liste ce que ton offre inclut aujourd\'hui (livrables, prix, délais)',
    'Note les 3 retours clients les plus fréquents sur l\'offre',
    'Décide 1 ajustement à tester cette semaine (scope, bonus ou garantie)',
  ],
  'Bilan semaine. Offre': [
    'Compare les tests pricing/packaging de la semaine (réactions, objections)',
    'Garde ce qui a converti. Abandonne ce qui n\'a eu aucun signal',
    'Rédige la version finale de ton offre pour la semaine prochaine',
  ],
  'Bilan 60 jours': [
    'Exporte CA/MRR, clients acquis et canal #1 sur 60 jours',
    'Compare vs objectif mois 1 : écart en % et cause principale',
    'Fixe 3 priorités non négociables pour le mois 3',
  ],
  'Bilan semaine acquisition': [
    'Calcule taux de réponse et RDV bookés par script testé',
    'Garde le message gagnant. Archive les versions < 5 % réponse',
    'Fixe quota outbound pour la semaine prochaine (+20 % si marge OK)',
  ],
  'Bilan contenu': [
    'Liste les 3 contenus publiés : vues, clics, leads générés',
    'Identifie le format et sujet qui performe le mieux',
    'Planifie 2 contenus similaires pour la semaine prochaine',
  ],
  'Bilan partenariats': [
    'Statut de chaque partenaire contacté : répondu / en cours / mort',
    'Note 1 win concret (intro, co-marketing, vente) ou 0 — pourquoi',
    'Relance ou abandon chaque piste. Max 3 partenaires actifs en parallèle',
  ],
  'Bilan 90 jours': [
    'Consolide pipeline, CA et canal #1 sur 90 jours',
    'Identifie le levier qui a le plus accéléré (volume, conversion, offre)',
    'Fixe objectif chiffré mois 4 et 1 action prioritaire demain',
  ],
  'Bilan rentabilité semaine 1': [
    'Marge % moyenne sur 3 clients ou ventes récentes',
    'Classe clients/offres : rentables / neutres / à couper',
    'Décide 1 action marge cette semaine (prix, coût ou scope)',
  ],
  'Bilan process semaine 2': [
    'Mesure délai moyen livraison vs promesse client',
    'Note l\'étape ops la plus lente (chronomètre ou estimation)',
    'Applique 1 correctif process testé sur la prochaine livraison',
  ],
  'Bilan automatisations': [
    'Liste automatisations mises en place cette semaine',
    'Estime heures gagnées vs temps de setup',
    'Choisis 1 prochaine tâche à automatiser (ROI > 2 h/semaine)',
  ],
  'Bilan 120 jours': [
    'Tableau CA, marge et capacité max sur 120 jours',
    'As-tu atteint l\'objectif mois 4 ? Écart et cause racine',
    'Valide ou ajuste ton plan 30 jours avant le mois 5',
  ],
  'Bilan écoute marché': [
    'Synthétise les 5+ retours clients collectés cette semaine',
    'Classe demandes : must-have / nice-to-have / hors scope',
    'Retiens 1 opportunité validée à transformer en offre #2',
  ],
  'Bilan offre #2': [
    'Récap tests offre complémentaire : intérêt, prix, objections',
    'Décide : lancer, ajuster ou mettre en pause l\'offre #2',
    'Si go : fixe date soft launch et liste 5 early adopters',
  ],
  'Bilan rétention': [
    'Calcule taux réachat ou renouvellement sur 30 jours',
    'Identifie les 3 clients/comptes les plus fidèles — profil commun',
    'Lance 1 action rétention ciblée (email, bonus, check-in)',
  ],
  'Bilan 150 jours': [
    'Consolide revenus, LTV estimée et taux adoption offre #2',
    'Compare vs vision mois 1 : sur la bonne trajectoire ?',
    'Fixe objectif mois 6 et 3 actions semaine 1 du mois 6',
  ],
  'Bilan chiffres semaine 1': [
    'Mets à jour dashboard : CA, marge, conversion par canal',
    'Repère la métrique la plus en retard vs objectif semestre',
    'Prends 1 décision data-driven (continuer / arrêter / doubler)',
  ],
  'Bilan rétention semestre': [
    'Taux rétention/réachat mois 1 vs mois 6 : tendance',
    'Synthétise 3 leçons des interviews clients (satisfaits + perdus)',
    'Planifie 1 initiative rétention pour le semestre 2',
  ],
  'Bilan délégation': [
    'Statut délégation : brief publié, candidats, process doc',
    'Estime coût mensuel vs marge disponible',
    'Décide go/no-go délégation mois 7 avec date de démarrage',
  ],
};

function tasksFromBilanTitle(title: string, objective: string): string[] {
  const theme = title.replace(/^bilan\s*/i, '').replace(/\.\s*/g, ' — ').trim();
  return [
    `Victoire concrète — ${theme || title} : note 1 résultat mesurable`,
    `Blocage ou friction — ${theme || objective} : identifie 1 point à corriger`,
    `Priorité suivante : fixe 1 action pour demain (liée à ${theme || 'la semaine'})`,
  ];
}

function tasksFromTitlePattern(title: string, objective: string): string[] | null {
  const t = title.toLowerCase();

  if (t.startsWith('bilan')) {
    return tasksFromBilanTitle(title, objective);
  }
  if (t.includes('objectif mois') || t.includes('objectif ca')) {
    return TITLE_TASKS[title] ?? [
      'Fixe un chiffre CA ou clients cible pour le mois',
      'Décompose en objectif hebdomadaire',
      'Identifie l\'action quotidienne qui soutient cet objectif',
    ];
  }
  if (t.includes('préparer le mois')) {
    return TITLE_TASKS[title] ?? [
      'Relis les bilans du mois écoulé',
      'Choisis 3 actions non négociables pour le mois suivant',
      'Bloque les créneaux récurrents dans l\'agenda',
    ];
  }
  if (t.includes('relance') || t.includes('script')) {
    return [
      'Rédige ou améliore ton script en 3 parties : accroche, valeur, CTA',
      'Teste sur 3 prospects aujourd\'hui',
      'Ajuste selon les réponses reçues',
    ];
  }
  if (t.includes('pipeline') || t.includes('prospects')) {
    return [
      'Mets à jour statut de chaque prospect (chaud / tiède / froid)',
      'Supprime les contacts morts. Focus sur le top 20 %',
      'Planifie la prochaine action par prospect chaud',
    ];
  }
  if (t.includes('contenu') || t.includes('publier')) {
    return [
      'Produis 1 contenu utile pour ta cible (post, email, vidéo courte)',
      'Inclue un CTA clair vers ton offre',
      'Mesure vues, clics ou réponses',
    ];
  }
  if (t.includes('partenaire') || t.includes('parrainage')) {
    return [
      'Identifie 3 partenaires complémentaires (même audience, offre différente)',
      'Rédige une proposition win-win en 5 lignes',
      'Envoie 2 messages de prise de contact',
    ];
  }
  if (t.includes('process') || t.includes('checklist') || t.includes('template') || t.includes('modèle')) {
    return [
      'Documente les étapes de A à Z pour une livraison type',
      'Crée une checklist ou template réutilisable',
      'Teste sur la prochaine mission ou commande',
    ];
  }
  if (t.includes('pricing') || t.includes('prix') || t.includes('packaging') || t.includes('marge')) {
    return [
      'Compare ton prix à 2 alternatives marché',
      'Teste une variation (palier, bundle ou essai) sur 3 prospects',
      'Note les objections prix et tes réponses',
    ];
  }
  if (t.includes('délégu') || t.includes('externalis')) {
    return [
      'Liste toutes tes tâches récurrentes (30 min)',
      'Cerclez celles qu\'un autre pourrait faire à 80 % de la qualité',
      'Rédige une fiche brief pour la 1ère tâche à déléguer',
    ];
  }

  return null;
}

function hasExplicitSemesterTasks(businessId: BusinessId, baseTitle: string): boolean {
  return Boolean(
    TITLE_TASK_OVERLAYS[businessId]?.[baseTitle]?.length || TITLE_TASKS[baseTitle]?.length
  );
}

function resolveCoreTasks(
  businessId: BusinessId,
  baseTitle: string,
  displayTitle: string,
  objective: string
): string[] {
  const businessTitleTasks = TITLE_TASK_OVERLAYS[businessId]?.[baseTitle];
  if (businessTitleTasks?.length) return businessTitleTasks;

  const exact = TITLE_TASKS[baseTitle];
  if (exact?.length) {
    return adaptGenericTasksToBusiness(businessId, exact, baseTitle);
  }

  const patterned = tasksFromTitlePattern(baseTitle, objective);
  if (patterned?.length) {
    return adaptGenericTasksToBusiness(businessId, patterned, baseTitle);
  }

  return [
    `Définis le livrable concret pour « ${displayTitle} » (doc, message ou chiffre)`,
    `Exécute l'action principale du jour. Objectif : ${objective}`,
    `Note le résultat mesurable en 1 phrase avant ce soir`,
  ];
}

export function buildSemesterDayTasks(
  businessId: BusinessId,
  month: number,
  dayInMonth: number,
  baseTitle: string,
  displayTitle: string,
  objective: string,
  phaseId: number,
  marketSegment?: MarketSegment | null
): string[] {
  const special = resolveSpecialDayKey(baseTitle);
  if (special?.startsWith('exit')) {
    return buildLegalExitTasks(businessId, special);
  }

  const week = dayInMonth <= 7 ? 1 : dayInMonth <= 14 ? 2 : dayInMonth <= 21 ? 3 : 4;

  const core = resolveCoreTasks(businessId, baseTitle, displayTitle, objective);
  const adaptedCore =
    marketSegment && businessUsesMarketSegment(businessId)
      ? applyMarketSegmentToTasks(core, businessId, marketSegment, baseTitle)
      : core;

  const enrichment =
    !hasExplicitSemesterTasks(businessId, baseTitle) && dayInMonth % 7 !== 0
      ? pickWeeklyEnrichmentTask(businessId, month, week, dayInMonth, baseTitle)
      : null;

  const baseTasks = [
    ...adaptedCore,
    ...(enrichment ? [enrichment] : []),
  ];

  return buildDenseDailyTasks(
    businessId,
    month,
    dayInMonth,
    baseTitle,
    objective,
    baseTasks
  );
}
