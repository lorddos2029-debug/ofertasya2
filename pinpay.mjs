import {createHash} from 'node:crypto';
export const PINPAY_BASE='https://api.usepinpay.com/functions/v1/api-v1';
const failed=(message,status=502)=>Object.assign(new Error(message),{status});
export function pinpayIdempotencyKey(event){const h=createHash('sha256').update(event).digest('hex').slice(0,32).split('');h[12]='4';h[16]=((parseInt(h[16],16)&3)|8).toString(16);const v=h.join('');return `${v.slice(0,8)}-${v.slice(8,12)}-${v.slice(12,16)}-${v.slice(16,20)}-${v.slice(20)}`}
export function pinpayStatus(status){if(['paid','approved'].includes(status))return 'paid';if(['refunded','chargeback'].includes(status))return 'refunded';if(['failed','expired','cancelled','canceled','refused'].includes(status))return 'cancelled';return 'pending'}
export function createPinpayClient({key,fetcher=fetch}){
 async function request(url,options={}){
  if(!key)throw failed('Pagamento temporariamente indisponível. A configuração do PIX precisa ser concluída pela loja.',503);
  const u=new URL(url);if(u.origin!=='https://api.usepinpay.com'||!u.pathname.startsWith('/functions/v1/api-v1/pix'))throw failed('Rota de consulta PIX inválida.');
  let response;try{response=await fetcher(url,{...options,headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json',...options.headers},redirect:'error',signal:AbortSignal.timeout(20000)})}catch{throw failed('Não foi possível confirmar a resposta do serviço PIX. Tente novamente em instantes.')}
  let data;try{data=await response.json()}catch{throw failed('O serviço PIX retornou uma resposta inválida.')}
  if(!response.ok||!data||typeof data!=='object'){
   const knownCodes=['no_acquirer','invalid_amount','missing_customer','invalid_document','missing_external_reference','missing_checkout_url','unauthorized','rate_limit'];
   const code=knownCodes.includes(data?.error?.code)?data.error.code:'upstream_error';
   console.warn('[PinPay] Requisição recusada',{http:response.status,code});
   if(code==='no_acquirer')throw failed('Pagamento PIX temporariamente indisponível. Tente novamente mais tarde.',503);
   throw failed('Não foi possível processar o PIX. Confira os dados ou tente novamente em instantes.');
  }return data;
 }
 return {
  async create(payload){
   const data=await request(PINPAY_BASE+'/pix',{method:'POST',headers:{'Idempotency-Key':pinpayIdempotencyKey(payload.evento_id)},body:JSON.stringify({amount:Math.round(payload.valor*100),description:payload.descricao,customer:{name:payload.nome,email:payload.email,document:{number:payload.cpf}},metadata:{external_reference:payload.evento_id,checkout_url:'https://ofertasyaloja.online/checkout',...Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','src','sck'].map(k=>[k,payload[k]||'']))}})});
   if(typeof data.id!=='string'||!data.id||data.id.length>200||typeof data.pix?.qr_code!=='string'||!data.pix.qr_code||data.amount!==Math.round(payload.valor*100))throw failed('O serviço não retornou os dados esperados do PIX.');
   const status=pinpayStatus(data.status);if(status!=='pending')throw failed('A cobrança PIX não está disponível para pagamento.');
   return {ok:true,venda_id:data.id,pix_code:data.pix.qr_code,expira_em:data.pix.expires_at,status,check_status_url:PINPAY_BASE+'/pix/'+encodeURIComponent(data.id),rastreamento:{}};
  },
  async status(url){
   const expected=decodeURIComponent(new URL(url).pathname.slice('/functions/v1/api-v1/pix/'.length));
   const data=await request(url);if(data.id!==expected||!Number.isSafeInteger(data.amount)||data.amount<100)throw failed('Resposta de confirmação PIX inválida.');
   return {ok:true,venda_id:data.id,status:pinpayStatus(data.status),pago:pinpayStatus(data.status)==='paid',valor:data.amount/100,pago_em:data.paid_at,rastreamento:{}};
  }
 };
}
