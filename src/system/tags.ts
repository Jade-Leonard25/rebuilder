const SVG_TAGS = new Set([
  'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon',
  'g', 'defs', 'use', 'text', 'tspan', 'ellipse', 'linearGradient',
  'stop', 'mask', 'pattern', 'filter', 'clipPath', 'marker'
]);

const HTML_TAGS = new Set([
  'div', 'span', 'button', 'input', 'form', 'section', 'header',
  'footer', 'nav', 'main', 'article', 'aside', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'p', 'a', 'img', 'ul', 'ol', 'li', 'table',
  'thead', 'tbody', 'tr', 'td', 'th', 'select', 'option', 'textarea',
  'label', 'fieldset', 'legend', 'iframe', 'video', 'audio', 'canvas'
]);

const BOOLEAN_PROPS = new Set([
  'disabled', 'checked', 'readonly', 'required', 'hidden',
  'autofocus', 'multiple', 'selected', 'open'
]);

export {
    BOOLEAN_PROPS,HTML_TAGS,SVG_TAGS
}