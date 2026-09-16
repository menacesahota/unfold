/**
 * Mobile header: hamburger + stacked menu.
 */

const MQ = window.matchMedia('(max-width: 900px)');

function setupNav() {
  const header = document.querySelector('.site-header');
  const inner = header?.querySelector('.header-inner');
  const nav = inner?.querySelector('.nav');
  if (!header || !inner || !nav) return;
  const existingButton = inner.querySelector('.nav-toggle');

  if (!nav.id) nav.id = 'site-nav';

  const btn = existingButton || document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', nav.id);
  btn.setAttribute('aria-label', 'Menu');
  btn.innerHTML = '<span></span><span></span><span></span>';
  if (!existingButton) inner.insertBefore(btn, nav);

  const setOpen = (open) => {
    header.classList.toggle('is-nav-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
  };

  btn.addEventListener('click', () => {
    setOpen(!header.classList.contains('is-nav-open'));
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a, button')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });

  MQ.addEventListener('change', () => {
    if (!MQ.matches) setOpen(false);
  });
}

setupNav();
