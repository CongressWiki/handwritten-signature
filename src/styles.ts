export const SIGNATURE_CSS = `
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
