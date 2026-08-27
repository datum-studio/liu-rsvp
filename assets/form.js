import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db, eventInfo, esc } from "./app.js";

const entriesKey = "rsvp_entries_" + eventInfo.title;
const legacyKey = "rsvp_done_" + eventInfo.title;
const SUBMIT_TIMEOUT_MS = 12000;

const formSection = document.getElementById("form-section");
const successSection = document.getElementById("success-section");
const form = document.getElementById("rsvp-form");
const nameInput = document.getElementById("rsvp-name");
const attendButtons = document.querySelectorAll(".attend-btn");
const companionsRow = document.getElementById("companions-row");
const companionRowsEl = document.getElementById("companion-rows");
const addCompanionBtn = document.getElementById("add-companion-btn");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const formError = document.getElementById("form-error");
const editBtn = document.getElementById("edit-btn");
const addAnotherBtn = document.getElementById("add-another-btn");
const otherEntriesEl = document.getElementById("other-entries");
const otherEntriesListEl = document.getElementById("other-entries-list");

let attending = null;
let editingId = null; // id da confirmação sendo editada agora (null = confirmação nova)
let activeId = null; // id da confirmação mostrada na tela de sucesso

// --- entradas salvas nesse navegador -------------------------------------

function loadEntries() {
  try {
    const raw = localStorage.getItem(entriesKey);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr)) return arr;
  } catch (e) {
    /* localStorage indisponível ou corrompido */
  }
  // migração de um formato antigo (uma confirmação só, sem edição possível)
  try {
    const legacy = JSON.parse(localStorage.getItem(legacyKey) || "null");
    if (legacy && legacy.name) {
      return [{ id: "legacy", name: legacy.name, attending: legacy.attending, companions: [], editToken: null }];
    }
  } catch (e) {
    /* ignora */
  }
  return [];
}

function saveEntries() {
  try {
    localStorage.setItem(entriesKey, JSON.stringify(entries));
  } catch (e) {
    /* localStorage indisponível — segue sem persistir */
  }
}

function findEntry(id) {
  return entries.find((e) => e.id === id);
}

const entries = loadEntries();

// --- helpers de rede -------------------------------------------------------

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      const err = new Error("tempo esgotado");
      err.timeout = true;
      reject(err);
    }, ms);
    promise.then(
      (val) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function makeToken() {
  try {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  } catch (e) {
    /* segue pro fallback */
  }
  return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// --- acompanhantes -----------------------------------------------------

function addCompanionRow(focus, value) {
  const row = document.createElement("div");
  row.className = "companion-row";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "companion-input";
  input.placeholder = "nome do acompanhante";
  input.autocomplete = "off";
  if (value) input.value = value;

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

// --- alternância entre form / sucesso -----------------------------------

function resetForm() {
  form.reset();
  companionRowsEl.innerHTML = "";
  attendButtons.forEach((b) => b.classList.remove("is-active"));
  attending = null;
  companionsRow.classList.add("is-hidden");
  submitBtn.disabled = false;
  submitBtn.innerHTML = "ENVIAR RESPOSTA";
  showError("");
}

function populateForm(entry) {
  nameInput.value = entry.name;
  companionRowsEl.innerHTML = "";
  attendButtons.forEach((b) => {
    const isYes = b.getAttribute("data-value") === "yes";
    b.classList.toggle("is-active", isYes === entry.attending);
  });
  attending = entry.attending;
  companionsRow.classList.toggle("is-hidden", !attending);
  if (attending) {
    if (entry.companions && entry.companions.length) {
      entry.companions.forEach((name) => addCompanionRow(false, name));
    } else {
      addCompanionRow(false);
    }
  }
  submitBtn.disabled = false;
  submitBtn.innerHTML = submitLabel();
  showError("");
}

function showForm(withCancel) {
  successSection.classList.add("is-hidden");
  formSection.classList.remove("is-hidden");
  cancelBtn.classList.toggle("is-hidden", !withCancel);
  cancelBtn.disabled = false;
  nameInput.focus();
}

function startEdit(id) {
  const entry = findEntry(id);
  if (!entry || !entry.id || entry.id === "legacy") return;
  editingId = id;
  populateForm(entry);
  showForm(true);
}

function startNew() {
  editingId = null;
  resetForm();
  showForm(entries.length > 0);
}

function cancelForm() {
  editingId = null;
  if (activeId && findEntry(activeId)) {
    renderSuccess(activeId);
  } else {
    resetForm();
    formSection.classList.remove("is-hidden");
    successSection.classList.add("is-hidden");
  }
}

function renderOtherEntries(currentId) {
  const others = entries.filter((e) => e.id !== currentId);
  if (!others.length) {
    otherEntriesEl.classList.add("is-hidden");
    otherEntriesListEl.innerHTML = "";
    return;
  }
  otherEntriesEl.classList.remove("is-hidden");
  otherEntriesListEl.innerHTML = others
    .map(
      (e) =>
        '<button type="button" class="other-entry" data-id="' +
        esc(String(e.id)) +
        '"><span class="other-entry-name">' +
        esc(e.name) +
        '</span><span class="other-entry-status">' +
        (e.attending ? "vem" : "não vem") +
        "</span></button>"
    )
    .join("");
  otherEntriesListEl.querySelectorAll(".other-entry").forEach((btn) => {
    btn.addEventListener("click", () => renderSuccess(btn.getAttribute("data-id")));
  });
}

function renderSuccess(id) {
  const entry = findEntry(id) || entries[entries.length - 1];
  if (!entry) return;
  activeId = entry.id;
  formSection.classList.add("is-hidden");
  successSection.classList.remove("is-hidden");
  const isAttending = entry.attending;
  document.getElementById("success-stamp").textContent = isAttending ? "✓ CONFIRMADO" : "✓ RESPOSTA ENVIADA";
  document.getElementById("success-title").textContent = isAttending
    ? "Combinado, " + entry.name + "!"
    : "Anotado, " + entry.name;
  document.getElementById("success-sub").textContent = isAttending ? "te espero lá ♡" : "vou sentir sua falta";
  document.getElementById("success-details").classList.toggle("is-hidden", !isAttending);
  editBtn.classList.toggle("is-hidden", !entry.id || entry.id === "legacy");
  renderOtherEntries(entry.id);
}

editBtn.addEventListener("click", () => {
  if (activeId) startEdit(activeId);
});
addAnotherBtn.addEventListener("click", startNew);
cancelBtn.addEventListener("click", cancelForm);

// mostra direto a tela de sucesso se esse navegador já tiver confirmações salvas.
if (entries.length) {
  renderSuccess(entries[entries.length - 1].id);
}

// --- envio ---------------------------------------------------------------

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
  cancelBtn.disabled = true;

  const isEditing = !!editingId;
  const existing = isEditing ? findEntry(editingId) : null;
  const editToken = isEditing && existing ? existing.editToken : makeToken();

  const payload = { name, attending, companions, submittedAt: serverTimestamp(), editToken };

  try {
    if (isEditing && existing) {
      await withTimeout(updateDoc(doc(db, "rsvps", existing.id), payload), SUBMIT_TIMEOUT_MS);
      existing.name = name;
      existing.attending = attending;
      existing.companions = companions;
      saveEntries();
      editingId = null;
      renderSuccess(existing.id);
    } else {
      const ref = await withTimeout(addDoc(collection(db, "rsvps"), payload), SUBMIT_TIMEOUT_MS);
      const newEntry = { id: ref.id, name, attending, companions, editToken };
      entries.push(newEntry);
      saveEntries();
      editingId = null;
      renderSuccess(newEntry.id);
    }
  } catch (err) {
    showError(
      err && err.timeout
        ? "Não consegui confirmar — verifica sua internet e tenta de novo."
        : "Não consegui enviar sua confirmação (" + (err && err.message ? err.message : "erro") + "). Tenta de novo em instantes."
    );
    submitBtn.disabled = false;
    submitBtn.innerHTML = submitLabel();
    cancelBtn.disabled = false;
  }
});
