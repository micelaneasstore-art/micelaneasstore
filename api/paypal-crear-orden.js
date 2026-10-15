const {api,habilitado,normalizarPedido,firmarPedido}=require("./_lib/paypal");
module.exports=async(req,res)=>{
 if(req.method!=="POST")return res.status(405).json({error:"Método no permitido"});
 if(!habilitado())return res.status(503).json({error:"PayPal no está disponible."});
 try {
  const pedido=normalizarPedido(req.body||{});
  const referencia=firmarPedido(pedido);
  const base=String(process.env.PUBLIC_BASE_URL||"").replace(/\/+$/,"");
  if(!base.startsWith("https://"))throw new Error("PUBLIC_BASE_URL debe usar HTTPS.");
  const orden=await api("/v2/checkout/orders",{method:"POST",body:{intent:"CAPTURE",purchase_units:[{reference_id:"loteria",custom_id:referencia,description:`MicelaneasStore ${pedido.cantidad} tablas ${pedido.formato}`,amount:{currency_code:"MXN",value:pedido.total.toFixed(2)}}],payment_source:{paypal:{experience_context:{brand_name:"MicelaneasStore",user_action:"PAY_NOW",return_url:`${base}/paypal-regreso.html`,cancel_url:`${base}/crear.html?paypal_cancelado=1`}}}}});
  const approve=orden.links?.find(x=>x.rel==="payer-action"||x.rel==="approve")?.href;
  if(!approve)throw new Error("PayPal no devolvió enlace de aprobación.");
  return res.status(200).json({order_id:orden.id,approve_url:approve,total:pedido.total});
 }catch(e){console.error("PayPal crear orden",e.message);return res.status(502).json({error:e.message});}
};
