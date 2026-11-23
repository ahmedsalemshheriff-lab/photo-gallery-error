import './capture-guard.mjs';
import { poseById } from './poses.mjs';
import { find, icon, make, modeLabel } from './ui.mjs';

const grid = find('#wall-grid');
const more = find('#more-photos');
const status = find('#wall-status');
const state = find('#wall-state');
const skeleton = find('#wall-skeleton');
const emptyUpload = find('#wall-empty-upload');
const retry = find('#wall-retry');
const buttons = [...document.querySelectorAll('button[data-mode]')];
const dialog = find('#photo-dialog');
const fullPhoto = find('#full-photo');
const galleryPreview = find('#gallery-preview');
const photoError = find('#photo-error');
const photoCaption = find('#photo-caption');
const photoLike = find('#photo-like');
const photoFeedback = find('#photo-feedback');
const wallFeedback = find('#wall-feedback');
const organizerTools = find('#organizer-tools');
const organizerForm = find('#organizer-form');
const organizerCode = find('#organizer-code');
const organizerStatus = find('#organizer-status');
const deletePhoto = find('#delete-photo');
const closePhoto = find('#close-photo');
const idPattern = /^photo-([a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})$/;
const savingLikes = new Set();
let mode = 'all';
let nextCursor;
let pending;
let retryAppend = false;
let activePhoto;
let deleting = false;

const imageUrl = id => `/api/gallery/${id}/image`;

function describe(post) {
  const pose = poseById.get(post.poseId);
  return pose ? `${post.guestName} recreates ${pose.name}` : `${post.guestName} strikes a freestyle pose`;
}

function feedback(note, text = '', error = false) {
  note.textContent = text;
  note.dataset.error = String(error);
}

function renderLike(button, reaction) {
  const count = Number(reaction.likes) || 0;
  button.setAttribute('aria-pressed', String(Boolean(reaction.liked)));
  button.setAttribute('aria-label', `Like photo, ${count} ${count === 1 ? 'like' : 'likes'}`);
  button.replaceChildren(icon('heart'), make('span', '', String(count)));
}

function bindLike(button, post) {
  button.dataset.photoId = post.id;
  button.disabled = savingLikes.has(post.id);
  renderLike(button, post);
  button.onclick = () => toggleLike(post.id, button.getAttribute('aria-pressed') !== 'true');
}

async function toggleLike(id, liked) {
  if (savingLikes.has(id)) return;
  const matchingButtons = () => document.querySelectorAll(`.like-button[data-photo-id="${id}"]`);
  const note = dialog.open && activePhoto === id ? photoFeedback : wallFeedback;
  feedback(note);
  savingLikes.add(id);
  for (const button of matchingButtons()) button.disabled = true;
  try {
    const response = await fetch(`/api/gallery/${id}/like`, { method: liked ? 'PUT' : 'DELETE' });
    if (!response.ok) throw new Error();
    const reaction = await response.json();
    for (const button of matchingButtons()) renderLike(button, reaction);
    feedback(note, reaction.liked ? 'Photo liked.' : 'Like removed.');
  } catch {
    feedback(note, 'Couldn’t update your like. Please try again.', true);
  } finally {
    savingLikes.delete(id);
    for (const button of matchingButtons()) button.disabled = false;
  }
}

function openPhoto(post) {
  if (deleting) return;
  activePhoto = post.id;
  photoError.hidden = true;
  galleryPreview.hidden = false;
  fullPhoto.alt = describe(post);
  fullPhoto.src = imageUrl(post.id);
  find('#photo-title').textContent = describe(post);
  photoCaption.textContent = post.caption;
  photoCaption.hidden = !post.caption;
  bindLike(photoLike, post);
  organizerTools.open = false;
  organizerForm.reset();
  feedback(organizerStatus);
  feedback(photoFeedback);
  if (!dialog.open) dialog.showModal();
}

fullPhoto.addEventListener('error', () => {
  galleryPreview.hidden = true;
  photoError.hidden = false;
});
const blockEasyCopy = event => event.preventDefault();
galleryPreview.addEventListener('contextmenu', blockEasyCopy);
closePhoto.addEventListener('click', () => dialog.close());
dialog.addEventListener('cancel', event => { if (deleting) event.preventDefault(); });
dialog.addEventListener('close', () => {
  if (!dialog.open) organizerForm.reset();
});

organizerForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!activePhoto || deleting) return;
  const id = activePhoto;
  const code = organizerCode.value.trim();
  organizerForm.reset();
  if (!code) {
    feedback(organizerStatus, 'Enter the organizer passkey.', true);
    organizerCode.focus();
    return;
  }
  deleting = true;
  organizerCode.disabled = deletePhoto.disabled = closePhoto.disabled = true;
  feedback(organizerStatus, 'Removing photo…');
  try {
    const response = await fetch(`/api/gallery/${id}`, {
      method: 'DELETE', headers: { 'X-Gallery-Organizer-Code': code },
    });
    if (!response.ok && response.status !== 404) {
      const result = await response.json().catch(() => ({}));
      feedback(organizerStatus, result.message ?? 'Couldn’t remove this photo. Please try again.', true);
      return;
    }
    if (location.hash === `#photo-${id}`) history.replaceState(null, '', location.pathname + location.search);
    dialog.close();
    galleryPreview.hidden = true;
    fullPhoto.removeAttribute('src');
    await loadPosts();
    feedback(wallFeedback, response.ok ? 'Photo removed from the Gallery Wall.' : 'This photo is already off the wall.');
    buttons.find(button => button.dataset.mode === mode)?.focus();
  } catch {
    feedback(organizerStatus, 'Check your connection and try again.', true);
  } finally {
    deleting = false;
    organizerCode.disabled = deletePhoto.disabled = closePhoto.disabled = false;
    if (dialog.open) organizerCode.focus();
  }
});

function postCard(post) {
  const figure = make('figure', 'post-card');
  figure.id = `photo-${post.id}`;
  const picture = make('button', 'post-picture');
  picture.type = 'button';
  picture.setAttribute('aria-label', `Open photo: ${describe(post)}`);
  picture.addEventListener('contextmenu', blockEasyCopy);
  const image = make('img');
  image.alt = '';
  image.loading = 'lazy';
  image.decoding = 'async';
  image.draggable = false;
  image.addEventListener('error', () => {
    image.hidden = true;
    picture.append(make('span', 'post-picture-note', 'Photo unavailable'));
  }, { once: true });
  image.src = imageUrl(post.id);
  picture.append(image);

  const caption = make('figcaption');
  const title = make('div');
  title.append(make('h2', '', post.guestName), make('span', 'mode-stamp', modeLabel(post.mode)));
  caption.append(title, make('p', 'post-pose', poseById.get(post.poseId)?.name ?? 'Freestyle pose'));
  if (post.caption) caption.append(make('p', '', post.caption));
  const like = make('button', 'like-button');
  like.type = 'button';
  bindLike(like, post);
  caption.append(like);
  picture.addEventListener('click', () => openPhoto({
    ...post, likes: Number(like.textContent), liked: like.getAttribute('aria-pressed') === 'true',
  }));
  figure.append(picture, caption);
  return figure;
}

function showState(title, copy, action) {
  find('#wall-state-title').textContent = title;
  find('#wall-state-text').textContent = copy;
  emptyUpload.hidden = action !== 'upload';
  retry.hidden = action !== 'retry';
  state.hidden = false;
}

async function spotlight(signal) {
  const match = idPattern.exec(location.hash.slice(1));
  if (!match) return;
  const existing = document.getElementById(match[0]);
  if (existing) {
    existing.scrollIntoView({ block: 'nearest' });
    existing.querySelector('button').focus({ preventScroll: true });
    return;
  }
  try {
    const response = await fetch(`/api/gallery/${match[1]}`, { signal });
    if (!response.ok) return;
    const post = await response.json();
    if (!signal.aborted && location.hash === `#${match[0]}` && post.id === match[1]) openPhoto(post);
  } catch {
    return;
  }
}

async function loadPosts(append = false) {
  pending?.abort();
  const controller = new AbortController();
  pending = controller;
  const signal = controller.signal;
  if (!append) grid.replaceChildren();
  status.textContent = 'Loading guest photos…';
  grid.setAttribute('aria-busy', 'true');
  more.disabled = true;
  retryAppend = append;
  state.hidden = true;
  skeleton.hidden = append;
  if (!append) {
    nextCursor = undefined;
    more.hidden = true;
  }

  const query = new URLSearchParams({ mode });
  if (append && nextCursor) query.set('cursor', nextCursor);
  try {
    const response = await fetch(`/api/gallery?${query}`, { signal });
    if (!response.ok) throw new Error();
    const result = await response.json();
    if (signal.aborted) return;
    if (!Array.isArray(result.posts)) throw new Error();
    skeleton.hidden = true;
    state.hidden = true;
    const cards = result.posts.map(postCard);
    grid.append(...cards);
    nextCursor = result.nextCursor;
    more.hidden = !nextCursor;
    if (!grid.children.length) {
      if (mode === 'all') showState('First pose goes to you.', 'No guest photos yet. Recreate a meme and be the first to share it!', 'upload');
      else showState(`No ${mode} photos yet.`, 'Try another filter or add a photo of your own.', 'upload');
    }
    status.textContent = grid.children.length ? `${grid.children.length} guest photos shown.` : 'No guest photos yet.';
    if (append) cards[0]?.querySelector('button').focus();
    else await spotlight(signal);
  } catch {
    if (signal.aborted) return;
    skeleton.hidden = true;
    more.hidden = true;
    status.textContent = 'Guest photos could not be loaded.';
    showState(append ? 'More photos couldn’t load.' : 'The wall couldn’t load.', 'Check your connection and try again.', 'retry');
  } finally {
    if (!signal.aborted) {
      grid.setAttribute('aria-busy', 'false');
      more.disabled = false;
    }
  }
}

for (const button of buttons) {
  button.addEventListener('click', () => {
    if (button.dataset.mode === mode) return;
    mode = button.dataset.mode;
    for (const option of buttons) option.setAttribute('aria-pressed', String(option.dataset.mode === mode));
    if (idPattern.test(location.hash.slice(1))) history.replaceState(null, '', location.pathname + location.search);
    void loadPosts();
  });
}

more.addEventListener('click', () => loadPosts(true));
retry.addEventListener('click', () => loadPosts(retryAppend));
void loadPosts();
