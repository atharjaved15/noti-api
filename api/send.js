import express from "express";
import admin from "firebase-admin";
import cors from "cors";

const app = express();

// Explicitly allow all origins, methods, and headers
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// Handle preflight requests for any route
app.options("*", cors());

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

app.get("/", (req, res) => {
  res.send("✅ Notification API is running!");
});

app.post("/send", async (req, res) => {
  try {
    const { tokens, token, title, body, imageUrl } = req.body;

    if ((!tokens || !Array.isArray(tokens) || tokens.length === 0) && !token) {
      return res.status(400).json({ error: "Missing tokens or token field" });
    }
    if (!title || !body) {
      return res.status(400).json({ error: "Missing title or body" });
    }

    const notificationPayload = {
      title,
      body,
      ...(imageUrl ? { image: imageUrl } : {}),
    };

    const message = {
      notification: notificationPayload,
      data: { click_action: "FLUTTER_NOTIFICATION_CLICK" },
    };

    let response;
    if (tokens && tokens.length > 1) {
      response = await admin.messaging().sendEachForMulticast({ tokens, ...message });
      res.json({
        success: true,
        sentCount: response.successCount,
        failureCount: response.failureCount,
      });
    } else {
      response = await admin.messaging().send({ token: token || tokens[0], ...message });
      res.json({ success: true, response });
    }
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    res.status(500).json({ error: error.message });
  }
});

export default app;
