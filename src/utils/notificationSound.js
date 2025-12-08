// Make sure the audio file is in: public/sounds/notify.mp3
const audio = new Audio("/sounds/notify.mp3");
audio.volume = 0.8;
audio.preload = "auto"; // Preload sound

export const playNotificationSound = () => {
  if (isMuted()) return console.log("🔇 Sound Muted");

  audio.currentTime = 0;
  audio.play().catch((err) => {
    console.warn("⚠️ Sound play blocked until first click", err);
  });
};

export const toggleMute = () => {
  const current = isMuted();
  localStorage.setItem("notificationsMuted", !current);
  return !current;
};

export const isMuted = () =>
  localStorage.getItem("notificationsMuted") === "true";
