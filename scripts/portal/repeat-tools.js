export function reminderDate(stock, dailyUse, leadDays, today = new Date()) {
 if(!Number.isFinite(stock)||stock<0||!Number.isFinite(dailyUse)||dailyUse<=0||!Number.isFinite(leadDays)||leadDays<0)throw Error('Enter valid stock, daily usage and lead time.');
 const date=new Date(today);date.setDate(date.getDate()+Math.max(0,Math.floor(stock/dailyUse)-Math.ceil(leadDays)));return date;
}
export function installRepeatTools(root,{order,items}) {
 const section=document.createElement('section');section.className='card';
 section.innerHTML='<h2>Plan your next run</h2><p>Reuse the previous specification and ask for current pricing. Artwork and delivery timing will be reconfirmed.</p><button class="btn" id="repeat-order">Request a repeat order</button><details><summary>Add a replenishment reminder to your calendar</summary><p>This is your planning estimate, based on the figures you enter. It does not book production or send automated emails.</p><form class="commerce-form" id="reminder-form"><label class="field">Boxes remaining<input name="stock" type="number" min="0" required></label><label class="field">Boxes used per day<input name="daily" type="number" min="1" required></label><label class="field">Lead time plus safety buffer (days)<input name="days" type="number" min="0" required></label><button class="btn">Download calendar reminder</button><p role="status" id="reminder-status"></p></form></details>';
 root.append(section);
 section.querySelector('#repeat-order').addEventListener('click',()=>{
  const brief=[`Previous order: ${order.order_number}`,order.title,...items.map(i=>`${i.name}: ${i.length_mm} x ${i.width_mm} x ${i.height_mm} mm; ${i.board}; ${i.wall} wall; previous quantity ${i.quantity}; ${i.brand_text||''}; ${i.print_notes||''}`),order.customer_notes||''].join('\n');
  try{sessionStorage.setItem('unfold-reorder',brief);location.href='/start?request=reorder';}catch{section.querySelector('#reminder-status').textContent='Browser storage is unavailable. Start a new request and include your previous order reference.';}
 });
 section.querySelector('#reminder-form').addEventListener('submit',e=>{
  e.preventDefault();const f=e.currentTarget;
  try{
   const date=reminderDate(Number(f.elements.stock.value),Number(f.elements.daily.value),Number(f.elements.days.value));
   const day=`${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
   const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
   const ics=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Unfold//Packaging reminder//EN\r\nBEGIN:VEVENT\r\nUID:${crypto.randomUUID()}@unfold.supply\r\nDTSTAMP:${stamp}\r\nDTSTART;VALUE=DATE:${day}\r\nSUMMARY:Review your packaging stock\r\nDESCRIPTION:Check stock and request current pricing at https://unfold.supply/start\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
   const url=URL.createObjectURL(new Blob([ics],{type:'text/calendar'})),link=document.createElement('a');link.href=url;link.download='unfold-stock-reminder.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   section.querySelector('#reminder-status').textContent=`Reminder prepared for ${date.toLocaleDateString('en-GB')}. Open the downloaded file to add it to your calendar.`;
  }catch(error){section.querySelector('#reminder-status').textContent=error.message;}
 });
}
