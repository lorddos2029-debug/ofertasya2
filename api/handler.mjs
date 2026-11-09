import {createPayments} from '../payments.mjs';
const handler=createPayments({key:process.env.URUSPAY_API_KEY,utmifyToken:process.env.UTMIFY_API_TOKEN,root:'/tmp',stateless:true,metaPixelId:process.env.META_PIXEL_ID,metaAccessToken:process.env.META_CAPI_ACCESS_TOKEN});
export default async function(req,res){const url=new URL(req.url,'https://ofertasya.local');const route=req.query?.route||url.searchParams.get('route')||'';if(route==='health'){res.setHeader('Cache-Control','no-store');return res.status(200).json({ok:true,pix_configurado:!!process.env.URUSPAY_API_KEY,utmify_configurado:!!process.env.UTMIFY_API_TOKEN,version:'ofertasya-vercel-pix-v1'})}return handler(req,res,'/api/'+String(route));}

