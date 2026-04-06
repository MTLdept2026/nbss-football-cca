import webpush from "web-push";

const REQUIRED_ENV_VARS = ["WEB_PUSH_PUBLIC_KEY", "WEB_PUSH_PRIVATE_KEY", "WEB_PUSH_SUBJECT"];

export function pushConfig() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing push environment variables: ${missing.join(", ")}`);
  }

  return {
    publicKey: process.env.WEB_PUSH_PUBLIC_KEY,
    privateKey: process.env.WEB_PUSH_PRIVATE_KEY,
    subject: process.env.WEB_PUSH_SUBJECT,
  };
}

export function configureWebPush() {
  const { publicKey, privateKey, subject } = pushConfig();
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendPushNotification(subscription, payload) {
  configureWebPush();
  return webpush.sendNotification(subscription, JSON.stringify(payload), {
    TTL: 60,
    urgency: "high",
  });
}
