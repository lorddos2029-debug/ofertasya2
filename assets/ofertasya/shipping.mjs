// Shared delivery options for product pages, checkout and server pricing. Prices in cents.
export const shippingOptions=[
 {id:'free',name:'Frete grátis',price:0,estimate:'7–10 dias'},
 {id:'sedex',name:'Sedex',price:1790,estimate:'3–5 dias'}
];
export const shippingFor=id=>shippingOptions.find(option=>option.id===id);
