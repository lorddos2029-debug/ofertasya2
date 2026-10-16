import assert from 'node:assert/strict';
import {utmifyOrder,syncUtmify} from './utmify.mjs';
const order=utmifyOrder({valor:85.41,nome:'Teste Integração',email:'teste@example.com',cpf:'52998224725',utm_source:'test',itens:[{id:'capacete',nome:'Capacete',quantidade:1,preco_unitario:85.41}]},123);let calls=0;const fetcher=async(url,opts)=>{calls++;assert.equal(opts.headers['x-api-token'],'test');const b=JSON.parse(opts.body);assert.equal(b.createdAt,order.createdAt);assert.equal(b.commission.totalPriceInCents,8541);assert.equal(b.trackingParameters.utm_source,'test');if(b.status==='paid')assert(b.approvedDate);return {ok:true}};
assert.equal((await syncUtmify({order,status:'waiting_payment',gateway:{utmify:'enviado'},token:'test',fetcher})).via,'uruspay');assert.equal(calls,0);
assert.equal((await syncUtmify({order,status:'waiting_payment',gateway:{utmify:'erro'},token:'test',fetcher})).status,'enviado');assert.equal((await syncUtmify({order,status:'paid',gateway:{utmify:'erro'},token:'test',fetcher})).status,'enviado');assert.equal(calls,2);
assert.equal((await syncUtmify({order,status:'paid',gateway:{utmify:'enviado',utmify_status_enviado:'paid'},token:'test',fetcher})).via,'uruspay');assert.equal(calls,2);console.log('PASS: UTMify pending/paid, centavos, UTMs e fallback sem duplicar envio confirmado.');

