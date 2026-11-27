import fs from 'node:fs';
import './create-home.mjs';
import './create-info-pages.mjs';
import {infoPages} from './assets/ofertasya/info-pages.mjs';
fs.mkdirSync('public/assets',{recursive:true});for(const file of ['index.html','pix.html','relogio.html','checkout.html','camera.html','capacete.html','basike.html','travesseiro.html','robo.html','climatizador.html','ventilador.html'])fs.copyFileSync(file,'public/'+file);fs.cpSync('assets/ofertasya','public/assets/ofertasya',{recursive:true});


for(const slug of Object.keys(infoPages))fs.copyFileSync('info-'+slug+'.html','public/info-'+slug+'.html');
