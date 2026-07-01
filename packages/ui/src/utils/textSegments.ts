export interface TextSegment {
  text: string;
  mark: boolean;
}

export function highlightQuerySegments(text: string, query: string): TextSegment[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [{ text, mark: false }];

  const lowerText = text.toLowerCase();
  const lowerQuery = normalizedQuery.toLowerCase();
  const segments: TextSegment[] = [];
  let cursor = 0;
  let index = lowerText.indexOf(lowerQuery);

  while (index !== -1) {
    if (cursor < index) {
      segments.push({ text: text.slice(cursor, index), mark: false });
    }
    const end = index + normalizedQuery.length;
    segments.push({ text: text.slice(index, end), mark: true });
    cursor = end;
    index = lowerText.indexOf(lowerQuery, cursor);
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), mark: false });
  }
  return segments.length ? segments : [{ text, mark: false }];
}

export function highlightRangeSegments(
  text: string,
  ranges: Array<[number, number]>,
): TextSegment[] {
  if (!ranges.length) return [{ text, mark: false }];

  const merged: Array<[number, number]> = [];
  for (const [rawStart, rawEnd] of [...ranges].sort((a, b) => a[0] - b[0])) {
    const start = Math.max(0, Math.min(text.length, rawStart));
    const end = Math.max(start, Math.min(text.length, rawEnd));
    if (start === end) continue;

    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  if (!merged.length) return [{ text, mark: false }];

  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (cursor < start) {
      segments.push({ text: text.slice(cursor, start), mark: false });
    }
    segments.push({ text: text.slice(start, end), mark: true });
    cursor = end;
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), mark: false });
  }
  return segments;
}
