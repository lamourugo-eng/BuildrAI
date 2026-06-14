# BuildrAI

Coaching IA pour entrepreneurs — landing page, questionnaire de profil, et base Next.js prête pour Supabase + Stripe.

## Démarrage

```bash
cd founder-coach
npm install
cp .env.example .env.local   # puis renseigner les clés
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Structure

| Dossier | Rôle |
|---------|------|
| `app/` | Pages Next.js (accueil, login, dashboard, API Stripe) |
| `components/` | UI React (quiz, header, sections landing) |
| `lib/quiz/` | Données et scoring du questionnaire |
| `lib/supabase/` | Clients Supabase (browser + serveur) |
| `lib/stripe.ts` | Helpers Stripe |
| `legacy/` | Ancienne version HTML statique (référence) |

## Questionnaire

6 questions → 8 profils business (SaaS, Freelance, E-commerce, etc.) avec résultats détaillés (%, dimensions, recommandations).

## Production (Vercel)

Site en ligne : [https://buildrai-xi.vercel.app](https://buildrai-xi.vercel.app)

```bash
npm run prod:checklist
```

Affiche les variables Vercel à copier, la config Supabase auth et le webhook Stripe.

### Vercel — variables d'environnement

Sur **Settings → Environment Variables** (Production), copiez depuis `.env.local` **sauf** :

| Variable | Valeur prod |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://buildrai-xi.vercel.app` |
| Autres clés | Identiques à `.env.local` (Supabase, OpenAI, Stripe, ADMIN_EMAILS) |

Ne jamais mettre `http://localhost:3000` en production sur Vercel.

## Supabase (auth magic link)

1. Copier l'URL et les clés dans `.env.local`
2. Dashboard Supabase → **Authentication → URL Configuration** :
   - Site URL : `https://buildrai-xi.vercel.app`
   - Redirect URLs : `https://buildrai-xi.vercel.app/auth/callback/**` et `http://localhost:3000/auth/callback/**`
   - En local, les liens email ne fonctionnent pas sur téléphone (localhost). Utilisez l'URL de prod.
3. Vercel : `NEXT_PUBLIC_APP_URL` = même URL que le Site URL Supabase
4. `/login` — inscription / connexion par email
5. `/espace` — tableau de bord abonné (connexion requise)

## Mémoire produit du coach

Chaque client connecté dispose d'un **dossier de suivi** persisté dans Supabase (historique, point d'avancement, résumé IA).

1. Supabase Dashboard → **SQL Editor** → exécuter `supabase/migrations/001_coach_memory.sql` puis `002_coach_journey_phase.sql`
2. Les tables `coach_threads` et `coach_messages` sont créées avec RLS (chaque utilisateur ne voit que ses données)
3. Au retour sur le coach : message *« La dernière fois, on était arrivés à… »* + historique complet
4. Les visiteurs non connectés gardent une mémoire locale (`localStorage`) importée automatiquement à la première connexion

## Stripe

### Formules (alignées sur l'app)

| ID interne | Nom Stripe | Mensuel | Annuel (-40 %) |
|------------|------------|---------|----------------|
| `starter` | Premium | 29 € | 204 €/an (17 €/mois) |
| `growth` | Premium — Business Accelerator | 99 € | 708 €/an (59 €/mois) |

Pas d'essai gratuit 14 jours. Le plan **Gratuit** reste côté app uniquement (sans Stripe).

### Configuration

1. Ajouter `STRIPE_SECRET_KEY` dans `.env.local` ([clés API Stripe](https://dashboard.stripe.com/apikeys))
2. Lancer la synchro automatique :

```bash
npm run stripe:sync
```

Le script crée/renomme les produits, met à jour les prix, archive l'ancien plan Scale et écrit les `STRIPE_PRICE_*` dans `.env.local`.

3. Optionnel : `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. `POST /api/stripe/checkout` — session Checkout
5. `POST /api/stripe/webhook` — synchronise les abonnements (TODO Supabase)

## Scripts

- `npm run dev` — développement
- `npm run build` — build production
- `npm run start` — serveur production
