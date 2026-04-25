import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';

// ─── SIMPLE MARKDOWN RENDERER ─────────────────────────────────────────────────
// Handles the subset of markdown used in Clutchr content cards:
// # H1, ## H2, ### H3, **bold**, *italic*, - bullet, numbered lists, blank lines

interface Props {
  content: string;
}

type Block =
  | { kind: 'h1'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'numbered'; n: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'divider' };

function parseBlocks(raw: string): Block[] {
  const lines = raw.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '' || trimmed === '---' || trimmed === '___') {
      // Only add divider if previous block wasn't already a divider/empty
      if (blocks.length > 0 && blocks[blocks.length - 1].kind !== 'divider') {
        blocks.push({ kind: 'divider' });
      }
      i++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      blocks.push({ kind: 'h3', text: trimmed.slice(4).trim() });
      i++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push({ kind: 'h2', text: trimmed.slice(3).trim() });
      i++;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      blocks.push({ kind: 'h1', text: trimmed.slice(2).trim() });
      i++;
      continue;
    }

    // Bullets: -, *, •
    if (/^[-*•]\s/.test(trimmed)) {
      blocks.push({ kind: 'bullet', text: trimmed.slice(2).trim() });
      i++;
      continue;
    }

    // Numbered list: 1. 2. etc
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      blocks.push({ kind: 'numbered', n: parseInt(numMatch[1]), text: numMatch[2].trim() });
      i++;
      continue;
    }

    // Everything else is a paragraph
    blocks.push({ kind: 'paragraph', text: trimmed });
    i++;
  }

  return blocks;
}

// Inline bold/italic parser
function InlineText({ text, style }: { text: string; style?: any }) {
  // Split on **bold** and *italic* patterns
  const parts: { content: string; bold: boolean; italic: boolean }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const boldIdx = remaining.indexOf('**');
    const italicIdx = remaining.indexOf('*');

    if (boldIdx !== -1 && (italicIdx === -1 || boldIdx <= italicIdx)) {
      // Bold
      if (boldIdx > 0) parts.push({ content: remaining.slice(0, boldIdx), bold: false, italic: false });
      const endBold = remaining.indexOf('**', boldIdx + 2);
      if (endBold !== -1) {
        parts.push({ content: remaining.slice(boldIdx + 2, endBold), bold: true, italic: false });
        remaining = remaining.slice(endBold + 2);
      } else {
        parts.push({ content: remaining.slice(boldIdx), bold: false, italic: false });
        remaining = '';
      }
    } else if (italicIdx !== -1) {
      // Italic
      if (italicIdx > 0) parts.push({ content: remaining.slice(0, italicIdx), bold: false, italic: false });
      const endItalic = remaining.indexOf('*', italicIdx + 1);
      if (endItalic !== -1) {
        parts.push({ content: remaining.slice(italicIdx + 1, endItalic), bold: false, italic: true });
        remaining = remaining.slice(endItalic + 1);
      } else {
        parts.push({ content: remaining.slice(italicIdx), bold: false, italic: false });
        remaining = '';
      }
    } else {
      parts.push({ content: remaining, bold: false, italic: false });
      remaining = '';
    }
  }

  if (parts.length === 1 && !parts[0].bold && !parts[0].italic) {
    return <Text style={style}>{parts[0].content}</Text>;
  }

  return (
    <Text style={style}>
      {parts.map((p, i) => (
        <Text
          key={i}
          style={[
            style,
            p.bold && { fontFamily: 'Inter_700Bold' },
            p.italic && { fontStyle: 'italic' },
          ]}
        >
          {p.content}
        </Text>
      ))}
    </Text>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function MarkdownRenderer({ content }: Props) {
  if (!content) return null;

  const blocks = parseBlocks(content);

  return (
    <View style={styles.container}>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'h1':
            return <InlineText key={i} text={block.text} style={styles.h1} />;
          case 'h2':
            return <InlineText key={i} text={block.text} style={styles.h2} />;
          case 'h3':
            return <InlineText key={i} text={block.text} style={styles.h3} />;
          case 'bullet':
            return (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <InlineText text={block.text} style={styles.bulletText} />
              </View>
            );
          case 'numbered':
            return (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.numberedNum}>{block.n}.</Text>
                <InlineText text={block.text} style={styles.bulletText} />
              </View>
            );
          case 'paragraph':
            return <InlineText key={i} text={block.text} style={styles.paragraph} />;
          case 'divider':
            return <View key={i} style={styles.divider} />;
          default:
            return null;
        }
      })}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },

  h1: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 26,
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  h2: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    lineHeight: 22,
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  h3: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    lineHeight: 20,
    marginTop: Spacing.xs,
    letterSpacing: 0.3,
  },

  paragraph: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    lineHeight: 24,
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    marginTop: 9,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    lineHeight: 24,
    flex: 1,
  },

  numberedNum: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    lineHeight: 24,
    minWidth: 22,
    flexShrink: 0,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
});
