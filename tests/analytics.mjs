import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('scripts/analytics.js','utf8').replace("import.meta.env.VITE_GA_MEASUREMENT_ID", "'G-TEST123'").replace('export function track','function track');
function run(choice) {
 const inserted=[], emitted=[];
 const element=()=>({setAttribute(){},addEventListener(){},append(){},querySelector:()=>({focus(){}})});
 const window={};
 const ctx={window,document:{createElement:element,head:{append:s=>inserted.push(s)},body:{append(){}},querySelector:()=>element(),addEventListener(){},dispatchEvent:e=>emitted.push(e)},localStorage:{getItem:()=>choice},location:{pathname:'/spec.html',origin:'https://unfold.supply'},CustomEvent:class {constructor(name,options){this.detail=options.detail}},Date};
 vm.runInNewContext(source,ctx); vm.runInNewContext("track('spec_to_quote',{style:'0427',email:'private@example.invalid',message:'private',product:'boxes'})",ctx);
 return {inserted,emitted,window};
}
for(const choice of [null,'no']) {const r=run(choice);assert.equal(r.inserted.length,0);assert(!r.window.dataLayer);}
const r=run('yes');assert.equal(r.inserted.length,1);assert(!JSON.stringify(r.window.dataLayer).includes('private'));assert(JSON.stringify(r.window.dataLayer).includes('spec_to_quote'));
console.log('Passed: no external analytics before consent; configured opt-in loads provider; personal/free-text fields excluded. No network requests sent.');
