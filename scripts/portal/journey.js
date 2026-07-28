/** Customer order journey — shared labels and step order */

export const JOURNEY_STEPS = [
  {
    status: 'enquiry',
    label: 'Enquiry received',
    blurb: 'We have your request and are preparing a quote.',
  },
  {
    status: 'quoted',
    label: 'Quote sent',
    blurb: 'Pricing is ready for your review.',
  },
  {
    status: 'sample_in_progress',
    label: 'Sample in progress',
    blurb: 'Your physical or digital sample is being prepared.',
  },
  {
    status: 'sample_shipped',
    label: 'Sample shipped',
    blurb: 'Sample is on its way for approval.',
  },
  {
    status: 'sample_approved',
    label: 'Sample approved',
    blurb: 'Approved — moving into production planning.',
  },
  {
    status: 'in_production',
    label: 'In production',
    blurb: 'Boxes are being manufactured.',
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
    blurb: 'Order complete.',
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
