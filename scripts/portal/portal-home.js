import { portalApi, portalMode } from './api.js';
import { STATUS_META, formatMoney, formatDate } from './journey.js';

const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const ordersList = document.getElementById('orders-list');
const welcomeTitle = document.getElementById('welcome-title');
const welcomeLead = document.getElementById('welcome-lead');
const modeBanner = document.getElementById('mode-banner');
const adminCta = document.getElementById('admin-cta');
const navAdmin = document.getElementById('nav-admin');
const navOrders = document.getElementById('nav-orders');
const navSignout = document.getElementById('nav-signout');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const signinStatus = document.getElementById('signin-status');
const signupStatus = document.getElementById('signup-status');

function setTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  signinForm.hidden = tab !== 'signin';
  signupForm.hidden = tab !== 'signup';
}

document.querySelectorAll('.auth-tab').forEach((btn) => {
  btn.addEventListener('click', () => setTab(btn.dataset.tab));
});

function statusClass(status) {
  if (status === 'delivered') return 'done';
  if (status === 'cancelled' || status === 'on_hold') return '';
  return 'live';
}

function renderOrders(orders, profile) {
  welcomeTitle.textContent =
    profile.company_name || profile.full_name
      ? `${profile.company_name || profile.full_name}`
      : 'Your orders';
  welcomeLead.textContent =
    profile.role === 'admin'
      ? 'All customer orders. Open any order for the full journey.'
      : 'Track sourcing, quotes, orders, production and delivery.';

  if (portalMode === 'demo') {
    modeBanner.hidden = false;
    modeBanner.textContent =
      'Portal storage is local until Supabase is connected on Render.';
  } else {
    modeBanner.hidden = true;
  }

  const isAdmin = profile.role === 'admin';
  adminCta.hidden = !isAdmin;
  navAdmin.hidden = !isAdmin;

  if (!orders.length) {
    ordersList.innerHTML =
      '<div class="empty-state">No orders yet. When unfold opens a job for you, it will appear here.</div>';
    return;
  }

  ordersList.innerHTML = orders
    .map((order) => {
      const meta = STATUS_META[order.status] || {
        label: order.status,
      };
      return `
        <a class="order-card" href="/portal-order.html?id=${encodeURIComponent(order.id)}">
          <div>
            <h2>${order.title}</h2>
            <p class="order-meta">
              ${order.order_number}
              · Updated ${formatDate(order.updated_at)}
              ${order.lead_time_days != null ? `· Lead time ${order.lead_time_days} days` : ''}
            </p>
          </div>
          <div class="order-side">
            <span class="status-pill ${statusClass(order.status)}">${meta.label}</span>
            <span class="order-meta">${formatMoney(order.total, order.currency)}</span>
          </div>
        </a>`;
    })
    .join('');
}

async function showDashboard(profile) {
  authView.hidden = true;
  dashboardView.hidden = false;
  navOrders.hidden = false;
  navSignout.hidden = false;
  navAdmin.hidden = profile.role !== 'admin';

  const orders = await portalApi.listOrders();
  renderOrders(orders, profile);
}

function showAuth() {
  authView.hidden = false;
  dashboardView.hidden = true;
  navOrders.hidden = true;
  navAdmin.hidden = true;
  navSignout.hidden = true;
}

navSignout?.addEventListener('click', async () => {
  await portalApi.signOut();
  window.location.href = '/portal.html';
});

signinForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  signinStatus.classList.remove('error');
  signinStatus.textContent = 'Signing in…';
  const data = new FormData(signinForm);
  try {
    const { profile } = await portalApi.signIn(
      String(data.get('email')),
      String(data.get('password'))
    );
    await showDashboard(profile);
  } catch (err) {
    signinStatus.classList.add('error');
    signinStatus.textContent = err.message || 'Could not sign in.';
  }
});

signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  signupStatus.classList.remove('error');
  signupStatus.textContent = 'Creating account…';
  const data = new FormData(signupForm);
  try {
    const { profile, needsEmailConfirmation } = await portalApi.signUp({
      email: String(data.get('email')),
      password: String(data.get('password')),
      full_name: String(data.get('full_name') || ''),
      company_name: String(data.get('company_name') || ''),
    });
    if (needsEmailConfirmation || !profile) {
      signupStatus.textContent =
        'Account created — check your email and confirm, then sign in.';
      setTab('signin');
      return;
    }
    await showDashboard(profile);
  } catch (err) {
    signupStatus.classList.add('error');
    signupStatus.textContent = err.message || 'Could not create account.';
  }
});

async function boot() {
  showAuth();
  try {
    const { profile } = await portalApi.getSession();
    if (profile) await showDashboard(profile);
  } catch {
    /* stay on auth */
  }
}

boot();
