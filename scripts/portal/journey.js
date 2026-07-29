/** Customer order journey — shared labels and step order */

export const JOURNEY_STEPS = [
  {
    status: 'enquiry',
    label: 'Brief received',
    blurb: 'We have your project brief and are reviewing requirements.',
  },
  {
    status: 'sample_in_progress',
    label: 'Design in progress',
    blurb: 'Structure and print are being developed for your brief.',
  },
  {
    status: 'sample_shipped',
    label: 'Sample sent',
    blurb: 'A proof or physical sample is on its way for approval.',
  },
  {
    status: 'sample_approved',
    label: 'Sample approved',
    blurb: 'Approved — preparing your competitive quote.',
  },
  {
    status: 'quoted',
    label: 'Competitive quote',
    blurb: 'Pricing is ready for your review.',
  },
  {
    status: 'in_production',
    label: 'In production',
    blurb: 'Your packaging is being manufactured.',
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
