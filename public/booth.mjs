import { modes, poses } from './poses.mjs';
import { find, icon, make, modeLabel, setReference } from './ui.mjs';

const poseCard = find('#pose-card');
const poseImage = find('#pose-image');
const poseName = find('#pose-name');
const poseTip = find('#pose-tip');
const rollStatus = find('#roll-status');
const deck = find('#deck-grid');
const morePoses = find('#more-poses');
const modeButtons = [...document.querySelectorAll('[data-mode-group] button')];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const deckBatch = 6;
let mode = 'all';
let activePose = poses[0];
let visibleCount = deckBatch;
let animation;

const currentDeck = () => poses.filter(pose => mode === 'all' || mode === pose.mode);

function selectPose(pose, rolled) {
  activePose = pose;
  poseCard.classList.add('has-rolled');
  animation?.cancel();
  if (rolled && !motion.matches && poseCard.animate) {
    animation = poseCard.animate([{ transform: 'rotate(3deg) scale(.985)' }, { transform: 'rotate(0)' }], { duration: 280, easing: 'ease-out' });
  }
  setReference(poseImage, pose, 760, `${pose.name} pose reference`);
  find('#pose-label').textContent = rolled ? 'Your roll' : 'Your pick';
  find('#pose-mode').textContent = modeLabel(pose.mode);
  poseName.textContent = pose.name;
  poseTip.textContent = pose.tip;
  rollStatus.textContent = `Your pose is ${pose.name}. ${modeLabel(pose.mode)}.`;
  for (const button of deck.children) {
    if (button.dataset.pose === pose.id) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  }
  poseName.focus({ preventScroll: true });
  poseCard.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth', block: 'nearest' });
}

function deckCard(pose) {
  const card = make('button', 'deck-card');
  card.type = 'button';
  card.dataset.pose = pose.id;
  card.setAttribute('aria-label', `Choose ${pose.name}, ${modeLabel(pose.mode)}`);
  if (poseCard.classList.contains('has-rolled') && activePose.id === pose.id) card.setAttribute('aria-current', 'true');
  const photo = make('span', 'deck-card-photo');
  const image = make('img');
  image.loading = 'lazy';
  image.decoding = 'async';
  setReference(image, pose, 420);
  photo.append(image, make('span', 'mode-stamp', modeLabel(pose.mode)));
  const label = make('span', 'deck-card-label');
  label.append(make('span', '', pose.name), icon('arrow'));
  card.append(photo, label);
  card.addEventListener('click', () => selectPose(pose, false));
  return card;
}

function renderDeck(append = false) {
  const choices = currentDeck();
  if (!append) deck.replaceChildren();
  const first = deck.children.length;
  deck.append(...choices.slice(first, visibleCount).map(deckCard));
  find('#deck-count').textContent = `${choices.length} ${choices.length === 1 ? 'pose' : 'poses'}`;
  morePoses.hidden = choices.length <= visibleCount;
  if (append) deck.children[first]?.focus();
}

for (const button of modeButtons) {
  button.addEventListener('click', () => {
    if (button.dataset.mode === mode) return;
    mode = button.dataset.mode;
    for (const option of modeButtons) option.setAttribute('aria-pressed', String(option.dataset.mode === mode));
    visibleCount = deckBatch;
    renderDeck();
  });
}

find('#roll').addEventListener('click', () => {
  const choices = currentDeck();
  const alternatives = choices.filter(pose => pose.id !== activePose.id);
  const pool = alternatives.length ? alternatives : choices;
  selectPose(pool[Math.floor(Math.random() * pool.length)], true);
});

morePoses.addEventListener('click', () => {
  visibleCount += deckBatch;
  renderDeck(true);
});
renderDeck();

const dialog = find('#upload-dialog');
const form = find('#upload-form');
const modePicker = find('#upload-mode');
const preview = find('#photo-preview');
const previewPanel = find('#upload-preview');
const camera = find('#camera-file');
const library = find('#library-file');
const submit = find('#publish');
const note = find('#upload-status');
const ticket = find('#ticket-dialog');
const closeUpload = find('#close-upload');
const pickCamera = find('#pick-camera');
const pickLibrary = find('#pick-library');
const removeButton = find('#remove-photo');
const previewSave = find('#preview-save');
const ticketSave = find('#ticket-save');
const fields = [...form.querySelectorAll('input[type=text], select')];
let uploadPose;
let photo;
let previewUrl;
let ticketUrl;
let preparing = false;
let uploading = false;
let selection = 0;

function message(text = '', error = false) {
  note.textContent = text;
  note.dataset.error = String(error);
}

function syncForm() {
  submit.disabled = !photo || preparing || uploading;
  submit.setAttribute('aria-busy', String(uploading));
  for (const control of [closeUpload, pickCamera, pickLibrary, removeButton, ...fields]) control.disabled = uploading;
}

function setSaveActions(panel, image, url) {
  const link = panel.querySelector('[data-save-photo]');
  const share = panel.querySelector('[data-share-photo]');
  const status = panel.querySelector('[role=status]');
  status.textContent = '';
  panel.hidden = !url;
  share.hidden = true;
  share.onclick = null;
  if (!image || !url) {
    link.removeAttribute('href');
    return;
  }
  link.href = url;
  const payload = { files: [new File([image], 'fiesta-pose.jpg', { type: 'image/jpeg' })] };
  if (!navigator.canShare?.(payload)) return;
  share.hidden = false;
  share.onclick = async () => {
    try {
      await navigator.share(payload);
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = 'Use Save my photo to download a copy instead.';
    }
  };
}

function clearPhoto() {
  selection += 1;
  photo = undefined;
  preparing = false;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = undefined;
  preview.removeAttribute('src');
  previewPanel.hidden = true;
  setSaveActions(previewSave);
  message();
  syncForm();
}

function openUpload(pose) {
  if (dialog.open) return;
  uploadPose = pose;
  clearPhoto();
  form.reset();
  const prompt = find('#upload-prompt');
  find('#upload-reference').hidden = !pose;
  find('#upload-mode-label').hidden = Boolean(pose);
  modePicker.value = pose?.mode ?? (Object.hasOwn(modes, mode) ? mode : 'solo');
  if (pose) {
    prompt.textContent = 'Match the reference, then take or pick your photo.';
    setReference(find('#upload-reference-image'), pose, 220, `${pose.name} pose reference`);
    find('#upload-reference-name').textContent = pose.name;
    find('#upload-reference-tip').textContent = pose.tip;
  } else {
    prompt.textContent = 'Snap a new photo or pick one you already took.';
  }
  dialog.showModal();
  pickCamera.focus();
}

for (const trigger of document.querySelectorAll('[data-upload]')) {
  trigger.addEventListener('click', () => {
    const includePose = trigger.dataset.upload === 'pose' || poseCard.classList.contains('has-rolled');
    openUpload(includePose ? activePose : undefined);
  });
}

function openDirectUpload() {
  if (location.hash === '#upload') openUpload();
}

window.addEventListener('hashchange', openDirectUpload);
openDirectUpload();

closeUpload.addEventListener('click', () => dialog.close());
dialog.addEventListener('cancel', event => { if (uploading) event.preventDefault(); });
dialog.addEventListener('close', () => {
  if (dialog.open) return;
  clearPhoto();
  if (location.hash === '#upload') history.replaceState(null, '', location.pathname + location.search);
});
find('#close-ticket').addEventListener('click', () => ticket.close());
ticket.addEventListener('close', () => {
  if (ticket.open) return;
  if (ticketUrl) URL.revokeObjectURL(ticketUrl);
  ticketUrl = undefined;
  setSaveActions(ticketSave);
});
pickCamera.addEventListener('click', () => {
  camera.setAttribute('capture', modePicker.value === 'solo' ? 'user' : 'environment');
  camera.click();
});
pickLibrary.addEventListener('click', () => library.click());
removeButton.addEventListener('click', () => {
  clearPhoto();
  pickLibrary.focus();
});

async function preparePhoto(file) {
  if (file.size > 25 * 1024 * 1024) throw new Error('Choose a photo smaller than 25 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1500 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d', { alpha: false });
    context.fillStyle = '#fff8e9';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .88));
    if (blob?.type === 'image/jpeg') return blob;
    throw new Error();
  } catch {
    throw new Error('We couldn’t open that photo. Try JPG or PNG, or take a new photo.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

for (const input of [camera, library]) {
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    clearPhoto();
    const current = selection;
    preparing = true;
    message('Preparing your photo…');
    syncForm();
    try {
      const image = await preparePhoto(file);
      if (selection !== current) return;
      photo = image;
      previewUrl = URL.createObjectURL(image);
      preview.src = previewUrl;
      previewPanel.hidden = false;
      setSaveActions(previewSave, image, previewUrl);
      message('Photo ready to post.');
    } catch (error) {
      if (selection === current) message(error.message, true);
    } finally {
      if (selection === current) {
        preparing = false;
        syncForm();
      }
    }
  });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!photo || preparing || uploading) return;
  const payload = new FormData(form);
  payload.set('photo', photo, 'fiesta-pose.jpg');
  if (uploadPose) payload.set('pose', uploadPose.id);
  uploading = true;
  message('Posting your photo to the Gallery Wall…');
  syncForm();
  try {
    const response = await fetch('/api/gallery', { method: 'POST', body: payload });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.id) throw new Error(result.message ?? 'We couldn’t post right now. Please try again.');
    find('#ticket-code').textContent = `FF-${result.id.slice(0, 8).toUpperCase()}`;
    find('#view-post').href = `/wall#photo-${result.id}`;
    ticketUrl = URL.createObjectURL(photo);
    setSaveActions(ticketSave, photo, ticketUrl);
    dialog.close();
    ticket.showModal();
  } catch (error) {
    message(error instanceof TypeError ? 'Check your connection and try posting again.' : error.message, true);
  } finally {
    uploading = false;
    syncForm();
  }
});
