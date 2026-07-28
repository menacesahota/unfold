import { portalApi } from './api.js';
import { JOURNEY_STEPS, STATUS_META } from './journey.js';

const gate = document.getElementById('admin-gate');
const view = document.getElementById('admin-view');
const navSignout = document.getElementById('nav-signout');
const updateForm = document.getElementById('update-form');
const createForm = document.getElementById('create-form');
const updateOrder = document.getElementById('update-order');
const updateStatus = document.getElementById('update-status');
const createStatus = document.getElementById('create-status');
const createCustomer = document.getElementById('create-customer');
const updateStatusMsg = document.getElementById('update-status-msg');
const createStatusMsg = document.getElementById('create-status-msg');

const ALL_STATUSES = [
  ...JOURNEY_STEPS.map((s) => s.status),
  'on_hold',
  'cancelled',
];

navSignout?.addEventListener('click', async () => {
  await portalApi.signOut();
  window.location.href = '/portal.html';
});

function fillStatusSelects() {
  const options = ALL_STATUSES.map((status) => {
    const label = STATUS_META[status]?.label || status;
    return `<option value="${status}">${label}</option>`;
  }).join('');
  updateStatus.innerHTML = options;
  createStatus.innerHTML = options;
}

async function refreshOrders() {
  const orders = await portalApi.listOrders();
  updateOrder.innerHTML = orders
    .map(
      (order) =>
        `<option value="${order.id}">${order.order_number} — ${order.title}</option>`
    )
    .join('');
  if (!orders.length) {
    updateOrder.innerHTML = '<option value="">No orders yet</option>';
  }
}

async function refreshCustomers() {
  const customers = await portalApi.listCustomers();
  createCustomer.innerHTML = customers
    .map(
      (c) =>
        `<option value="${c.id}">${c.company_name || c.full_name || c.email}</option>`
    )
    .join('');
  if (!customers.length) {
    createCustomer.innerHTML =
      '<option value="">No customers — create a customer account first</option>';
  }
}

updateOrder?.addEventListener('change', async () => {
  const id = updateOrder.value;
  if (!id) return;
  try {
    const { order } = await portalApi.getOrder(id);
    updateForm.status.value = order.status;
    updateForm.lead_time_days.value = order.lead_time_days ?? '';
    updateForm.estimated_dispatch_date.value = order.estimated_dispatch_date || '';
    updateForm.estimated_delivery_date.value = order.estimated_delivery_date || '';
    updateForm.carrier.value = order.carrier || '';
    updateForm.tracking_number.value = order.tracking_number || '';
    updateForm.tracking_url.value = order.tracking_url || '';
    updateForm.dispatch_method.value = order.dispatch_method || '';
    updateForm.dispatch_address.value = order.dispatch_address || '';
    updateForm.dispatch_notes.value = order.dispatch_notes || '';
  } catch {
    /* ignore */
  }
});

updateForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  updateStatusMsg.classList.remove('error');
  updateStatusMsg.textContent = 'Publishing…';
  const data = new FormData(updateForm);
  try {
    const order = await portalApi.updateOrderStatus(String(data.get('order_id')), {
      status: String(data.get('status')),
      title: String(data.get('title') || '') || undefined,
      detail: String(data.get('detail') || ''),
      lead_time_days: data.get('lead_time_days')
        ? Number(data.get('lead_time_days'))
        : null,
      estimated_dispatch_date: String(data.get('estimated_dispatch_date') || '') || null,
      estimated_delivery_date: String(data.get('estimated_delivery_date') || '') || null,
      carrier: String(data.get('carrier') || '') || null,
      tracking_number: String(data.get('tracking_number') || '') || null,
      tracking_url: String(data.get('tracking_url') || '') || null,
      dispatch_method: String(data.get('dispatch_method') || '') || null,
      dispatch_address: String(data.get('dispatch_address') || '') || null,
      dispatch_notes: String(data.get('dispatch_notes') || '') || null,
    });
    updateStatusMsg.textContent = `Updated ${order.order_number}.`;
    await refreshOrders();
  } catch (err) {
    updateStatusMsg.classList.add('error');
    updateStatusMsg.textContent = err.message || 'Update failed.';
  }
});

createForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  createStatusMsg.classList.remove('error');
  createStatusMsg.textContent = 'Creating…';
  const data = new FormData(createForm);
  try {
    const order = await portalApi.createOrder({
      customer_id: String(data.get('customer_id')),
      title: String(data.get('title')),
      status: String(data.get('status') || 'enquiry'),
      lead_time_days: data.get('lead_time_days')
        ? Number(data.get('lead_time_days'))
        : null,
      dispatch_address: String(data.get('dispatch_address') || '') || null,
      items: [
        {
          name: String(data.get('item_name') || 'Custom box'),
          fefco: String(data.get('fefco') || '0201'),
          length_mm: Number(data.get('length_mm')),
          width_mm: Number(data.get('width_mm')),
          height_mm: Number(data.get('height_mm')),
          board: String(data.get('board') || 'kraft'),
          wall: String(data.get('wall') || 'single'),
          quantity: Number(data.get('quantity')),
          unit_price: Number(data.get('unit_price')),
          brand_text: String(data.get('brand_text') || ''),
          print_notes: String(data.get('print_notes') || ''),
        },
      ],
    });
    createStatusMsg.textContent = `Created ${order.order_number}.`;
    createForm.reset();
    fillStatusSelects();
    await refreshOrders();
    await refreshCustomers();
  } catch (err) {
    createStatusMsg.classList.add('error');
    createStatusMsg.textContent = err.message || 'Create failed.';
  }
});

async function boot() {
  fillStatusSelects();
  try {
    const { profile } = await portalApi.getSession();
    if (!profile) {
      window.location.href = '/portal.html';
      return;
    }
    if (profile.role !== 'admin') {
      gate.innerHTML =
        '<p class="muted">Admin access only. <a href="/portal.html">Back to portal</a></p>';
      return;
    }
    gate.hidden = true;
    view.hidden = false;
    await refreshCustomers();
    await refreshOrders();
    updateOrder.dispatchEvent(new Event('change'));
  } catch (err) {
    gate.innerHTML = `<p class="muted">${err.message || 'Could not load admin.'}</p>`;
  }
}

boot();
