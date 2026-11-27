import assert from 'node:assert/strict';
import {tokenizeBeehiveCard} from './assets/ofertasya/beehive-card.mjs';
const calls=[];let available=true,failAuth=false;
const original={fetch:globalThis.fetch,document:globalThis.document,window:globalThis.window};
globalThis.window={HopyFingerprint:{},BeehivePay:{setPublicKey:key=>calls.push(['public',key]),setTestMode:mode=>calls.push(['mode',mode]),is3DSAvailable:async()=>available,authenticate3DS:async data=>{calls.push(['3ds',data]);if(failAuth)throw Error('declined')},encrypt:async card=>{calls.push(['encrypt',card]);return {hash:'bhp_tok_encrypted_test_123'}}}};
globalThis.document={createElement:()=>({}),head:{append:script=>{assert.equal(script.src,'https://api.conta.paybeehive.com.br/v1/js');queueMicrotask(()=>script.onload())}}};
globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/payment-config');assert.equal(options.body,undefined);return {ok:true,json:async()=>({card_enabled:true,public_key:'pk_test_public'})}};
const card={number:'4111111111111111',holderName:'Comprador Teste',expMonth:12,expYear:new Date().getFullYear()+1,cvv:'123'};
try{
 let prompted=false;assert.equal(await tokenizeBeehiveCard(card,{amount:7990,installments:2,onAuthenticating:()=>prompted=true}),'bhp_tok_encrypted_test_123');assert(prompted);assert.deepEqual(calls.map(x=>x[0]),['public','mode','3ds','encrypt']);assert.equal(calls[2][1].amount,7990);assert.equal(calls[2][1].installments,2);assert.equal(calls[1][1],false);
 calls.length=0;available=false;await tokenizeBeehiveCard(card,{amount:7990,installments:1});assert.deepEqual(calls.map(x=>x[0]),['encrypt']);
 calls.length=0;available=true;failAuth=true;await assert.rejects(()=>tokenizeBeehiveCard(card,{amount:7990,installments:1}));assert.deepEqual(calls.map(x=>x[0]),['3ds']);
 calls.length=0;await assert.rejects(()=>tokenizeBeehiveCard({...card,number:'4111111111111112'},{amount:7990,installments:1}));assert.equal(calls.length,0);
 console.log('PASS: browser card validation, 3DS before tokenization, cancelled authentication and token extraction.');
}finally{for(const [key,value] of Object.entries(original)){if(value===undefined)delete globalThis[key];else globalThis[key]=value}}
