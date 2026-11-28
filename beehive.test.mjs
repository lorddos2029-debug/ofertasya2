import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import {createPayments} from './payments.mjs';
import {createBeehiveClient,BEEHIVE_BASE,beehiveStatus,beehiveFailure} from './beehive.mjs';
import {normalizePhone,validPhone,formatPhone} from './assets/ofertasya/phone.mjs';
import {validCard} from './assets/ofertasya/beehive-card.mjs';
let calls=0,nextStatus='waiting_payment',wrongAmount=false,lastPayload,lastHeaders;
const transactions=new Map(),meta=[],utm=[];
const fetcher=async(url,o={})=>{
 if(url.startsWith('https://graph.facebook')){meta.push(JSON.parse(o.body));return {ok:true}}
 if(url.startsWith('https://api.utmify')){utm.push(JSON.parse(o.body));return {ok:true}}
 assert.equal(o.headers.Authorization,'Basic '+Buffer.from('bee-secret:x').toString('base64'));assert.equal(o.redirect,'error');
 if(o.method==='POST'){
  assert.equal(url,BEEHIVE_BASE+'/transactions');lastPayload=JSON.parse(o.body);lastHeaders=o.headers;calls++;
  const id=100+calls;const tx={...lastPayload,id,status:nextStatus,pix:lastPayload.paymentMethod==='pix'?{qrCode:'000201-pix-test',expirationDate:'2099-01-01T00:00:00Z'}:null};transactions.set(id,tx);return {ok:true,json:async()=>tx};
 }
 const tx=transactions.get(Number(url.split('/').at(-1)));assert(tx);return {ok:true,json:async()=>({...tx,status:nextStatus,amount:wrongAmount?1:tx.amount})};
};
const options={provider:'beehive',key:'legacy-seal-key',beehiveKey:'bee-secret',beehivePublicKey:'pk-test',root:os.tmpdir(),stateless:true,fetcher,utmifyToken:'utm-test',metaPixelId:'pixel',metaAccessToken:'meta-token'};
let handler=createPayments(options);const server=http.createServer((req,res)=>handler(req,res,new URL(req.url,'http://test').pathname));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const body={nome:'Comprador Teste',email:'teste@example.com',cpf:'52998224725',telefone:'11999999999',evento_id:'ev_beehive_order_12345_pix',frete:'sedex',endereco:{cep:'01001000',logradouro:'Praça',numero:'1',bairro:'Sé',cidade:'São Paulo',uf:'SP'},itens:[{productId:'purificador',color:'Branco',voltage:'Bivolt',quantity:1}],utm_source:'meta',fbp:'fb.1.test',fbc:'fb.1.click'};
const post=(route,b)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':'189.10.20.30'},body:JSON.stringify(b)});
try{
 const config=await(await fetch(base+'/api/payment-config')).json();assert.equal(config.card_enabled,true);assert.equal(config.public_key,'pk-test');assert(!JSON.stringify(config).includes('bee-secret'));
 for(const telefone of ['', '999999999', '00999999999'])assert.equal((await post('/api/charge',{...body,telefone})).status,400);assert.equal(calls,0);
 assert.equal(normalizePhone('+55 (11) 99999-9999'),'11999999999');assert(validPhone('+55 (11) 99999-9999'));assert(validPhone('1133334444'));assert(!validPhone('20999999999'));assert.equal(formatPhone('11999999999'),'(11) 99999-9999');
 const nested=beehiveFailure({message:JSON.stringify({message:'Informe um número de telefone válido com DDD'})},424);assert.equal(nested.code,'invalid_phone');assert.equal(nested.error.status,400);assert(nested.error.message.includes('telefone'));assert(!nested.error.message.includes('indisponível'));
 assert.equal(beehiveFailure({message:JSON.stringify({message:'Valor da compra menor que as taxas aplicáveis'})},424).code,'amount_below_fees');
 const r=await post('/api/charge',body),pix=await r.json();assert.equal(r.status,200);assert.equal(pix.valor,93.81);assert.equal(pix.payment_method,'pix');assert.equal(pix.pix_code,'000201-pix-test');assert.equal(lastPayload.amount,9381);assert.equal(lastPayload.shipping.fee,1790);assert.equal(lastPayload.items[0].unitPrice,7591);assert.equal(lastPayload.customer.document.number,body.cpf);assert.equal(lastPayload.ip,'189.10.20.30');assert.equal(lastPayload.metadata.shop_url,'https://www.ofertasyaloja.online');assert.equal(lastPayload.externalRef,body.evento_id);assert(lastHeaders['Idempotency-Key']);assert(lastPayload.postbackUrl.startsWith('https://www.ofertasyaloja.online/api/beehive/webhook/'));const callback=new URL(lastPayload.postbackUrl).pathname;assert(!lastPayload.postbackUrl.includes(body.email));assert(!JSON.stringify(pix).includes('bee-secret'));assert.equal(meta.length,0);
 await post('/api/charge',body);assert.equal(calls,1);handler=createPayments(options);
 const qr=await fetch(base+pix.check_status_url.replace('/api/status/','/api/qr/'));assert.equal(qr.headers.get('content-type'),'image/png');
 assert.equal((await(await fetch(base+pix.check_status_url)).json()).pago,false);nextStatus='authorized';assert.equal((await(await fetch(base+pix.check_status_url)).json()).pago,false);assert.equal(meta.length,0);
 const webhook={type:'transaction',objectId:pix.venda_id,data:{status:'paid'}};await post(callback,webhook);assert.equal(meta.length,0);
 nextStatus='paid';wrongAmount=true;assert.equal((await fetch(base+pix.check_status_url)).status,502);assert.equal((await post(callback,webhook)).status,403);assert.equal(meta.length,0);wrongAmount=false;
 const paid=await(await fetch(base+pix.check_status_url)).json();assert.equal(paid.pago,true);assert.deepEqual(meta.at(-1).data.map(x=>x.event_name),['InitiateCheckout','Purchase']);assert.equal(meta.at(-1).data[1].event_id,body.evento_id);assert.equal(utm.at(-1).status,'paid');
 handler=createPayments(options);assert.equal((await post(callback,webhook)).status,200);assert.equal(meta.at(-1).data[1].event_id,body.evento_id);
 nextStatus='waiting_payment';const cardBody={...body,evento_id:'ev_beehive_order_12345_card',card_token:'bhp_tok_test_123456',installments:3};const cr=await post('/api/card/charge',cardBody),card=await cr.json();assert.equal(cr.status,200);assert.equal(card.payment_method,'card');assert.equal(card.valor,97.8);assert.equal(lastPayload.amount,9780);assert.equal(lastPayload.paymentMethod,'credit_card');assert.deepEqual(lastPayload.card,{hash:cardBody.card_token});assert.equal(lastPayload.installments,3);assert.equal(lastPayload.items[0].unitPrice,7990);assert.equal(utm.at(-1).paymentMethod,'credit_card');assert(!JSON.stringify(card).includes(cardBody.card_token));assert.equal((await post('/api/card/charge',{...cardBody,event_id:'raw',card_number:'4111111111111111'})).status,400);assert.equal((await post('/api/card/charge',{...cardBody,installments:12})).status,400);
 assert.equal((await(await fetch(base+card.check_status_url)).json()).pago,false);nextStatus='paid';assert.equal((await(await fetch(base+card.check_status_url)).json()).pago,true);
 nextStatus='refused';const declined=await post('/api/card/charge',{...cardBody,evento_id:'ev_beehive_declined_123456'});assert.equal(declined.status,402);
 for(const status of ['authorized','processing','partially_paid','waiting_payment'])assert.equal(beehiveStatus(status),'pending');assert.equal(beehiveStatus('paid'),'paid');assert.equal(beehiveStatus('chargedback'),'refunded');
 const denied=createBeehiveClient({key:'secret',fetcher:async()=>({ok:false,status:401,json:async()=>({message:'secret sensitive response'})})});await assert.rejects(()=>denied.status(BEEHIVE_BASE+'/transactions/1'),e=>e.status===503&&!e.message.includes('sensitive'));await assert.rejects(()=>denied.status('https://evil.example/transactions/1'));
 const unavailable=createBeehiveClient({key:'secret',fetcher:async()=>({ok:false,status:424,json:async()=>({message:'internal acquirer details'})})});await assert.rejects(()=>unavailable.status(BEEHIVE_BASE+'/transactions/1'),e=>e.status===503&&e.message.includes('temporariamente indisponível')&&!e.message.includes('Confira os dados')&&!e.message.includes('internal'));
 assert(validCard({number:'4111111111111111',holderName:'Teste Comprador',expMonth:12,expYear:new Date().getFullYear()+1,cvv:'123'}));assert(!validCard({number:'4111111111111112',holderName:'Teste Comprador',expMonth:12,expYear:2030,cvv:'123'}));
 console.log('PASS: Beehive PIX/card, token-only payload, server pricing, auth, QR, pending/paid, verified webhooks and tracking.');
}finally{await new Promise(r=>server.close(r))}
