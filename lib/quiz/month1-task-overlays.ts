import type { BusinessId } from '@/lib/quiz/data';
import {
  BUSINESS_FAMILY,
  adaptGenericTasksToBusiness,
  type BusinessFamily,
} from '@/lib/quiz/roadmap-business-overlays';

/** Tâches mois 1 par famille business (jours sans businessTasks dédié dans le blueprint). */
const MONTH1_FAMILY_TASKS: Record<BusinessFamily, Record<string, string[]>> = {
  product: {
    'Clarifier le problème': [
      'Interview 2 utilisateurs potentiels : « Quel outil utilisez-vous aujourd\'hui pour [problème] ? »',
      'Rédige « Mon utilisateur perd X h/semaine parce que… » avec un chiffre',
      'Vérifie que le problème justifie un abonnement (budget logiciel existant ou douleur récurrente)',
    ],
    'Définir la transformation': [
      'Écris « Après [produit], mon utilisateur gagne… » (temps, revenus ou erreurs évitées)',
      'Liste 3 métriques produit mesurables (activation J7, temps gagné, MRR généré…)',
      'Compare avec Excel/Notion/concurrent : ta différence en 1 phrase',
    ],
    'Hypothèse de marché': [
      'Choisis B2B ou B2C pour la v1. Un segment, une géographie',
      'Liste 3 communautés ou canaux où ta cible est active (LinkedIn, Slack, Reddit…)',
      'Critère ICP : taille entreprise, rôle ou profil utilisateur qui signe / active',
    ],
    'Persona & contexte d\'achat': [
      'Nomme ton persona (rôle + entreprise ou profil) et son KPI personnel',
      'Liste 3 objections avant essai (prix, migration, sécurité, adoption équipe…)',
      'Identifie le déclencheur d\'achat (audit, croissance, nouveau outil stack…)',
    ],
    'Forme juridique. Anticiper (appliquer plus tard)': [
      'Compare SASU vs micro pour SaaS B2B avec MRR récurrent',
      'Note 2 signaux « formaliser » : 1er client payant, MRR > 500 €/mois',
      'Fixe statut cible SASU. Aucune immatriculation tant que l\'offre n\'est pas validée',
    ],
    'Échanges terrain': [
      'Contacte 3 utilisateurs ICP (15 min chacun)',
      'Pose : workflow actuel, budget logiciel, critère de changement',
      'Note verbatim 5 phrases exactes utilisées par tes interlocuteurs',
    ],
    'Synthèse terrain & bilan semaine 1': [
      'Synthétise 3 insights terrain (problème confirmé, budget, objections)',
      'Relis problème + promesse + ICP : cohérents avec les échanges ?',
      'Fixe objectif S2 : offre v1 + landing avec CTA essai validés par 1 prospect',
    ],
    'Différenciation': [
      'Liste 3 différenciateurs SaaS (niche, UX, intégration, pricing)',
      'Transforme chacun en bénéfice utilisateur chiffré',
      'Rédige réponse à « Pourquoi pas [concurrent connu] ? » en 3 lignes',
    ],
    'Pitch & accroche': [
      'Pitch 30 s : problème → solution → essai gratuit / démo',
      'Headline landing : « [Résultat] sans [douleur] en [délai] »',
      '3 bullets bénéfices orientés résultat (pas liste de features)',
    ],
    'Preuves & crédibilité': [
      'Capture 3 screenshots produit ou démo vidéo 2 min',
      'Rédige 1 mini cas « avant / après » même sur beta test interne',
      'FAQ 5 objections : sécurité, onboarding, prix, support, intégration',
    ],
    'Supports de vente': [
      'Deck 5 slides : problème, solution, démo, pricing, CTA essai',
      'Template email outbound personnalisable (3 lignes + lien démo)',
      'Script call découverte 15 min : 5 questions + CTA essai booké',
    ],
    'Choix des canaux': [
      'Liste 5 canaux SaaS : LinkedIn outbound, SEO, Product Hunt, communautés, ads',
      'Score chaque canal : effort / coût / délai first user',
      'Retiens 2 canaux pour semaine 4 (ex. LinkedIn + communauté niche)',
    ],
    'Bilan semaine 2': [
      'Fais relire offre + pitch à 1 prospect ICP : compris en 30 s ?',
      'Note 3 ajustements (wording, pricing affiché, CTA)',
      'Checklist : nom offre, 3 features v1, prix, CTA essai — tout présent ?',
    ],
    'Bilan semaine 3': [
      'Parcours test : landing → CTA essai/démo → email bienvenue',
      'Corrige frictions (mobile, formulaire, temps chargement)',
      'Liste 20 comptes cibles avec décideur + angle personnalisation',
    ],
    'Liste de prospects': [
      'Liste 20 comptes ICP : entreprise, décideur, LinkedIn/email',
      'Priorise top 10 avec signal d\'achat (levée, recrutement, post LinkedIn…)',
      'Note 1 accroche personnalisée par prospect chaud',
    ],
    'Séquence de prospection': [
      'Rédige message initial : pain point spécifique + lien démo (max 5 lignes)',
      'Prépare relance J+3 avec ressource utile (checklist, article)',
      'Envoie 5 messages personnalisés aujourd\'hui. Note heure d\'envoi',
    ],
    'Relances & conversations': [
      'Relance prospects J+3 sans réponse avec insight ou case study',
      'Propose créneau démo 15 min dans chaque relance chaude',
      'Note objections récurrentes pour mettre à jour FAQ',
    ],
    'Appels de découverte': [
      'Mène 2 démos : workflow actuel → douleur → démo → essai booké',
      'Utilise script 5 questions découverte + next step clair',
      'Envoie follow-up sous 2 h avec lien essai et récap',
    ],
    'Proposition & closing': [
      'Envoie proposition à 1 prospect chaud : plan, prix, onboarding, date début',
      'Inclus essai 14 j ou pilote avec critères de succès',
      'Fixe point décision sous 48 h (call ou email)',
    ],
    'Livraison & feedback': [
      'Checklist onboarding : compte créé, 1ère action clé, email J+1',
      'Collecte feedback : « Qu\'est-ce qui bloque ? » + NPS interne',
      'Note temps passé onboarding vs prévu',
    ],
    'Itération offre': [
      'Mets à jour landing ou onboarding selon feedback beta/essai',
      'Ajuste pricing ou trial si objection #1 = prix',
      'Priorise 1 amélioration produit pour la semaine prochaine',
    ],
    'Bilan 30 jours & suite': [
      'Compte : outreach, démos, essais activés, MRR ou préinscriptions',
      '3 victoires + 3 axes amélioration (produit, message, canal)',
      'Fixe objectif MRR ou essais actifs pour le mois 2',
    ],
  },
  services: {
    'Clarifier le problème': [
      'Identifie 3 situations où un client a besoin de ton expertise immédiatement',
      'Rédige « Mon client galère parce que… » avec un exemple concret secteur cible',
      'Vérifie que le problème se règle en mission/forfait (budget externalisation)',
    ],
    'Définir la transformation': [
      'Écris « Après ma mission, mon client… » avec résultat mesurable (CA, image, livraison)',
      'Liste 3 bénéfices chiffrables : temps gagné, CA, risque évité',
      'Compare avec internalisation ou concurrent freelance : ta différence',
    ],
    'Hypothèse de marché': [
      'Cible secteur + taille entreprise où ton TJM/forfait se justifie',
      'Liste où trouver ces clients (LinkedIn, réseau, Malt, événements…)',
      'Critère bon prospect : budget, urgence, décideur accessible',
    ],
    'Persona & contexte d\'achat': [
      'Nomme persona (dirigeant, marketing, RH…) et son enjeu du trimestre',
      'Liste 3 objections (budget, timing, « on le fait en interne »)',
      'Identifie déclencheur : refonte, recrutement, échéance, crise',
    ],
    'Forme juridique. Anticiper (appliquer plus tard)': [
      'Compare micro vs portage vs EURL/SASU pour missions récurrentes',
      'Signaux formalisation : 1ère mission signée, TJM confirmé, clients récurrents',
      'Fixe statut cible. Pas d\'action admin avant validation offre',
    ],
    'Échanges terrain': [
      'Parle à 3 prospects sur leur dernier projet externalisé (réussi ou raté)',
      'Pose : budget, critères choix prestataire, délais, freins',
      'Note mots exacts et objections entendues',
    ],
    'Synthèse terrain & bilan semaine 1': [
      'Synthétise 3 insights des entretiens (budget, urgence, critères)',
      'Relis problème, promesse, persona : alignés avec le terrain ?',
      'Objectif S2 : forfait signature + pitch prêt à envoyer',
    ],
    'Différenciation': [
      'Liste 3 différenciateurs (spécialisation, méthode, garantie, vitesse)',
      'Transforme en bénéfice client concret par différenciateur',
      'Prépare réponse « Pourquoi pas une agence / un interne ? »',
    ],
    'Pitch & accroche': [
      'Pitch 30 s : « J\'aide [cible] à [résultat] en [délai] »',
      'Headline LinkedIn/site orientée résultat client (pas ton titre)',
      '3 bullets : livrables, délai, preuve',
    ],
    'Preuves & crédibilité': [
      'Compile portfolio, recommandations LinkedIn ou cas anonymisé structuré',
      'Rédige 2 mini cas avant/après (même projet perso ou pro bono)',
      'FAQ 5 objections : prix, délai, disponibilité, process, garantie',
    ],
    'Supports de vente': [
      'One-pager : offre, process 3 étapes, tarifs, témoignage, CTA RDV',
      'Template message intro LinkedIn/email (personnalisable en 2 min)',
      'Script call 15 min : découverte → scope → forfait → next step',
    ],
    'Choix des canaux': [
      'Liste 5 canaux : réseau, LinkedIn, Malt, partenaires, bouche-à-oreille',
      'Score effort/coût/délai pour chaque',
      'Retiens 2 canaux semaine 4 avec quota hebdo (ex. 10 messages LinkedIn)',
    ],
    'Bilan semaine 2': [
      'Relis forfait + pitch : achetable sans call de clarification ?',
      'Fais relire à 1 pair ou prospect de confiance',
      'Note 3 ajustements prioritaires (scope, prix, wording)',
    ],
    'Bilan semaine 3': [
      'Test parcours : page → Calendly/formulaire → proposition forfait',
      'Corrige frictions (mobile, prise RDV, clarté offre)',
      'Liste 20 prospects avec angle personnalisation',
    ],
    'Liste de prospects': [
      'Liste 20 entreprises/contacts cibles (nom, rôle, LinkedIn)',
      'Priorise 10 chauds (réseau, signal achat, recommandation)',
      'Note 1 accroche par prospect basée sur actualité entreprise',
    ],
    'Séquence de prospection': [
      'Message initial : résultat concret + cas similaire + CTA RDV 20 min',
      'Relance J+3 : question ciblée ou mini insight secteur',
      'Envoie 5 messages personnalisés aujourd\'hui',
    ],
    'Relances & conversations': [
      'Relance tièdes avec mini audit gratuit ou question sur enjeu #1',
      'Propose créneau call 15–20 min dans chaque relance',
      'Note objections pour ajuster script',
    ],
    'Appels de découverte': [
      'Mène 2 calls : besoin → scope → forfait → date démarrage',
      'Script 5 questions + proposition orale en fin d\'appel',
      'Envoie récap + proposition écrite sous 24 h',
    ],
    'Proposition & closing': [
      'Proposition écrite : scope, livrables, calendrier, acompte 30–50 %',
      'Fixe deadline réponse 48 h',
      'Planifie relance J+2 si silence',
    ],
    'Livraison & feedback': [
      'Checklist livraison + point mi-parcours client',
      '3 questions feedback : satisfaction, délai, amélioration',
      'Note temps réel vs estimé par livrable',
    ],
    'Itération offre': [
      'Ajuste forfait, scope ou pricing selon 1ère mission/feedback',
      'Mets à jour one-pager et page avec learnings',
      'Identifie 1 standard à documenter (template, process)',
    ],
    'Bilan 30 jours & suite': [
      'KPIs : prospects contactés, RDV, missions signées, pipeline €',
      '3 victoires + 3 axes amélioration',
      'Objectif mois 2 : CA ou missions signées chiffré',
    ],
  },
  commerce: {
    'Clarifier le problème': [
      'Décris frustration produit ou lifestyle que ta marque adresse',
      'Interview 3 personnes de ta cible : « Qu\'est-ce qui vous frustre avec [catégorie] ? »',
      'Vérifie problème fréquent + willingness to pay (prix marché existant)',
    ],
    'Définir la transformation': [
      'Écris transformation émotionnelle + fonctionnelle après achat',
      'Liste 3 bénéfices mesurables (confort, gain temps, statut, économie…)',
      'Compare avec alternative Amazon/marque leader : ta différence',
    ],
    'Hypothèse de marché': [
      'Définis niche, persona acheteur, canal #1 (Instagram, TikTok, SEO, ads)',
      'Liste 3 communautés ou hashtags où ta cible achète',
      'Critère bon client : panier cible, fréquence achat, marge acceptable',
    ],
    'Persona & contexte d\'achat': [
      'Décris persona : âge, style vie, moment d\'achat (impulsion, cadeau, récurrent)',
      'Liste 3 objections (livraison, qualité, prix, confiance marque)',
      'Identifie déclencheur : saison, événement, influenceur, besoin immédiat',
    ],
    'Forme juridique. Anticiper (appliquer plus tard)': [
      'Micro pour test ventes ; société si stock, TVA ou volume',
      'Signaux : 10 commandes/mois, marge stable, besoin stocker',
      'Fixe statut cible sans immatriculer avant validation produit',
    ],
    'Échanges terrain': [
      'Sonde 3 acheteurs potentiels sur marque actuelle et critères d\'achat',
      'Montre mockup produit ou échantillon si possible',
      'Note prix qu\'ils paieraient et objections',
    ],
    'Synthèse terrain & bilan semaine 1': [
      'Synthétise 3 insights (prix, design, canal, objections)',
      'Valide cohérence problème ↔ produit pilote',
      'Objectif S2 : SKU pilote + fiche produit rédigée',
    ],
    'Différenciation': [
      '3 différenciateurs : histoire marque, qualité, communauté, packaging',
      'Transforme en bénéfice perçu sur fiche produit',
      'Réponse « Pourquoi pas Shein/Amazon ? »',
    ],
    'Pitch & accroche': [
      'Accroche marque + bénéfice produit star en 1 phrase',
      'Bio Instagram/TikTok : promesse + preuve sociale',
      '3 bullets fiche produit orientés bénéfices',
    ],
    'Preuves & crédibilité': [
      'Photos produit pro ou mockups haute qualité',
      '2 scénarios avant/après usage produit',
      'FAQ : livraison, retours, composition, garantie',
    ],
    'Supports de vente': [
      'Fiche produit complète : titre SEO, bénéfices, specs, avis placeholder',
      'Visuels lifestyle + packshot sur fond neutre',
      'Argumentaire vente 5 lignes pour DM ou pub',
    ],
    'Choix des canaux': [
      'Liste 5 canaux : Instagram, TikTok, SEO, micro-influence, ads test',
      'Budget test et effort par canal',
      'Retiens 2 canaux semaine 4 avec objectif (ex. 3 ventes organiques)',
    ],
    'Bilan semaine 2': [
      'Relis fiche produit : envie d\'acheter en 30 s ?',
      'Feedback 2 personnes cible sur prix et visuels',
      '3 ajustements (photo, titre, prix, garantie)',
    ],
    'Bilan semaine 3': [
      'Test parcours : page → panier → paiement test → confirmation email',
      'Corrige frictions checkout mobile',
      'Liste 20 cibles (influenceurs micro, communautés, lookalike)',
    ],
    'Liste de prospects': [
      'Liste 20 micro-influenceurs ou clients seed (niche, engagement, contact)',
      'Priorise 10 alignés marque + audience acheterait',
      'Note offre collab ou early bird par contact',
    ],
    'Séquence de prospection': [
      'DM/email partenariat ou teasing lancement (pas spam massif)',
      'Message lancement : early bird + preuve produit',
      'Envoie 5 messages personnalisés',
    ],
    'Relances & conversations': [
      'Relance communauté / liste waitlist avec date lancement',
      'Propose code early bird limité 48 h',
      'Note questions récurrentes pour FAQ',
    ],
    'Appels de découverte': [
      '2 calls B2B wholesale ou feedback clients early si D2C',
      'Script : besoin → fit produit → commande test ou précommande',
      'Documente profil client qui convertit',
    ],
    'Proposition & closing': [
      'Offre lancement : bundle, code -X %, précommande limitée',
      'Deadline claire + stock ou places limitées',
      'Envoie à 3 prospects chauds minimum',
    ],
    'Livraison & feedback': [
      'Checklist expédition : emballage, délai, tracking, email post-achat',
      'Demande avis ou UGC à 3 premiers acheteurs',
      'Note coût réel livraison vs prévu',
    ],
    'Itération offre': [
      'Ajuste fiche produit, prix ou bundle selon feedback',
      'Coupe variante qui ne convertit pas',
      'Planifie test pub ou contenu sur angle gagnant',
    ],
    'Bilan 30 jours & suite': [
      'KPIs : commandes, panier moyen, CAC organique, marge %',
      '3 victoires + 3 axes (produit, pub, ops)',
      'Objectif CA mois 2 chiffré',
    ],
  },
  platform: {
    'Clarifier le problème': [
      'Formule problème des 2 côtés : offreurs ET demandeurs (1 phrase chacun)',
      'Interview 2 personnes de chaque côté si possible',
      'Vérifie que la transaction a une fréquence récurrente',
    ],
    'Définir la transformation': [
      'Valeur créée côté offre : revenus, visibilité, simplicité',
      'Valeur créée côté demande : confiance, choix, gain temps',
      'Compare avec solution actuelle (WhatsApp, annuaire, concurrent)',
    ],
    'Hypothèse de marché': [
      'Décide quel côté lancer en premier (offre ou demande) et pourquoi',
      'Géographie ou niche verticale pour densifier liquidité',
      'Critère early adopter : motivation + friction acceptable',
    ],
    'Persona & contexte d\'achat': [
      'Persona côté prioritaire : quotidien, outils actuels, budget',
      'Objections : confiance plateforme, commission, effort onboarding',
      'Déclencheur : saisonnalité, événement local, besoin urgent',
    ],
    'Forme juridique. Anticiper (appliquer plus tard)': [
      'Anticipe SASU avant transactions récurrentes',
      'Signaux : 10 transactions, commission encaissée, litige possible',
      'Fixe statut cible sans formaliser avant liquidité test',
    ],
    'Échanges terrain': [
      'Interview 3 offreurs OU 3 demandeurs (selon côté #1)',
      'Pose : comment ils font aujourd\'hui, friction, commission acceptable',
      'Note verbatim et willingness to join beta',
    ],
    'Synthèse terrain & bilan semaine 1': [
      'Synthétise insights liquidité : quel côté est plus facile à recruter',
      'Valide proposition 2 faces (ou 1 face si focus)',
      'Objectif S2 : promesse + liste 20 early adopters identifiés',
    ],
    'Différenciation': [
      '3 différenciateurs : confiance, curation, niche geo, take rate',
      'Évite « un Airbnb de plus » — sois spécifique',
      'Réponse objection « pourquoi pas Facebook Marketplace ? »',
    ],
    'Pitch & accroche': [
      'Accroche côté #1 : bénéfice concret en rejoignant maintenant',
      'Accroche côté #2 en brouillon si applicable',
      '3 bullets : simplicité, confiance, économie',
    ],
    'Preuves & crédibilité': [
      'Waitlist, logos partenaires ou engagements early adopters',
      'Schéma transaction type en 1 visuel',
      'FAQ : commission, paiement, litiges, modération',
    ],
    'Supports de vente': [
      'Deck ou one-pager côté prioritaire + waitlist CTA',
      'Message recrutement manuel early adopter (5 lignes)',
      'Script call onboarding 15 min',
    ],
    'Choix des canaux': [
      'Canaux recrutement côté #1 : communautés, LinkedIn, local, partenaires',
      'Score effort par canal',
      'Retiens 2 canaux + quota (ex. 10 inscriptions/semaine)',
    ],
    'Bilan semaine 2': [
      'Proposition valeur claire pour early adopter en 30 s ?',
      'Feedback 2 early adopters potentiels sur commission/process',
      '3 ajustements prioritaires',
    ],
    'Bilan semaine 3': [
      'Test : landing → inscription waitlist → email confirmation',
      'Corrige friction inscription',
      'Liste 20 early adopters nom + contact + besoin',
    ],
    'Liste de prospects': [
      '20 early adopters côté prioritaire : nom, contact, besoin',
      'Top 10 les plus chauds (engagement exprimé)',
      'Angle personnalisation par prospect',
    ],
    'Séquence de prospection': [
      'Message recrutement : valeur plateforme + onboarding simple + early benefit',
      'Relance J+3 avec preuve social (X inscrits)',
      '5 messages manuels aujourd\'hui',
    ],
    'Relances & conversations': [
      'Relance avec bénéfice concret d\'être parmi les premiers',
      'Propose call onboarding 15 min',
      'Note friction exprimée',
    ],
    'Appels de découverte': [
      '2 calls onboarding early adopters : comprendre friction actuelle',
      'Script : besoin → fit plateforme → inscription guidée',
      'Documente objection #1',
    ],
    'Proposition & closing': [
      'Accord early adopter : conditions, commission, engagement minimal',
      'Envoie à 3 prospects chauds',
      'Deadline réponse 48 h',
    ],
    'Livraison & feedback': [
      'Accompagne 1ère transaction ou matching bout en bout',
      'Collecte feedback des 2 parties',
      'Note temps ops par transaction',
    ],
    'Itération offre': [
      'Corrige friction #1 identifiée (inscription, paiement, matching)',
      'Ajuste commission ou incitation early adopter',
      'Mets à jour landing avec learnings',
    ],
    'Bilan 30 jours & suite': [
      'KPIs : inscrits actifs, transactions, rétention 7 j, GMV',
      '3 victoires + 3 axes (liquidité, produit, recrutement)',
      'Objectif mois 2 : transactions ou inscrits actifs chiffré',
    ],
  },
  impact: {
    'Clarifier le problème': [
      'Lie problème social à besoin concret qu\'un payeur résout',
      'Interview 2 bénéficiaires + 1 payeur potentiel (client, donateur, institution)',
      'Vérifie double existence : impact réel + willingness to pay',
    ],
    'Définir la transformation': [
      'Impact chiffré attendu (bénéficiaires, CO₂, emplois…) + bénéfice payeur',
      '3 métriques impact + 1 métrique business',
      'Compare avec alternative (ONG, concurrent, statu quo)',
    ],
    'Hypothèse de marché': [
      'Identifie qui paie (client B2B, B2C éthique, institution, donateur)',
      'Canal reach : communauté mission, presse locale, réseau engagé',
      'Critère bon partenaire/client : alignement valeurs + budget',
    ],
    'Persona & contexte d\'achat': [
      'Persona payeur : valeurs, critères achat responsable, budget',
      'Objections : greenwashing, prix, preuve impact',
      'Déclencheur : reporting RSE, événement, campagne',
    ],
    'Forme juridique. Anticiper (appliquer plus tard)': [
      'Clarifie ASS vs SAS selon modèle mixte impact + CA',
      'Signaux : 1er client payeur récurrent, subvention, équipe',
      'Statut cible une fois viabilité démontrée',
    ],
    'Échanges terrain': [
      'Parle à bénéficiaires ET payeurs (3 entretiens minimum)',
      'Valide que les deux existent et que le lien est crédible',
      'Note langage exact utilisé sur impact et prix',
    ],
    'Synthèse terrain & bilan semaine 1': [
      'Synthétise fit mission ↔ demande payeur',
      'Cohérence impact chiffré ↔ offre',
      'Objectif S2 : offre + preuve impact sur page',
    ],
    'Différenciation': [
      'Transparence impact + qualité produit/service',
      '3 preuves différenciantes vs concurrent « green »',
      'Réponse greenwashing : comment vous mesurez',
    ],
    'Pitch & accroche': [
      'Mission en 1 phrase + bénéfice client concret',
      'Headline page : impact + produit',
      '3 bullets : impact, qualité, transparence',
    ],
    'Preuves & crédibilité': [
      'Impact chiffré même estimé, labels, partenaires mission',
      '2 histoires bénéficiaires (avec consentement)',
      'FAQ impact + prix + traçabilité',
    ],
    'Supports de vente': [
      'One-pager mission + offre + impact chiffré + CTA',
      'Message partenaire ou client B2B (5 lignes)',
      'Script call 15 min aligné valeurs',
    ],
    'Choix des canaux': [
      'Canaux : communauté, partenaires, LinkedIn mission, événements',
      'Score effort par canal',
      '2 canaux semaine 4 avec objectif RDV ou ventes',
    ],
    'Bilan semaine 2': [
      'Mission + offre + prix cohérents ?',
      'Feedback 2 personnes sur crédibilité impact',
      '3 ajustements communication ou offre',
    ],
    'Bilan semaine 3': [
      'Test parcours : page → achat/soutien → reçu + preuve impact',
      'Corrige frictions paiement ou compréhension',
      'Liste 20 contacts : clients, partenaires, prescripteurs',
    ],
    'Liste de prospects': [
      '20 contacts : clients payeurs, partenaires, prescripteurs mission',
      'Top 10 avec alignement valeurs fort',
      'Angle personnalisation par contact',
    ],
    'Séquence de prospection': [
      'Message aligné mission sans culpabilisation + proposition claire',
      'Relance J+3 avec preuve impact récente',
      '5 messages personnalisés',
    ],
    'Relances & conversations': [
      'Relance avec data impact + invitation essai/événement',
      'Propose call 15 min découverte',
      'Note objections impact vs prix',
    ],
    'Appels de découverte': [
      '2 calls : mission → fit → achat/soutien → mesure impact',
      'Script découverte + next step concret',
      'Envoi récap sous 24 h',
    ],
    'Proposition & closing': [
      'Proposition : offre + impact associé + reporting',
      'Deadline réponse 48 h',
      'Envoie à 1 client ou partenaire chaud',
    ],
    'Livraison & feedback': [
      'Livre + mesure impact réalisé vs promis',
      '3 questions feedback payeur et bénéficiaire si possible',
      'Documente preuve impact pour page',
    ],
    'Itération offre': [
      'Renforce preuve impact sur page selon feedback',
      'Ajuste pricing ou packaging éthique',
      'Priorise 1 amélioration mesure impact',
    ],
    'Bilan 30 jours & suite': [
      'KPIs : clients payeurs, impact chiffré, marge, partenaires',
      '3 victoires + 3 axes',
      'Objectif mois 2 viabilité (CA + impact)',
    ],
  },
  creator: {
    'Clarifier le problème': [
      'Décris manque d\'info/inspiration/compétence de ton audience',
      'Sonde 3 personnes cible : quel contenu consomment-ils ? qu\'est-ce qui manque ?',
      'Vérifie problème + willingness to pay (formation, produit, sponsoring)',
    ],
    'Définir la transformation': [
      'Écris ce que ton audience saura, fera ou ressentira après ton contenu/offre',
      '3 bénéfices mesurables (compétence, revenu, confiance…)',
      'Compare avec créateur concurrent : ta voix/format unique',
    ],
    'Hypothèse de marché': [
      'Niche audience + format principal + plateforme #1',
      'Liste 3 créateurs/comptes où ton audience est déjà',
      'Critère fan idéal : engagement, pouvoir achat, problème clair',
    ],
    'Persona & contexte d\'achat': [
      'Persona audience : habitudes contenu, budget formation/produits',
      'Objections : temps, prix, « contenu gratuit suffit »',
      'Déclencheur : lancement, promo, FOMO, saison',
    ],
    'Forme juridique. Anticiper (appliquer plus tard)': [
      'Micro pour premiers revenus ; SASU si produits, équipe ou revente',
      'Signaux : revenus récurrents, sponsors, produits digitaux',
      'Statut cible sans formaliser avant 1ère vente',
    ],
    'Échanges terrain': [
      'Sonde 3 personnes cible sur contenu consommé et payé',
      'Pose : format préféré, prix acceptable, problème #1',
      'Note verbatim et idées contenu',
    ],
    'Synthèse terrain & bilan semaine 1': [
      'Synthétise 3 insights audience (format, prix, problème)',
      'Cohérence niche ↔ monétisation',
      'Objectif S2 : hub créateur + 1er lead magnet défini',
    ],
    'Différenciation': [
      'Voix unique + format signature + preuve audience engagée',
      '3 raisons de te suivre vs créateur #1 de ta niche',
      'Réponse « pourquoi payer alors que YouTube est gratuit ? »',
    ],
    'Pitch & accroche': [
      'Bio 2 lignes + promesse audience + CTA principal',
      'Headline link-in-bio orientée transformation',
      '3 bullets offre ou newsletter',
    ],
    'Preuves & crédibilité': [
      'Stats audience, engagement, extraits contenu top performer',
      '2 témoignages ou DM positifs (screenshot anonymisé)',
      'FAQ : fréquence, prix, résultats attendus',
    ],
    'Supports de vente': [
      'Media kit ou page offres : stats, formats, tarifs, CTA',
      'Template pitch sponsor ou partenariat',
      'Script call partenariat/vente 15 min',
    ],
    'Choix des canaux': [
      'Plateforme #1, newsletter, SEO, collabs créateurs',
      'Score effort par canal',
      '2 canaux semaine 4 + quota contenu (ex. 5 posts + 1 email)',
    ],
    'Bilan semaine 2': [
      'Hub oriente vers action monétisable ?',
      'Feedback 2 abonnés sur clarté offre',
      '3 ajustements (CTA, lead magnet, bio)',
    ],
    'Bilan semaine 3': [
      'Test parcours : hub → lead magnet → email → offre',
      'Corrige frictions inscription email/produit',
      'Liste 20 collabs ou clients potentiels',
    ],
    'Liste de prospects': [
      '20 marques sponsors, partenaires ou clients formation alignés niche',
      'Top 10 avec audience overlap',
      'Angle collab par contact',
    ],
    'Séquence de prospection': [
      'Message collab : valeur audience + proposition win-win',
      'Relance J+3 avec exemple contenu à forte perf',
      '5 DMs/emails personnalisés',
    ],
    'Relances & conversations': [
      'Relance avec contenu gratuit à forte valeur + CTA soft',
      'Propose call 15 min partenariat',
      'Note objections récurrentes',
    ],
    'Appels de découverte': [
      '2 calls : audience → offre → partenariat ou vente directe',
      'Script découverte + next step',
      'Envoi récap + lien offre sous 24 h',
    ],
    'Proposition & closing': [
      'Proposition partenariat ou vente package (prix, livrables, délai)',
      'Offre early bird audience fidèle si pertinent',
      'Deadline 48 h',
    ],
    'Livraison & feedback': [
      'Livre produit/contenu + demande témoignage ou UGC',
      '3 questions satisfaction',
      'Note temps production vs prévu',
    ],
    'Itération offre': [
      'Double sur format/contenu qui convertit',
      'Ajuste pricing ou packaging produit digital',
      'Mets à jour hub avec preuves sociales',
    ],
    'Bilan 30 jours & suite': [
      'KPIs : abonnés, ouverture email, ventes, revenus divers',
      '3 victoires + 3 axes croissance',
      'Objectif revenus ou audience mois 2',
    ],
  },
};

/** Overrides OnlyFans Management (famille creator trop générique). */
const MONTH1_OFM_OVERRIDES: Record<string, string[]> = {
  'Clarifier le problème': [
    'Formule problème modèle OnlyFans : acquisition abonnés, ops chatting, monétisation PPV',
    'Échange avec 2 modèles (sans pitch) : plus gros blocage business actuel',
    'Vérifie que le modèle paierait commission agence pour ce problème',
  ],
  'Hypothèse de marché': [
    'Cible type modèles OnlyFans : niche, revenus $/mois, objectifs croissance',
    'Canaux recrutement : Twitter/X, Instagram, réseau managers OFM',
    'Critère bon modèle : abonnés existants, motivation, alignement charte éthique',
  ],
  'Échanges terrain': [
    'Échange avec 3 modèles OnlyFans sur blocages (sans promesse de $ fixe)',
    'Pose : revenus actuels, temps chatting, acquisition abonnés',
    'Note mots exacts et niveau confiance secteur',
  ],
  'Synthèse terrain & bilan semaine 1': [
    'Synthétise 3 insights modèles (commission acceptable, services demandés)',
    'Cohérence problème ↔ offre OFM',
    'Objectif S2 : offre OFM + charte modèle rédigée',
  ],
  'Liste de prospects': [
    '20 modèles OnlyFans niche : @, abonnés estimés, blocage business',
    'Top 10 avec croissance possible + charte compatible',
    'Angle DM personnalisé (contenu récent, compliment spécifique)',
  ],
  'Séquence de prospection': [
    'DM respectueux + charte OFM jointe + proposition call 20 min',
    'Relance J+3 avec ressource éducative (pas promesse revenus)',
    '5 DM qualifiés aujourd\'hui',
  ],
  'Appels de découverte': [
    'Call : objectifs modèle → services OFM → commission % → étape contrat',
    'Modèle reste décisionnaire contenu. Tu présentes ops pro',
    'Envoi récap + contrat draft sous 24 h',
  ],
  'Proposition & closing': [
    'Contrat OFM : services, commission revenus OnlyFans, durée, clause sortie',
    'Période test 30 j commission réduite si utile',
    'Deadline signature 48 h',
  ],
  'Livraison & feedback': [
    'Onboarding : accès, calendrier contenu, shifts chatting, reporting revenus',
    'Feedback modèle : transparence commission, qualité ops',
    'Note temps setup vs prévu',
  ],
  'Bilan 30 jours & suite': [
    'KPIs : modèles contactés, calls, contrats signés, commission $ estimée',
    '3 victoires + 3 axes (recrutement, ops, charte)',
    'Objectif modèles signés mois 2',
  ],
};

export function resolveMonth1BusinessTasks(
  businessId: BusinessId,
  title: string
): string[] | null {
  if (businessId === 'ofm') {
    const ofm = MONTH1_OFM_OVERRIDES[title];
    if (ofm?.length) return ofm;
  }

  const family = BUSINESS_FAMILY[businessId];
  const familyTasks = MONTH1_FAMILY_TASKS[family]?.[title];
  if (familyTasks?.length) return familyTasks;

  return null;
}

export function buildMonth1TasksFromBlueprint(
  businessId: BusinessId,
  title: string,
  baseTasks: string[],
  businessFocus: string
): string[] {
  const overlay = resolveMonth1BusinessTasks(businessId, title);
  if (overlay?.length) return overlay;

  if (!baseTasks.length) return businessFocus ? [businessFocus] : [];

  const adapted = adaptGenericTasksToBusiness(
    businessId,
    baseTasks.slice(0, 2),
    title
  );
  const third = baseTasks[2] ?? businessFocus;
  const tasks = [...adapted, third].filter(Boolean);

  return tasks.length >= 3 ? tasks.slice(0, 3) : tasks;
}
