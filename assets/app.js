// Inicialização compartilhada do Firebase (usada pela página de RSVP e pela de confirmados).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, eventInfo } from "../firebase-config.js";

export const app = initializeApp(firebaseConfig);
// Algumas redes (certos provedores, wi-fi de estabelecimento, dados móveis de
// algumas operadoras) bloqueiam ou travam o canal de streaming que o Firestore
// usa por padrão — a gravação fica pendurada sem nunca dar erro nem sucesso.
// Forçando "long polling" aqui, ele usa um tipo de conexão mais compatível
// que funciona nessas redes também.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
});
export { eventInfo };

export function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
