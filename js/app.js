import TransactionManager from './js/transactionManager.js';
import ChartManager from './js/chartManager.js';
import { formatRupiah } from './js/utils.js';

const transactionManager = new TransactionManager();
const chartManager = new ChartManager(
  document.getElementById('barChart'),
  document.getElementById('pieChart')
);

document.addEventListener('DOMContentLoaded', () => {
  renderTransactions();
  updateSummary();
  updateCharts();

  document.getElementById('form-transaction').addEventListener('submit', e => {
    e.preventDefault();
    const form = e.target;
    const newTransaction = {
      title: form.title.value,
      amount: parseInt(form.amount.value),
      category: form.category.value,
      type: form.type.value
    };
    transactionManager.addTransaction(newTransaction);
    form.reset();
    renderTransactions();
    updateSummary();
    updateCharts();
  });

  document.getElementById('search').addEventListener('input', e => {
    const keyword = e.target.value;
    renderTransactions(keyword);
  });

  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Apakah yakin ingin mereset semua transaksi?')) {
      transactionManager.resetAll();
      renderTransactions();
      updateSummary();
      updateCharts();
    }
  });
});

function renderTransactions(keyword = '') {
  const list = document.getElementById('transaction-list');
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
  document.getElementById('income').textContent = formatRupiah(income);
  document.getElementById('expense').textContent = formatRupiah(expense);
  document.getElementById('balance').textContent = formatRupiah(balance);
}

function updateCharts() {
  const data = transactionManager.getDataGroupedByCategory();
  chartManager.renderBarChart(data);
  chartManager.renderPieChart(data);
}

// Navigasi Sidebar
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

    document.getElementById(targetId).classList.remove('hidden');
    link.classList.add('active');
  });
});

document.getElementById('add-transaction-btn').addEventListener('click', () => {
  const formSection = document.getElementById('form-section');
  formSection.classList.toggle('hidden');
});
