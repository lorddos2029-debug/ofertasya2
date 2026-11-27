import fs from 'node:fs';
import './create-home.mjs';
import './create-info-pages.mjs';
import {infoPages} from './assets/ofertasya/info-pages.mjs';
fs.mkdirSync('public/assets',{recursive:true});for(const file of ['index.html','pix.html','checkout.html','travesseiro.html','robo.html','climatizador.html','ventilador.html','panela.html','purificador.html'])fs.copyFileSync(file,'public/'+file);fs.cpSync('assets/ofertasya','public/assets/ofertasya',{recursive:true});


for(const slug of Object.keys(infoPages))fs.copyFileSync('info-'+slug+'.html','public/info-'+slug+'.html');

for(const file of ['relogio.html','camera.html','capacete.html','basike.html']){const p='public/'+file;if(fs.existsSync(p))fs.unlinkSync(p)}
