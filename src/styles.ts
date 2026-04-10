export const STYLE_ID = 'hws-styles';
const MANAGED_STYLE_ATTR = 'data-hws-managed';

export const CSS = `
@keyframes hws-letter-stroke {
  0% {
    stroke-dashoffset: 0;
    stroke-opacity: 1;
  }
  88% {
    stroke-opacity: 1;
  }
  100% {
    stroke-dashoffset: var(--hws-dash-length, 1.2);
    stroke-opacity: 0;
  }
}`;

let mountedInstanceCount = 0;

const getStyleElement = (): HTMLStyleElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const styleElement = document.getElementById(STYLE_ID);
  return styleElement instanceof HTMLStyleElement ? styleElement : null;
};

export const acquireSignatureStyles = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  mountedInstanceCount += 1;

  const existingStyleElement = getStyleElement();
  if (existingStyleElement) {
    existingStyleElement.textContent = CSS;
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = STYLE_ID;
  styleElement.setAttribute(MANAGED_STYLE_ATTR, 'true');
  styleElement.textContent = CSS;
  document.head.appendChild(styleElement);
};

export const releaseSignatureStyles = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  mountedInstanceCount = Math.max(mountedInstanceCount - 1, 0);
  if (mountedInstanceCount > 0) {
    return;
  }

  const styleElement = getStyleElement();
  if (styleElement?.getAttribute(MANAGED_STYLE_ATTR) === 'true') {
    styleElement.remove();
  }
};

export const resetSignatureStylesForTests = (): void => {
  mountedInstanceCount = 0;
  getStyleElement()?.remove();
};
