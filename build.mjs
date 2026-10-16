import fs from 'node:fs';
fs.mkdirSync('public/assets',{recursive:true});for(const file of ['index.html','checkout.html','camera.html','capacete.html'])fs.copyFileSync(file,'public/'+file);fs.cpSync('assets/ofertasya','public/assets/ofertasya',{recursive:true});

