// api/save.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method Not Allowed" });
    return;
  }

  try {
    const GAS_URL = process.env.GAS_URL;
    if (!GAS_URL) {
      throw new Error("Falta la variable de entorno GAS_URL en Vercel");
    }

    const body = req.body || {};
    const params = new URLSearchParams();
    for (const key of Object.keys(body)) {
      const val = body[key];
      params.append(key, typeof val === "string" ? val : JSON.stringify(val));
    }

    const resp = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    res.status(200).json({
      ok: resp.ok,
      status: resp.status,
      data,
    });
  } catch (err) {
    console.error("Error en /api/save:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
}
