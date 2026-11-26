import fs from 'node:fs';
import './create-home.mjs';
fs.mkdirSync('public/assets',{recursive:true});for(const file of ['index.html','relogio.html','checkout.html','camera.html','capacete.html','basike.html','travesseiro.html','robo.html','climatizador.html','ventilador.html'])fs.copyFileSync(file,'public/'+file);fs.cpSync('assets/ofertasya','public/assets/ofertasya',{recursive:true});

