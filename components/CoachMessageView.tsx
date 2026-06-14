'use client';

import {
  parseCoachMessage,
  stripMarkdownBold,
} from '@/lib/coach/parse-message';

interface CoachMessageViewProps {
  content: string;
}

function TextBlock({ text }: { text: string }) {
  return (
    <div className="coach-msg-block-body">
      {stripMarkdownBold(text)
        .split('\n')
        .filter((line) => line.trim())
        .map((line, i) => (
          <p key={i}>{line}</p>
        ))}
    </div>
  );
}

export default function CoachMessageView({ content }: CoachMessageViewProps) {
  const parsed = parseCoachMessage(content);

  if (!parsed.structured) {
    return <p className="coach-message-text">{stripMarkdownBold(content)}</p>;
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
          <TextBlock text={parsed.nextStep} />
        </div>
      )}

      {parsed.deliverable && (
        <div className="coach-msg-deliverable">
          <span className="coach-msg-label">
            <span aria-hidden="true">✅</span> Ton livrable
          </span>
          <TextBlock text={parsed.deliverable} />
        </div>
      )}

      {parsed.tool && (
        <details className="coach-msg-details">
          <summary>
            <span aria-hidden="true">🛠️</span> Outil recommandé
          </summary>
          <TextBlock text={parsed.tool} />
        </details>
      )}

      {parsed.plan && (
        <details className="coach-msg-details">
          <summary>
            <span aria-hidden="true">📋</span> Parcours restant
          </summary>
          <TextBlock text={parsed.plan} />
        </details>
      )}
    </div>
  );
}
