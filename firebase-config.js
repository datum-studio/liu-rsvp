// Cole aqui a configuração do SEU projeto Firebase.
// Onde encontrar: console.firebase.google.com -> seu projeto -> ⚙️ Configurações do projeto
// -> aba "Geral" -> role até "Seus apps" -> app Web -> "Config" (ou clique no ícone </>)
//
// Essas chaves NÃO são segredo (é normal elas aparecerem no código de um site Firebase) —
// quem protege seus dados são as regras em firestore.rules, não esconder essa config.

export const firebaseConfig = {
  apiKey: "COLE_AQUI_SUA_API_KEY",
  authDomain: "SEU-PROJETO.firebaseapp.com",
  projectId: "SEU-PROJETO",
  storageBucket: "SEU-PROJETO.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxx",
};

// Dados do evento — mude aqui se algum detalhe da festa mudar.
export const eventInfo = {
  title: "Aniversário da Liu",
  dateLabel: "07 de setembro de 2026",
  timeLabel: "14h30",
  location: "Resort Cajueiro",
  host: "Liu",
};
