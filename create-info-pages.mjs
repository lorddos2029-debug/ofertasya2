import fs from 'node:fs';
import './create-home.mjs';
import {infoPages} from './assets/ofertasya/info-pages.mjs';
import {footerMarkup} from './assets/ofertasya/footer.mjs';
const source=fs.readFileSync('index.html','utf8');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const baseHead=source.slice(0,source.indexOf('</head>'));
const header=source.slice(source.indexOf('<div class="announcement"'),source.indexOf('<main>')).replaceAll('href="#produtos"','href="/#produtos"').replaceAll('href="#atendimento"','href="/atendimento"');
const overlay=source.slice(source.indexOf('<div class="overlay"'));
for(const [slug,page] of Object.entries(infoPages)){
 let head=baseHead.replace(/<title>.*?<\/title>/,'<title>'+page.title+' | Ofertasya</title>').replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+escape(page.intro)+'">');
 head+='<link rel="stylesheet" href="/assets/ofertasya/info.css"><link rel="stylesheet" href="/assets/ofertasya/footer.css"><link rel="canonical" href="https://www.ofertasyaloja.online/'+slug+'"></head>';
 fs.writeFileSync('info-'+slug+'.html',head+'<body class="reference-layout info-page">'+header+'<main><nav class="info-breadcrumb" aria-label="Você está em"><a href="/">Início</a><span>/</span><span>'+page.title+'</span></nav><h1>'+page.title+'</h1><p class="info-intro">'+page.intro+'</p><article class="info-content">'+page.content+'</article></main><footer class="store-footer">'+footerMarkup()+'</footer>'+overlay);
}
