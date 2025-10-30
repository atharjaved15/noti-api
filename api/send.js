import express from "express";
import admin from "firebase-admin";

const app = express();

app.use(express.json());

// Firebase init
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Handle all requests with CORS headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.post("/send", async (req, res) => {
  try {
    const { token, title, body } = req.body;
    if (!token || !title || !body) return res.status(400).json({ error: "Missing fields" });

    const message = {
      token,
      notification: { title, body },
      data: { click_action: "FLUTTER_NOTIFICATION_CLICK" },
    };

    const response = await admin.messaging().send(message);
    res.json({ success: true, response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default app;
