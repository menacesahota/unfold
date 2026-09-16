import {supabase,supabaseConfigured} from './client.js';
import {escapeHtml as h,money} from '../buyer-catalog.js';
const root=document.getElementById('commerce-root');
const enabled=import.meta.env.VITE_COMMERCE_ENABLED==='true' && supabaseConfigured;
let profile,quotes=[];
const fail=error=>{const message=document.getElementById('commerce-status');if(message)message.textContent=error.message||'Could not complete the request. Your changes have not been confirmed.';};
async function result(query){const {data,error}=await query;if(error)throw error;return data;}
function actions(q){
 const expired=q.valid_until<new Date().toISOString().slice(0,10);
 if(profile.role==='admin') return `${q.status==='draft'?'<button class="btn" data-action="publish">Publish this version</button>':''}${['draft','sent','changes'].includes(q.status)?'<button class="btn buyer-secondary" data-action="withdraw">Withdraw</button>':''}`;
 if(q.status==='sent'&&!expired) return `<label><input type="checkbox" data-agree> I approve quote version ${q.version}, its specification, total, timing and terms${q.proof_path?`, and artwork proof ${h(q.proof_version)}`:''}.</label><div class="actions"><button class="btn" data-action="accept">Approve this quote</button><button class="btn buyer-secondary" data-action="changes">Request a change</button></div><label class="field">Changes requested<textarea data-changes rows="2" maxlength="5000"></textarea></label>`;
 if(q.status==='accepted') return `${q.payment_url?`<a class="btn" href="${h(q.payment_url)}" target="_blank" rel="noopener">View secure Stripe invoice ↗</a><p class="small-note">Payment happens on Stripe. Opening this link does not mark the order paid. Follow the invoice’s payment confirmation.</p>`:'<p>Quote approved. Unfold will confirm payment arrangements before production.</p>'}<button class="btn buyer-secondary" data-action="reorder">Request another run</button>`;
 return `<p>${expired?'This quote has expired. Ask for updated pricing.':q.status==='changes'?'Your change request is recorded. Await a revised quote.':'This version is no longer open for approval.'}</p>`;
}
function renderQuote(q){
 return `<article class="commerce-item" data-id="${h(q.id)}"><p class="eyebrow">${h(q.reference)} · VERSION ${q.version} · ${h(q.status)}</p><h2>${h(q.title)}</h2><p>${q.quantity.toLocaleString()} units · Valid through ${h(q.valid_until)}</p><details><summary>Specification and terms</summary><h3>Specification</h3><pre>${h(q.specification)}</pre><h3>Timing</h3><p>${h(q.timing)}</p><h3>Terms</h3><pre>${h(q.terms)}</pre></details><dl><dt>Goods and printing</dt><dd>${money(q.goods)}</dd><dt>Tooling / setup</dt><dd>${money(q.setup)}</dd><dt>Delivery</dt><dd>${money(q.delivery)}</dd><dt>VAT</dt><dd>${money(q.vat)}</dd><dt><strong>Total GBP</strong></dt><dd><strong>${money(Number(q.goods)+Number(q.setup)+Number(q.delivery)+Number(q.vat))}</strong></dd></dl>${q.proof_path?`<button type="button" class="btn buyer-secondary" data-action="proof">Open proof ${h(q.proof_version)}</button><p class="small-note">Check this exact proof before approving.</p>`:'<p class="small-note">No artwork proof attached. Do not approve printed production until the required proof is included.</p>'}<div class="actions">${actions(q)}</div><details><summary>Activity</summary><div data-events>Open a quote action to refresh activity, or reload this page.</div></details></article>`;
}
async function load(){
 quotes=await result(supabase.from('packaging_quotes').select('*').order('created_at',{ascending:false}));
 document.getElementById('quote-list').innerHTML=quotes.map(renderQuote).join('')||'<p class="buyer-callout">No published quotes yet. <a href="/start.html">Start a packaging request</a>.</p>';
 if(quotes.length){
  const events=await result(supabase.from('packaging_quote_events').select('*').in('quote_id',quotes.map(q=>q.id)).order('created_at',{ascending:false}));
  for(const q of quotes){const node=document.querySelector(`[data-id="${q.id}"] [data-events]`);node.textContent=events.filter(e=>e.quote_id===q.id).map(e=>`${new Date(e.created_at).toLocaleString('en-GB')} · ${e.action}${e.detail?' · '+e.detail:''}`).join('\n')||'No activity yet.';node.style.whiteSpace='pre-wrap';}
 }
}
async function adminSetup(){
 const customers=await result(supabase.from('profiles').select('id,email,company_name').eq('role','customer').order('email'));
 document.getElementById('admin-tools').innerHTML=`<details class="buyer-callout"><summary>Create a reviewed quote</summary><p>Use confirmed supplier costs only. All amounts are GBP. A revision needs the same reference and a higher version. Published versions cannot be edited. Publishing does not send an email.</p><form id="new-quote" class="commerce-form"><label class="field">Customer<select name="customer_id" required>${customers.map(c=>`<option value="${c.id}">${h(c.company_name||c.email)} — ${h(c.email)}</option>`).join('')}</select></label><div class="field-row"><label class="field">Request reference<input name="reference" required maxlength="100"></label><label class="field">Version<input type="number" name="version" value="1" min="1" required></label></div><label class="field">Title<input name="title" required maxlength="200"></label><label class="field">Agreed specification<textarea name="specification" required minlength="10" rows="5"></textarea></label><label class="field">Quantity<input name="quantity" type="number" min="1" required></label>${['goods','setup','delivery','vat'].map(k=>`<label class="field">${k==='goods'?'Goods and printing':k==='vat'?'VAT':k==='setup'?'Tooling / setup':'Delivery'} (GBP)<input type="number" name="${k}" min="0" step="0.01" required></label>`).join('')}<label class="field">Valid through<input name="valid_until" type="date" required></label><label class="field">Confirmed production and delivery timing<textarea name="timing" required></textarea></label><label class="field">Commercial terms<textarea name="terms" required minlength="10" rows="4"></textarea></label><label class="field">Artwork proof (PDF, PNG or JPEG; max 10 MB)<input name="proof" type="file" accept="application/pdf,image/png,image/jpeg"></label><label class="field">Proof version<input name="proof_version" maxlength="100" placeholder="Required if a proof is attached"></label><label class="field">Customer-specific Stripe hosted invoice URL <span class="field-optional">optional</span><input name="payment_url" type="url" placeholder="https://invoice.stripe.com/i/…"></label><p class="small-note">Create the invoice in your Stripe account for this customer and exact amount. Never use a reusable or unrelated payment link.</p><button class="btn">Save draft quote</button></form></details><details class="buyer-callout"><summary>Enquiry work queue</summary><p>Log incoming email requests here using their UF reference. Email requests are not imported automatically. Set an internal follow-up time and keep the state current.</p><form id="new-enquiry" class="commerce-form"><label class="field">Request reference<input name="reference" required></label><label class="field">Customer contact<input name="contact" required></label><label class="field">Brief<textarea name="brief" required></textarea></label><label class="field">Follow up by<input name="due_at" type="datetime-local" required></label><button class="btn">Add to queue</button></form><div id="enquiry-list"></div></details>`;
 document.getElementById('new-quote').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.currentTarget,button=f.querySelector('button');button.disabled=true;
  try{
   const data=Object.fromEntries(new FormData(f)),file=data.proof;delete data.proof;
   for(const k of ['version','quantity','goods','setup','delivery','vat'])data[k]=Number(data[k]);
   data.payment_url=data.payment_url.trim()||null;
   if(data.payment_url&&!/^https:\/\/invoice\.stripe\.com\/i\/[A-Za-z0-9_/?=.-]+$/.test(data.payment_url))throw Error('Use a customer-specific Stripe hosted invoice URL.');
   data.proof_version=data.proof_version.trim()||null;
   if(file.size){
    if(file.size>10485760||!['application/pdf','image/png','image/jpeg'].includes(file.type)||!data.proof_version)throw Error('Provide a proof version and a PDF/PNG/JPEG no larger than 10 MB.');
    const path=`${data.customer_id}/${crypto.randomUUID()}.${file.type==='application/pdf'?'pdf':file.type==='image/png'?'png':'jpg'}`;
    await result(supabase.storage.from('packaging-proofs').upload(path,file,{upsert:false}));data.proof_path=path;
   }else if(data.proof_version)throw Error('Attach the proof file for this version.');
   await result(supabase.from('packaging_quotes').insert(data));f.reset();await load();document.getElementById('commerce-status').textContent='Draft saved. Review it below before publishing.';
  }catch(error){fail(error);}finally{button.disabled=false;}
 });
 const refreshQueue=async()=>{
  const rows=await result(supabase.from('packaging_enquiries').select('*').order('due_at',{ascending:true}));
  document.getElementById('enquiry-list').innerHTML=rows.map(r=>`<article class="commerce-item"><strong>${h(r.reference)} · ${h(r.contact)}</strong><p>${r.due_at?`${new Date(r.due_at)<new Date()&&r.state!=='closed'?'Follow-up due · ':''}${h(new Date(r.due_at).toLocaleString('en-GB'))}`:''}</p><pre>${h(r.brief)}</pre><label>State <select data-enquiry="${r.id}">${['new','checking','quoted','closed'].map(s=>`<option ${s===r.state?'selected':''}>${s}</option>`).join('')}</select></label></article>`).join('')||'<p>No enquiries logged.</p>';
 };
 document.getElementById('new-enquiry').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,button=f.querySelector('button');button.disabled=true;try{const data=Object.fromEntries(new FormData(f));data.due_at=new Date(data.due_at).toISOString();await result(supabase.from('packaging_enquiries').insert(data));f.reset();await refreshQueue();}catch(error){fail(error);}finally{button.disabled=false;}});
 document.getElementById('enquiry-list').addEventListener('change',async e=>{const select=e.target.closest('[data-enquiry]');if(!select)return;select.disabled=true;try{await result(supabase.from('packaging_enquiries').update({state:select.value}).eq('id',select.dataset.enquiry));}catch(error){fail(error);}finally{await refreshQueue();}});
 await refreshQueue();
}
async function boot(){
 if(!enabled){root.innerHTML='<div class="buyer-callout"><h2>Quote review by email</h2><p>Online quote approval is not available yet. Your Unfold contact will send your reviewed quote and confirm payment arrangements directly.</p><div class="actions"><a class="btn" href="/start.html">Start a request</a><a class="text-link" href="/portal.html">Track existing orders</a></div></div>';return;}
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user){root.innerHTML='<p class="buyer-callout">Sign in to your customer account to view your private quotes. <a href="/portal.html">Sign in →</a></p>';return;}
 profile=await result(supabase.from('profiles').select('*').eq('id',user.id).single());
 root.innerHTML='<p id="commerce-status" role="status"></p><div id="admin-tools"></div><div id="quote-list"></div>';
 if(profile.role==='admin')await adminSetup();
 await load();
 document.getElementById('quote-list').addEventListener('click',async e=>{
  const button=e.target.closest('[data-action]');if(!button)return;
  const item=button.closest('[data-id]'),q=quotes.find(q=>q.id===item.dataset.id),action=button.dataset.action;
  button.disabled=true;
  try{
   if(action==='proof'){
    const data=await result(supabase.storage.from('packaging-proofs').createSignedUrl(q.proof_path,120));
    const link=document.createElement('a');link.href=data.signedUrl;link.target='_blank';link.rel='noopener';link.textContent=`Open proof ${q.proof_version} (link expires in 2 minutes)`;button.after(link);return;
   }
   if(action==='reorder'){
    sessionStorage.setItem('unfold-reorder',`Previous quote ${q.reference}, version ${q.version}\n${q.specification}\nArtwork version: ${q.proof_version||'None'}\nConfirm reuse of this artwork and current pricing before ordering.`);location.href='/start.html?request=reorder';return;
   }
   if(action==='accept'&&!item.querySelector('[data-agree]').checked)throw Error('Read the specification, total, timing, terms and any attached proof, then tick the approval box.');
   const detail=action==='changes'?item.querySelector('[data-changes]').value:action==='accept'?`Customer approved quote v${q.version}${q.proof_version?` and proof ${q.proof_version}`:''}`:'';
   await result(supabase.rpc('respond_packaging_quote',{p_id:q.id,p_action:action,p_detail:detail}));
   await load();document.getElementById('commerce-status').textContent=action==='publish'?'Quote published to the customer account. Share its reference with the customer.':action==='accept'?'Approval recorded. Review payment arrangements below.':'Quote updated.';
  }catch(error){fail(error);}finally{button.disabled=false;}
 });
}
boot().catch(error=>{root.innerHTML='<p id="commerce-status" role="status"></p><p><a href="/portal.html">Back to your account</a> · <a href="mailto:hello@unfold.supply">Contact Unfold</a></p>';fail(error);});
