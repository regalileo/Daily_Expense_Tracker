import { TransactionManager } from "./transactionManager.js";
import { ChartManager } from "./chartManager.js";
import { formatRupiah, saveToStorage, getFromStorage } from "./utils.js";

const transMgr = new TransactionManager();
const chartMgr = new ChartManager();

const el = (id) => document.getElementById(id);
const today = () => new Date().toISOString().slice(0, 10);

function updateUI() {
  const list = el("transactionList");
  list.innerHTML = "";
  const filtered = transMgr.filterTransactions(el("searchInput").value);
  filtered.forEach(t => {
    const div = document.createElement("div");
    div.className = "transaction";
    div.innerHTML = `
      <span>${t.description} (${t.category}) - ${formatRupiah(t.amount)}</span>
      <div>
        <button onclick="deleteTransaction(${t.id})">🗑️</button>
      </div>`;
    list.appendChild(div);
  });

  el("todayTotal").textContent = formatRupiah(transMgr.getTodayTotal());
  el("monthTotal").textContent = formatRupiah(transMgr.getMonthTotal());

  const saldo = parseFloat(el("initialBalance").value) || 0;
  el("totalBalance").textContent = formatRupiah(transMgr.getBalance(saldo));

  chartMgr.renderCategoryChart(transMgr.getCategoryStats());
  chartMgr.renderDateChart(transMgr.getDateStats());
}

window.deleteTransaction = function (id) {
  transMgr.deleteTransaction(id);
  updateUI();
};

el("addTransaction").onclick = () => {
  const desc = el("descInput").value;
  const amt = parseFloat(el("amountInput").value);
  const cat = el("categoryInput").value;
  if (!desc || !amt) return;
  transMgr.addTransaction({ description: desc, amount: amt, category: cat, date: today() });
  el("descInput").value = "";
  el("amountInput").value = "";
  updateUI();
};

el("initialBalance").oninput = () => updateUI();
el("searchInput").oninput = () => updateUI();

el("exportBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(transMgr.transactions)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "backup.json";
  a.click();
};

el("importFile").onchange = (e) => {
  const reader = new FileReader();
  reader.onload = () => {
    transMgr.transactions = JSON.parse(reader.result);
    transMgr.save();
    updateUI();
  };
  reader.readAsText(e.target.files[0]);
};

el("resetBtn").onclick = () => {
  el("resetModal").classList.add("show");
};

el("confirmReset").onclick = () => {
  if (el("resetPassword").value === "hansohe") {
    transMgr.resetAll();
    el("resetModal").classList.remove("show");
    updateUI();
  }
};

el("cancelReset").onclick = () => {
  el("resetModal").classList.remove("show");
};

el("themeToggle").onclick = () => {
  document.body.classList.toggle("dark");
  saveToStorage("theme", document.body.classList.contains("dark"));
};

window.onload = () => {
  if (getFromStorage("theme")) document.body.classList.add("dark");
  updateUI();
};
