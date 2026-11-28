import {createHash} from 'node:crypto';
import {normalizePhone,validPhone} from './assets/ofertasya/phone.mjs';
export const BEEHIVE_BASE='https://api.conta.paybeehive.com.br/v1';
const fail=(message,status=502)=>Object.assign(new Error(message),{status});
export function beehiveFailure(data,http){
 let message=data?.message||data?.error?.message||data?.error||'';for(let i=0;i<3&&typeof message==='string';i++){try{const parsed=JSON.parse(message);message=parsed.message||parsed.error||message}catch{break}}
 const text=(Array.isArray(message)?message.join(' '):String(message)).toLowerCase();
 if(/telefone|phone|celular/.test(text))return {code:'invalid_phone',error:fail('Informe um telefone válido com DDD para concluir o pagamento.',400)};
 if(/menor.*taxa|below.*fee/.test(text))return {code:'amount_below_fees',error:fail('O valor deste pedido não pode ser processado por este meio de pagamento. Entre em contato com o suporte.',503)};
 const unavailable=[401,403,424].includes(http);return {code:http===424?'upstream_dependency':http===401||http===403?'authentication_failed':'upstream_rejected',error:fail(unavailable?'O serviço de pagamento está temporariamente indisponível nesta loja. Tente novamente mais tarde ou entre em contato com o suporte.':'Não foi possível concluir o pagamento. Confira os dados ou tente outra forma de pagamento.',unavailable?503:502)};
}
export function beehiveStatus(status){if(status==='paid')return 'paid';if(['refunded','chargedback','chargeback'].includes(status))return 'refunded';if(['refused','canceled','cancelled','expired','failed'].includes(status))return 'cancelled';return 'pending'}
export function normalizeBeehive(raw){
 const d=raw?.data?.id?raw.data:raw;if(!d||!Number.isSafeInteger(Number(d.id))||Number(d.id)<1||!Number.isSafeInteger(d.amount)||d.amount<1)throw fail('O serviço retornou dados de pagamento inválidos.');
 let pix=d.pix;if(typeof pix==='string'){try{pix=JSON.parse(pix)}catch{pix={qrCode:pix}}}
 const method=d.paymentMethod==='credit_card'?'card':'pix';const status=beehiveStatus(d.status);
 return {ok:true,venda_id:d.id,valor:d.amount/100,status,pago:status==='paid',payment_method:method,pix_code:pix?.qrCode||pix?.qrcode||pix?.qr_code||d.qrCode||'',expira_em:pix?.expirationDate||pix?.expiresAt||d.expiresAt,pago_em:d.paidAt,external_ref:d.externalRef||d.metadata?.order_id,check_status_url:BEEHIVE_BASE+'/transactions/'+d.id,rastreamento:{}};
}
export function createBeehiveClient({key,fetcher=fetch}){
 async function request(url,options={}){
  if(!key)throw fail('Pagamento temporariamente indisponível. Tente novamente em instantes.',503);
  if(!new RegExp('^'+BEEHIVE_BASE.replaceAll('.','\\.')+'/transactions(?:/[0-9]+)?$').test(url))throw fail('Consulta de pagamento inválida.',400);
  let response;try{response=await fetcher(url,{...options,redirect:'error',headers:{...options.headers,Authorization:'Basic '+Buffer.from(key+':x').toString('base64'),'Content-Type':'application/json'},signal:AbortSignal.timeout(20000)})}catch{throw fail('Não foi possível confirmar a resposta do pagamento. Aguarde e verifique o pedido antes de tentar novamente.')}
  let data;try{data=await response.json()}catch{throw fail('O serviço de pagamento retornou uma resposta inválida.')}
  if(!response.ok){const failure=beehiveFailure(data,response.status);console.warn('[Beehive] Requisição recusada',{http:response.status,code:failure.code});throw failure.error}
  return normalizeBeehive(data);
 }
 return {async create(p){
  if(!validPhone(p.telefone))throw fail('Informe um telefone válido com DDD para concluir o pagamento.',400);
  const address={street:p.endereco.logradouro,streetNumber:p.endereco.numero,complement:p.endereco.complemento||'',neighborhood:p.endereco.bairro,city:p.endereco.cidade,state:p.endereco.uf,zipCode:p.endereco.cep,country:'BR'};
  const body={amount:Math.round(p.valor*100),paymentMethod:p.payment_method==='card'?'credit_card':'pix',customer:{name:p.nome,email:p.email,phone:normalizePhone(p.telefone),document:{number:p.cpf,type:'cpf'},address},items:p.itens.filter(i=>i.id!=='frete-sedex').map(i=>({externalRef:i.id,title:i.nome,unitPrice:Math.round(i.preco_unitario*100),quantity:i.quantidade,tangible:true})),shipping:{fee:p.shipping_fee,address},metadata:{provider:'Ofertasya',user_email:p.email,order_id:p.evento_id,checkout_url:'https://www.ofertasyaloja.online/checkout',shop_url:'https://www.ofertasyaloja.online'},externalRef:p.evento_id,ip:p.ip,postbackUrl:p.postback_url};
  if(p.payment_method==='card'){body.card={hash:p.card_token};body.installments=p.installments}else body.pix={expiresInSeconds:3600};
  const data=await request(BEEHIVE_BASE+'/transactions',{method:'POST',headers:{'Idempotency-Key':createHash('sha256').update(p.evento_id).digest('hex')},body:JSON.stringify(body)});
  if(Math.round(data.valor*100)!==body.amount)throw fail('O valor retornado não corresponde ao pedido. Entre em contato com a loja.');
  if(data.payment_method!==p.payment_method)throw fail('A forma de pagamento retornada não corresponde ao pedido.');
  if(data.status==='cancelled')throw fail('Pagamento não aprovado. Confira os dados ou tente outra forma de pagamento.',402);
  if(p.payment_method==='pix'&&!data.pix_code)throw fail('O serviço não retornou o código PIX. Entre em contato com a loja.');return data;
 },status:url=>request(url)};
}
