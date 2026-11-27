let sdkPromise;
const fail=()=>new Error('Não foi possível carregar o pagamento com cartão. Tente novamente ou escolha PIX.');
async function loadSDK(){
 if(!sdkPromise)sdkPromise=(async()=>{
  const r=await fetch('/api/payment-config',{signal:AbortSignal.timeout(12000)}),config=await r.json();if(!r.ok||!config.card_enabled||!config.public_key)throw fail();
  await new Promise((resolve,reject)=>{const script=document.createElement('script');const timer=setTimeout(()=>reject(fail()),15000);script.src='https://api.conta.paybeehive.com.br/v1/js';script.onload=()=>{clearTimeout(timer);resolve()};script.onerror=()=>{clearTimeout(timer);reject(fail())};document.head.append(script)});
  const sdk=window.BeehivePay||window.HopyPay||(window.HopyPayHelper&&window[window.HopyPayHelper.getJsVariableName()]);if(!sdk?.encrypt||!sdk?.is3DSAvailable||!sdk?.authenticate3DS)throw fail();await sdk.setPublicKey(config.public_key);sdk.setTestMode(false);
  const deadline=Date.now()+10000;while(!window.HopyFingerprint&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));if(!window.HopyFingerprint)throw fail();return sdk;
 })().catch(error=>{sdkPromise=null;throw error});return sdkPromise;
}
export function validCard(card){
 const number=String(card.number||'').replace(/\D/g,'');if(!/^\d{13,19}$/.test(number)||/^(\d)\1+$/.test(number)||!/^\d{3,4}$/.test(card.cvv||'')||!String(card.holderName||'').trim().includes(' '))return false;
 let sum=0,double=false;for(let i=number.length-1;i>=0;i--){let n=Number(number[i]);if(double){n*=2;if(n>9)n-=9}sum+=n;double=!double}const month=Number(card.expMonth),year=Number(card.expYear),now=new Date();return sum%10===0&&month>=1&&month<=12&&year<=now.getFullYear()+25&&new Date(year,month,1)>now;
}
export async function tokenizeBeehiveCard(card,{amount,installments,onAuthenticating=()=>{}}){
 if(!validCard(card))throw new Error('Confira o número, nome, validade e código de segurança do cartão.');
 const sdk=await loadSDK();try{
  if(await sdk.is3DSAvailable()){onAuthenticating();await sdk.authenticate3DS({amount,currency:'brl',installments,card})}
  const result=await sdk.encrypt(card);const token=typeof result==='string'?result:result?.hash||result?.token||result?.id;
  if(typeof token!=='string'||!/^[A-Za-z0-9._-]{8,512}$/.test(token))throw fail();return token;
 }catch{throw new Error('Não foi possível validar o cartão. Confira os dados, conclua a autenticação solicitada ou escolha PIX.')}
}
