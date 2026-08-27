import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db, eventInfo, esc } from "./app.js";

document.getElementById("admin-event").textContent =
  eventInfo.title + " · " + eventInfo.dateLabel;

const listEl = document.getElementById("guest-list");
const emptyEl = document.getElementById("empty-state");
const statYes = document.getElementById("stat-yes");
const statPeople = document.getElementById("stat-people");
const statNo = document.getElementById("stat-no");
const liveDot = document.getElementById("live-dot");
const errorEl = document.getElementById("admin-error");

function fmtWhen(ts) {
  if (!ts || !ts.toDate) return "agora mesmo";
  const d = ts.toDate();
  const dd = d.toLocaleDateString("pt-BR");
  const hh = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return dd + " às " + hh;
}

function companionCount(r) {
  return Array.isArray(r.companions) ? r.companions.length : Number(r.companions) || 0;
}

function render(rows) {
  const yes = rows.filter((r) => r.attending);
  const no = rows.filter((r) => !r.attending);
  const people = yes.reduce((sum, r) => sum + 1 + companionCount(r), 0);

  statYes.textContent = yes.length;
  statPeople.textContent = people;
  statNo.textContent = no.length;

  if (!rows.length) {
    listEl.innerHTML = "";
    emptyEl.classList.remove("is-hidden");
    return;
  }
  emptyEl.classList.add("is-hidden");

  listEl.innerHTML = rows
    .map((r) => {
      const bits = [];
      if (r.attending && companionCount(r) > 0) {
        const names = Array.isArray(r.companions) ? r.companions.filter(Boolean) : [];
        bits.push(
          names.length
            ? "com " + names.map(esc).join(", ")
            : "+" + companionCount(r) + (companionCount(r) === 1 ? " acompanhante" : " acompanhantes")
        );
      }
      bits.push(fmtWhen(r.submittedAt));
      return (
        '<div class="guest">' +
        '<div class="who">' +
        '<div class="name">' + esc(r.name) + "</div>" +
        '<div class="meta">' + bits.join(" &middot; ") + "</div>" +
        "</div>" +
        '<span class="badge ' + (r.attending ? "yes" : "no") + '">' +
        (r.attending ? "VEM" : "NÃO VEM") +
        "</span>" +
        "</div>"
      );
    })
    .join("");
}

document.getElementById("refresh-btn").addEventListener("click", () => location.reload());

try {
  const q = query(collection(db, "rsvps"), orderBy("submittedAt", "desc"));
  onSnapshot(
    q,
    (snap) => {
      liveDot.classList.remove("is-hidden");
      const rows = snap.docs.map((d) => d.data());
      render(rows);
    },
    (err) => {
      errorEl.innerHTML =
        '<div class="error-notice">Não consegui carregar a lista (' +
        esc(err.message) +
        ").</div>";
    }
  );
} catch (err) {
  errorEl.innerHTML =
    '<div class="error-notice">Não consegui conectar ao banco de dados.</div>';
}
