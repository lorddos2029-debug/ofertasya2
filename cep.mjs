const states=new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));
const error=(message,status)=>Object.assign(new Error(message),{status});
export function createCepLookup({fetcher=fetch,timeoutMs=2500,now=Date.now}={}){
 const cache=new Map(),pending=new Map();
 async function lookup(cep){
  if(!/^\d{8}$/.test(cep))throw error('Digite um CEP com 8 números.',400);
  const hit=cache.get(cep);if(hit&&hit.expires>now())return hit.data;if(pending.has(cep))return pending.get(cep);
  const task=(async()=>{
   const controllers=[];
   const providers=[{url:'https://brasilapi.com.br/api/cep/v2/'+cep,normalize:d=>({cep:d.cep,logradouro:d.street||'',bairro:d.neighborhood||'',localidade:d.city,uf:d.state})},{url:'https://viacep.com.br/ws/'+cep+'/json/',normalize:d=>({cep:d.cep,logradouro:d.logradouro||'',bairro:d.bairro||'',localidade:d.localidade,uf:d.uf})}];
   try{
    const data=await Promise.any(providers.map(async p=>{
     const controller=new AbortController();controllers.push(controller);const timer=setTimeout(()=>controller.abort(),timeoutMs);
     try{const r=await fetcher(p.url,{signal:controller.signal,headers:{Accept:'application/json'}});if(r.status===404)throw error('CEP não encontrado.',404);if(!r.ok)throw error('Consulta indisponível.',503);const raw=await r.json();if(raw.erro===true||raw.erro==='true')throw error('CEP não encontrado.',404);const d=p.normalize(raw);if(String(d.cep||'').replace(/\D/g,'')!==cep||typeof d.localidade!=='string'||!d.localidade.trim()||!states.has(d.uf))throw error('Resposta de CEP inválida.',503);return {...d,cep:cep.slice(0,5)+'-'+cep.slice(5)};
     }finally{clearTimeout(timer)}
    }));
    if(cache.size>=500)cache.delete(cache.keys().next().value);cache.set(cep,{data,expires:now()+86400000});return data;
   }catch(e){if(e.errors?.every(x=>x.status===404))throw error('CEP não encontrado. Confira os números.',404);throw error('Consulta de CEP indisponível. Preencha o endereço manualmente para continuar.',503)}finally{controllers.forEach(c=>c.abort())}
  })();pending.set(cep,task);try{return await task}finally{pending.delete(cep)}
 }
 return lookup;
}
