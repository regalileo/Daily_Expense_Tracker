import TransactionManager from './transactionManager.js';
import ChartManager from './chartManager.js';
import { formatRupiah } from './utils.js';

const transactionManager = new TransactionManager();
let chartManager;

document.addEventListener('DOMContentLoaded', () => {
  chartManager = new ChartManager(document.getElementById('barChart'));

  renderTransactions();
  updateSummary();
  updateCharts();

  const form = document.getElementById('transaction-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const title = form.title.value.trim();
      const amount = parseInt(form.amount.value);
      const category = form.category.value;
      const type = form.type.value;

      if (!title || isNaN(amount) || !category || !type) {
        alert("Harap isi semua kolom dengan benar!");
        return;
      }

      const newTransaction = { title, amount, category, type };
      transactionManager.addTransaction(newTransaction);
      form.reset();
      renderTransactions();
      updateSummary();
      updateCharts();
    });
  }

  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const keyword = e.target.value;
      renderTransactions(keyword);
    });
  }

 const resetBtn = document.getElementById('reset');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    const password = prompt("Masukkan password untuk mereset data:");
    if (password === "hansohe") {
      if (confirm('Apakah yakin ingin mereset semua transaksi?')) {
        transactionManager.resetAll();
        renderTransactions();
        updateSummary();
        updateCharts();
      }
    } else {
      alert("Password salah. Reset dibatalkan.");
    }
  });
}


  document.querySelectorAll('.menu-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetId = link.dataset.target;

      document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
      });

      document.querySelectorAll('.menu-link').forEach(link => {
        link.classList.remove('active');
      });

      const targetPage = document.getElementById(targetId);
      if (targetPage) {
        targetPage.classList.remove('hidden');
      }

      link.classList.add('active');
    });
  });

  const addTransactionBtn = document.getElementById('add-transaction-btn');
  const formSection = document.getElementById('form-section');
  if (addTransactionBtn && formSection) {
    addTransactionBtn.addEventListener('click', () => {
      formSection.classList.toggle('hidden');
    });
  }
});

function renderTransactions(keyword = '') {
  const list = document.getElementById('transaction-list');
  if (!list) return;

  list.innerHTML = '';

  const transactions = keyword
    ? transactionManager.search(keyword)
    : transactionManager.getTransactions();

  if (transactions.length === 0) {
    list.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada transaksi</td></tr>';
    return;
  }

  transactions.forEach(t => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${t.title}</td>
      <td>${t.category}</td>
      <td>${t.type === 'income' ? '+' : '-'}${formatRupiah(t.amount)}</td>
      <td>
        <button class="btn btn-sm btn-danger" data-id="${t.id}">Hapus</button>
      </td>
    `;
    list.appendChild(row);
  });

  document.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      transactionManager.deleteTransaction(btn.dataset.id);
      renderTransactions(keyword);
      updateSummary();
      updateCharts();
    });
  });
}

function updateSummary() {
  const { income, expense, balance } = transactionManager.getSummary();
  const incomeEl = document.getElementById('income');
  const expenseEl = document.getElementById('expense');
  const balanceEl = document.getElementById('balance');

  if (incomeEl) incomeEl.textContent = formatRupiah(income);
  if (expenseEl) expenseEl.textContent = formatRupiah(expense);
  if (balanceEl) balanceEl.textContent = formatRupiah(balance);
}

function updateCharts() {
  const monthlyData = transactionManager.getMonthlySummary();
  chartManager.renderBarChart(monthlyData);
}
