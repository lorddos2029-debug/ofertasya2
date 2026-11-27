import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createPayments} from './payments.mjs';
import {validItem,variantId} from './assets/ofertasya/catalog.mjs';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'ofertasya-voltage-'));
const pinpayCalls=[],trackingCalls=[];
const handler=createPayments({key:'test-legacy',pinpayKey:'test-pinpay',provider:'pinpay',utmifyToken:'test-utmify',root,stateless:true,fetcher:async(url,options)=>{
 const body=JSON.parse(options.body);
 if(url.includes('usepinpay.com')){pinpayCalls.push(body);return {ok:true,status:201,json:async()=>({id:'voltage-charge-'+pinpayCalls.length,amount:body.amount,status:'pending',pix:{qr_code:'test-voltage-pix',expires_at:'2099-01-01T00:00:00Z'}})}}
 if(url.includes('utmify')){trackingCalls.push(body);return {ok:true,status:200,json:async()=>({ok:true})}}
 throw Error('Unexpected external request in voltage test');
}});
const server=http.createServer((req,res)=>handler(req,res,new URL(req.url,'http://local').pathname));
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const item={productId:'climatizador',color:'Cinza',quantity:1};
const customer={nome:'Comprador Teste',email:'teste@example.com',cpf:'52998224725',frete:'free',endereco:{cep:'01001000',logradouro:'Praça da Sé',numero:'1',bairro:'Sé',cidade:'São Paulo',uf:'SP'}};
const post=(itens,event,extra={})=>fetch(base+'/api/charge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...customer,itens,evento_id:event,...extra})});
try{
 assert.equal(validItem(item),false);assert.equal(validItem({...item,voltage:'bivolt'}),false);
 for(const voltage of ['110V','220V']){
  const selected={...item,voltage};assert(validItem(selected));assert.equal(variantId(selected),'climatizador-cinza-'+voltage.toLowerCase());
  const response=await post([selected],'ev_voltage_'+voltage+'_12345',{valor:0.01});assert.equal(response.status,200);const charge=await response.json();assert.equal(charge.valor,121.51);assert.equal(pinpayCalls.at(-1).amount,12151);assert(pinpayCalls.at(-1).description.includes(voltage));
  const order=trackingCalls.at(-1);assert(order.products[0].name.includes('Voltagem '+voltage));assert.equal(order.products[0].id,variantId(selected));assert.equal(order.products[0].priceInCents,12151);
 }
 for(const voltage of ['110V','220V']){
  const tower={productId:'ventilador',color:'Branco',quantity:1,voltage};assert(validItem(tower));
  const response=await post([tower],'ev_tower_'+voltage+'_123456',{valor:0.01});assert.equal(response.status,200);assert.equal((await response.json()).valor,85.41);assert.equal(pinpayCalls.at(-1).amount,8541);assert(pinpayCalls.at(-1).description.includes(voltage));assert.equal(trackingCalls.at(-1).products[0].id,'ventilador-branco-'+voltage.toLowerCase());assert(trackingCalls.at(-1).products[0].name.includes(voltage));
 }
 assert.equal(validItem({productId:'ventilador',color:'Branco',quantity:1}),false);
 for(const voltage of ['110V','220V']){const selected={productId:'panela',color:'Preto',quantity:1,voltage};assert(validItem(selected));const response=await post([selected],'ev_panela_'+voltage+'_123456',{valor:0.01});assert.equal(response.status,200);assert.equal((await response.json()).valor,75.91);assert.equal(pinpayCalls.at(-1).amount,7591);assert.equal(trackingCalls.at(-1).products[0].id,'panela-preto-'+voltage.toLowerCase())}assert.equal(validItem({productId:'panela',color:'Preto',quantity:1}),false);
 const purifier={productId:'purificador',color:'Branco',quantity:1,voltage:'Bivolt'};assert(validItem(purifier));assert.equal(validItem({...purifier,voltage:'220V'}),false);const purifierResponse=await post([purifier],'ev_purifier_bivolt_12345',{valor:0.01});assert.equal(purifierResponse.status,200);assert.equal((await purifierResponse.json()).valor,75.91);assert.equal(pinpayCalls.at(-1).amount,7591);assert.equal(trackingCalls.at(-1).products[0].id,'purificador-branco-bivolt');
 const calls=pinpayCalls.length;
 for(const invalid of [item,{...item,voltage:'bivolt'},{...item,voltage:'220'},{...item,voltage:'220V',color:'Preto'}])assert.equal((await post([invalid],'ev_invalid_voltage_123456')).status,400);
 assert.equal(pinpayCalls.length,calls);
 const double=await post([{...item,voltage:'220V',quantity:2}],'ev_voltage_sedex_12345',{frete:'sedex'});assert.equal(double.status,200);assert.equal((await double.json()).valor,260.92);assert.equal(pinpayCalls.at(-1).amount,26092);
 assert(validItem({productId:'capacete',color:'Preto',size:'58/M',quantity:1}));
 console.log('PASS: voltagem obrigatória, variantes 110V/220V, valor no servidor, frete e voltagem no pedido/rastreamento.');
}finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true})}
