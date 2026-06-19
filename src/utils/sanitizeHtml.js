const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'blockquote', 'hr', 'img', 'span', 'div',
]);

const ALLOWED_ATTRS = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
};

function sanitizeNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.cloneNode(false);

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const tag = node.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) {
    const frag = document.createDocumentFragment();
    node.childNodes.forEach((child) => {
      const safe = sanitizeNode(child);
      if (safe) frag.appendChild(safe);
    });
    return frag;
  }

  const el = document.createElement(tag);
  const attrs = ALLOWED_ATTRS[tag] || [];

  attrs.forEach((attr) => {
    const val = node.getAttribute(attr);
    if (!val) return;
    if (attr === 'href' || attr === 'src') {
      if (/^(https?:|mailto:|#)/i.test(val)) el.setAttribute(attr, val);
    } else {
      el.setAttribute(attr, val);
    }
  });

  if (tag === 'a') {
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  }

  node.childNodes.forEach((child) => {
    const safe = sanitizeNode(child);
    if (safe) el.appendChild(safe);
  });

  return el;
}

export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const container = document.createElement('div');
  doc.body.childNodes.forEach((child) => {
    const safe = sanitizeNode(child);
    if (safe) container.appendChild(safe);
  });
  return container.innerHTML;
}
