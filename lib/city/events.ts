/** Déclenché après une action qui modifie la progression ville / analytics (même onglet) */
export const CITY_REFRESH_EVENT = 'buildrai:city-refresh';

export function emitCityRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CITY_REFRESH_EVENT));
}
