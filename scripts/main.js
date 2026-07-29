/**
 * unfold — packaging brief flow (category → brief → FormSubmit)
 */

const PRODUCTS = [
  {
    id: 'boxes',
    label: 'Boxes',
    blurb: 'Shipping cartons, mailers, retail and gift boxes.',
  },
  {
    id: 'paper-bags',
    label: 'Paper bags',
    blurb: 'Carrier bags, boutique bags and branded takeaway bags.',
  },
  {
    id: 'food-packaging',
    label: 'Food packaging',
    blurb: 'Trays, wraps, clamshells and food-safe cartons.',
  },
  {
    id: 'mailers',
    label: 'Mailers & postal',
    blurb: 'E-commerce mailers, envelopes and protective packs.',
  },
  {
    id: 'flexible',
    label: 'Flexible & pouches',
    blurb: 'Stand-up pouches, sachets and soft packaging.',
  },
  {
    id: 'other',
    label: 'Something else',
    blurb: 'Tape, labels, inserts or a custom mix — tell us.',
  },
];

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
      <span class="product-card-title">${product.label}</span>
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
    subjectField.value = `Packaging brief — ${product.label} — ${name}`;
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
        message: String(messageField?.value || '—'),
        _replyto: email,
        _subject: `Packaging brief — ${product.label} — ${name}`,
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
      throw new Error(resultMessage || 'Could not send brief.');
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
        'Brief sent — we’ll reply within one working day.';
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
    formStatus.textContent = 'Brief sent — we’ll reply within one working day.';
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
