// src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import toast from "react-hot-toast";

const firebaseConfig = {
  apiKey: "AIzaSyBcNTkpl4sv89fUMecf6vvmLilq7wmdb5Y",
  authDomain: "vrism-b96fc.firebaseapp.com",
  projectId: "vrism-b96fc",
  storageBucket: "vrism-b96fc.firebasestorage.app",
  messagingSenderId: "376273879246",
  appId: "1:376273879246:web:835a60aa82508ae20f109f",
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// 👉 Ask permission + store FCM token
export const requestNotificationPermission = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: "NDx3eh45H21YvZevYS3CV3SqZ7iGu3KcX0UKxjXmJRU",
    });

    if (token) localStorage.setItem("fcm_token", token);
    return token;
  } catch (err) {
    console.log("Notification permission denied");
  }
};

// 👉 Foreground handler (when app is open)
export const handleForegroundNotification = (navigate) => {
  onMessage(messaging, (payload) => {
    toast(payload.notification?.body || "New Notification", {
      icon: "🔔",
    });

    if (payload?.data?.senderId) {
      setTimeout(() => {
        navigate(`/chat/${payload.data.senderId}`);
      }, 1000);
    }
  });
};
