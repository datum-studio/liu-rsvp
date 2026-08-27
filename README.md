# RSVP da Liu

Site simples de confirmação de presença (RSVP), com uma página de formulário
e uma página `/confirmados` que mostra a lista ao vivo, sem precisar de senha
nem de conta Claude/Google pra quem confirma.

- **Frontend:** HTML/CSS/JS puro, sem build (sem npm, sem framework).
- **Banco de dados:** Firebase Firestore (grava as confirmações).
- **Hospedagem:** Firebase Hosting (grátis no plano Spark).
- **Código-fonte:** este repositório no GitHub (fica versionado, dá pra reaproveitar em outros freelas).

## Estrutura

```
index.html            → formulário de confirmação (link pra colocar no convite)
confirmados/index.html → lista de confirmados ao vivo (link só pra você/cliente)
assets/                → CSS, imagens e o JS de cada página
firebase-config.js     → onde você cola as chaves do SEU projeto Firebase
firestore.rules        → regras de segurança do banco de dados
firebase.json          → configuração de deploy
```

## Passo a passo (primeira vez)

### 1. Criar o projeto no Firebase (grátis)

1. Acesse https://console.firebase.google.com e entre com uma conta Google.
2. Clique em **"Adicionar projeto"**, dê um nome (ex: `liu-rsvp`) e siga o
   assistente (pode desativar o Google Analytics, não é necessário).
3. Dentro do projeto, no menu lateral, clique em **Build → Firestore Database**
   → **Criar banco de dados** → escolha um local (ex: `southamerica-east1` -
   São Paulo) → inicie em **modo de produção** (as regras deste projeto já
   cuidam da segurança).
4. Ainda no console, clique no ícone de engrenagem (⚙️) → **Configurações do
   projeto** → role até **"Seus apps"** → clique no ícone `</>` (Web) → dê um
   apelido ao app → **Registrar app**. Ele vai te mostrar um bloco de código
   com `apiKey`, `authDomain`, `projectId` etc.
5. Copie esses valores para o arquivo **`firebase-config.js`** deste projeto,
   substituindo os valores de exemplo.

### 2. Instalar as ferramentas (uma vez só, no seu computador)

Precisa ter o [Node.js](https://nodejs.org) instalado. Depois, no terminal:

```bash
npm install -g firebase-tools
firebase login
```

Isso abre o navegador pra você entrar com a mesma conta Google do passo 1.

### 3. Conectar este projeto ao Firebase e publicar

Dentro da pasta do projeto:

```bash
firebase use --add
```

Escolha o projeto que você criou e, quando perguntar um "alias", pode
digitar `default`. Isso atualiza o arquivo `.firebaserc` automaticamente
(não precisa editar ele à mão).

Depois, pra publicar o site e as regras do banco de dados:

```bash
firebase deploy
```

Ao final, o terminal mostra a **Hosting URL** — algo como
`https://liu-rsvp.web.app`. Esse é o link do formulário. A página de
confirmados fica em `https://liu-rsvp.web.app/confirmados`.

### 4. Subir o código pro GitHub

```bash
git init
git add .
git commit -m "RSVP da Liu"
gh repo create liu-rsvp --private --source=. --remote=origin --push
```

(Se preferir sem o `gh` CLI: crie um repositório vazio em github.com, depois
`git remote add origin <url-do-repo>` e `git push -u origin main`.)

O arquivo `.gitignore` já evita subir arquivos temporários do Firebase.
`firebase-config.js` **pode** ir pro repositório normalmente — essas chaves
não são segredo, a segurança está nas regras do Firestore (`firestore.rules`).

## Pra usar em outro evento depois

Edite os textos em `firebase-config.js` (seção `eventInfo`) e em `index.html`
/ `confirmados/index.html` (título, data, local), troque `assets/polaroid.jpg`
se quiser outra foto, rode `firebase deploy` de novo — pronto, é só isso pra
reaproveitar esse mesmo projeto num próximo freela.

## Se algo der errado

- **"Missing or insufficient permissions"** ao confirmar: geralmente é porque
  as regras (`firestore.rules`) ainda não foram publicadas — rode
  `firebase deploy --only firestore:rules`.
- **Confirmações não aparecem em `/confirmados`**: veja o console do
  navegador (F12) — o erro mais comum é `firebase-config.js` ainda com os
  valores de exemplo.
- Quer apagar uma confirmação errada/teste: abra o Firestore Database no
  console do Firebase → coleção `rsvps` → apague o documento por lá
  diretamente (por segurança, isso não pode ser feito pela própria página).
