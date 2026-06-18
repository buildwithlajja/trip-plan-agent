export default {
  fetch() {
    return Response.json({ ok: true, timestamp: new Date().toISOString() });
  }
};
