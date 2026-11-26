import {mountFooter} from './footer.mjs';
import {icon,paymentBrandsMarkup} from './layout-icons.js';

export function paintCheckoutItem(element,item,product,unitPrice,money){
 let image=element.querySelector('.checkout-item-image');if(!image){image=document.createElement('div');image.className='checkout-item-image';const img=element.querySelector('img');img.before(image);image.append(img);const badge=document.createElement('span');badge.textContent=item.quantity;image.append(badge)}
 const info=element.lastElementChild;info.className='checkout-item-info';const name=document.createElement('p');name.textContent=product.shortName;const variant=document.createElement('small');variant.textContent=item.color+(item.size?' · '+item.size:'')+(item.voltage?' · '+item.voltage:'');const price=document.createElement('strong');price.textContent=money(item.quantity*unitPrice/100);info.replaceChildren(name,variant,price);
}

export function initCheckoutLayout(){
 const $=s=>document.querySelector(s);document.body.classList.add('vantto-checkout');
 const header=document.querySelector('header');const secure=document.createElement('span');secure.className='checkout-secure';secure.innerHTML=icon('lock',16)+'<span>Pagamento<br><b>100% seguro</b></span>';header.append(secure);
 const panel=$('.layout>.panel'),summary=$('.layout>aside');panel.classList.add('checkout-main');summary.classList.add('checkout-summary');panel.prepend($('.steps'));
 const labels={identification:['user','Informações pessoais'],shipping:['truck','Entrega'],payment:['card','Pagamento']};
 for(const button of document.querySelectorAll('[data-step]')){const [symbol,label]=labels[button.dataset.step];button.innerHTML='<b>'+icon(symbol,20)+'</b><span>'+label+'</span>'}
 const title=$('#step-identification h2');title.innerHTML='<span class="number">1</span>'+icon('user',16)+'Informações pessoais';$('#step-shipping h2').innerHTML='<span class="number">2</span>'+icon('pin',16)+'Entrega';$('#step-payment h2').innerHTML='<span class="number">3</span>'+icon('card',16)+'Pagamento';
 $('#identity-next').innerHTML='Ir para entrega '+icon('arrow',18);$('#shipping-next').innerHTML='Ir para pagamento '+icon('arrow',18);
 const phone=document.createElement('label');phone.htmlFor='phone';phone.innerHTML='Celular / WhatsApp <span class="optional">(opcional)</span><input id="phone" type="tel" autocomplete="tel-national" inputmode="tel" placeholder="(11) 99999-9999" maxlength="16">';
 const cpfLabel=$('#cpf').closest('label'),row=document.createElement('div');row.className='field-row';cpfLabel.before(row);row.append(cpfLabel,phone);
 const note=document.createElement('p');note.className='checkout-reassurance';note.innerHTML=icon('shield',16)+' Ofertasya · Boas escolhas para o seu dia a dia';panel.append(note);
 $('#summary-toggle').innerHTML='<span class="summary-heading-label">'+icon('bag',19)+' Resumo do pedido '+icon('chevron',15)+'</span><span id="summary-header-total"></span><span class="summary-toggle" aria-hidden="true">+</span>';
 const desktopTitle=document.createElement('h2');desktopTitle.className='summary-desktop-title';desktopTitle.textContent='Resumo do pedido';summary.prepend(desktopTitle);
 const coupon=document.createElement('div');coupon.className='checkout-coupon';coupon.innerHTML='<button type="button" id="coupon-toggle" aria-expanded="false" aria-controls="coupon-form">Tem um cupom? '+icon('chevron',16)+'</button><form id="coupon-form" hidden><div><input aria-label="Código do cupom" placeholder="Código do cupom" required maxlength="50"><button type="submit">Adicionar</button></div><p id="coupon-message" role="status"></p></form>';$('#items').after(coupon);
 $('#coupon-toggle').onclick=()=>{const open=$('#coupon-form').hidden;$('#coupon-form').hidden=!open;$('#coupon-toggle').setAttribute('aria-expanded',String(open))};$('#coupon-form').onsubmit=e=>{e.preventDefault();$('#coupon-message').textContent='Cupom inválido ou indisponível.'};
 const lockNote=document.createElement('p');lockNote.className='summary-secure';lockNote.innerHTML=icon('lock',14)+' Ambiente seguro';$('#summary-content').append(lockNote);
 const edit=document.createElement('a');edit.href='/';edit.className='checkout-edit-cart';edit.textContent='Continuar comprando';$('#summary-content').append(edit);
 mountFooter();
 const updateTotal=()=>{$('#summary-header-total').textContent=$('#total').textContent};new MutationObserver(updateTotal).observe($('#total'),{childList:true,characterData:true,subtree:true});updateTotal();
}
