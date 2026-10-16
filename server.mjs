import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPayments} from './payments.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
try{for(const line of fs.readFileSync(path.join(root,'.env'),'utf8').split(/\r?\n/)){const m=line.trim().match(/^([A-Z_]+)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].trim()}}catch{}
const payments=createPayments({key:process.env.URUSPAY_API_KEY,root});
const mime={'.mjs':'text/javascript; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{let route;try{route=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}if(route.startsWith('/api/'))return payments(req,res,route);if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return}if(route==='/capacete'||route==='/capacete/')route='/capacete.html';if(route==='/camera'||route==='/camera/')route='/camera.html';if(route==='/')route='/index.html';if(route==='/camisolas')route='/camisolas.html';if(route==='/checkout'||route==='/checkout/')route='/checkout.html';if(!(route.startsWith('/assets/')||route.startsWith('/__l5e/')||/^\/(index[^/]*\.html|camisolas\.html|checkout\.html|camera\.html|capacete\.html|favicon\.png)$/.test(route))){res.writeHead(404).end();return}const file=path.resolve(root,'.'+route);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end('Arquivo não encontrado');return}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(req.method==='HEAD'?undefined:data)})}).listen(Number(process.env.PORT)||4180,()=>console.log('Ofertasya: servidor iniciado'));

