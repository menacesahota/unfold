/**
 * unfold — free packaging quote flow (category → quote request → FormSubmit)
 */

const PRODUCTS = [
  {
    id: 'boxes',
    label: 'Boxes',
    blurb: 'Shipping cartons, mailers, retail and gift boxes.',
    icon: 'box',
  },
  {
    id: 'paper-bags',
    label: 'Paper bags',
    blurb: 'Carrier bags, boutique bags and branded takeaway bags.',
    icon: 'bag',
  },
  {
    id: 'food-packaging',
    label: 'Food packaging',
    blurb: 'Trays, wraps, clamshells and food-safe cartons.',
    icon: 'food',
  },
  {
    id: 'mailers',
    label: 'Mailers & postal',
    blurb: 'E-commerce mailers, envelopes and protective packs.',
    icon: 'mailer',
  },
  {
    id: 'flexible',
    label: 'Flexible & pouches',
    blurb: 'Stand-up pouches, sachets and soft packaging.',
    icon: 'pouch',
  },
  {
    id: 'other',
    label: 'Something else',
    blurb: 'Tape, labels, inserts or a custom mix — tell us.',
    icon: 'other',
  },
];

const ICONS = {
  box: `<svg class="product-icon" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M4 10.5 16 4l12 6.5v11L16 28 4 21.5v-11Zm2.2 1.3v8.4L15 26.2V16.4L6.2 11.8Zm17.6 0L17 16.4v9.8l8.8-5.9v-8.5ZM16 5.9l-8.2 4.4L16 14.8l8.2-4.5L16 5.9Z"/></svg>`,
  bag: `<svg class="product-icon" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M10 8.5V7a6 6 0 0 1 12 0v1.5h3.5v18A2.5 2.5 0 0 1 23 29H9a2.5 2.5 0 0 1-2.5-2.5v-18H10Zm2 0h8V7a4 4 0 0 0-8 0v1.5Zm-3.5 2v15.5c0 .3.2.5.5.5h14c.3 0 .5-.2.5-.5V10.5H8.5Z"/></svg>`,
  food: `<svg class="product-icon" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M6 11h20l-1.2 14.2A2.5 2.5 0 0 1 22.3 27H9.7a2.5 2.5 0 0 1-2.5-1.8L6 11Zm2.1 2-.9 11.5c0 .2.1.5.4.5h17c.2 0 .4-.2.4-.5L24 13H8.1ZM9 8.5h14v2H9v-2Zm3-3h8v2h-8V5.5Z"/></svg>`,
  mailer: `<svg class="product-icon" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M5 8.5h22v15H5v-15Zm2 2v3.2l9 5.4 9-5.4V10.5H7Zm18 5.4-8.1 4.9a1.8 1.8 0 0 1-1.8 0L7 15.9V21.5h18v-5.6Z"/></svg>`,
  pouch: `<svg class="product-icon" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M11 4.5h10l1.5 3H26v18.2A3.3 3.3 0 0 1 22.7 29H9.3A3.3 3.3 0 0 1 6 25.7V7.5h3.5L11 4.5Zm1.2 2 .8 1.5h6l.8-1.5h-7.6ZM8 9.5v16.2c0 .7.6 1.3 1.3 1.3h13.4c.7 0 1.3-.6 1.3-1.3V9.5H8Zm3 4h10v2H11v-2Z"/></svg>`,
  other: `<svg class="product-icon" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M15 5h2v8h8v2h-8v8h-2v-8H7v-2h8V5Zm-7.5 16.5h3v3h-3v-3Zm6 0h3v3h-3v-3Zm6 0h3v3h-3v-3Z"/></svg>`,
};
const form = document.getElementById('quote-form');
const formStatus = document.getElementById('form-status');
const productGrid = document.getElementById('product-grid');
const productSelect = document.getElementById('quote-product-select');
const productTypeHidden = document.getElementById('quote-product-type');
const selectedLabel = document.getElementById('selected-product-label');

let selectedProduct = '';

function productById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

function setProduct(id, { scroll = false } = {}) {
  const product = productById(id);
  selectedProduct = product ? product.id : '';

  if (productSelect) productSelect.value = selectedProduct;
  if (productTypeHidden) productTypeHidden.value = product?.label || '';

  productGrid?.querySelectorAll('.product-card').forEach((card) => {
    const active = card.dataset.product === selectedProduct;
    card.classList.toggle('active', active);
    card.setAttribute('aria-selected', String(active));
  });

  if (selectedLabel) {
    if (product) {
      selectedLabel.hidden = false;
      selectedLabel.textContent = `Selected: ${product.label}`;
    } else {
      selectedLabel.hidden = true;
      selectedLabel.textContent = '';
    }
  }

  if (scroll && product) {
    document.getElementById('brief')?.scrollIntoView({ behavior: 'smooth' });
  }
}

function renderProducts() {
  if (!productGrid) return;

  productGrid.innerHTML = PRODUCTS.map(
    (product) => `
    <button
      type="button"
      class="product-card"
      role="option"
      aria-selected="false"
      data-product="${product.id}"
    >
      <span class="product-card-head">
        ${ICONS[product.icon] || ''}
        <span class="product-card-title">${product.label}</span>
      </span>
      <span class="product-card-blurb">${product.blurb}</span>
    </button>`
  ).join('');

  productGrid.querySelectorAll('.product-card').forEach((card) => {
    card.addEventListener('click', () => {
      setProduct(card.dataset.product, { scroll: true });
    });
  });

  if (productSelect) {
    productSelect.innerHTML =
      '<option value="">Select what you need</option>' +
      PRODUCTS.map(
        (p) => `<option value="${p.id}">${p.label}</option>`
      ).join('');

    productSelect.addEventListener('change', () => {
      setProduct(productSelect.value);
    });
  }
}

form?.addEventListener('submit', async (e) => {
  const submitBtn = form.querySelector('button[type="submit"]');
  const fileInput = document.getElementById('quote-files');
  const files = fileInput?.files ? [...fileInput.files] : [];
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const maxBytes = 10 * 1024 * 1024;

  const name = String(form.elements.name?.value || '').trim();
  const email = String(form.elements.email?.value || '').trim();
  const company = String(form.elements.company?.value || '').trim() || '—';
  const quantityField = form.elements.quantity;
  const messageField = form.elements.message;
  const productId = String(productSelect?.value || '');
  const product = productById(productId);

  if (!product) {
    e.preventDefault();
    formStatus.textContent = 'Please select what you need above.';
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (quantityField && !String(quantityField.value || '').trim()) {
    quantityField.value = '—';
  }

  const subjectField = document.getElementById('quote-subject');
  const replytoField = document.getElementById('quote-replyto');
  if (subjectField) {
    subjectField.value = `Free packaging quote — ${product.label} — ${name}`;
  }
  if (replytoField) replytoField.value = email;
  if (productSelect) productSelect.value = product.id;
  if (productTypeHidden) productTypeHidden.value = product.label;

  if (totalBytes > maxBytes) {
    e.preventDefault();
    formStatus.textContent = 'Attachments are too large — please keep under 10MB total.';
    return;
  }

  if (files.length) {
    if (submitBtn) submitBtn.disabled = true;
    formStatus.textContent = 'Uploading attachment and sending…';
    return;
  }

  e.preventDefault();
  if (submitBtn) submitBtn.disabled = true;
  formStatus.textContent = 'Sending…';

  try {
    if (fileInput) fileInput.disabled = true;

    const res = await fetch('https://formsubmit.co/ajax/hello@unfold.supply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        company,
        product: product.id,
        product_type: product.label,
        quantity: String(quantityField?.value || '—'),
        current_price: String(form.elements.current_price?.value || '—'),
        message: String(messageField?.value || '—'),
        _replyto: email,
        _subject: `Free packaging quote — ${product.label} — ${name}`,
        _template: 'table',
        _captcha: 'false',
      }),
    });

    const result = await res.json().catch(() => ({}));
    const resultMessage = String(result.message || '');
    const needsActivation = /activat/i.test(resultMessage);
    const failed =
      (!res.ok || result.success === 'false' || result.success === false) &&
      !needsActivation;

    if (failed) {
      throw new Error(resultMessage || 'Could not send quote request.');
    }

    form.reset();
    setProduct('');
    const fileList = document.getElementById('quote-file-list');
    if (fileList) {
      fileList.hidden = true;
      fileList.textContent = '';
    }

    if (needsActivation) {
      formStatus.textContent =
        'Almost there — check hello@unfold.supply for a FormSubmit activation email, click Activate once, then submit again.';
    } else {
      formStatus.textContent =
        'Quote request sent — we’ll reply within one working day.';
    }
  } catch (err) {
    const detail = err?.message ? ` ${err.message}` : '';
    formStatus.textContent = `Could not send automatically.${detail} Email hello@unfold.supply and we will help.`;
    console.error(err);
  } finally {
    if (fileInput) fileInput.disabled = false;
    if (submitBtn) submitBtn.disabled = false;
  }
});

document.getElementById('quote-files')?.addEventListener('change', (e) => {
  const list = document.getElementById('quote-file-list');
  if (!list) return;
  const files = [...(e.target.files || [])];
  if (!files.length) {
    list.hidden = true;
    list.textContent = '';
    return;
  }
  list.hidden = false;
  list.textContent = files
    .map((file) => `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`)
    .join(' · ');
});

if (new URLSearchParams(window.location.search).get('quote') === 'sent') {
  if (formStatus) {
    formStatus.textContent =
      'Quote request sent — we’ll reply within one working day.';
  }
  const url = new URL(window.location.href);
  url.searchParams.delete('quote');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

renderProducts();

const hashProduct = new URLSearchParams(window.location.search).get('product');
if (hashProduct && productById(hashProduct)) {
  setProduct(hashProduct);
}
