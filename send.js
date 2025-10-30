import express from "express";
import admin from "firebase-admin";
import { readFileSync } from "fs";
import serverless from "serverless-http";

const app = express();
app.use(express.json());

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// ✅ Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized successfully");
}

// ✅ Base route
app.get("/", (req, res) => res.send("🚀 Notification API is running!"));

// ✅ Send Notification route
app.post("/send", async (req, res) => {
  try {
    const { token, title, body, imageUrl } = req.body;

    if (!token || !title || !body) {
      return res.status(400).send({ error: "Missing required fields" });
    }

    const message = {
      token,
      notification: { title, body, imageUrl },
      data: { click_action: "FLUTTER_NOTIFICATION_CLICK" },
    };

    await admin.messaging().send(message);

    console.log(`✅ Notification sent to token: ${token}`);
    res.send({ success: true, message: "Notification sent successfully" });
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    res.status(500).send({ error: error.message });
  }
});

// 🚀 Export for Vercel
export const handler = serverless(app);
export default handler;
