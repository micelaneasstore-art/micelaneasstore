const { normalizarPedido, firmarPedido, verificarReferencia } = require("./order");

function baseUrl() {
  return process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}
function habilitado() {
  return process.env.PAYPAL_ENV === "sandbox" && !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET;
}
async function accessToken() {
  const credentials = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${baseUrl()}/v1/oauth2/token`, {method:"POST", headers:{Authorization:`Basic ${credentials}`, "Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials"});
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error("No se pudo autenticar con PayPal Sandbox.");
  return data.access_token;
}
async function api(path, options = {}) {
  const token = await accessToken();
  const response = await fetch(`${baseUrl()}${path}`, {method:options.method||"GET", headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json",...(options.headers||{})},...(options.body?{body:JSON.stringify(options.body)}:{})});
  const raw=await response.text(); let data;try{data=JSON.parse(raw)}catch{data={}};
  if (!response.ok) {const err=new Error(data.message||`PayPal respondió ${response.status}`);err.status=response.status;err.data=data;throw err;}
  return data;
}
function verificarOrden(order) {
  if (!order || order.intent!=="CAPTURE") throw new Error("Orden PayPal inválida.");
  const unit=order.purchase_units?.[0];
  if (!unit?.custom_id) throw new Error("La orden no contiene referencia firmada.");
  const pedido=verificarReferencia(unit.custom_id);
  if (unit.amount?.currency_code!=="MXN" || Number(unit.amount.value)!==pedido.total) throw new Error("El importe PayPal no coincide con el pedido.");
  return {pedido,unit};
}
function verificarCaptura(order) {
  const {pedido,unit}=verificarOrden(order);
  const capture=unit.payments?.captures?.find(c=>c.status==="COMPLETED");
  if (!capture || capture.amount?.currency_code!=="MXN" || Number(capture.amount.value)!==pedido.total) throw new Error("Pago PayPal aún no completado.");
  return {pedido,capture};
}
module.exports={api,habilitado,normalizarPedido,firmarPedido,verificarOrden,verificarCaptura};
