import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import {createPayments} from './payments.mjs';
let paid=false,amount=85.41,metaCalls=0,created;
const options={key:'urus-test-secret',pinpayKey:'old-pinpay-key',provider:'uruspay',root:os.tmpdir(),stateless:true,metaPixelId:'pixel',metaAccessToken:'meta',fetcher:async(url,o={})=>{
 if(url.startsWith('https://graph.facebook')){metaCalls++;return {ok:true}}
 assert.equal(o.headers.Authorization,'Bearer urus-test-secret');
 if(o.method==='POST'){
  assert.equal(url,'https://uruspaypagamentos.com/api/v1/charge');created=JSON.parse(o.body);
  return {ok:true,json:async()=>({ok:true,venda_id:321,pix_code:'pix-copy-code',qr_code_url:'https://example.com/qr.png',valor:85.41,status:'pending',expira_em:'2099-01-01T00:00:00Z',check_status_url:'https://uruspaypagamentos.com/api/v1/status/321',rastreamento:{facebook:'configurado',utmify:'enviado'}})};
 }
 assert.equal(url,'https://uruspaypagamentos.com/api/v1/status/321');
 return {ok:true,json:async()=>({ok:true,venda_id:321,status:paid?'paid':'pending',pago:paid,valor:amount,rastreamento:{utmify:'enviado',utmify_status_enviado:paid?'paid':'pending'}})};
}};
let handler=createPayments(options);
const server=http.createServer((req,res)=>handler(req,res,new URL(req.url,'http://test').pathname));
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
try{
 const body={nome:'Comprador Teste',email:'teste@example.com',cpf:'52998224725',valor:1,evento_id:'ev_urus_test_123456',frete:'free',endereco:{cep:'01001000',logradouro:'Praça',numero:'1',bairro:'Sé',cidade:'São Paulo',uf:'SP'},itens:[{productId:'basike',color:'Preto',quantity:1}],utm_source:'meta',utm_medium:'cpc',utm_campaign:'sale',utm_content:'ad',utm_term:'term',src:'src',sck:'sck',fbp:'fb.1.test',fbc:'fb.1.click'};
 const response=await fetch(base+'/api/charge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),charge=await response.json();
 assert.equal(response.status,200);assert.equal(charge.valor,85.41);assert.equal(created.valor,85.41);assert.equal(charge.qr_code_url,'https://example.com/qr.png');assert.equal(charge.pix_code,'pix-copy-code');assert.equal(charge.evento_id,body.evento_id);
 for(const k of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','src','sck','fbp','fbc'])assert.equal(created[k],body[k]);
 assert(!JSON.stringify(charge).includes('urus-test-secret'));assert(charge.check_status_url.startsWith('/api/status/'));
 handler=createPayments(options);assert.equal((await(await fetch(base+charge.check_status_url)).json()).status,'pending');
 paid=true;amount=1;assert.equal((await fetch(base+charge.check_status_url)).status,502);
 amount=85.41;const confirmed=await(await fetch(base+charge.check_status_url)).json();assert.equal(confirmed.pago,true);assert.equal(confirmed.status,'paid');assert.equal(metaCalls,0);
 console.log('PASS: UrusPay auth, server price, tracking, QR URL, restart, paid amount and CAPI deduplication.');
}finally{server.close()}
