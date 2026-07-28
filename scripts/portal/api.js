import { supabase, supabaseConfigured } from './client.js';
import { demoApi } from './demo-store.js';

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not signed in.');
  return data.user;
}

async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

const supabaseApi = {
  mode: 'supabase',

  async getSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) return { user: null, profile: null };
    const profile = await getProfile(data.session.user.id);
    return { user: data.session.user, profile };
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    const profile = await getProfile(data.user.id);
    return { user: data.user, profile };
  },

  async signUp({ email, password, full_name, company_name }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, company_name, role: 'customer' },
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Could not create account.');
    let profile = null;
    try {
      profile = await getProfile(data.user.id);
    } catch {
      profile = {
        id: data.user.id,
        email,
        full_name,
        company_name,
        role: 'customer',
      };
    }
    return { user: data.user, profile };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async listOrders() {
    const user = await requireUser();
    const profile = await getProfile(user.id);
    let query = supabase.from('orders').select('*').order('updated_at', {
      ascending: false,
    });
    if (profile.role !== 'admin') query = query.eq('customer_id', user.id);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getOrder(orderId) {
    await requireUser();
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .maybeSingle();
    if (error) throw error;
    if (!order) throw new Error('Order not found.');

    const [{ data: items, error: itemsError }, { data: events, error: eventsError }, { data: customer }] =
      await Promise.all([
        supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id)
          .order('sort_order'),
        supabase
          .from('order_events')
          .select('*')
          .eq('order_id', order.id)
          .order('happened_at'),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', order.customer_id)
          .maybeSingle(),
      ]);

    if (itemsError) throw itemsError;
    if (eventsError) throw eventsError;

    return {
      order,
      items: items || [],
      events: events || [],
      customer: customer || null,
    };
  },

  async listCustomers() {
    const user = await requireUser();
    const profile = await getProfile(user.id);
    if (profile.role !== 'admin') throw new Error('Admin only.');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('company_name');
    if (error) throw error;
    return data || [];
  },

  async createOrder(payload) {
    const user = await requireUser();
    const profile = await getProfile(user.id);
    if (profile.role !== 'admin') throw new Error('Admin only.');

    const items = (payload.items || []).map((item, index) => {
      const quantity = Number(item.quantity) || 1;
      const unit = Number(item.unit_price) || 0;
      return {
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
    const total = Math.round((subtotal + vat) * 100) / 100;

    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    const orderNumber = `UN-${String(1000 + (count || 0) + 1)}`;

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
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
        subtotal,
        vat,
        total,
        customer_notes: payload.customer_notes || '',
      })
      .select('*')
      .single();
    if (error) throw error;

    if (items.length) {
      const { error: itemsError } = await supabase.from('order_items').insert(
        items.map((item) => ({ ...item, order_id: order.id }))
      );
      if (itemsError) throw itemsError;
    }

    const { error: eventError } = await supabase.from('order_events').insert({
      order_id: order.id,
      status: order.status,
      title: 'Order created',
      detail: payload.event_detail || 'Order opened in the customer portal.',
      visible_to_customer: true,
    });
    if (eventError) throw eventError;

    return order;
  },

  async updateOrderStatus(orderId, { status, title, detail, ...fields }) {
    const user = await requireUser();
    const profile = await getProfile(user.id);
    if (profile.role !== 'admin') throw new Error('Admin only.');

    const patch = { ...fields };
    if (status) patch.status = status;

    const { data: order, error } = await supabase
      .from('orders')
      .update(patch)
      .eq('id', orderId)
      .select('*')
      .single();
    if (error) throw error;

    const { error: eventError } = await supabase.from('order_events').insert({
      order_id: order.id,
      status: order.status,
      title: title || `Status: ${order.status}`,
      detail: detail || '',
      visible_to_customer: true,
    });
    if (eventError) throw eventError;

    return order;
  },
};

export const portalApi = supabaseConfigured ? supabaseApi : demoApi;
export const portalMode = portalApi.mode;
