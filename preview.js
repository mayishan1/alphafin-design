// Shared motion contract for the specimen. Business actions remain unchanged.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const motionAnimations = new Map();
const dialogCloseTasks = new WeakMap();
const motionIntents = new WeakMap();
function nextMotionIntent(element) { const id = (motionIntents.get(element) || 0) + 1; motionIntents.set(element,id); return id; }
const Motion = {
  get reduced() { return motionPreference.matches || document.documentElement.dataset.motion === 'reduced'; },
  async run(element, frames, duration = 160) {
    motionAnimations.get(element)?.cancel();
    if (this.reduced) return true;
    const animation = element.animate(frames, { duration, easing: 'cubic-bezier(.2,.8,.2,1)' });
    motionAnimations.set(element, animation);
    try { await animation.finished; return true; }
    catch { return false; }
    finally { if (motionAnimations.get(element) === animation) motionAnimations.delete(element); }
  },
  enter(element, drawer = false) {
    nextMotionIntent(element);
    const current = motionAnimations.has(element) ? getComputedStyle(element) : null;
    const from = {opacity:current?.opacity || 0,transform:current?.transform || (drawer?'translateX(24px)':'translateY(4px)')};
    element.hidden = false;
    element.inert = false;
    return this.run(element, [from,{opacity:1,transform:'none'}], drawer?240:160);
  },
  async hide(element) {
    const intent = nextMotionIntent(element);
    if (element.hidden) return;
    element.inert = true;
    const done = await this.run(element,[{opacity:getComputedStyle(element).opacity},{opacity:0}],120);
    if (motionIntents.get(element) !== intent) return;
    if (done) element.hidden = true;
    element.inert = false;
  },
  openDialog(dialog) {
    if (dialog.open) return;
    dialog.showModal();
    this.enter(dialog,dialog.classList.contains('drawer'));
  },
  closeDialog(dialog, value = '') {
    if (dialogCloseTasks.has(dialog)) return dialogCloseTasks.get(dialog);
    if (!dialog.open) return Promise.resolve();
    dialog.dataset.closing = 'true';
    const drawer = dialog.classList.contains('drawer');
    const current = getComputedStyle(dialog);
    const task = this.run(dialog,[{opacity:current.opacity,transform:current.transform},{opacity:0,transform:drawer?'translateX(24px)':'translateY(3px)'}],drawer?180:120)
      .then(done => { if (done && dialog.open) dialog.close(value); })
      .finally(() => { delete dialog.dataset.closing; dialogCloseTasks.delete(dialog); });
    dialogCloseTasks.set(dialog, task);
    return task;
  },
  async reveal(element, open) {
    // The final state is applied only by the most recent animation, including reduced motion.
    const intent = nextMotionIntent(element);
    const opacity = element.hidden ? 0 : getComputedStyle(element).opacity;
    const height = element.hidden ? 0 : element.getBoundingClientRect().height;
    element.hidden = false;
    element.inert = !open;
    const full = element.scrollHeight;
    element.style.overflow = 'hidden';
    if (await this.run(element,[{height:`${height}px`,opacity},{height:open?`${full}px`:'0px',opacity:open?1:0}],200) && motionIntents.get(element) === intent) {
      element.hidden = !open;
      element.inert = false;
      element.style.overflow = '';
    }
  }
};
function syncMotionPreference() {
  if (Motion.reduced) motionAnimations.forEach(animation => animation.finish());
  document.documentElement.classList.toggle('motion-reduced', Motion.reduced);
}
motionPreference.addEventListener('change', syncMotionPreference);
syncMotionPreference();
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('cancel', event => { event.preventDefault(); Motion.closeDialog(dialog); });
  dialog.querySelectorAll('form[method="dialog"]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault(); Motion.closeDialog(dialog, event.submitter?.value || '');
  }));
});
// Native details retain keyboard semantics while their content expands smoothly.
document.querySelectorAll('details').forEach(details => {
  const summary = details.querySelector('summary');
  const content = document.createElement('div');
  content.className = 'motion-disclosure';
  Array.from(details.childNodes).filter(node => node !== summary).forEach(node => content.append(node));
  details.append(content);
  let expanded = details.open;
  summary.addEventListener('click', async event => {
    event.preventDefault(); expanded = !expanded;
    if (expanded && !details.open) { content.hidden = true; details.open = true; }
    await Motion.reveal(content,expanded);
    if (!expanded && content.hidden) details.open = false;
  });
});

const dropdowns = [];
const views = Array.from(document.querySelectorAll('.tabs [role=tab]')).map(el => el.dataset.view);
function activate(view, focus = false) {
  if (!views.includes(view)) return;
  dropdowns.forEach(select => select.close(false));
  document.querySelectorAll('[role=tabpanel]').forEach(el => { const selected = el.id === view; const wasHidden = el.hidden; el.hidden = !selected; if (selected && wasHidden) Motion.enter(el); });
  document.querySelectorAll('[data-view]').forEach(el => {
    const active = el.dataset.view === view;
    el.classList.toggle('active', active);
    if (el.getAttribute('role') === 'tab') {
      el.setAttribute('aria-selected', String(active));
      el.tabIndex = active ? 0 : -1;
      if (active && focus) el.focus();
    }
  });
}
document.querySelectorAll('[data-view]').forEach(el => {
  el.addEventListener('click', event => {
    event.preventDefault();
    activate(el.dataset.view);
    const target = document.getElementById(el.dataset.jump);
    if (target) { target.scrollIntoView({ block: 'start' }); target.focus({ preventScroll: true }); }
  });
});
document.querySelector('[role=tablist]').addEventListener('keydown', event => {
  const current = views.indexOf(event.target.dataset.view);
  if (current < 0) return;
  let next;
  if (event.key === 'ArrowRight') next = (current + 1) % views.length;
  if (event.key === 'ArrowLeft') next = (current + views.length - 1) % views.length;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = views.length - 1;
  if (next !== undefined) { event.preventDefault(); activate(views[next], true); }
});
document.querySelectorAll('[data-select]').forEach(anchor => {
  const trigger = anchor.querySelector('[aria-haspopup=listbox]');
  const menu = anchor.querySelector('[role=listbox]');
  const value = anchor.querySelector('[data-selected-value]');
  const options = Array.from(menu.querySelectorAll('[role=option]')).filter(option => !option.disabled);
  // Portal the popup so workspace/card overflow cannot clip it.
  document.body.append(menu);
  function close(restoreFocus = true) {
    Motion.hide(menu);
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }
  function positionMenu() {
    const rect = trigger.getBoundingClientRect();
    const gutter = 8;
    menu.style.width = `${Math.min(rect.width, 260, innerWidth - gutter * 2)}px`;
    const below = innerHeight - rect.bottom - 6 - gutter;
    const above = rect.top - 6 - gutter;
    const upwards = below < Math.min(menu.scrollHeight, 160) && above > below;
    menu.style.maxHeight = `${Math.max(0, Math.min(280, upwards ? above : below))}px`;
    menu.style.left = `${Math.max(gutter, Math.min(rect.left, innerWidth - menu.offsetWidth - gutter))}px`;
    menu.style.top = `${upwards ? rect.top - 6 - menu.offsetHeight : rect.bottom + 6}px`;
  }
  function open() {
    dropdowns.forEach(select => select.close(false));
    Motion.enter(menu);
    positionMenu();
    trigger.setAttribute('aria-expanded', 'true');
    (options.find(el => el.getAttribute('aria-selected') === 'true') || options[0]).focus({ preventScroll: true });
  }
  dropdowns.push({ close });
  trigger.addEventListener('click', () => trigger.getAttribute('aria-expanded') === 'true' ? close() : open());
  trigger.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(); }
  });
  options.forEach(option => option.addEventListener('click', () => {
    value.textContent = option.querySelector('[data-option-label]').textContent;
    options.forEach(el => el.setAttribute('aria-selected', String(el === option)));
    close();
  }));
  let search = '';
  let lastKeyAt = 0;
  menu.addEventListener('keydown', event => {
    const index = options.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % options.length;
    if (event.key === 'ArrowUp') next = (index + options.length - 1) % options.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    if (next !== undefined) { event.preventDefault(); options[next].focus(); }
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    // Restore the trigger before native Tab navigation leaves this control.
    if (event.key === 'Tab') close();
    if (event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      search = now - lastKeyAt > 700 ? event.key : search + event.key;
      lastKeyAt = now;
      const match = options.find(el => el.querySelector('[data-option-label]').textContent.startsWith(search));
      if (match) { event.preventDefault(); match.focus(); }
    }
  });
  document.addEventListener('pointerdown', event => {
    if (!menu.hidden && !anchor.contains(event.target) && !menu.contains(event.target)) close(false);
  });
  document.addEventListener('scroll', event => {
    if (menu.hidden || menu.contains(event.target)) return;
    const rect = trigger.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight) close(false);
    else positionMenu();
  }, true);
  window.addEventListener('resize', () => close(false));
});
function feedback(text) {
  document.querySelector('#component-feedback').textContent = text;
  document.querySelector('#workspace-feedback').textContent = text;
}
document.querySelectorAll('[data-toast]').forEach(el => el.addEventListener('click', () => feedback(el.dataset.toast)));
const dialog = document.querySelector('#confirm-dialog');
document.querySelector('#open-dialog').addEventListener('click', () => Motion.openDialog(dialog));
dialog.addEventListener('close', () => { if (dialog.returnValue === 'preview') feedback('危险操作反馈已预览；没有移除任何数据'); dialog.returnValue = ''; });
