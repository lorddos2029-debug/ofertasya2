import {createHash} from 'node:crypto';
export const BEEHIVE_BASE='https://api.conta.paybeehive.com.br/v1';
const fail=(message,status=502)=>Object.assign(new Error(message),{status});
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
  if(!response.ok){console.warn('[Beehive] Requisição recusada',{http:response.status});throw fail(response.status===401||response.status===403?'Pagamento temporariamente indisponível. Entre em contato com a loja.':'Não foi possível concluir o pagamento. Confira os dados ou tente outra forma de pagamento.',response.status===401||response.status===403?503:502)}
  return normalizeBeehive(data);
 }
 return {async create(p){
  const address={street:p.endereco.logradouro,streetNumber:p.endereco.numero,complement:p.endereco.complemento||'',neighborhood:p.endereco.bairro,city:p.endereco.cidade,state:p.endereco.uf,zipCode:p.endereco.cep,country:'BR'};
  const body={amount:Math.round(p.valor*100),paymentMethod:p.payment_method==='card'?'credit_card':'pix',customer:{name:p.nome,email:p.email,phone:p.telefone||undefined,document:{number:p.cpf,type:'cpf'},address},items:p.itens.filter(i=>i.id!=='frete-sedex').map(i=>({externalRef:i.id,title:i.nome,unitPrice:Math.round(i.preco_unitario*100),quantity:i.quantidade,tangible:true})),shipping:{fee:p.shipping_fee,address},metadata:{provider:'Ofertasya',user_email:p.email,order_id:p.evento_id,checkout_url:'https://www.ofertasyaloja.online/checkout',shop_url:'https://www.ofertasyaloja.online'},externalRef:p.evento_id,ip:p.ip,postbackUrl:p.postback_url};
  if(p.payment_method==='card'){body.card={hash:p.card_token};body.installments=p.installments}else body.pix={expiresInSeconds:3600};
  const data=await request(BEEHIVE_BASE+'/transactions',{method:'POST',headers:{'Idempotency-Key':createHash('sha256').update(p.evento_id).digest('hex')},body:JSON.stringify(body)});
  if(Math.round(data.valor*100)!==body.amount)throw fail('O valor retornado não corresponde ao pedido. Entre em contato com a loja.');
  if(data.payment_method!==p.payment_method)throw fail('A forma de pagamento retornada não corresponde ao pedido.');
  if(data.status==='cancelled')throw fail('Pagamento não aprovado. Confira os dados ou tente outra forma de pagamento.',402);
  if(p.payment_method==='pix'&&!data.pix_code)throw fail('O serviço não retornou o código PIX. Entre em contato com a loja.');return data;
 },status:url=>request(url)};
}
