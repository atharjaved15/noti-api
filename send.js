import express from "express";
import admin from "firebase-admin";
import serverless from "serverless-http";

const app = express();
app.use(express.json());

// Parse Firebase service account from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

app.get("/", (req, res) => {
  res.send("🚀 Notification API is live and running!");
});

app.post("/send", async (req, res) => {
  try {
    const { token, title, body } = req.body;

    if (!token || !title || !body) {
      return res.status(400).send({ error: "Missing fields" });
    }

    const message = {
      notification: { title, body },
      token,
    };

    const response = await admin.messaging().send(message);
    res.status(200).send({ success: true, response });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).send({ success: false, error: error.message });
  }
});

// For Vercel serverless
export const handler = serverless(app);
