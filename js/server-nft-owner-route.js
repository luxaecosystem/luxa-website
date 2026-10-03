// Incolla in backend/src/server.js subito dopo la route
//   app.get('/api/node/nfts/:address', ...)
//
// Fallback usato da luxa-certificate.js quando il REST pubblico
// (https://api.luxaecosystem.xyz) non è raggiungibile dal browser.
// Passa status e corpo della chain così com'è: il client distingue
// da solo "non trovato" da "chain irraggiungibile".

app.get('/api/node/nft-owner/:classId/:id', async (req, res) => {
  const { classId, id } = req.params;
  if (classId !== 'luxa-relics' || !/^[0-4]$/.test(id)) {
    return res.status(400).json({ error: 'Invalid class or token id' });
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(
      `${OCI_REST_URL}/cosmos/nft/v1beta1/owner/${classId}/${id}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Error reading on-chain NFT owner', details: err.message });
  }
});
