const WORD_START = /[A-Za-z_$]/;
const WORD_PART = /[\w$-]/;

export function findModuleSpecifiers(source, filePath = "source.ts") {
  if (filePath.endsWith(".css")) return findCssImports(source);
  if (filePath.endsWith(".vue")) return findVueImports(source);
  const ranges = [[0, source.length]];
  return ranges.flatMap(([start, end]) => findJavaScriptImports(source, start, end));
}

export function rewriteModuleSpecifiers(source, filePath, replace) {
  const edits = findModuleSpecifiers(source, filePath)
    .map((item) => ({ ...item, replacement: replace(item.value) }))
    .filter((item) => item.replacement !== item.value);
  let output = source;
  for (const edit of edits.reverse()) {
    output = `${output.slice(0, edit.start)}${edit.replacement}${output.slice(edit.end)}`;
  }
  return { content: output, changed: edits.length > 0, edits: edits.reverse() };
}

function findJavaScriptImports(source, start, end) {
  const tokens = tokenize(source, start, end);
  const found = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== "word" || !["import", "export"].includes(token.value)) continue;
    const direct = tokens[index + 1];
    if (token.value === "import" && direct?.type === "string") found.push(direct);
    if (token.value === "import" && direct?.value === "(" && isModuleToken(tokens[index + 2])) {
      found.push(tokens[index + 2]);
    }
    for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
      const candidate = tokens[cursor];
      if (candidate.value === ";" || candidate.type === "word" && ["import", "export"].includes(candidate.value)) break;
      if (candidate.type === "word" && candidate.value === "from" && tokens[cursor + 1]?.type === "string") {
        found.push(tokens[cursor + 1]);
        break;
      }
    }
  }
  return uniqueRanges(found);
}

function tokenize(source, start, end) {
  const tokens = [];
  let index = start;
  while (index < end) {
    const char = source[index];
    if (/\s/.test(char)) { index += 1; continue; }
    if (char === "/" && source[index + 1] === "/") { index = skipLine(source, index + 2, end); continue; }
    if (char === "/" && source[index + 1] === "*") { index = skipBlock(source, index + 2, end); continue; }
    if (char === "'" || char === '"') {
      const token = readString(source, index, end, char);
      tokens.push(token);
      index = token.close + 1;
      continue;
    }
    if (char === "`") {
      const template = readTemplate(source, index, end);
      if (template.token) tokens.push(template.token);
      index = template.close + 1;
      continue;
    }
    if (WORD_START.test(char)) {
      const wordStart = index++;
      while (index < end && WORD_PART.test(source[index])) index += 1;
      tokens.push({ type: "word", value: source.slice(wordStart, index), start: wordStart, end: index });
      continue;
    }
    tokens.push({ type: "punct", value: char, start: index, end: index + 1 });
    index += 1;
  }
  return tokens;
}

function readString(source, open, end, quote) {
  let index = open + 1;
  while (index < end) {
    if (source[index] === "\\") { index += 2; continue; }
    if (source[index] === quote) {
      return { type: "string", value: source.slice(open + 1, index), start: open + 1, end: index, close: index };
    }
    index += 1;
  }
  throw new Error("Cannot safely parse an unterminated module string.");
}

function skipLine(source, index, end) {
  const next = source.indexOf("\n", index);
  return next < 0 || next >= end ? end : next + 1;
}

function skipBlock(source, index, end) {
  const next = source.indexOf("*/", index);
  if (next < 0 || next >= end) throw new Error("Cannot safely parse an unterminated block comment.");
  return next + 2;
}

function readTemplate(source, open, end) {
  let index = open + 1;
  let interpolated = false;
  while (index < end) {
    if (source[index] === "\\") { index += 2; continue; }
    if (source[index] === "$" && source[index + 1] === "{") interpolated = true;
    if (source[index] === "`") {
      return {
        close: index,
        token: {
          type: interpolated ? "template" : "string",
          value: source.slice(open + 1, index),
          start: open + 1,
          end: index,
          dynamic: interpolated,
        },
      };
    }
    index += 1;
  }
  throw new Error("Cannot safely parse an unterminated template literal.");
}

function findVueImports(source) {
  return [
    ...vueScriptRanges(source).flatMap(([start, end]) => findJavaScriptImports(source, start, end)),
    ...findVueStyleImports(source),
  ];
}

function vueScriptRanges(source) {
  const ranges = [];
  let cursor = 0;
  while (cursor < source.length) {
    const open = source.toLowerCase().indexOf("<script", cursor);
    if (open < 0) break;
    const body = source.indexOf(">", open + 7);
    const close = source.toLowerCase().indexOf("</script>", body + 1);
    if (body < 0 || close < 0) throw new Error("Cannot safely parse an unterminated Vue script block.");
    ranges.push([body + 1, close]);
    cursor = close + 9;
  }
  return ranges;
}

function findVueStyleImports(source) {
  const imports = [];
  const lower = source.toLowerCase();
  let cursor = 0;
  while (cursor < source.length) {
    const open = lower.indexOf("<style", cursor);
    if (open < 0) break;
    const body = source.indexOf(">", open + 6);
    const close = lower.indexOf("</style>", body + 1);
    if (body < 0 || close < 0) throw new Error("Cannot safely parse an unterminated Vue style block.");
    const openingTag = source.slice(open, body + 1);
    const sourceAttribute = /\ssrc\s*=\s*(["'])([^"']+)\1/i.exec(openingTag);
    if (sourceAttribute) {
      const value = sourceAttribute[2];
      const start = open + sourceAttribute.index + sourceAttribute[0].lastIndexOf(value);
      imports.push({ type: "string", value, start, end: start + value.length });
    }
    imports.push(...findCssImports(source.slice(body + 1, close), body + 1));
    cursor = close + 8;
  }
  return imports;
}

function findCssImports(source, offset = 0) {
  const imports = [];
  const pattern = /@import\s+(?:url\(\s*)?(["'])([^"']+)\1\s*\)?/g;
  for (const match of source.matchAll(pattern)) {
    const value = match[2];
    const start = offset + match.index + match[0].indexOf(value);
    imports.push({ type: "string", value, start, end: start + value.length });
  }
  return imports;
}

function uniqueRanges(items) {
  return [...new Map(items.map((item) => [`${item.start}:${item.end}`, item])).values()];
}

function isModuleToken(token) {
  return token?.type === "string" || token?.type === "template";
}
