import express from "express";
import admin from "firebase-admin";
import cors from "cors";

const app = express();

// ✅ Enable CORS for all origins
app.use(cors({ origin: true }));
app.use(express.json());

// ✅ Initialize Firebase Admin SDK from environment variable
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

app.get("/", (req, res) => {
  res.send("✅ Notification API is running on Vercel!");
});

// ✅ Send notification to one or multiple tokens
app.post("/send", async (req, res) => {
  try {
    const { tokens, token, title, body, imageUrl } = req.body;

    // Validate input
    if ((!tokens || !Array.isArray(tokens) || tokens.length === 0) && !token) {
      return res.status(400).json({ error: "Missing tokens or token field" });
    }
    if (!title || !body) {
      return res.status(400).json({ error: "Missing title or body" });
    }

    // Build the notification payload
    const notificationPayload = {
      title,
      body,
      ...(imageUrl ? { image: imageUrl } : {}), // include image only if provided
    };

    const message = {
      notification: notificationPayload,
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    };

    let response;

    if (tokens && tokens.length > 1) {
      // 📨 Multiple devices
      response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...message,
      });
      res.json({
        success: true,
        sentCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      });
    } else {
      // 📨 Single device
      response = await admin.messaging().send({
        token: token || (tokens ? tokens[0] : ""),
        ...message,
      });
      res.json({ success: true, response });
    }
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    res.status(500).json({ error: error.message });
  }
});

export default app;
