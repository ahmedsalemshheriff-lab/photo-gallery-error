// Screenshot deterrents for the Gallery Wall (see /privacy).
// No web page is told when a phone takes a screenshot, so this reacts to every signal a capture
// usually gives off: keyboard shortcuts, phone screenshot gestures and keys, and the page losing
// focus or going hidden (screenshot previews, recorders, control centre, snipping tools).
// Each time, the photos are covered with a friendly "Caught ya!" note that stays up until the
// guest promises not to capture the wall, so a screenshot taken then shows the note instead.
const root = document.documentElement;
const shield = document.querySelector('#capture-shield');
const shieldTitle = shield.querySelector('#capture-shield-title');
const shieldText = shield.querySelector('#capture-shield-text');
const shieldOkay = shield.querySelector('#capture-shield-okay');
const usePopover = typeof shield.showPopover === 'function';
if (usePopover) shield.popover = 'manual';

const notes = [
  ['Caught ya! 📸', 'Psst… screenshots of the Gallery Wall aren’t allowed. Please respect our guests’ privacy and keep their photos here.'],
  ['Caught ya again! 👀', 'Nice try! These photos belong to our guests, so please don’t screenshot or record them.'],
  ['Still caught ya! 🎟️', 'The Gallery Wall is for looking, not capturing. Thanks for keeping Funfair Fiesta a fun, safe place for everyone.'],
];
let caught = 0;
let returnFocus;

function cover() {
  const fresh = !root.classList.contains('is-shielded');
  root.classList.add('is-shielded');
  if (fresh) {
    const [title, text] = notes[Math.min(caught, notes.length - 1)];
    caught += 1;
    shieldTitle.textContent = title;
    shieldText.textContent = text;
    returnFocus = document.activeElement;
  }
  shield.removeAttribute('aria-hidden');
  // An open photo dialog makes everything outside it inert, so the note lives inside it while it's open.
  const home = document.querySelector('dialog[open]') ?? document.body;
  if (usePopover && shield.matches(':popover-open') && shield.parentElement === home) return;
  if (usePopover && shield.matches(':popover-open')) shield.hidePopover();
  if (shield.parentElement !== home) home.append(shield);
  if (usePopover) shield.showPopover();
  shieldOkay.focus({ preventScroll: true });
}

function uncover() {
  root.classList.remove('is-shielded');
  shield.setAttribute('aria-hidden', 'true');
  if (usePopover && shield.matches(':popover-open')) shield.hidePopover();
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  returnFocus = undefined;
}

shieldOkay.addEventListener('click', uncover);
// Keep the note up: Escape shouldn't close the photo dialog underneath it.
document.addEventListener('cancel', event => { if (root.classList.contains('is-shielded')) event.preventDefault(); }, true);

const phoneKeys = new Set(['audiovolumedown', 'audiovolumeup', 'volumedown', 'volumeup', 'power', 'camera']);
const isCaptureKey = event => {
  const key = event.key?.toLowerCase();
  if (key === 'printscreen' || phoneKeys.has(key)) return true;
  // macOS: Cmd+Shift+3/4/5/6. Windows: Win+Shift+S.
  if (event.metaKey && event.shiftKey && ['3', '4', '5', '6', 's'].includes(key)) return true;
  // Print dialog: Ctrl+P / Cmd+P.
  return (event.ctrlKey || event.metaKey) && key === 'p';
};

addEventListener('keydown', event => {
  if (!isCaptureKey(event)) return;
  if (event.key.toLowerCase() === 'p') event.preventDefault();
  cover();
}, true);

// On Windows, Print Screen copies the screen to the clipboard; overwrite it where the browser allows.
addEventListener('keyup', event => {
  if (event.key !== 'PrintScreen') return;
  cover();
  navigator.clipboard?.writeText('Screenshots of the Funfair Fiesta Gallery Wall are not allowed.').catch(() => {});
}, true);

// Many Android phones screenshot with a three-finger swipe or a palm swipe across the screen.
// The page sees those touches first, so the note goes up before the phone captures the screen.
const isPalm = touch => Math.max(touch.radiusX || 0, touch.radiusY || 0) > 45;
addEventListener('touchstart', event => {
  if (event.touches.length >= 3 || [...event.changedTouches].some(isPalm)) cover();
}, { capture: true, passive: true });

// Screenshot previews, screen recorders, control centres, app switchers and snipping tools take focus or hide the page.
addEventListener('blur', cover);
addEventListener('pagehide', cover);
document.addEventListener('visibilitychange', () => { if (document.hidden) cover(); });
addEventListener('beforeprint', cover);

// No saving, dragging or copying guest photos.
const blockOnPhotos = event => { if (event.target instanceof HTMLImageElement) event.preventDefault(); };
document.addEventListener('contextmenu', blockOnPhotos);
document.addEventListener('dragstart', blockOnPhotos);
