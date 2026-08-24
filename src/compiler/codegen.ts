// src/compiler/codegen.ts
import type { ParsedSFC, ASTNode, PropValue } from './parser.ts';

export function generateCode(sfc: ParsedSFC, filePath = 'Component.rebuilder'): string {
  const componentName = getComponentName(filePath);
  const metadataJson = JSON.stringify(sfc.frontmatter, null, 2);

  // Render Template Root Node
  const templateCode = renderASTNodes(sfc.templateAST);

  return `// Generated from ${filePath} by Rebuilder Compiler
import {
  r,
  useState,
  createSignal,
  createEffect,
  createComputed,
  Show,
  For,
  useRef,
  createRef,
  Fragment,
} from '@/system/factorysystem/config';

export const metadata = ${metadataJson};

export default function ${componentName}(context) {
  ${sfc.script}

  return ${templateCode || "r.div({ className: 'p-4' }, 'Empty .rebuilder component')"};
}
`;
}

function renderASTNodes(nodes: ASTNode[]): string {
  if (nodes.length === 0) return 'null';
  if (nodes.length === 1) return renderNode(nodes[0]);
  return `Fragment({ children: [${nodes.map(renderNode).join(', ')}] })`;
}

function renderNode(node: ASTNode): string {
  switch (node.type) {
    case 'text':
      return JSON.stringify(node.value);

    case 'interpolation':
      return node.expression;

    case 'controlFlow': {
      if (node.tag === 'Show') {
        const whenExpr = getPropExpr(node.props.when, 'true');
        const fallbackExpr = node.props.fallback ? getPropExpr(node.props.fallback, 'null') : 'null';
        const childrenExpr = renderASTNodes(node.children);
        return `Show({ when: () => (${whenExpr}), fallback: ${fallbackExpr}, children: () => (${childrenExpr}) })`;
      }
      if (node.tag === 'For') {
        const eachExpr = getPropExpr(node.props.each, '[]');
        const childrenExpr = renderASTNodes(node.children);
        return `For({ each: () => (${eachExpr}), children: (item, index) => (${childrenExpr}) })`;
      }
      return 'null';
    }

    case 'element': {
      const propsStr = renderPropsObject(node.props);
      const childrenStr = node.children.map(renderNode).join(', ');

      if (childrenStr) {
        return `r('${node.tag}', ${propsStr}, ${childrenStr})`;
      }
      return `r('${node.tag}', ${propsStr})`;
    }

    default:
      return 'null';
  }
}

function renderPropsObject(props: Record<string, PropValue>): string {
  const entries: string[] = [];

  for (const [key, val] of Object.entries(props)) {
    if (val.type === 'literal') {
      entries.push(`${JSON.stringify(key)}: ${JSON.stringify(val.value)}`);
    } else if (val.type === 'event') {
      entries.push(`${JSON.stringify(key)}: ${val.handler}`);
    } else if (val.type === 'binding') {
      entries.push(`${JSON.stringify(key)}: () => (${val.expression})`);
    } else if (val.type === 'expression') {
      entries.push(`${JSON.stringify(key)}: ${val.expression}`);
    }
  }

  if (entries.length === 0) return 'null';
  return `{ ${entries.join(', ')} }`;
}

function getPropExpr(prop: PropValue | undefined, defaultVal: string): string {
  if (!prop) return defaultVal;
  if (prop.type === 'expression' || prop.type === 'binding') return prop.expression;
  if (prop.type === 'literal') return JSON.stringify(prop.value);
  return defaultVal;
}

function getComponentName(filePath: string): string {
  const baseName = filePath.split(/[/\\]/).pop() || 'Component';
  const cleanName = baseName.replace(/\.rebuilder$/, '');
  return cleanName
    .replace(/[^a-zA-Z0-9_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'RebuilderPage';
}

