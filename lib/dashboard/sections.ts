import type { SideNavIconId } from '@/components/SideNav';

export type DashboardSection =
  | 'overview'
  | 'coach'
  | 'parcours'
  | 'profil'
  | 'activite'
  | 'analyse'
  | 'ressources'
  | 'ville'
  | 'blocnotes'
  | 'abonnement'
  | 'assistance';

export const LOCKED_SECTIONS = new Set<DashboardSection>([
  'coach',
  'activite',
  'analyse',
  'ressources',
]);

type DashboardSectionDef = {
  id: DashboardSection;
  label: string;
  description: string;
  icon: SideNavIconId;
  href: string;
  growthOnly?: boolean;
};

const DASHBOARD_SECTION_MAP: Record<DashboardSection, DashboardSectionDef> = {
  overview: {
    id: 'overview',
    label: 'Vue d\'ensemble',
    icon: 'space',
    description: 'Résumé de ta progression',
    href: '/espace',
  },
  coach: {
    id: 'coach',
    label: 'Coach IA',
    icon: 'coach',
    description: 'Construis ton projet étape par étape',
    href: '/espace?section=coach',
  },
  parcours: {
    id: 'parcours',
    label: 'Parcours',
    icon: 'flow',
    description: 'Plan 180 jours (6 chapitres) calibré sur ton modèle. 8 étapes coach',
    href: '/espace?section=parcours',
  },
  profil: {
    id: 'profil',
    label: 'Profil',
    icon: 'profile',
    description: 'Ton profil entrepreneurial',
    href: '/espace?section=profil',
  },
  analyse: {
    id: 'analyse',
    label: 'Analyse hebdo',
    icon: 'flow',
    description: 'Bilan approfondi. Business Accelerator (79 €/mois)',
    href: '/espace?section=analyse',
    growthOnly: true,
  },
  ressources: {
    id: 'ressources',
    label: 'Ressources',
    icon: 'grid',
    description: 'Bibliothèque templates & prompts. Business Accelerator',
    href: '/espace?section=ressources',
    growthOnly: true,
  },
  activite: {
    id: 'activite',
    label: 'Activité',
    icon: 'grid',
    description: 'Coach, parcours 180 jours, ville et régularité',
    href: '/espace?section=activite',
  },
  abonnement: {
    id: 'abonnement',
    label: 'Abonnement',
    icon: 'pricing',
    description: 'Formule, facturation et changement de plan',
    href: '/espace?section=abonnement',
  },
  ville: {
    id: 'ville',
    label: 'Ma ville',
    icon: 'space',
    description: 'Crée ton personnage et suis ton empire',
    href: '/espace?section=ville',
  },
  blocnotes: {
    id: 'blocnotes',
    label: 'Bloc-notes',
    icon: 'mail',
    description: 'Notes personnelles sauvegardées',
    href: '/espace?section=blocnotes',
  },
  assistance: {
    id: 'assistance',
    label: 'Assistance',
    icon: 'help',
    description: 'Aide, guides et contact direct avec le créateur',
    href: '/espace?section=assistance',
  },
};

/** Ordre d'importance dans le menu latéral (haut → bas). */
export const DASHBOARD_SECTION_ORDER: DashboardSection[] = [
  'overview',
  'coach',
  'parcours',
  'ville',
  'profil',
  'analyse',
  'ressources',
  'activite',
  'abonnement',
  'blocnotes',
  'assistance',
];

/** Raccourcis visibles en barre horizontale (mobile). */
export const DASHBOARD_PRIMARY_SECTIONS: DashboardSection[] = [
  'overview',
  'coach',
  'parcours',
  'ville',
  'profil',
];

export const DASHBOARD_NAV_GROUPS: {
  id: string;
  label: string;
  sections: DashboardSection[];
}[] = [
  {
    id: 'journey',
    label: 'Ton parcours',
    sections: ['overview', 'coach', 'parcours', 'ville'],
  },
  {
    id: 'profile',
    label: 'Profil & suivi',
    sections: ['profil', 'activite', 'blocnotes'],
  },
  {
    id: 'accelerator',
    label: 'Business Accelerator',
    sections: ['analyse', 'ressources'],
  },
  {
    id: 'account',
    label: 'Compte',
    sections: ['abonnement', 'assistance'],
  },
];

export const DASHBOARD_SECTIONS: DashboardSectionDef[] = DASHBOARD_SECTION_ORDER.map(
  (id) => DASHBOARD_SECTION_MAP[id]
);

export function resolveDashboardSection(
  raw: string | null | undefined
): DashboardSection {
  const normalized =
    raw === 'roadmap' ? 'parcours' : raw === 'recompenses' ? 'ville' : raw;
  if (normalized && DASHBOARD_SECTION_MAP[normalized as DashboardSection]) {
    return normalized as DashboardSection;
  }
  return 'overview';
}
