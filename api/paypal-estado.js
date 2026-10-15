module.exports = (req, res) => {
  if (req.method !== "GET") return res.status(405).json({error:"Método no permitido"});
  res.setHeader("Cache-Control", "no-store");
  const disponible = process.env.PAYPAL_ENV === "live" &&
    Boolean(process.env.PAYPAL_CLIENT_ID) && Boolean(process.env.PAYPAL_CLIENT_SECRET);
  return res.status(200).json({disponible});
};
