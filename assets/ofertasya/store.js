import {shippingOptions,shippingFor} from './shipping.mjs';
import {catalog,productFor,validItem} from './catalog.mjs';
const product=catalog[document.body.dataset.product||'bettdow'];const camera=product.id==='camera',helmet=product.id==='capacete',basike=product.id==='basike';let size='58/M';
const trackingKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','src','sck','fbclid'];for(const k of trackingKeys){const v=new URLSearchParams(location.search).get(k);if(v)sessionStorage.setItem('ofertasya-'+k,v)};
const $=s=>document.querySelector(s);const money=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});let color=product.colors[0],quantity=1,active=1,cart=[];try{cart=JSON.parse(localStorage.getItem('ofertasya-cart-v1')||'[]');if(!Array.isArray(cart))cart=[];cart=cart.filter(validItem)}catch{}const basikeCaptions=["Caixa de som Basike 80W nas cores camuflado, preto e vermelho","10 horas de reprodução e função power bank","80W RMS e 120W de pico","Pareamento TWS e luzes RGB","Resistência IPX6","Modos de equalização","Entradas USB, AUX, cartão TF e Bluetooth","Botões e comandos TWS","Dimensões e cores","Conectividade em ambiente externo","Comandos da Basike preta","Comandos da Basike vermelha","Basike camuflada"];const basikeGallery=['/assets/ofertasya/basike-principal.png',...basikeCaptions.slice(1).map((_,i)=>'/assets/ofertasya/basike-'+(i+1)+'.png')];const captions=product.gallery?.map(image=>image.alt)|| (basike?basikeCaptions:helmet?['ASX City SV lateral','ASX City SV em uso','Detalhe da viseira','Vista frontal','Vista em ângulo','Vista lateral direita','Vista traseira','Guia de medidas']:camera?['Câmera Jortan branca','Câmera Jortan preta','Câmera Jortan rosa','Full HD 1080p','Monitoramento pelo celular','Alertas de movimento','Áudio bidirecional','Proteção IP66','Visão noturna colorida','Giro 360° pelo aplicativo','Dimensões do produto']:['Bettdow Smartwatch claro e principais recursos','Funções do Bettdow preto','Resistência anunciada de 3 ATM','GPS e atividades esportivas','Mostradores personalizados','Display AMOLED e recursos','Design e conectividade','Autonomia e carregamento magnético','Chamadas e respostas rápidas']);const gallery=product.gallery?.map(image=>image.src)|| (basike?basikeGallery:helmet?captions.map((_,i)=>'/assets/ofertasya/capacete-'+(i+1)+'.jpg'):camera?[9,10,11,1,2,3,4,5,6,7,8].map(n=>'/assets/ofertasya/camera-'+n+'.jpg'):captions.map((_,i)=>'/assets/ofertasya/watch-'+(i+1)+'.png'));function photo(n){active=n;$('#hero-image').src=gallery[n-1];$('#hero-image').alt=captions[n-1];document.querySelectorAll('.thumbnails button').forEach((b,i)=>{b.classList.toggle('active',i===n-1);b.setAttribute('aria-pressed',i===n-1)})}captions.forEach((alt,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Ver foto ${i+1}`);const img=document.createElement('img');img.src=gallery[i];img.alt=alt;b.append(img);b.onclick=()=>photo(i+1);$('#thumbnails').append(b)});photo(1);function choose(c){color=c;$('#color-label').textContent=c;document.querySelectorAll('[data-color]').forEach(b=>{b.classList.toggle('selected',b.dataset.color===c);b.setAttribute('aria-pressed',b.dataset.color===c)});photo(product.gallery?1:basike?({Preto:11,Vermelho:12,Camuflado:13}[c]):helmet?1:camera?product.colors.indexOf(c)+1:(c==='Preto'?2:1));const u=new URL(location.href);if(!helmet)u.searchParams.delete('tamanho');u.searchParams.set('cor',c.toLowerCase());history.replaceState(null,'',u)}document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>choose(b.dataset.color));const initial=new URLSearchParams(location.search).get('cor');choose(product.colors.find(c=>c.toLowerCase()===initial)||product.colors[0]);if(basike)photo(1);function qty(){ $('#quantity').textContent=quantity;$('#minus').disabled=quantity<=1;$('#plus').disabled=quantity>=99}$('#minus').onclick=()=>{quantity=Math.max(1,quantity-1);qty()};$('#plus').onclick=()=>{quantity=Math.min(99,quantity+1);qty()};qty();let timer;function toast(t){$('#toast').textContent=t;$('#toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('#toast').hidden=true,3500)}function renderCart(){localStorage.setItem('ofertasya-cart-v1',JSON.stringify(cart));$('#cart-count').textContent=cart.reduce((s,x)=>s+x.quantity,0);$('#cart-total').textContent=money(cart.reduce((s,x)=>s+x.quantity*productFor(x).price/100,0));$('#cart-items').replaceChildren();if(!cart.length){$('#cart-items').textContent='Sua sacola está vazia. Escolha seu produto.'}cart.forEach((x,i)=>{const item=document.createElement('div');item.className='cart-item';const img=document.createElement('img');img.src=productFor(x).images[x.color];img.alt=productFor(x).shortName+' '+x.color;const body=document.createElement('div');const title=document.createElement('strong');title.textContent=productFor(x).shortName;const text=document.createElement('p');text.textContent=`${x.color}${x.size?" · "+x.size:""} · ${x.quantity} unidade(s) · ${money(productFor(x).price/100*x.quantity)}`;body.append(title,text);[['−',()=>{if(x.quantity>1)x.quantity--;renderCart()}],['+',()=>{x.quantity=Math.min(99,x.quantity+1);renderCart()}],['Remover',()=>{cart.splice(i,1);renderCart()}]].forEach(([label,fn])=>{const b=document.createElement('button');b.textContent=label;b.setAttribute('aria-label',label==='−'?'Diminuir quantidade na sacola':label==='+'?'Aumentar quantidade na sacola':'Remover produto');b.onclick=fn;body.append(b)});item.append(img,body);$('#cart-items').append(item)});$('#checkout').disabled=!cart.length}let lastFocus;function openCart(){lastFocus=document.activeElement;$('#cart-overlay').hidden=false;document.body.style.overflow='hidden';$('#close-cart').focus()}function closeCart(){$('#cart-overlay').hidden=true;document.body.style.overflow='';lastFocus?.focus()}$('#open-cart').onclick=openCart;$('#close-cart').onclick=closeCart;$('#cart-overlay').onclick=e=>{if(e.target===$('#cart-overlay'))closeCart()};document.addEventListener('keydown',e=>{if(!$('#cart-overlay').hidden){if(e.key==='Escape')closeCart();if(e.key==='Tab'){const els=[...$('#cart-overlay').querySelectorAll('button:not(:disabled)')];const first=els[0],last=els.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}});$('#buy').onclick=()=>{cart=[{productId:product.id,color,quantity,...(helmet?{size}:{})}];renderCart();sessionStorage.removeItem('ofertasya-charge');sessionStorage.removeItem('ofertasya-event');if(typeof window.fbq==='function')window.fbq('track','InitiateCheckout',{content_ids:[product.id+'-'+color.toLowerCase()],contents:[{id:product.id+'-'+color.toLowerCase(),quantity}],content_type:'product',value:product.price*quantity/100,currency:'BRL',num_items:quantity});location.href='/checkout'+location.search};$('#checkout').onclick=()=>{location.href='/checkout'+location.search};let saved=localStorage.getItem('ofertasya-favorite-'+product.id)==='true';function favorite(){$('#wishlist').textContent=saved?'♥ Salvo nos favoritos':'♡ Salvar nos favoritos';$('#wishlist').setAttribute('aria-pressed',saved)}$('#wishlist').onclick=()=>{saved=!saved;localStorage.setItem('ofertasya-favorite-'+product.id,saved);favorite()};favorite();$('#zoom').onclick=()=>{$('#zoom-image').src=$('#hero-image').src;$('#zoom-image').alt=captions[active-1];$('#lightbox').showModal()};$('#close-zoom').onclick=()=>$('#lightbox').close();$('#write-review').onclick=()=>{$('#review-form').hidden=!$('#review-form').hidden;if(!$('#review-form').hidden)$('#review-form input').focus()};$('#review-form').onsubmit=e=>{e.preventDefault();const data=new FormData(e.target);$('#review-preview').textContent=`PRÉVIA LOCAL — NÃO PUBLICADA\n${data.get('name')} · ${data.get('rating')} estrelas\n${data.get('message')}`};renderCart();

if(helmet){const setSize=v=>{size=v;$("#size-label").textContent=v;document.querySelectorAll("[data-size]").forEach(b=>{b.classList.toggle("selected",b.dataset.size===v);b.setAttribute("aria-pressed",b.dataset.size===v)});const u=new URL(location.href);u.searchParams.set("tamanho",v);history.replaceState(null,"",u)};document.querySelectorAll("[data-size]").forEach(b=>b.onclick=()=>setSize(b.dataset.size));const initialSize=new URLSearchParams(location.search).get("tamanho");setSize(product.sizes.includes(initialSize)?initialSize:"58/M")}



// Shared product-page gallery and store-wide customer milestone.
const storyTrack=$('#product-story-track');
const storySubtitle=$('.story-product');if(storySubtitle)storySubtitle.textContent=product.shortName+' · veja as imagens do produto';
gallery.forEach((src,i)=>{
 const card=document.createElement('button');card.type='button';card.className='story-card';
 card.setAttribute('aria-label',`Ampliar: ${captions[i]}`);
 const image=document.createElement('img');image.src=src;image.alt=captions[i];image.loading='lazy';
 const caption=document.createElement('span');caption.textContent=captions[i];card.append(image,caption);
 card.onclick=()=>{photo(i+1);$('#zoom').click()};storyTrack.append(card);
});
const storyPrev=$('#story-prev'),storyNext=$('#story-next');
function updateStoryControls(){storyPrev.disabled=storyTrack.scrollLeft<2;storyNext.disabled=storyTrack.scrollLeft+storyTrack.clientWidth>=storyTrack.scrollWidth-2}
function scrollStory(direction){storyTrack.scrollBy({left:direction*storyTrack.clientWidth*.85,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
storyPrev.onclick=()=>scrollStory(-1);storyNext.onclick=()=>scrollStory(1);
storyTrack.addEventListener('scroll',updateStoryControls,{passive:true});
new ResizeObserver(updateStoryControls).observe(storyTrack);
// Continuous carousel: touch and mouse hover must not leave autoplay paused.
const storyMotion=matchMedia('(prefers-reduced-motion: reduce)');
let storyVisible=false,storyTouching=false,storyFrame=0,storyLastTime=0,storyPosition=0,storyWritten=0,storyCycle=0;
let storyPaused=storyMotion.matches;
const storyOriginals=[...storyTrack.children];
storyOriginals.forEach(card=>{const copy=card.cloneNode(true);copy.tabIndex=-1;copy.setAttribute('aria-hidden','true');copy.onclick=()=>card.click();storyTrack.append(copy)});
storyTrack.classList.add('story-track-continuous');
const autoplayButton=document.createElement('button');autoplayButton.type='button';autoplayButton.className='story-autoplay';
$('.story-controls').insertBefore(autoplayButton,storyNext);
function updateAutoplayButton(){autoplayButton.textContent=storyPaused?'▶':'Ⅱ';autoplayButton.setAttribute('aria-label',storyPaused?'Reproduzir carrossel':'Pausar carrossel');autoplayButton.setAttribute('aria-pressed',String(storyPaused))}
function measureStoryCycle(){storyCycle=storyTrack.children[storyOriginals.length].offsetLeft-storyTrack.children[0].offsetLeft}
function animateStory(time){
 if(!storyLastTime)storyLastTime=time;
 const elapsed=Math.min(time-storyLastTime,80);storyLastTime=time;
 if(storyVisible&&!document.hidden&&!storyPaused&&!storyTouching&&!$('#lightbox').open&&$('#cart-overlay').hidden&&storyCycle>0){
  if(Math.abs(storyTrack.scrollLeft-storyWritten)>2)storyPosition=storyTrack.scrollLeft;
  storyPosition=(storyPosition+elapsed*.035)%storyCycle;
  storyTrack.scrollLeft=storyPosition;storyWritten=storyTrack.scrollLeft;
 }
 storyFrame=requestAnimationFrame(animateStory);
}
autoplayButton.onclick=()=>{storyPaused=!storyPaused;updateAutoplayButton()};updateAutoplayButton();
new IntersectionObserver(entries=>{storyVisible=entries[0].isIntersecting;storyLastTime=0},{threshold:0}).observe(storyTrack);
new ResizeObserver(measureStoryCycle).observe(storyTrack);measureStoryCycle();
storyTrack.addEventListener('pointerdown',()=>{storyTouching=true});
function releaseStoryTouch(){storyTouching=false;storyPosition=storyTrack.scrollLeft;storyWritten=storyPosition;storyLastTime=0}
addEventListener('pointerup',releaseStoryTouch);addEventListener('pointercancel',releaseStoryTouch);
addEventListener('blur',releaseStoryTouch);
storyMotion.addEventListener('change',()=>{storyPaused=storyMotion.matches;updateAutoplayButton()});
addEventListener('pagehide',()=>{cancelAnimationFrame(storyFrame);storyFrame=0});
addEventListener('pageshow',()=>{if(!storyFrame){storyLastTime=0;storyFrame=requestAnimationFrame(animateStory)}});
storyFrame=requestAnimationFrame(animateStory);
for(const [direction,label,symbol] of [[-1,'Foto anterior','‹'],[1,'Próxima foto','›']]){
 const button=document.createElement('button');button.type='button';button.className='gallery-arrow '+(direction<0?'gallery-prev':'gallery-next');button.setAttribute('aria-label',label);button.textContent=symbol;
 button.onclick=()=>photo((active-1+direction+gallery.length)%gallery.length+1);$('.main-image').append(button);
}
const photoPosition=document.createElement('span');photoPosition.className='photo-position';photoPosition.setAttribute('aria-live','polite');$('.main-image').append(photoPosition);
function updatePhotoPosition(){photoPosition.textContent=`${active} / ${gallery.length}`}
new MutationObserver(updatePhotoPosition).observe($('#hero-image'),{attributes:true,attributeFilter:['src']});updatePhotoPosition();

// Review photos use the existing accessible image dialog.
document.querySelectorAll('.review-photo-button').forEach(button=>{button.onclick=()=>{const image=button.querySelector('img');$('#zoom-image').src=image.src;$('#zoom-image').alt=image.alt;$('#lightbox').showModal()}});

// Product purchase tools: shared by every page using the storefront module.
const purchasePanel=$('.purchase');
const optionsAnchor=document.createElement('div');optionsAnchor.id='escolher-produto';optionsAnchor.tabIndex=-1;
const firstOption=purchasePanel.querySelector('.option-head')||$('#buy');firstOption.before(optionsAnchor);
for(const link of document.querySelectorAll('a[href="#produto"]')){
 link.href='#escolher-produto';link.addEventListener('click',()=>{optionsAnchor.focus({preventScroll:true})});
}
const delivery=document.createElement('section');delivery.className='product-delivery';delivery.setAttribute('aria-labelledby','delivery-title');
delivery.innerHTML=`<h2 id="delivery-title">Entrega e pagamento</h2><p>Pagamento via PIX. Consulte as opções de entrega para seu CEP.</p><form id="product-delivery-form"><label for="product-cep">Calcular frete e prazo</label><div class="delivery-input"><input id="product-cep" name="cep" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" maxlength="9" required pattern="[0-9]{5}-?[0-9]{3}" aria-describedby="product-delivery-status"><button type="submit" class="secondary">Calcular</button></div></form><p id="product-delivery-status" role="status" aria-live="polite"></p><fieldset id="product-delivery-options" hidden><legend>Opções de entrega</legend></fieldset><small>Escolha o frete e confira o endereço no checkout, antes de gerar o PIX.</small>`;
$('#buy').after(delivery);
const cepInput=$('#product-cep'),deliveryStatus=$('#product-delivery-status'),deliveryOptions=$('#product-delivery-options'),calculateButton=$('#product-delivery-form button');
let deliverySequence=0,deliveryController;
function clearQuote(){deliveryOptions.hidden=true;deliveryOptions.replaceChildren();try{sessionStorage.removeItem('ofertasya-delivery')}catch{}}
cepInput.addEventListener('input',()=>{
 deliverySequence++;deliveryController?.abort();calculateButton.disabled=false;calculateButton.textContent='Calcular';
 const raw=cepInput.value.replace(/\D/g,'').slice(0,8);cepInput.value=raw.replace(/^(\d{5})(\d)/,'$1-$2');clearQuote();deliveryStatus.textContent='';
});
$('#product-delivery-form').onsubmit=async event=>{
 event.preventDefault();const cep=cepInput.value.replace(/\D/g,'');if(!/^\d{8}$/.test(cep))return;
 const sequence=++deliverySequence;deliveryController?.abort();deliveryController=new AbortController();
 const timeout=setTimeout(()=>deliveryController.abort(),12000);
 clearQuote();calculateButton.disabled=true;calculateButton.textContent='Consultando…';deliveryStatus.textContent='Consultando CEP…';
 try{
  const response=await fetch('/api/cep/'+cep,{signal:deliveryController.signal});const data=await response.json();
  if(sequence!==deliverySequence)return;
  if(!response.ok||data.erro||!data.localidade||!data.uf)throw Error(data.error||'CEP não encontrado. Confira os números.');
  deliveryStatus.textContent='Entrega para '+data.localidade+'/'+data.uf;
  const legend=document.createElement('legend');legend.textContent='Opções de entrega disponíveis';deliveryOptions.append(legend);
  shippingOptions.forEach(option=>{
   const label=document.createElement('div');label.className='product-shipping-option';
   const details=document.createElement('span');const name=document.createElement('strong');name.textContent=option.name;const estimate=document.createElement('small');estimate.textContent=option.estimate;details.append(name,estimate);
   const price=document.createElement('b');price.textContent=option.price?money(option.price/100):'Grátis';
   label.append(details,price);deliveryOptions.append(label);
  });deliveryOptions.hidden=false;
  try{sessionStorage.setItem('ofertasya-delivery',JSON.stringify({cep}))}catch{}
 }catch(error){if(sequence===deliverySequence)deliveryStatus.textContent=error.name==='AbortError'?'A consulta demorou. Tente calcular novamente.':error.message||'Não foi possível consultar o CEP. Tente novamente.'}
 finally{clearTimeout(timeout);if(sequence===deliverySequence){calculateButton.disabled=false;calculateButton.textContent='Calcular'}}
};
try{const quote=JSON.parse(sessionStorage.getItem('ofertasya-delivery')||'null');if(/^\d{8}$/.test(quote?.cep||''))cepInput.value=quote.cep.replace(/^(\d{5})(\d)/,'$1-$2')}catch{}
const mobilePurchase=document.createElement('aside');mobilePurchase.className='mobile-purchase';mobilePurchase.setAttribute('aria-label','Compra rápida');mobilePurchase.hidden=true;
mobilePurchase.innerHTML='<div><strong class="mobile-purchase-price"></strong><span class="mobile-purchase-selection"></span></div><button type="button" class="primary" id="mobile-buy">Comprar agora →</button>';
document.body.append(mobilePurchase);document.body.classList.add('has-mobile-purchase');
function refreshMobilePurchase(){
 $('.mobile-purchase-price').textContent=money(product.price*quantity/100);
 $('.mobile-purchase-selection').textContent=color+(helmet?' · '+size:'')+(quantity>1?' · '+quantity+' un.':'');
 const buyRect=$('#buy').getBoundingClientRect();const headerBottom=document.querySelector('header').getBoundingClientRect().bottom;
 const buyVisible=buyRect.bottom>headerBottom&&buyRect.top<innerHeight;
 const editing=document.activeElement?.matches('input,textarea,select');
 mobilePurchase.hidden=!matchMedia('(max-width: 800px)').matches||buyVisible||!$('#cart-overlay').hidden||$('#lightbox').open||editing;
}
$('#mobile-buy').onclick=()=>$('#buy').click();
new MutationObserver(refreshMobilePurchase).observe(purchasePanel,{subtree:true,attributes:true,attributeFilter:['aria-pressed'],characterData:true,childList:true});
new MutationObserver(refreshMobilePurchase).observe($('#cart-overlay'),{attributes:true,attributeFilter:['hidden']});
new MutationObserver(refreshMobilePurchase).observe($('#lightbox'),{attributes:true,attributeFilter:['open']});
addEventListener('scroll',refreshMobilePurchase,{passive:true});addEventListener('resize',refreshMobilePurchase);document.addEventListener('focusin',refreshMobilePurchase);document.addEventListener('focusout',()=>requestAnimationFrame(refreshMobilePurchase));refreshMobilePurchase();

// Keep the purchase area compact on future product pages too.
const productIntro=document.querySelector('.purchase .intro');
if(productIntro){
 let descriptionArea=document.querySelector('#detalhes');
 if(!descriptionArea){descriptionArea=document.createElement('section');descriptionArea.id='detalhes';descriptionArea.className='details';const title=document.createElement('h2');title.textContent='Sobre o produto';descriptionArea.append(title);document.querySelector('.product').after(descriptionArea)}
 const title=descriptionArea.querySelector('h2');productIntro.className='product-description';if(title)title.after(productIntro);else descriptionArea.prepend(productIntro);
}
