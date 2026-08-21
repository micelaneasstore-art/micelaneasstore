async function guardarYFirmar({ pathname, bytes, contentType = "application/pdf", minutos = 15 }) {
  const { put, issueSignedToken, presignUrl } = await import("@vercel/blob");

  await put(pathname, bytes, {
    access: "private",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60
  });

  const validUntil = Date.now() + minutos * 60 * 1000;

  const token = await issueSignedToken({
    pathname,
    operations: ["get"],
    validUntil
  });

  const { presignedUrl } = await presignUrl(token, {
    pathname,
    operation: "get",
    validUntil,
    useCache: false
  });

  return { presignedUrl, validUntil };
}

module.exports = { guardarYFirmar };
