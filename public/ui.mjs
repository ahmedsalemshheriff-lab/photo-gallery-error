import { modes, referenceImage } from './poses.mjs';

export const find = selector => document.querySelector(selector);

export function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

export function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS(svg.namespaceURI, 'use');
  use.setAttribute('href', `/icons.svg#${name}`);
  svg.setAttribute('aria-hidden', 'true');
  svg.append(use);
  return svg;
}

export function modeLabel(mode) {
  return mode === 'group' ? 'Group · 3+' : modes[mode];
}

export function setReference(image, pose, width, description = '') {
  const fallback = `/img/${pose.id}.jpg`;
  image.onerror = () => {
    image.onerror = null;
    image.src = fallback;
  };
  image.alt = description;
  image.src = referenceImage(pose.id, width);
}
