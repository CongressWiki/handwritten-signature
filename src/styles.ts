export const STYLE_ID = 'hws-styles';

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
}
.hws-signature {
  display: flex;
  align-items: flex-end;
  pointer-events: auto;
  gap: 0;
  color: inherit;
}
.hws-space,
.hws-missing {
  display: inline-block;
  margin-left: var(--hws-ml, 0px);
  margin-right: var(--hws-mr, 0px);
}
.hws-space {
  width: var(--hws-space-w, 0px);
  height: var(--hws-h, auto);
}
.hws-missing {
  width: var(--hws-missing-w, 0px);
  height: var(--hws-h, auto);
}
.hws-glyph {
  display: inline-block;
  overflow: visible;
  width: var(--hws-svg-w, auto);
  height: var(--hws-h, auto);
  margin-left: var(--hws-ml, 0px);
  margin-right: var(--hws-mr, 0px);
  transform: translateY(var(--hws-bl, 0px));
}
.hws-path {
  stroke-dasharray: var(--hws-dash-length, 1.2);
  stroke-dashoffset: 0;
  stroke-opacity: 1;
  animation-name: hws-letter-stroke;
  animation-duration: var(--hws-dur, 320ms);
  animation-delay: var(--hws-delay, 0ms);
  animation-timing-function: var(--hws-easing, cubic-bezier(0.33, 1, 0.68, 1));
  animation-direction: reverse;
  animation-fill-mode: both;
  animation-iteration-count: 1;
  animation-play-state: var(--hws-play, running);
  will-change: stroke-dashoffset, stroke-opacity;
}`;
