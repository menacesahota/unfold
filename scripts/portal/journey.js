/** Customer order journey — free quote → source → supply via unfold */

export const JOURNEY_STEPS = [
  {
    status: 'enquiry',
    label: 'Quote request',
    blurb: 'We have your details and are reviewing what you need.',
  },
  {
    status: 'sample_in_progress',
    label: 'Sourcing',
    blurb: 'Finding and negotiating with suitable packaging suppliers.',
  },
  {
    status: 'sample_shipped',
    label: 'Options ready',
    blurb: 'Supplier options are being finalised for your quote.',
  },
  {
    status: 'sample_approved',
    label: 'Spec confirmed',
    blurb: 'Spec locked — preparing your unfold price.',
  },
  {
    status: 'quoted',
    label: 'Free quote ready',
    blurb: 'Your unfold price is ready to review — no obligation.',
  },
  {
    status: 'in_production',
    label: 'Order placed',
    blurb: 'Order confirmed through unfold — production underway.',
  },
  {
    status: 'quality_check',
    label: 'Quality check',
    blurb: 'Final inspection before dispatch.',
  },
  {
    status: 'dispatched',
    label: 'Dispatched',
    blurb: 'On the way to your delivery address.',
  },
  {
    status: 'delivered',
    label: 'Delivered',
    blurb: 'Order complete — reorders keep the better pricing.',
  },
];

export const STATUS_META = Object.fromEntries(
  JOURNEY_STEPS.map((step) => [step.status, step])
);

STATUS_META.on_hold = {
  status: 'on_hold',
  label: 'On hold',
  blurb: 'Paused — we will update you shortly.',
};

STATUS_META.cancelled = {
  status: 'cancelled',
  label: 'Cancelled',
  blurb: 'This order has been cancelled.',
};

const ACTIVE_INDEX = Object.fromEntries(
  JOURNEY_STEPS.map((step, i) => [step.status, i])
);

export function journeyIndex(status) {
  return ACTIVE_INDEX[status] ?? -1;
}

export function formatMoney(amount, currency = 'GBP') {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `£${value.toFixed(2)}`;
  }
}

export function formatDate(value) {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function leadTimeLabel(days) {
  if (days == null || days === '') return 'TBC';
  const n = Number(days);
  if (!Number.isFinite(n)) return 'TBC';
  if (n <= 0) return 'ASAP';
  return `${n} working day${n === 1 ? '' : 's'}`;
}
