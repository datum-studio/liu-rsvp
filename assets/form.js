import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db, eventInfo, esc } from "./app.js";

const storageKey = "rsvp_done_" + eventInfo.title;

const formSection = document.getElementById("form-section");
const successSection = document.getElementById("success-section");
const form = document.getElementById("rsvp-form");
const nameInput = document.getElementById("rsvp-name");
const attendButtons = document.querySelectorAll(".attend-btn");
const companionsRow = document.getElementById("companions-row");
const companionRowsEl = document.getElementById("companion-rows");
const addCompanionBtn = document.getElementById("add-companion-btn");
const submitBtn = document.getElementById("submit-btn");
const formError = document.getElementById("form-error");

let attending = null;

function addCompanionRow(focus) {
  const row = document.createElement("div");
  row.className = "companion-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "companion-input";
  input.placeholder = "nome do acompanhante";
  input.autocomplete = "off";

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "companion-remove";
  remove.setAttribute("aria-label", "remover acompanhante");
  remove.innerHTML = "&times;";
  remove.addEventListener("click", () => row.remove());

  row.appendChild(input);
  row.appendChild(remove);
  companionRowsEl.appendChild(row);
  if (focus) input.focus();
}

addCompanionBtn.addEventListener("click", () => addCompanionRow(true));

function submitLabel() {
  return attending === true ? "&hearts;&nbsp; CONFIRMAR PRESENÇA" : "ENVIAR RESPOSTA";
}

function showError(msg) {
  formError.innerHTML = msg ? '<div class="error-notice">' + esc(msg) + "</div>" : "";
}

attendButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    attendButtons.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    attending = btn.getAttribute("data-value") === "yes";
    companionsRow.classList.toggle("is-hidden", !attending);
    if (attending && !companionRowsEl.children.length) addCompanionRow(false);
    submitBtn.innerHTML = submitLabel();
  });
});

function showSuccess(name, isAttending) {
  formSection.classList.add("is-hidden");
  successSection.classList.remove("is-hidden");
  document.getElementById("success-stamp").textContent = isAttending
    ? "✓ CONFIRMADO"
    : "✓ RESPOSTA ENVIADA";
  document.getElementById("success-title").textContent = isAttending
    ? "Combinado, " + name + "!"
    : "Anotado, " + name;
  document.getElementById("success-sub").textContent = isAttending
    ? "te espero lá ♡"
    : "vou sentir sua falta";
  document.getElementById("success-details").classList.toggle("is-hidden", !isAttending);
}

// já confirmou nesse navegador antes? pula direto pro estado de sucesso.
try {
  const done = JSON.parse(localStorage.getItem(storageKey) || "null");
  if (done && done.name) {
    showSuccess(done.name, done.attending);
  }
} catch (e) {
  /* localStorage indisponível — segue com o form normalmente */
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  showError("");
  const name = nameInput.value.trim();
  if (!name) {
    showError("Escreve seu nome ali em cima :)");
    return;
  }
  if (attending === null) {
    showError("Escolhe se você vem ou não.");
    return;
  }

  const companions = attending
    ? Array.from(document.querySelectorAll(".companion-input"))
        .map((i) => i.value.trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];

  submitBtn.disabled = true;
  submitBtn.textContent = "enviando...";

  const entry = {
    name,
    attending,
    companions,
    submittedAt: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, "rsvps"), entry);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ name, attending }));
    } catch (e) {}
    showSuccess(name, attending);
  } catch (err) {
    showError(
      "Não consegui enviar sua confirmação (" +
        (err && err.message ? err.message : "erro") +
        "). Tenta de novo em instantes."
    );
    submitBtn.disabled = false;
    submitBtn.innerHTML = submitLabel();
  }
});
