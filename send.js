import express from "express";
import admin from "firebase-admin";
import serverless from "serverless-http";

const app = express();
app.use(express.json());

// ✅ Initialize Firebase Admin using env variable
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// ✅ Root route
app.get("/", (req, res) => {
  res.status(200).send("🚀 Notification API is running successfully on Vercel!");
});

// ✅ Send notification route
app.post("/send", async (req, res) => {
  try {
    const { token, title, body } = req.body;

    if (!token || !title || !body) {
      return res.status(400).send({ error: "Missing required fields" });
    }

    const message = {
      notification: { title, body },
      token,
    };

    const response = await admin.messaging().send(message);
    res.status(200).send({ success: true, response });
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    res.status(500).send({ error: error.message });
  }
});

// ✅ Do NOT use app.listen() on Vercel
export default serverless(app);
