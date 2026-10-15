import {createPayments} from '../payments.mjs';
const handler=createPayments({key:process.env.URUSPAY_API_KEY,root:'/tmp',stateless:true});
export default async function(req,res){const url=new URL(req.url,'https://ofertasya.local');const route=req.query?.route||url.searchParams.get('route')||'';if(route==='health'){res.setHeader('Cache-Control','no-store');return res.status(200).json({ok:true,pix_configurado:!!process.env.URUSPAY_API_KEY,version:'ofertasya-vercel-pix-v1'})}return handler(req,res,'/api/'+String(route));}

