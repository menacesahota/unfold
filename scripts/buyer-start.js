import {PACKS,recommendPack} from './buyer-catalog.js';
import './main.js';
const form=document.getElementById('buyer-form'),review=document.getElementById('buyer-review'),quote=document.getElementById('quote-form');
const params=new URLSearchParams(location.search);
const returnStatus=document.getElementById('form-status').textContent;
if(returnStatus){const notice=document.createElement('p');notice.className='buyer-callout';notice.setAttribute('role','status');notice.textContent=returnStatus;form.before(notice);}
form.elements.pack.innerHTML += PACKS.map(p=>`<option value="${p.id}">${p.title}</option>`).join('');
for(const key of ['pack','request','sample','artwork']) {
 const field=form.elements.namedItem(key), value=params.get(key);
 if(value && [...field.options].some(o=>o.value===value)) field.value=value;
}
try {
 const previous=sessionStorage.getItem('unfold-reorder');
 if(params.get('request')==='reorder' && previous){
  form.elements.notes.value=previous;
  const note=document.getElementById('reorder-note'); note.hidden=false;
  note.textContent='Your previous specification is included below. Confirm the new quantity and deadline; current prices and artwork still need review.';
 }
} catch { /* The form remains usable if browser storage is unavailable. */ }
form.addEventListener('submit',event=>{
 event.preventDefault();
 const data=Object.fromEntries(new FormData(form)), pack=recommendPack(data);
 document.getElementById('recommendation').textContent=`${pack.title}: ${pack.intro} ${pack.checks}`;
 const label=name=>form.elements.namedItem(name).selectedOptions[0].textContent;
 const text=[`Request: ${label('request')}`,`Packaging starting point: ${pack.title}${data.pack==='help'?' (suggestion for review)':''}`,`Product: ${data.contents}`,`Product size: ${data.size||'Please advise'}`,`Product weight: ${data.weight||'Please advise'}`,`Quantity: ${data.quantity||'Please advise'}`,`Appearance: ${data.appearance}`,`Artwork: ${label('artwork')}`,`Extras: ${data.extras}`,`Required delivery: ${data.deadline||'To discuss'}`,`UK delivery postcode: ${data.postcode||'To confirm'}`,`Sample preference: ${label('sample')}`,data.notes?`Notes / previous specification: ${data.notes}`:''].filter(Boolean).join('\n');
 quote.elements.box_brief.value=text;
 quote.elements.quantity.value=data.quantity||'To discuss';
 quote.elements.product.value=pack.id==='tape'?'other':pack.id==='mailers'?'mailers':'boxes';
 form.hidden=true;review.hidden=false;
 document.getElementById('recommendation').tabIndex=-1;
 document.getElementById('recommendation').focus();
});
document.getElementById('edit-brief').addEventListener('click',()=>{review.hidden=true;form.hidden=false;form.elements.contents.focus();});
