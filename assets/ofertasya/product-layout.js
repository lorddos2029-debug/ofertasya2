// Shared product layout. Product, checkout and gallery behavior stay in store.js.
import {paymentIcons} from './product-payment-icons.js';
export function applyProductLayout(product, money) {
 const $=s=>document.querySelector(s);
 if(!document.querySelector('link[href="/assets/ofertasya/product-layout.css"]')){const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='/assets/ofertasya/product-layout.css';document.head.append(stylesheet)}
 document.body.classList.add('reference-layout');
 $('.announcement').textContent='PROMOÇÃO DE PRÉ BLACK FRIDAY · OFERTASYA';
 const header=$('header');
 const menu=document.createElement('button');menu.type='button';menu.className='layout-menu';menu.setAttribute('aria-label','Abrir menu');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-controls','store-navigation');menu.textContent='☰';
 const nav=header.querySelector('nav');nav.id='store-navigation';
 menu.onclick=()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));header.classList.toggle('menu-open',open)};
 nav.addEventListener('click',()=>{header.classList.remove('menu-open');menu.setAttribute('aria-expanded','false')});
 header.prepend(menu);
 const productSection=$('.product'),purchase=$('.purchase');
 const description=document.createElement('section');description.className='product-description-panel';description.setAttribute('aria-labelledby','description-heading');
 const title=document.createElement('h2');title.id='description-heading';title.textContent='Descrição';description.append(title);
 for(const section of [...$('main').children]){
  if(section.matches('.feature-strip,.editorial,.details,.image-grid,.specs'))description.append(section);
 }
 productSection.append(description);
 const story=$('.product-story');if(story)productSection.after(story);
 const promo=$('.pre-black-friday');promo.textContent='PRÉ BLACK FRIDAY';
 const badgeRow=document.createElement('div');badgeRow.className='layout-badges';
 const storeBadge=document.createElement('span');storeBadge.textContent='OFERTA OFERTASYA';badgeRow.append(storeBadge,promo);purchase.prepend(badgeRow);
 const reviews=[...document.querySelectorAll('.camera-review')];
 const rating=document.createElement('a');rating.className='layout-rating';rating.href='#avaliacoes';
 if(reviews.length){const stars=document.createElement('span');stars.textContent='★★★★★';stars.setAttribute('aria-hidden','true');rating.append(stars,document.createTextNode(' '+reviews.length+' avaliações de clientes'));}
 else rating.textContent='Confira as avaliações do produto';
 purchase.querySelector('h1').after(rating);
 const pay=document.createElement('button');pay.type='button';pay.className='layout-payment-toggle';pay.textContent='▣ Opções de pagamento';pay.setAttribute('aria-expanded','false');pay.setAttribute('aria-controls','product-payment-info');
 const info=document.createElement('p');info.id='product-payment-info';info.hidden=true;info.textContent='PIX'+(product.pixDiscount?' com '+product.pixDiscount+'% de desconto':'')+'. Cartão: até 6x sem juros e de 7x a 12x com juros. A cobrança por cartão está desativada no momento.';
 pay.onclick=()=>{info.hidden=!info.hidden;pay.setAttribute('aria-expanded',String(!info.hidden))};
 const priceBox=$('.price-box');priceBox.append(pay,info);
 const pix=priceBox.querySelector('.pix-price');if(pix){const icon=document.createElement('img');icon.src='/assets/ofertasya/pix.png';icon.alt='';icon.width=17;icon.height=17;pix.prepend(icon);priceBox.append(pix)}
 const paymentMarks=document.createElement('div');paymentMarks.className='layout-payment-marks';paymentMarks.innerHTML='<span>Formas de pagamento</span><div>'+paymentIcons+'</div>';
 $('#buy').after(paymentMarks);
 const delivery=$('.product-delivery');delivery.querySelector('h2').textContent='Frete e prazo de entrega';delivery.querySelector('p').textContent='Frete grátis · 7–10 dias. SEDEX · 3–5 dias. Consulte seu CEP.';
 const guarantee=document.createElement('div');guarantee.className='layout-guarantee';guarantee.innerHTML='<span aria-hidden="true">↩</span><div><strong>Compra com tranquilidade</strong><p>Confira as condições de entrega e pagamento antes de finalizar seu pedido.</p></div>';delivery.after(guarantee);
 const related=document.createElement('section');related.className='layout-related';related.innerHTML='<h2>Produtos relacionados</h2><div></div>';
 import('./catalog.mjs').then(({catalog})=>{for(const p of Object.values(catalog)){if(p.id===product.id)continue;const a=document.createElement('a');a.href=p.id==='bettdow'?'/':'/'+p.id;const img=document.createElement('img');img.src=Object.values(p.images)[0];img.alt=p.shortName;img.loading='lazy';const name=document.createElement('strong');name.textContent=p.shortName;const price=document.createElement('span');price.textContent=money(p.price/100);a.append(img,name,price);related.querySelector('div').append(a)}});
 $('main').append(related);
 const footer=$('footer');const footerGrid=document.createElement('div');footerGrid.className='layout-footer-grid';
 const brand=document.createElement('section');brand.append(footer.querySelector('.brand-logo'),footer.querySelector('p'));
 const products=document.createElement('section');const productsTitle=document.createElement('h3');productsTitle.textContent='Produtos';products.append(productsTitle);
 for(const link of nav.querySelectorAll('a:not([href^="#"])'))products.append(link.cloneNode(true));
 const help=document.createElement('section');const helpTitle=document.createElement('h3');helpTitle.textContent='Informações';help.append(helpTitle,...footer.querySelector('div').children);
 const payments=document.createElement('section');payments.innerHTML='<h3>Formas de pagamento</h3><div class="layout-footer-payments">'+paymentIcons.replaceAll('pi-','footer-pi-')+'</div>';
 footerGrid.append(brand,products,help,payments);footer.querySelector('div').remove();footer.prepend(footerGrid);
}
