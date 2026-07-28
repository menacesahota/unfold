import { portalApi } from './api.js';
import {
  JOURNEY_STEPS,
  STATUS_META,
  journeyIndex,
  formatMoney,
  formatDate,
  formatDateTime,
  leadTimeLabel,
} from './journey.js';

const root = document.getElementById('order-root');
const navAdmin = document.getElementById('nav-admin');
const navSignout = document.getElementById('nav-signout');

navSignout?.addEventListener('click', async () => {
  await portalApi.signOut();
  window.location.href = '/portal.html';
});

function paramsId() {
  return new URLSearchParams(window.location.search).get('id');
}

function renderJourney(status) {
  const current = journeyIndex(status);
  const special = status === 'on_hold' || status === 'cancelled';

  if (special) {
    const meta = STATUS_META[status];
    return `
      <ol class="journey">
        <li class="journey-step current">
          <span class="journey-dot" aria-hidden="true"></span>
          <div>
            <p class="journey-label">${meta.label}</p>
            <p class="journey-blurb">${meta.blurb}</p>
          </div>
        </li>
      </ol>`;
  }

  return `
    <ol class="journey">
      ${JOURNEY_STEPS.map((step, index) => {
        let state = 'upcoming';
        if (current < 0) state = 'upcoming';
        else if (index < current) state = 'done';
        else if (index === current) state = 'current';
        return `
          <li class="journey-step ${state}">
            <span class="journey-dot" aria-hidden="true"></span>
            <div>
              <p class="journey-label">${step.label}</p>
              <p class="journey-blurb">${step.blurb}</p>
            </div>
          </li>`;
      }).join('')}
    </ol>`;
}

function render(detail, profile) {
  const { order, items, events, customer } = detail;
  const meta = STATUS_META[order.status] || { label: order.status, blurb: '' };
  document.title = `${order.order_number} — unfold`;

  if (profile?.role === 'admin') navAdmin.hidden = false;

  root.innerHTML = `
    <div class="panel-head">
      <div>
        <p class="portal-kicker"><a href="/portal.html">Orders</a> / ${order.order_number}</p>
        <h1 class="portal-title">${order.title}</h1>
        <p class="portal-lead">
          ${meta.label}
          ${customer ? ` · ${customer.company_name || customer.full_name || customer.email}` : ''}
        </p>
      </div>
      <span class="status-pill live">${meta.label}</span>
    </div>

    <div class="order-layout">
      <div class="stack">
        <section class="card">
          <h2>Journey</h2>
          ${renderJourney(order.status)}
        </section>

        <section class="card">
          <h2>Boxes &amp; pricing</h2>
          ${items
            .map(
              (item) => `
            <div class="item-row">
              <strong>${item.name} · FEFCO ${item.fefco}</strong>
              <p>
                ${item.length_mm} × ${item.width_mm} × ${item.height_mm} mm
                · ${item.board} · ${item.wall} wall
                · Qty ${Number(item.quantity).toLocaleString('en-GB')}
              </p>
              <p>
                ${item.brand_text ? `Brand: ${item.brand_text}. ` : ''}
                ${item.print_notes || ''}
              </p>
              <p class="price">
                ${formatMoney(item.unit_price, order.currency)} each
                · ${formatMoney(item.line_total, order.currency)} line
              </p>
            </div>`
            )
            .join('') || '<p class="muted">No box lines on this order yet.</p>'}
          <div class="totals">
            <div><span>Subtotal</span><span>${formatMoney(order.subtotal, order.currency)}</span></div>
            <div><span>VAT</span><span>${formatMoney(order.vat, order.currency)}</span></div>
            <div class="grand"><span>Total</span><span>${formatMoney(order.total, order.currency)}</span></div>
          </div>
        </section>

        <section class="card">
          <h2>Activity</h2>
          <ol class="timeline">
            ${[...events]
              .reverse()
              .map(
                (event) => `
              <li>
                <time datetime="${event.happened_at}">${formatDateTime(event.happened_at)}</time>
                <strong>${event.title}</strong>
                ${event.detail ? `<p>${event.detail}</p>` : ''}
              </li>`
              )
              .join('') || '<li><p class="muted">No updates yet.</p></li>'}
          </ol>
        </section>
      </div>

      <div class="stack">
        <section class="card">
          <h2>Lead times</h2>
          <dl class="facts">
            <div class="fact">
              <dt>Lead time</dt>
              <dd>${leadTimeLabel(order.lead_time_days)}</dd>
            </div>
            <div class="fact">
              <dt>Est. dispatch</dt>
              <dd>${formatDate(order.estimated_dispatch_date)}</dd>
            </div>
            <div class="fact">
              <dt>Est. delivery</dt>
              <dd>${formatDate(order.estimated_delivery_date)}</dd>
            </div>
            <div class="fact">
              <dt>Last update</dt>
              <dd>${formatDate(order.updated_at)}</dd>
            </div>
          </dl>
        </section>

        <section class="card">
          <h2>Dispatch</h2>
          <div class="dispatch-block">
            <p>
              <span class="label">Method</span>
              ${order.dispatch_method || 'TBC'}
            </p>
            <p>
              <span class="label">Carrier</span>
              ${order.carrier || 'TBC'}
            </p>
            <p>
              <span class="label">Tracking</span>
              ${
                order.tracking_url && order.tracking_number
                  ? `<a href="${order.tracking_url}" target="_blank" rel="noopener">${order.tracking_number}</a>`
                  : order.tracking_number || 'Available when dispatched'
              }
            </p>
            <p>
              <span class="label">Deliver to</span>
              ${order.dispatch_address || '—'}
            </p>
            <p>
              <span class="label">Notes</span>
              ${order.dispatch_notes || '—'}
            </p>
          </div>
        </section>

        ${
          order.customer_notes
            ? `<section class="card">
                <h2>Your notes</h2>
                <p class="muted" style="margin:0">${order.customer_notes}</p>
              </section>`
            : ''
        }
      </div>
    </div>
  `;
}

async function boot() {
  const id = paramsId();
  if (!id) {
    root.innerHTML = '<p class="muted">Missing order id. <a href="/portal.html">Back to orders</a></p>';
    return;
  }

  try {
    const { profile } = await portalApi.getSession();
    if (!profile) {
      window.location.href = '/portal.html';
      return;
    }
    const detail = await portalApi.getOrder(id);
    render(detail, profile);
  } catch (err) {
    root.innerHTML = `<p class="muted">${err.message || 'Could not load order.'} <a href="/portal.html">Back</a></p>`;
  }
}

boot();
