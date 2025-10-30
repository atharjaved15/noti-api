import express from "express";
import admin from "firebase-admin";
import cors from "cors";

const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: "*", // allow all origins (you can restrict to your web app domain)
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Parse JSON body
app.use(express.json());

// Firebase initialization
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Health check
app.get("/", (req, res) => {
  res.send("✅ Notification API is running!");
});

// Notification endpoint
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

// Handle preflight OPTIONS requests explicitly (important for Flutter Web)
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(200);
});

export default app;
