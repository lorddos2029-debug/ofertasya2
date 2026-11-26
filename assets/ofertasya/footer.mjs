import {business,footerGroups} from './business.mjs';
export function footerMarkup(){return `<div class="store-footer-main"><nav class="footer-groups" aria-label="Informações e atendimento">${footerGroups.map(group=>`<details class="footer-group"><summary>${group.title}<span aria-hidden="true">+</span></summary><div>${group.links.map(([label,url])=>`<a href="${url}">${label}</a>`).join('')}</div></details>`).join('')}<a class="footer-sitemap" href="/mapa-do-site">Mapa do site</a></nav></div><div class="store-footer-business"><p><strong>Endereço:</strong> ${business.address}, CEP: ${business.cep}</p><p><strong>CNPJ:</strong> ${business.cnpj} <span>·</span> <a href="mailto:${business.email}">${business.email}</a></p><p>© ${new Date().getFullYear()} ${business.name}. Todos os direitos reservados.</p></div>`}
export function mountFooter(){
 const footer=document.querySelector('footer');if(!footer||footer.dataset.storeFooter==='true')return;
 footer.className='store-footer';footer.id='atendimento';footer.dataset.storeFooter='true';footer.innerHTML=footerMarkup();
 if(!document.querySelector('link[href="/assets/ofertasya/footer.css"]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/assets/ofertasya/footer.css';document.head.append(css)}
 const media=matchMedia('(min-width: 900px)');const sync=()=>{footer.querySelectorAll('details').forEach(detail=>detail.open=media.matches)};sync();media.addEventListener('change',sync);
}
