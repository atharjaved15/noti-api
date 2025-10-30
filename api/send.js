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

// CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Notification endpoint
app.post("/send", async (req, res) => {
  try {
    const { tokens, token, title, body, imageUrl } = req.body;

    if ((!tokens || tokens.length === 0) && !token) {
      return res.status(400).json({ error: "Missing tokens or token field" });
    }

    if (!title || !body) {
      return res.status(400).json({ error: "Missing title or body" });
    }

    const notificationPayload = {
      title,
      body,
      ...(imageUrl ? { image: imageUrl } : {}), // optional image
    };

    const message = {
      notification: notificationPayload,
      data: { click_action: "FLUTTER_NOTIFICATION_CLICK" },
    };

    let response;

    if (tokens && tokens.length > 1) {
      // Multiple tokens
      response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...message,
      });
      res.json({
        success: true,
        sentCount: response.successCount,
        failureCount: response.failureCount,
      });
    } else {
      // Single token
      const targetToken = token || tokens[0];
      response = await admin.messaging().send({ token: targetToken, ...message });
      res.json({ success: true, response });
    }
  } catch (err) {
    console.error("❌ Error sending notification:", err);
    res.status(500).json({ error: err.message });
  }
});

export default app;
