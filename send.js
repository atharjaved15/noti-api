import express from "express";
import admin from "firebase-admin";
import { readFileSync } from "fs";

const app = express();
app.use(express.json());

// ✅ Load service account key from file
const serviceAccount = JSON.parse(
  readFileSync("./serviceAccountKey.json", "utf8")
);

// ✅ Initialize Firebase Admin SDK once
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

    // 📨 Create FCM message
    const message = {
      token,
      notification: {
        title,
        body,
        imageUrl,
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    };

    // ✅ Send message via Firebase Admin
    await admin.messaging().send(message);

    console.log(`✅ Notification sent to token: ${token}`);
    res.send({ success: true, message: "Notification sent successfully" });
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    res.status(500).send({ error: error.message });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

export default app;
