const {api,habilitado,verificarOrden,verificarCaptura}=require("./_lib/paypal");
const {crearTokenDescarga}=require("./_lib/delivery");
const {enviarCorreoPedido}=require("./_lib/email-pedido");
module.exports=async(req,res)=>{
 if(req.method!=="POST")return res.status(405).json({error:"Método no permitido"});
 if(!habilitado())return res.status(503).json({error:"PayPal no está habilitado."});
 const id=String(req.body?.order_id||"");
 if(!/^[A-Z0-9-]{8,40}$/.test(id))return res.status(400).json({error:"Identificador de orden inválido."});
 try {
  let orden=await api(`/v2/checkout/orders/${encodeURIComponent(id)}`);
  verificarOrden(orden);
  if(orden.status!=="COMPLETED"){
    if(orden.status!=="APPROVED")return res.status(409).json({error:"El comprador aún no aprobó el pago."});
    try{await api(`/v2/checkout/orders/${encodeURIComponent(id)}/capture`,{method:"POST",headers:{"PayPal-Request-Id":`micelaneasstore-${id}`}})}catch(e){
      if(e.status!==422)throw e; // Puede haber sido capturada por otra solicitud simultánea.
    }
    orden=await api(`/v2/checkout/orders/${encodeURIComponent(id)}`);
  }
  const {pedido,capture}=verificarCaptura(orden);
  const paymentId=`paypal-${id}`;
  const token=crearTokenDescarga({paymentId,pedido,minutos:15});
  const email=orden.payer?.email_address||"";
  if(email){try{await enviarCorreoPedido({payment:{id:paymentId,payer:{email}},pedido})}catch(e){console.error("Correo PayPal pendiente de reintento",e.message)}}
  return res.status(200).json({token,pedido:{cantidad:pedido.cantidad,formato:pedido.formato,diseno:pedido.diseno,agregarMazo:pedido.agregarMazo,total:pedido.total},capture_id:capture.id});
 }catch(e){console.error("PayPal capturar orden",e.message);return res.status(400).json({error:e.message});}
};
