/**
 * Applique les migrations Supabase manquantes (004 + 005).
 * Usage :
 *   SUPABASE_DB_PASSWORD=votre_mot_de_passe node scripts/apply-supabase-migrations.mjs
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import pg from 'pg';

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const password = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD;

if (!projectRef) {
  console.error('NEXT_PUBLIC_SUPABASE_URL manquant dans .env.local');
  process.exit(1);
}

if (!password) {
  console.error('Mot de passe base de données requis.');
  console.error('Supabase → Project Settings → Database → Database password');
  console.error('Puis : SUPABASE_DB_PASSWORD=xxx npm run db:apply-migrations');
  console.error('\nOu exécutez dans le SQL Editor :');
  console.error('  supabase/migrations/004_user_profiles.sql');
  console.error('  supabase/migrations/005_coach_token_usage.sql');
  process.exit(1);
}

const connectionString =
  process.env.SUPABASE_DB_URL ||
  `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;

const migrationFiles = readdirSync(resolve(process.cwd(), 'supabase/migrations'))
  .filter((name) => name.endsWith('.sql'))
  .sort();

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  for (const file of migrationFiles) {
    const sql = readFileSync(resolve(process.cwd(), 'supabase/migrations', file), 'utf8');
    await client.query(sql);
    console.log(`✓ ${file}`);
  }
  console.log('\nToutes les migrations ont été appliquées.');
} catch (err) {
  console.error('✗ Échec migration:', err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await client.end();
}
