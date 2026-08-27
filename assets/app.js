// Inicialização compartilhada do Firebase (usada pela página de RSVP e pela de confirmados).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, eventInfo } from "../firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { eventInfo };

export function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
