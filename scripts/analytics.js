// Optional GA4 integration: no Google requests before an explicit opt-in.
const id = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const configured = /^G-[A-Z0-9]+$/.test(id);
const key = 'unfold-analytics-consent';
let allowed = false;
let loaded = false;
const events = new Set(['product_select', 'quote_start', 'quote_submit_attempt', 'quote_submit_success', 'quote_submit_error', 'quote_attachment_handoff', 'spec_to_quote', 'spec_download', 'guide_quote_click', 'page_view']);
const gtag = (...args) => { window.dataLayer = window.dataLayer || []; window.dataLayer.push(args); };

export function track(name, details = {}) {
  if (!events.has(name)) return;
  // Only fixed categories and FEFCO codes; never include contact or free-text inputs.
  const data = { page_path: location.pathname };
  if (/^[a-z-]{1,30}$/.test(details.product || '')) data.product_type = details.product;
  if (/^\d{4}$/.test(details.style || '')) data.box_style = details.style;
  document.dispatchEvent(new CustomEvent('unfold:analytics', { detail: { name, ...data } }));
  if (configured && allowed) gtag('event', name, data);
}

function start() {
  if (loaded || !configured) return;
  loaded = true;
  gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  gtag('js', new Date());
  gtag('config', id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, page_location: location.origin + location.pathname, page_referrer: '' });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.append(script);
  track('page_view');
}

if (configured) {
  let choice = null;
  try { choice = localStorage.getItem(key); } catch { /* Storage can be disabled. */ }
  allowed = choice === 'yes';
  if (allowed) start();
  const panel = document.createElement('section');
  panel.className = 'analytics-choice';
  panel.setAttribute('aria-label', 'Analytics preference');
  panel.innerHTML = '<p>Allow Google Analytics to measure which pages and quote steps are useful? Your form answers are not included.</p><button type="button" data-choice="yes">Allow analytics</button><button type="button" data-choice="no">No thanks</button>';
  panel.hidden = choice !== null;
  panel.addEventListener('click', e => {
    const value = e.target.closest('[data-choice]')?.dataset.choice;
    if (!value) return;
    allowed = value === 'yes';
    try { localStorage.setItem(key, value); } catch { /* Keep in-memory choice. */ }
    if (allowed) start();
    else if (loaded) {
      window[`ga-disable-${id}`] = true;
      gtag('consent', 'update', { analytics_storage: 'denied' });
    }
    if (allowed && loaded) {
      window[`ga-disable-${id}`] = false;
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
    panel.hidden = true;
  });
  document.body.append(panel);
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'analytics-settings';
  settings.textContent = 'Analytics preferences';
  settings.addEventListener('click', () => { panel.hidden = false; panel.querySelector('button').focus(); });
  (document.querySelector('.footer-inner') || document.body).append(settings);
}
document.addEventListener('click', e => {
  const link = e.target.closest('[data-event]');
  if (link) track(link.dataset.event);
});
