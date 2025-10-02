import { Router } from "express";
import fetch from "node-fetch";
import { pool } from "../db";

export interface PolarTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  x_user_id: string;
}

const router = Router();

const CLIENT_ID = process.env.POLAR_CLIENT_ID!;
const CLIENT_SECRET = process.env.POLAR_CLIENT_SECRET!;
const REDIRECT_URI = "http://localhost:4000/api/auth/polar/callback";

router.get("/polar/profile", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT access_token, polar_user_id FROM polar_tokens WHERE user_id = $1",
      [1]
    );

    if (!rows.length) {
      return res.status(404).send("No Polar account linked");
    }

    const { access_token, polar_user_id } = rows[0];

    const txRes = await fetch(
      `https://www.polaraccesslink.com/v3/users/${polar_user_id}/physical-information-transactions`,
      { method: "POST", headers: { Authorization: `Bearer ${access_token}`, Accept: "application/json" } }
    );

    if (txRes.status === 204) {
      return res.json({ physicalInfos: [] });
    }

    if (!txRes.ok) {
      const text = await txRes.text();
      return res.status(txRes.status).send(`Failed to create transaction: ${text}`);
    }

    const txData = await txRes.json() as { "transaction-id": string };
    const transactionId: string = txData["transaction-id"];

    const listRes = await fetch(
      `https://www.polaraccesslink.com/v3/users/${polar_user_id}/physical-information-transactions/${transactionId}`,
      { headers: { Authorization: `Bearer ${access_token}`, Accept: "application/json" } }
    );

    if (listRes.status === 204) {
      return res.json({ physicalInfos: [] });
    }

    if (!listRes.ok) {
      const text = await listRes.text();
      return res.status(listRes.status).send(`Failed to list physical info: ${text}`);
    }

    const listData = await listRes.json() as { "physical-informations"?: string[] };
    const physicalUrls: string[] = listData["physical-informations"] || [];

    const infos = [];
    for (const url of physicalUrls) {
      const infoRes = await fetch(url, { headers: { Authorization: `Bearer ${access_token}`, Accept: "application/json" } });
      if (!infoRes.ok) continue;
      infos.push(await infoRes.json());
    }

    await fetch(
      `https://www.polaraccesslink.com/v3/users/${polar_user_id}/physical-information-transactions/${transactionId}`,
      { method: "PUT", headers: { Authorization: `Bearer ${access_token}` } }
    );
    res.json({ physicalInfos: infos });

  } catch (err) {
    console.error("Error fetching Polar profile:", err);
    res.status(500).send("Error fetching profile");
  }
});


router.get("/polar/connect", (_req, res) => {
  const url = new URL("https://flow.polar.com/oauth2/authorization");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("scope", "accesslink.read_all");
  res.redirect(url.toString());
});

router.get("/polar/callback", async (req, res) => {
  const { code } = req.query;
  console.log("Auth code:", code);
  if (!code) return res.status(400).send("No code provided");

  try {
    const tokenRes = await fetch("https://polarremote.com/v2/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization":
          "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error("Token exchange failed");
    }

    const tokens = (await tokenRes.json()) as PolarTokenResponse;
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const memberId = "user_1"; 
    const registerRes = await fetch("https://www.polaraccesslink.com/v3/users", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ "member-id": memberId }),
    });

    if (!registerRes.ok && registerRes.status !== 409) { 
      const text = await registerRes.text();
      return res.status(registerRes.status).send(`Failed to register user: ${text}`);
    }

    const registerData = await registerRes.json() as { "polar-user-id"?: string };
    const polarUserId = registerData["polar-user-id"] || tokens.x_user_id;

    await pool.query(
      `INSERT INTO polar_tokens 
        (user_id, polar_user_id, access_token, refresh_token, expires_at) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
         SET polar_user_id = EXCLUDED.polar_user_id,
             access_token = EXCLUDED.access_token,
             refresh_token = EXCLUDED.refresh_token,
             expires_at = EXCLUDED.expires_at,
             updated_at = NOW();`,
      [1, polarUserId, tokens.access_token, tokens.refresh_token, expiresAt]
    );
    res.redirect("http://localhost:5173/user?polar=connected");
  } catch (err) {
    console.error("Error exchanging token or registering user:", err);
    res.status(500).send("Auth failed");
  }
});

export default router;
