import React from 'react';

interface EventDocumentDetailsProps {
  text?: string;
  className?: string;
}

interface DocumentBlock {
  type: 'paragraph' | 'heading' | 'list';
  text?: string;
  items?: string[];
  isNumbered?: boolean;
}

/**
 * Parses raw event description strings into a structured document layout
 * supporting paragraphs, subheadings, and clean bullet/numbered lists.
 * Handles both multiline text (with newlines) and inline bullet strings
 * (e.g. "Intro text. What we'll cover: • Bullet 1 • Bullet 2").
 */
export function parseEventDocument(rawText?: string): DocumentBlock[] {
  if (!rawText || typeof rawText !== 'string') return [];

  let text = rawText.replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  // Normalize inline bullets '•' to ensure they start on new lines
  if (text.includes('•')) {
    text = text.replace(/\s*•\s*/g, '\n• ');
  }

  // Normalize inline dashes when preceded by a colon or sentence punctuation
  text = text.replace(/:\s*-\s+/g, ':\n- ');
  text = text.replace(/([.?!])\s*-\s+/g, '$1\n- ');

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const blocks: DocumentBlock[] = [];
  let currentList: { type: 'list'; items: string[]; isNumbered: boolean } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for bullet list item: starts with •, -, *, or 1. / 2.
    const bulletMatch = line.match(/^([•\-\*]|\d+\.)\s*(.*)$/);
    if (bulletMatch) {
      const isNumbered = /^\d+\./.test(bulletMatch[1]);
      if (!currentList || currentList.isNumbered !== isNumbered) {
        currentList = { type: 'list', items: [], isNumbered };
        blocks.push(currentList);
      }
      currentList.items.push(bulletMatch[2].trim());
      continue;
    }

    // Not a bullet line, close any current list
    currentList = null;

    // Check if line contains a sub-heading (either entire line ends with ':', or ends with a label like '... What we\'ll cover:')
    if (line.endsWith(':')) {
      // Check if there is an introductory sentence preceding this heading on the same line
      // e.g. "An interactive online session... Guest Faculty Teacher. What we'll cover:"
      const inlineHeadingMatch = line.match(/^(.*?[.?!])\s+([A-Za-z0-9\s'’/&()-]{2,50}:)$/);
      if (inlineHeadingMatch) {
        blocks.push({ type: 'paragraph', text: inlineHeadingMatch[1].trim() });
        blocks.push({ type: 'heading', text: inlineHeadingMatch[2].trim() });
      } else {
        // Also check if there's common phrases without punctuation before it
        const commonPhraseMatch = line.match(/^(.*?)\s+(What we'll cover:|What we will cover:|Topics covered:|Agenda:|Session highlights:|Prerequisites:|Who should attend:|Key takeaways:|Learning outcomes:)\s*$/i);
        if (commonPhraseMatch) {
          blocks.push({ type: 'paragraph', text: commonPhraseMatch[1].trim() });
          blocks.push({ type: 'heading', text: commonPhraseMatch[2].trim() });
        } else {
          blocks.push({ type: 'heading', text: line });
        }
      }
      continue;
    }

    // Standard paragraph
    blocks.push({ type: 'paragraph', text: line });
  }

  return blocks;
}

/**
 * Formats inline bold text (**bold**) or emphasis
 */
function renderInlineFormattedText(content: string): React.ReactNode {
  if (!content.includes('**')) {
    return content;
  }

  const parts = content.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-extrabold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export const EventDocumentDetails: React.FC<EventDocumentDetailsProps> = ({
  text,
  className = ''
}) => {
  if (!text || !text.trim()) {
    return (
      <p className="text-xs text-slate-500 italic">No event description provided.</p>
    );
  }

  const blocks = parseEventDocument(text);

  return (
    <div className={`space-y-2 text-xs leading-relaxed ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'heading') {
          return (
            <h5
              key={idx}
              className="font-bold text-slate-900 text-xs mt-3 first:mt-0 mb-1 tracking-tight"
            >
              {block.text}
            </h5>
          );
        }

        if (block.type === 'list') {
          if (block.isNumbered) {
            return (
              <ol key={idx} className="space-y-1.5 my-2 pl-1 sm:pl-2">
                {block.items?.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start text-xs text-slate-700 leading-relaxed">
                    <span className="inline-block font-mono font-bold text-slate-900 text-xs mr-2 select-none mt-0.5">
                      {itemIdx + 1}.
                    </span>
                    <span className="flex-1">{renderInlineFormattedText(item)}</span>
                  </li>
                ))}
              </ol>
            );
          }

          return (
            <ul key={idx} className="space-y-1.5 my-2 pl-1 sm:pl-2">
              {block.items?.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start text-xs text-slate-700 leading-relaxed">
                  <span className="inline-block text-slate-900 font-extrabold text-sm mr-2.5 leading-none select-none mt-0.5">
                    •
                  </span>
                  <span className="flex-1">{renderInlineFormattedText(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="text-xs text-slate-700 leading-relaxed">
            {renderInlineFormattedText(block.text || '')}
          </p>
        );
      })}
    </div>
  );
};
