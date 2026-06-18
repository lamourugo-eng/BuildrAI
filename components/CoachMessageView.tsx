'use client';

import {
  extractCoachToolsContent,
  formatCoachHeadingLine,
  isCoachHeadingLine,
  parseCoachMessage,
  stripCoachToolSections,
  stripMarkdownBold,
} from '@/lib/coach/parse-message';

interface CoachMessageViewProps {
  content: string;
}

function CoachTextBlock({ text }: { text: string }) {
  const lines = stripMarkdownBold(text)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim());

  return (
    <div className="coach-msg-block-body">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (isCoachHeadingLine(trimmed)) {
          const level = trimmed.match(/^(#+)/)?.[1].length ?? 3;
          return (
            <p
              key={i}
              className={
                level <= 2
                  ? 'coach-msg-heading coach-msg-heading--main'
                  : 'coach-msg-heading'
              }
            >
              {formatCoachHeadingLine(trimmed)}
            </p>
          );
        }
        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
}

function CoachToolsPanel({ tools }: { tools: string }) {
  if (!tools.trim()) return null;

  return (
    <details className="coach-msg-details coach-msg-details--tools">
      <summary>
        <span className="coach-msg-details-chevron" aria-hidden="true">
          ▾
        </span>
        <span aria-hidden="true">🛠️</span>
        Outils recommandés
      </summary>
      <CoachTextBlock text={tools} />
    </details>
  );
}

export function stripCoachToolSection(content: string): string {
  return stripCoachToolSections(content);
}

export default function CoachMessageView({ content }: CoachMessageViewProps) {
  const parsed = parseCoachMessage(content);
  const toolsContent =
    extractCoachToolsContent(content) || parsed.tool.trim();
  const bodyWithoutTools = stripCoachToolSections(content);

  if (!parsed.structured) {
    return (
      <>
        <CoachTextBlock text={bodyWithoutTools} />
        <CoachToolsPanel tools={toolsContent} />
      </>
    );
  }

  return (
    <div className="coach-msg-structured">
      {parsed.situation && (
        <p className="coach-msg-situation">
          <span className="coach-msg-icon" aria-hidden="true">
            🎯
          </span>
          {stripMarkdownBold(parsed.situation)}
        </p>
      )}

      {parsed.parcours && (
        <div className="coach-msg-step-pill">
          <span className="coach-msg-step-icon" aria-hidden="true">
            📍
          </span>
          {stripMarkdownBold(parsed.parcours)}
        </div>
      )}

      {parsed.nextStep && (
        <div className="coach-msg-action">
          <span className="coach-msg-label">
            <span aria-hidden="true">➡️</span> À faire maintenant
          </span>
          <CoachTextBlock text={parsed.nextStep} />
        </div>
      )}

      {parsed.deliverable && (
        <div className="coach-msg-deliverable">
          <span className="coach-msg-label">
            <span aria-hidden="true">✅</span> Ton livrable
          </span>
          <CoachTextBlock text={parsed.deliverable} />
        </div>
      )}

      {parsed.plan && (
        <details className="coach-msg-details">
          <summary>
            <span className="coach-msg-details-chevron" aria-hidden="true">
              ▾
            </span>
            <span aria-hidden="true">📋</span>
            Parcours restant
          </summary>
          <CoachTextBlock text={parsed.plan} />
        </details>
      )}

      <CoachToolsPanel tools={toolsContent} />
    </div>
  );
}
