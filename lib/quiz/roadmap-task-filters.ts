/** Tâches « bloc focus 45 min » à exclure du parcours et de l'UI. */
const FOCUS_BLOCK_TASK_PATTERN =
  /bloc\s*focus|bloque(?:r)?\s+45\s*min|bloc\s+de\s+45|45\s*minutes?\s+(?:pour|de)|sans\s+distractions?|concentrer\s+sur\s+cette\s+recherche|t[eé]l[eé]phone\s+en\s+silencieux/i;

export function isFocusBlockTask(task: string): boolean {
  return FOCUS_BLOCK_TASK_PATTERN.test(task.trim());
}

export function withoutFocusBlockTasks(tasks: string[]): string[] {
  return tasks.filter((task) => !isFocusBlockTask(task));
}
