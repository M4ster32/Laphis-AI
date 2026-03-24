/**
 * LAPHIS — Notification & Reminder System
 * Uses the browser Notification API + localStorage for scheduling
 */

const STORAGE_KEY = "laphis-reminders";
const PERMISSION_KEY = "laphis-notification-permission";

// ===== Permission =====
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
}

export function getNotificationPermission() {
  if (!("Notification" in window)) return "denied";
  return Notification.permission;
}

// ===== Send Notification =====
export function sendNotification(title, body, icon = "") {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `laphis-${Date.now()}`,
      vibrate: [200, 100, 200],
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    setTimeout(() => n.close(), 8000);
  } catch (e) {
    console.error("Notification error:", e);
  }
}

// ===== Reminders Storage =====
export function getReminders() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveReminders(reminders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

export function addReminder(reminder) {
  const reminders = getReminders();
  reminders.push({
    id: Date.now(),
    ...reminder,
    active: true,
    createdAt: new Date().toISOString(),
  });
  saveReminders(reminders);
  return reminders;
}

export function removeReminder(id) {
  const reminders = getReminders().filter((r) => r.id !== id);
  saveReminders(reminders);
  return reminders;
}

export function toggleReminder(id) {
  const reminders = getReminders().map((r) =>
    r.id === id ? { ...r, active: !r.active } : r
  );
  saveReminders(reminders);
  return reminders;
}

// ===== Reminder Checker (runs periodically) =====
let checkerInterval = null;

export function startReminderChecker() {
  if (checkerInterval) return;

  checkerInterval = setInterval(() => {
    checkReminders();
  }, 60000); // Check every minute

  // Also check immediately
  checkReminders();
}

export function stopReminderChecker() {
  if (checkerInterval) {
    clearInterval(checkerInterval);
    checkerInterval = null;
  }
}

function checkReminders() {
  const reminders = getReminders();
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDay = now.getDay(); // 0 = Sunday
  const todayStr = now.toISOString().split("T")[0];

  for (const reminder of reminders) {
    if (!reminder.active) continue;

    // Check if this reminder should fire now
    const [rHour, rMinute] = (reminder.time || "08:00").split(":").map(Number);

    // Check time (within 1 minute window)
    if (currentHour !== rHour || currentMinute !== rMinute) continue;

    // Check day of week
    if (reminder.days && reminder.days.length > 0) {
      if (!reminder.days.includes(currentDay)) continue;
    }

    // Check if already fired today
    const firedKey = `laphis-fired-${reminder.id}-${todayStr}`;
    if (localStorage.getItem(firedKey)) continue;

    // Fire!
    const typeIcons = {
      treino: "",
      refeicao: "",
      agua: "",
      custom: "",
    };
    const typeLabels = {
      treino: "Hora do Treino!",
      refeicao: "Hora da Refeição!",
      agua: "Bebe Água!",
      custom: "Lembrete LAPHIS",
    };

    sendNotification(
      typeLabels[reminder.type] || "Lembrete LAPHIS",
      reminder.message || `${typeIcons[reminder.type] || ""} ${reminder.label || "Não te esqueças!"}`,
    );

    // Mark as fired today
    localStorage.setItem(firedKey, "1");
    // Clean old fired keys after 2 days
    setTimeout(() => localStorage.removeItem(firedKey), 172800000);
  }
}

// ===== Preset Reminders =====
export const REMINDER_PRESETS = [
  {
    type: "treino",
    label: "Lembrete de Treino",
    iconName: "dumbbell",
    defaultTime: "07:30",
    defaultMessage: "Está na hora do treino! Não saltes o dia de hoje.",
    defaultDays: [1, 2, 3, 4, 5], // Mon-Fri
  },
  {
    type: "refeicao",
    label: "Lembrete de Refeição",
    iconName: "nutrition",
    defaultTime: "12:30",
    defaultMessage: "Hora de comer! Mantém a tua dieta em dia.",
    defaultDays: [0, 1, 2, 3, 4, 5, 6], // Every day
  },
  {
    type: "agua",
    label: "Beber Água",
    iconName: "water",
    defaultTime: "10:00",
    defaultMessage: "Bebe água! Mantém-te hidratado ao longo do dia.",
    defaultDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    type: "custom",
    label: "Lembrete Personalizado",
    iconName: "bell",
    defaultTime: "09:00",
    defaultMessage: "",
    defaultDays: [1, 2, 3, 4, 5],
  },
];
