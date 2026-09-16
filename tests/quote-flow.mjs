import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const source = fs.readFileSync('scripts/main.js', 'utf8').replace(/^import[^\n]*\n/, '');
async function scenario(response, {attachment=false, ok=true}={}) {
  const handlers={}, events=[];
  const fields=Object.fromEntries(Object.entries({name:'Test',email:'test@example.invalid',message:'Test brief',quantity:'500',_honey:''}).map(([k,value])=>[k,{value}]));
  const button={disabled:false};
  let reset=false, calls=0, prevented=false;
  const form={elements:fields,addEventListener:(n,fn)=>handlers[n]=fn,querySelector:()=>button,reset:()=>{reset=true}};
  const status={textContent:''}, select={value:'help'}, file={files:attachment?[{size:100}]:[],addEventListener:()=>{}};
  const map={'quote-form':form,'form-status':status,'quote-product-select':select,'quote-files':file};
  const ctx={document:{getElementById:id=>map[id]||null},window:{location:{search:'',href:'https://unfold.supply/'},history:{replaceState(){}}},sessionStorage:{getItem:()=>null},URLSearchParams,URL,console:{error(){}},track:(n)=>events.push(n),fetch:async()=>{calls++;return {ok,json:async()=>response}}};
  vm.runInNewContext(source,ctx);
  handlers.input(); handlers.input();
  assert.equal(events.filter(e=>e==='quote_start').length,1);
  await handlers.submit({preventDefault(){prevented=true}});
  return {reset,events,calls,prevented,status:status.textContent,button};
}
const success=await scenario({success:'true'});assert(success.reset);assert(success.events.includes('quote_submit_success'));assert(!success.button.disabled);
for(const response of [{success:false},{success:'false'},{},{success:true,message:'Activate your form'}]) {
 const r=await scenario(response);assert(!r.reset);assert(!r.events.includes('quote_submit_success'));assert(r.events.includes('quote_submit_error'));assert(!r.button.disabled);
}
const attachment=await scenario({}, {attachment:true});assert.equal(attachment.calls,0);assert(!attachment.prevented);assert(attachment.events.includes('quote_attachment_handoff'));assert(!attachment.events.includes('quote_submit_success'));
console.log('Passed: quote start deduplication, confirmed success, failed/unknown/activation responses preserve form, attachment handoff distinct from success. No network requests sent.');
