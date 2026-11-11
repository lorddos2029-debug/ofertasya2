import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createPayments} from './payments.mjs';
import {createPinpayClient,PINPAY_BASE,pinpayIdempotencyKey,pinpayStatus} from './pinpay.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ofertasya-pinpay-'));let payload,headers,status='pending',amount=10331,providerCalls=0;const tracked=[],meta=[];
const fetcher=async(url,o={})=>{
 if(url.startsWith('https://api.utmify')){tracked.push(JSON.parse(o.body));return {ok:true}}
 if(url.startsWith('https://graph.facebook')){meta.push(JSON.parse(o.body));return {ok:true}}
 assert.equal(o.headers.Authorization,'Bearer pinpay-test-secret');assert.equal(o.redirect,'error');assert(url.startsWith(PINPAY_BASE+'/pix'));providerCalls++;
 if(o.method==='POST'){payload=JSON.parse(o.body);headers=o.headers;return {ok:true,json:async()=>({id:'pix_test_123',amount:10331,status:'pending',pix:{qr_code:'000201-test-pinpay',expires_at:'2099-01-01T00:00:00Z'}})}}
 return {ok:true,json:async()=>({id:'pix_test_123',amount,status,paid_at:'2026-11-10T12:00:00Z'})};
};
const opts={key:'legacy-seal-key',pinpayKey:'pinpay-test-secret',provider:'pinpay',root,fetcher,stateless:true,utmifyToken:'test-utm',metaPixelId:'test-pixel',metaAccessToken:'test-meta'};
let handler=createPayments(opts);const server=http.createServer((req,res)=>handler(req,res,new URL(req.url,'http://local').pathname));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const body={nome:'Cliente Teste',email:'cliente@example.com',cpf:'52998224725',evento_id:'ev_pinpay_test_123456789',frete:'sedex',endereco:{cep:'01001000',logradouro:'Praça da Sé',numero:'1',bairro:'Sé',cidade:'São Paulo',uf:'SP'},itens:[{productId:'robo',color:'Preto',quantity:1}],valor:1,utm_source:'meta',sck:'test-subid'};
const post=()=>fetch(base+'/api/charge',{method:'POST',body:JSON.stringify(body)});
try{
 const response=await post(),created=await response.json();assert.equal(response.status,200);assert.equal(payload.amount,10331);assert.equal(payload.customer.document.number,body.cpf);assert.equal(payload.metadata.external_reference,body.evento_id);assert.equal(payload.metadata.checkout_url,'https://ofertasyaloja.online/checkout');assert.equal(payload.metadata.utm_source,'meta');assert.equal(payload.metadata.sck,'test-subid');assert.equal(headers['Idempotency-Key'],pinpayIdempotencyKey(body.evento_id));assert.match(headers['Idempotency-Key'],/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);assert.equal(created.valor,103.31);assert.equal(created.pix_code,'000201-test-pinpay');assert(!JSON.stringify(created).includes('pinpay-test-secret'));assert(!created.check_status_url.includes('usepinpay'));assert.equal(tracked[0].platform,'PinPay');assert.equal(tracked[0].commission.totalPriceInCents,10331);
 await post();assert.equal(providerCalls,1);
 handler=createPayments(opts);const coldRetry=await(await post()).json();assert.equal(coldRetry.pix_code,'000201-test-pinpay');assert.equal(coldRetry.valor,103.31);const pending=await(await fetch(base+created.check_status_url)).json();assert.equal(pending.pago,false);assert.equal(meta.length,0);
 const qr=await fetch(base+created.check_status_url.replace('/api/status/','/api/qr/'));assert.equal(qr.headers.get('content-type'),'image/png');assert.equal(Buffer.from(await qr.arrayBuffer()).subarray(1,4).toString(),'PNG');
 const firstKey=headers['Idempotency-Key'];await post();assert.equal(headers['Idempotency-Key'],firstKey);
 status='approved';const paid=await(await fetch(base+created.check_status_url)).json();assert.equal(paid.pago,true);assert.equal(paid.status,'paid');assert.equal(tracked.at(-1).status,'paid');assert.equal(meta.length,1);await fetch(base+created.check_status_url);assert.equal(meta.length,1);
 amount=1;assert.equal((await fetch(base+created.check_status_url)).status,502);amount=10331;
 status='expired';const expired=await(await fetch(base+created.check_status_url)).json();assert.equal(expired.status,'cancelled');assert.equal(expired.pago,false);
 assert.equal(pinpayStatus('paid'),'paid');assert.equal(pinpayStatus('approved'),'paid');assert.equal(pinpayStatus('processing'),'pending');assert.equal(pinpayStatus('something-unrecognized'),'pending');assert.equal(pinpayStatus('refunded'),'refunded');
 const denied=createPinpayClient({key:'test',fetcher:async()=>({ok:false,status:401,json:async()=>({message:'internal secret error'})})});await assert.rejects(()=>denied.create({evento_id:'x',valor:1}),e=>e.status===502&&!e.message.includes('internal secret'));
 let sent=false;const safe=createPinpayClient({key:'secret',fetcher:async()=>{sent=true}});await assert.rejects(()=>safe.status('https://evil.example/pix/id'));assert.equal(sent,false);
 // A previously issued UrusPay token remains readable after enabling PinPay.
 const legacyOpts={key:'legacy-seal-key',root,stateless:true,fetcher:async(url,o)=>({ok:true,json:async()=>o.method==='POST'?{ok:true,venda_id:42,pix_code:'legacy-code',status:'pending'}:{ok:true,venda_id:42,status:'paid',pago:true}})};
 handler=createPayments(legacyOpts);const old=await(await post()).json();handler=createPayments({...legacyOpts,pinpayKey:'new-secret',provider:'pinpay'});const legacy=await(await fetch(base+old.check_status_url)).json();assert.equal(legacy.pago,true);
 console.log('PASS: PinPay cents, metadata, UUID idempotency, QR, confirmed amount, approved/paid, expiry, secret isolation, UTMify/Meta and legacy pending tokens.');
}finally{server.close();fs.rmSync(root,{recursive:true,force:true})}
