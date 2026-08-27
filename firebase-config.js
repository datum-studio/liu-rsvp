// Configuração do projeto Firebase "liu-rsvp".
// Essas chaves NÃO são segredo (é normal elas aparecerem no código de um site Firebase) —
// quem protege seus dados são as regras em firestore.rules, não esconder essa config.

export const firebaseConfig = {
  apiKey: "AIzaSyB_JEPdp0q_nh2VHJyjsFZ57SHmDX3rU_Q",
  authDomain: "liu-rsvp.firebaseapp.com",
  projectId: "liu-rsvp",
  storageBucket: "liu-rsvp.firebasestorage.app",
  messagingSenderId: "860782968179",
  appId: "1:860782968179:web:9f1c9f7833ef0486f45906",
};

// Dados do evento — mude aqui se algum detalhe da festa mudar.
export const eventInfo = {
  title: "Aniversário da Liu",
  dateLabel: "07 de setembro de 2026",
  timeLabel: "14h30",
  location: "Resort Cajueiro",
  host: "Liu",
};
