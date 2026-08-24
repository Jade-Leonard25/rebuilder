// src/compiler/parser.ts

export interface ParsedSFC {
  frontmatter: Record<string, any>;
  script: string;
  template: string;
  style: string;
  templateAST: ASTNode[];
}

export type ASTNode =
  | ElementNode
  | TextNode
  | InterpolationNode
  | ControlFlowNode;

export interface ElementNode {
  type: 'element';
  tag: string;
  props: Record<string, PropValue>;
  children: ASTNode[];
  selfClosing?: boolean;
}

export interface ControlFlowNode {
  type: 'controlFlow';
  tag: 'Show' | 'For';
  props: Record<string, PropValue>;
  children: ASTNode[];
}

export interface TextNode {
  type: 'text';
  value: string;
}

export interface InterpolationNode {
  type: 'interpolation';
  expression: string;
}

export type PropValue =
  | { type: 'literal'; value: string | boolean | number }
  | { type: 'expression'; expression: string }
  | { type: 'event'; event: string; handler: string }
  | { type: 'binding'; prop: string; expression: string };

// ============ FRONTMATTER & SECTION PARSING ============

export function parseFrontmatter(raw: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = raw.trim().split(/\r?\n/);
  let currentKey = '';
  let subObject: Record<string, any> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Sub-object indentation (e.g. window: \n  width: 1200)
    if (line.startsWith('  ') && currentKey && subObject) {
      const match = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (match) {
        subObject[match[1]] = parseValue(match[2]);
      }
      continue;
    }

    if (subObject && currentKey) {
      result[currentKey] = subObject;
      subObject = null;
    }

    const match = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (match) {
      currentKey = match[1];
      const valStr = match[2].trim();
      if (!valStr) {
        subObject = {};
      } else {
        result[currentKey] = parseValue(valStr);
      }
    }
  }

  if (subObject && currentKey) {
    result[currentKey] = subObject;
  }

  return result;
}

function parseValue(val: string): any {
  const trimmed = val.trim().replace(/^['"]|['"]$/g, '');
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (!isNaN(Number(trimmed)) && trimmed !== '') return Number(trimmed);
  return trimmed;
}

export function parseSFC(source: string): ParsedSFC {
  let frontmatter: Record<string, any> = {};
  let content = source;

  // Extract YAML Frontmatter
  const fmMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (fmMatch) {
    frontmatter = parseFrontmatter(fmMatch[1]);
    content = source.slice(fmMatch[0].length);
  }

  // Extract <script>
  let script = '';
  const scriptMatch = content.match(/<script(?:\s+lang=["'][^"']+["'])?>([\s\S]*?)<\/script>/i);
  if (scriptMatch) {
    script = scriptMatch[1].trim();
  }

  // Extract <template>
  let template = '';
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/i);
  if (templateMatch) {
    template = templateMatch[1].trim();
  } else {
    // If no <template> wrapper, use remaining HTML content without <script>/<style>
    template = content
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .trim();
  }

  // Extract <style>
  let style = '';
  const styleMatch = content.match(/<style(?:\s+scoped)?>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    style = styleMatch[1].trim();
  }

  const templateAST = parseTemplate(template);

  return {
    frontmatter,
    script,
    template,
    style,
    templateAST,
  };
}

// ============ TEMPLATE HTML & DIRECTIVE PARSER ============

const SELF_CLOSING_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

export function parseTemplate(html: string): ASTNode[] {
  const nodes: ASTNode[] = [];
  let cursor = 0;

  while (cursor < html.length) {
    // 1. Tag Start
    if (html[cursor] === '<') {
      // Comment <!-- ... -->
      if (html.slice(cursor, cursor + 4) === '<!--') {
        const endComment = html.indexOf('-->', cursor);
        if (endComment !== -1) {
          cursor = endComment + 3;
          continue;
        }
      }

      // Closing Tag (handled by parent recursion)
      if (html[cursor + 1] === '/') {
        break;
      }

      // Open Tag
      const tagMatch = html.slice(cursor).match(/^<([a-zA-Z0-9_-]+)/);
      if (tagMatch) {
        const tagName = tagMatch[1];
        cursor += tagMatch[0].length;

        // Parse Attributes
        const props: Record<string, PropValue> = {};
        while (cursor < html.length && html[cursor] !== '>' && html.slice(cursor, cursor + 2) !== '/>') {
          // Skip whitespace
          while (cursor < html.length && /\s/.test(html[cursor])) {
            cursor++;
          }

          if (html[cursor] === '>' || html.slice(cursor, cursor + 2) === '/>') {
            break;
          }

          // Attribute Name
          const attrMatch = html.slice(cursor).match(/^([@:a-zA-Z0-9_.-]+)/);
          if (!attrMatch) {
            cursor++;
            continue;
          }

          const rawAttrName = attrMatch[1];
          cursor += rawAttrName.length;

          // Skip whitespace around '='
          while (cursor < html.length && /\s/.test(html[cursor])) cursor++;

          let propVal: PropValue = { type: 'literal', value: true };

          if (html[cursor] === '=') {
            cursor++; // skip '='
            while (cursor < html.length && /\s/.test(html[cursor])) cursor++;

            // Value wrapped in {expression}
            if (html[cursor] === '{') {
              const exprEnd = findMatchingBracket(html, cursor);
              const expr = html.slice(cursor + 1, exprEnd).trim();
              cursor = exprEnd + 1;

              if (rawAttrName.startsWith('@') || rawAttrName.startsWith('on:')) {
                const event = rawAttrName.replace(/^(@|on:)/, '');
                propVal = { type: 'event', event, handler: expr };
              } else if (rawAttrName.startsWith(':')) {
                const prop = rawAttrName.slice(1);
                propVal = { type: 'binding', prop, expression: expr };
              } else {
                propVal = { type: 'expression', expression: expr };
              }
            } else if (html[cursor] === '"' || html[cursor] === "'") {
              // Value wrapped in quotes
              const quote = html[cursor];
              cursor++;
              const valEnd = html.indexOf(quote, cursor);
              const strVal = html.slice(cursor, valEnd);
              cursor = valEnd + 1;

              if (rawAttrName.startsWith('@') || rawAttrName.startsWith('on:')) {
                const event = rawAttrName.replace(/^(@|on:)/, '');
                propVal = { type: 'event', event, handler: strVal };
              } else if (rawAttrName.startsWith(':')) {
                const prop = rawAttrName.slice(1);
                propVal = { type: 'binding', prop, expression: strVal };
              } else {
                propVal = { type: 'literal', value: strVal };
              }
            }
          }

          // Normalize attribute key
          let finalKey = rawAttrName;
          if (finalKey.startsWith('@') || finalKey.startsWith('on:')) {
            const eventName = finalKey.replace(/^(@|on:)/, '');
            finalKey = `on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`;
          } else if (finalKey.startsWith(':')) {
            finalKey = finalKey.slice(1);
          }

          if (finalKey === 'class') finalKey = 'className';
          props[finalKey] = propVal;
        }

        // Check if self-closing
        let isSelfClosing = SELF_CLOSING_TAGS.has(tagName.toLowerCase());
        if (html.slice(cursor, cursor + 2) === '/>') {
          isSelfClosing = true;
          cursor += 2;
        } else if (html[cursor] === '>') {
          cursor++;
        }

        // Children parsing
        const children: ASTNode[] = [];
        if (!isSelfClosing) {
          const subChildren = parseTemplate(html.slice(cursor));
          children.push(...subChildren);

          // Find closing tag `</tagName>`
          const closingTag = `</${tagName}>`;
          const closingIdx = html.indexOf(closingTag, cursor);
          if (closingIdx !== -1) {
            cursor = closingIdx + closingTag.length;
          }
        }

        if (tagName === 'Show' || tagName === 'For') {
          nodes.push({
            type: 'controlFlow',
            tag: tagName,
            props,
            children,
          });
        } else {
          nodes.push({
            type: 'element',
            tag: tagName,
            props,
            children,
            selfClosing: isSelfClosing,
          });
        }
        continue;
      }
    }

    // 2. Expression Interpolation `{expression}`
    if (html[cursor] === '{') {
      const end = findMatchingBracket(html, cursor);
      const expr = html.slice(cursor + 1, end).trim();
      nodes.push({
        type: 'interpolation',
        expression: expr,
      });
      cursor = end + 1;
      continue;
    }

    // 3. Static Text Node
    const nextTag = html.indexOf('<', cursor);
    const nextExpr = html.indexOf('{', cursor);
    let nextBoundary = html.length;

    if (nextTag !== -1 && nextExpr !== -1) {
      nextBoundary = Math.min(nextTag, nextExpr);
    } else if (nextTag !== -1) {
      nextBoundary = nextTag;
    } else if (nextExpr !== -1) {
      nextBoundary = nextExpr;
    }

    const textContent = html.slice(cursor, nextBoundary);
    cursor = nextBoundary;

    if (textContent && (textContent.trim().length > 0 || textContent.includes(' '))) {
      nodes.push({
        type: 'text',
        value: textContent,
      });
    }
  }

  return nodes;
}

function findMatchingBracket(str: string, startIndex: number): number {
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return str.length - 1;
}

