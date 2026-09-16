import './analytics.js';
import {PACKS,activeOffers,money} from './buyer-catalog.js';
const catalogue=document.getElementById('catalogue');
if(catalogue) catalogue.innerHTML=PACKS.map(p=>`<article class="buyer-card"><h2>${p.title}</h2><p>${p.intro}</p><p class="small-note">Custom brief · Minimum run and timing confirmed with your quote</p><a class="btn" href="/product.html?pack=${p.id}">Explore ${p.title.toLowerCase()} →</a></article>`).join('');
const detail=document.getElementById('product-content');
if(detail){
 const p=PACKS.find(p=>p.id===new URLSearchParams(location.search).get('pack'));
 if(!p) detail.innerHTML='<h1>Choose your packaging.</h1><p>That product could not be found. <a href="/packaging.html">Browse the range</a>.</p>';
 else {
  document.title=`${p.title} — unfold`;
  detail.innerHTML=`<div class="product-detail"><section><p class="eyebrow">E-COMMERCE PACKAGING</p><h1>${p.title}</h1><p class="buyer-lead">${p.intro}</p><ul>${p.options.map(o=>`<li>${o}</li>`).join('')}</ul><dl class="product-facts"><div><dt>Sizes</dt><dd>Tell us your product dimensions or existing box size.</dd></div><div><dt>Minimum quantity</dt><dd>Confirmed for your specification. Tell us your target run.</dd></div><div><dt>Production &amp; delivery</dt><dd>Confirmed after specification and artwork review.</dd></div></dl><div class="actions"><a class="btn" href="/start.html?pack=${p.id}">Build my request →</a><a class="text-link" href="/start.html?pack=${p.id}&request=sample">Ask about samples</a></div></section><section>${p.image?`<img src="/fefco/${p.image}.png" alt="Illustrative ${p.title.toLowerCase()} box family"><p class="sample-caption">Illustrative box family, not a verified customer order or exact production specification.</p>`:''}<div class="buyer-callout"><h2>Before you order</h2><p>${p.checks}</p><h2>Your quote should cover</h2><p>Goods, printing, tooling and setup, delivery and VAT. We confirm these for the requested quantity and delivery address.</p></div><h2>Price &amp; quantity options</h2><div id="verified-offers"></div><p><a class="text-link" href="/artwork.html">Need help with artwork? →</a></p></section></div>`;
  const offers=activeOffers(p.id);
  document.getElementById('verified-offers').innerHTML=offers.length?offers.map(o=>`<p>${o.quantity} units · ${money(o.goods+o.setup+o.delivery+o.vat)} including VAT · ${o.scope}</p>`).join(''):'<p class="buyer-lead">Request a reviewed price for your quantity. We’ll confirm the full cost for your specification, including setup and delivery.</p>';
 }
}
