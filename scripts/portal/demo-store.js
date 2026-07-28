/**
 * Local demo store — used until Supabase env vars are set on Render.
 * Seeded with a realistic customer journey so the portal is usable immediately.
 */

const STORAGE_KEY = 'unfold-portal-demo-v1';

const DEMO_USERS = {
  'demo@customer.com': {
    id: 'cust-demo-1',
    email: 'demo@customer.com',
    password: 'demo1234',
    full_name: 'Alex Morgan',
    company_name: 'Northline Goods',
    role: 'customer',
  },
  'admin@unfold.supply': {
    id: 'admin-demo-1',
    email: 'admin@unfold.supply',
    password: 'admin1234',
    full_name: 'Unfold Ops',
    company_name: 'unfold',
    role: 'admin',
  },
};

function uid(prefix = 'id') {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function seed() {
  const orderId = 'ord-demo-1';
  const orderId2 = 'ord-demo-2';

  return {
    sessionUserId: null,
    accounts: Object.fromEntries(
      Object.entries(DEMO_USERS).map(([email, account]) => [
        email,
        { id: account.id, password: account.password },
      ])
    ),
    profiles: Object.values(DEMO_USERS).map(({ password, ...p }) => p),
    orders: [
      {
        id: orderId,
        order_number: 'UN-1042',
        customer_id: 'cust-demo-1',
        title: 'E-commerce mailers — spring drop',
        status: 'in_production',
        lead_time_days: 12,
        estimated_dispatch_date: '2026-08-08',
        estimated_delivery_date: '2026-08-12',
        carrier: null,
        tracking_number: null,
        tracking_url: null,
        dispatch_method: 'Pallet via pallet network',
        dispatch_address: 'Unit 4, Riverside Industrial Estate, Leeds LS10 1AB',
        dispatch_notes: 'Deliver between 08:00–16:00. Forklift on site.',
        currency: 'GBP',
        subtotal: 1840,
        vat: 368,
        total: 2208,
        customer_notes: 'Match approved sample colour as closely as possible.',
        created_at: '2026-07-10T09:12:00.000Z',
        updated_at: '2026-07-26T14:20:00.000Z',
      },
      {
        id: orderId2,
        order_number: 'UN-0988',
        customer_id: 'cust-demo-1',
        title: 'RSC shippers — restock',
        status: 'delivered',
        lead_time_days: 10,
        estimated_dispatch_date: '2026-06-18',
        estimated_delivery_date: '2026-06-20',
        carrier: 'DPD',
        tracking_number: '15501234567890',
        tracking_url: 'https://www.dpd.co.uk/',
        dispatch_method: 'Parcel network',
        dispatch_address: 'Unit 4, Riverside Industrial Estate, Leeds LS10 1AB',
        dispatch_notes: 'Left in goods-in.',
        currency: 'GBP',
        subtotal: 620,
        vat: 124,
        total: 744,
        customer_notes: '',
        created_at: '2026-05-28T11:00:00.000Z',
        updated_at: '2026-06-20T16:40:00.000Z',
      },
    ],
    items: [
      {
        id: 'item-1',
        order_id: orderId,
        name: 'Self-lock mailer',
        fefco: '0426',
        length_mm: 320,
        width_mm: 230,
        height_mm: 80,
        board: 'kraft',
        wall: 'single',
        quantity: 2000,
        unit_price: 0.72,
        line_total: 1440,
        brand_text: 'Northline',
        print_notes: '1-colour teal logo, front panel',
        sort_order: 0,
      },
      {
        id: 'item-2',
        order_id: orderId,
        name: 'Tissue wrap insert pad',
        fefco: '0201',
        length_mm: 300,
        width_mm: 210,
        height_mm: 20,
        board: 'white',
        wall: 'single',
        quantity: 2000,
        unit_price: 0.2,
        line_total: 400,
        brand_text: '',
        print_notes: 'Plain — no print',
        sort_order: 1,
      },
      {
        id: 'item-3',
        order_id: orderId2,
        name: 'Regular slotted carton',
        fefco: '0201',
        length_mm: 400,
        width_mm: 300,
        height_mm: 250,
        board: 'kraft',
        wall: 'double',
        quantity: 500,
        unit_price: 1.24,
        line_total: 620,
        brand_text: 'Northline',
        print_notes: 'Black one-colour brand mark',
        sort_order: 0,
      },
    ],
    events: [
      {
        id: 'ev-1',
        order_id: orderId,
        status: 'enquiry',
        title: 'Enquiry received',
        detail: 'Quote form submitted for spring mailer programme.',
        happened_at: '2026-07-10T09:12:00.000Z',
        visible_to_customer: true,
      },
      {
        id: 'ev-2',
        order_id: orderId,
        status: 'quoted',
        title: 'Quote sent',
        detail: 'Ballpark £1,840 ex VAT for 2,000 mailers + pads. MOQ met.',
        happened_at: '2026-07-11T15:40:00.000Z',
        visible_to_customer: true,
      },
      {
        id: 'ev-3',
        order_id: orderId,
        status: 'sample_in_progress',
        title: 'Sample in progress',
        detail: 'Structural sample cut for FEFCO 0426 with print proof.',
        happened_at: '2026-07-15T10:05:00.000Z',
        visible_to_customer: true,
      },
      {
        id: 'ev-4',
        order_id: orderId,
        status: 'sample_shipped',
        title: 'Sample shipped',
        detail: 'Sent via courier to Leeds goods-in.',
        happened_at: '2026-07-17T13:22:00.000Z',
        visible_to_customer: true,
      },
      {
        id: 'ev-5',
        order_id: orderId,
        status: 'sample_approved',
        title: 'Sample approved',
        detail: 'Customer approved structure and print. Production booked.',
        happened_at: '2026-07-22T09:50:00.000Z',
        visible_to_customer: true,
      },
      {
        id: 'ev-6',
        order_id: orderId,
        status: 'in_production',
        title: 'In production',
        detail: 'Board on machine. Est. dispatch 8 Aug.',
        happened_at: '2026-07-26T14:20:00.000Z',
        visible_to_customer: true,
      },
      {
        id: 'ev-7',
        order_id: orderId2,
        status: 'enquiry',
        title: 'Enquiry received',
        detail: 'Restock of double-wall RSC.',
        happened_at: '2026-05-28T11:00:00.000Z',
        visible_to_customer: true,
      },
      {
        id: 'ev-8',
        order_id: orderId2,
        status: 'quoted',
        title: 'Quote sent',
        detail: '£620 ex VAT for 500 boxes.',
        happened_at: '2026-05-28T16:10:00.000Z',
        visible_to_customer: true,
      },
      {
        id: 'ev-9',
        order_id: orderId2,
        status: 'sample_approved',
        title: 'Sample approved',
        detail: 'Repeat of previous approved style — sample waived.',
        happened_at: '2026-05-29T09:00:00.000Z',
        visible_to_customer: true,
      },
      {
        id: 'ev-10',
        order_id: orderId2,
        status: 'in_production',
        title: 'In production',
        detail: 'On press.',
        happened_at: '2026-06-05T08:30:00.000Z',
        visible_to_customer: true,
      },
      {
        id: 'ev-11',
        order_id: orderId2,
        status: 'dispatched',
        title: 'Dispatched',
        detail: 'DPD collection. Tracking 15501234567890.',
        happened_at: '2026-06-18T11:15:00.000Z',
        visible_to_customer: true,
      },
      {
        id: 'ev-12',
        order_id: orderId2,
        status: 'delivered',
        title: 'Delivered',
        detail: 'Signed for at goods-in.',
        happened_at: '2026-06-20T16:40:00.000Z',
        visible_to_customer: true,
      },
    ],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (!data.accounts) {
        data.accounts = Object.fromEntries(
          Object.entries(DEMO_USERS).map(([email, account]) => [
            email,
            { id: account.id, password: account.password },
          ])
        );
        save(data);
      }
      return data;
    }
  } catch {
    /* ignore */
  }
  const data = seed();
  save(data);
  return data;
}

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function currentProfile(data) {
  if (!data.sessionUserId) return null;
  return data.profiles.find((p) => p.id === data.sessionUserId) || null;
}

export const demoApi = {
  mode: 'demo',

  async getSession() {
    const data = load();
    const profile = currentProfile(data);
    return profile ? { user: profile, profile } : { user: null, profile: null };
  },

  async signIn(email, password) {
    const data = load();
    const key = email.trim().toLowerCase();
    const account = data.accounts?.[key];
    const profile = data.profiles.find((p) => p.email === key);
    if (!account || !profile || account.password !== password) {
      throw new Error('Invalid email or password.');
    }
    data.sessionUserId = profile.id;
    save(data);
    return { user: profile, profile };
  },

  async signUp({ email, password, full_name, company_name }) {
    const data = load();
    const key = email.trim().toLowerCase();
    if (data.accounts?.[key] || data.profiles.some((p) => p.email === key)) {
      throw new Error('An account with that email already exists.');
    }
    const profile = {
      id: uid('cust'),
      email: key,
      full_name: full_name || '',
      company_name: company_name || '',
      role: 'customer',
    };
    data.accounts = data.accounts || {};
    data.accounts[key] = { id: profile.id, password };
    data.profiles.push(profile);
    data.sessionUserId = profile.id;
    save(data);
    return { user: profile, profile };
  },

  async signOut() {
    const data = load();
    data.sessionUserId = null;
    save(data);
  },

  async listOrders() {
    const data = load();
    const profile = currentProfile(data);
    if (!profile) throw new Error('Not signed in.');
    const orders =
      profile.role === 'admin'
        ? [...data.orders]
        : data.orders.filter((o) => o.customer_id === profile.id);
    return orders.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  },

  async getOrder(orderId) {
    const data = load();
    const profile = currentProfile(data);
    if (!profile) throw new Error('Not signed in.');
    const order = data.orders.find((o) => o.id === orderId || o.order_number === orderId);
    if (!order) throw new Error('Order not found.');
    if (profile.role !== 'admin' && order.customer_id !== profile.id) {
      throw new Error('Order not found.');
    }
    const customer = data.profiles.find((p) => p.id === order.customer_id) || null;
    const items = data.items
      .filter((i) => i.order_id === order.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const events = data.events
      .filter((e) => e.order_id === order.id)
      .filter((e) => profile.role === 'admin' || e.visible_to_customer)
      .sort((a, b) => a.happened_at.localeCompare(b.happened_at));
    return { order, items, events, customer };
  },

  async listCustomers() {
    const data = load();
    const profile = currentProfile(data);
    if (!profile || profile.role !== 'admin') throw new Error('Admin only.');
    return data.profiles.filter((p) => p.role === 'customer');
  },

  async createOrder(payload) {
    const data = load();
    const profile = currentProfile(data);
    if (!profile || profile.role !== 'admin') throw new Error('Admin only.');

    const orderId = uid('ord');
    const now = new Date().toISOString();
    const orderNumber = `UN-${String(1000 + data.orders.length + 1)}`;
    const items = (payload.items || []).map((item, index) => {
      const quantity = Number(item.quantity) || 1;
      const unit = Number(item.unit_price) || 0;
      return {
        id: uid('item'),
        order_id: orderId,
        name: item.name || 'Custom box',
        fefco: item.fefco || '0201',
        length_mm: Number(item.length_mm) || 300,
        width_mm: Number(item.width_mm) || 200,
        height_mm: Number(item.height_mm) || 150,
        board: item.board || 'kraft',
        wall: item.wall || 'single',
        quantity,
        unit_price: unit,
        line_total: Math.round(quantity * unit * 100) / 100,
        brand_text: item.brand_text || '',
        print_notes: item.print_notes || '',
        sort_order: index,
      };
    });
    const subtotal = items.reduce((sum, i) => sum + i.line_total, 0);
    const vat = Math.round(subtotal * 0.2 * 100) / 100;
    const order = {
      id: orderId,
      order_number: orderNumber,
      customer_id: payload.customer_id,
      title: payload.title || 'Box order',
      status: payload.status || 'enquiry',
      lead_time_days: payload.lead_time_days ?? null,
      estimated_dispatch_date: payload.estimated_dispatch_date || null,
      estimated_delivery_date: payload.estimated_delivery_date || null,
      carrier: payload.carrier || null,
      tracking_number: payload.tracking_number || null,
      tracking_url: payload.tracking_url || null,
      dispatch_method: payload.dispatch_method || null,
      dispatch_address: payload.dispatch_address || null,
      dispatch_notes: payload.dispatch_notes || null,
      currency: 'GBP',
      subtotal,
      vat,
      total: Math.round((subtotal + vat) * 100) / 100,
      customer_notes: payload.customer_notes || '',
      created_at: now,
      updated_at: now,
    };

    data.orders.push(order);
    data.items.push(...items);
    data.events.push({
      id: uid('ev'),
      order_id: orderId,
      status: order.status,
      title: 'Order created',
      detail: payload.event_detail || 'Order opened in the customer portal.',
      happened_at: now,
      visible_to_customer: true,
    });
    save(data);
    return order;
  },

  async updateOrderStatus(orderId, { status, title, detail, ...fields }) {
    const data = load();
    const profile = currentProfile(data);
    if (!profile || profile.role !== 'admin') throw new Error('Admin only.');
    const order = data.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found.');

    const now = new Date().toISOString();
    order.status = status || order.status;
    order.updated_at = now;
    for (const key of [
      'lead_time_days',
      'estimated_dispatch_date',
      'estimated_delivery_date',
      'carrier',
      'tracking_number',
      'tracking_url',
      'dispatch_method',
      'dispatch_address',
      'dispatch_notes',
      'customer_notes',
      'title',
    ]) {
      if (fields[key] !== undefined) order[key] = fields[key];
    }

    data.events.push({
      id: uid('ev'),
      order_id: order.id,
      status: order.status,
      title: title || `Status: ${order.status}`,
      detail: detail || '',
      happened_at: now,
      visible_to_customer: true,
    });
    save(data);
    return order;
  },
};
