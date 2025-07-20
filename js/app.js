import { formatCurrency, formatDate } from './utils.js';
import { ChartManager } from './chartManager.js';
import { TransactionManager } from './transactionManager.js';

document.addEventListener("DOMContentLoaded", () => {
  const addTransactionBtn = document.getElementById("add-transaction-btn");
  const transactionFormSection = document.getElementById("form-section");
  const transactionForm = document.getElementById("transaction-form");
  const transactionList = document.getElementById("transaction-list");
  const balanceEl = document.getElementById("balance");
  const incomeEl = document.getElementById("income");
  const expenseEl = document.getElementById("expense");
  const totalTransactionsEl = document.getElementById("total-transactions");
  const resetBtn = document.getElementById("reset");
  const passwordModal = document.getElementById("password-modal");
  const confirmResetBtn = document.getElementById("confirm-reset");
  const resetPasswordInput = document.getElementById("reset-password");
  const searchInput = document.getElementById("search");

  const transactionManager = new TransactionManager();
  const chartManager = new ChartManager();

  function renderTransactions(transactions) {
    transactionList.innerHTML = "";
    if (transactions.length === 0) {
      transactionList.innerHTML = `<tr><td colspan="4">Belum ada transaksi</td></tr>`;
      return;
    }

    transactions.forEach((t, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.title}</td>
        <td>${t.category}</td>
        <td class="${t.type}">${formatCurrency(t.amount)}</td>
        <td><button data-index="${index}" class="delete-btn">🗑</button></td>
      `;
      transactionList.appendChild(tr);
    });
  }

  function updateSummary() {
    const { balance, income, expense, totalTransactions } = transactionManager.getSummary();
    balanceEl.textContent = formatCurrency(balance);
    incomeEl.textContent = formatCurrency(income);
    expenseEl.textContent = formatCurrency(expense);
    totalTransactionsEl.textContent = totalTransactions;
  }

  function refreshUI() {
    const filtered = transactionManager.filterTransactions(searchInput.value);
    renderTransactions(filtered);
    updateSummary();
    chartManager.renderCharts(transactionManager.transactions);
  }

  addTransactionBtn.addEventListener("click", () => {
    transactionFormSection.classList.toggle("hidden");
  });

  transactionForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(transactionForm);
    const newTransaction = {
      title: data.get("title"),
      amount: parseFloat(data.get("amount")),
      category: data.get("category"),
      type: data.get("type"),
      date: new Date().toISOString()
    };
    transactionManager.addTransaction(newTransaction);
    transactionForm.reset();
    transactionFormSection.classList.add("hidden");
    refreshUI();
  });

  transactionList.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const index = e.target.dataset.index;
      transactionManager.deleteTransaction(index);
      refreshUI();
    }
  });

  searchInput.addEventListener("input", refreshUI);

  resetBtn.addEventListener("click", () => {
    passwordModal.classList.remove("hidden");
  });

  confirmResetBtn.addEventListener("click", () => {
    const password = resetPasswordInput.value;
    if (password === "hansohe") {
      transactionManager.resetTransactions();
      passwordModal.classList.add("hidden");
      resetPasswordInput.value = "";
      refreshUI();
    } else {
      alert("Password salah!");
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target === passwordModal) {
      passwordModal.classList.add("hidden");
    }
  });

  // Init UI
  refreshUI();
});
