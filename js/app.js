// app.js

import TransactionManager from './transactionManager.js';
import ChartManager from './chartManager.js';
import { formatCurrency, formatDate } from './utils.js';

const transactionManager = new TransactionManager();
const chartManager = new ChartManager();

const form = document.getElementById('transactionForm');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const typeInput = document.getElementById('type');
const transactionList = document.getElementById('transactionList');
const balanceDisplay = document.getElementById('balance');
const recentUpdates = document.getElementById('recentUpdates');
const resetButton = document.getElementById('resetBtn');

function updateUI() {
  const transactions = transactionManager.getTransactions();
  const balance = transactionManager.getBalance();
  const monthlyData = transactionManager.getMonthlyData();
  const categoryData = transactionManager.getCategoryData();
  const yearlyData = transactionManager.getYearlyData();

  // Tampilkan saldo
  balanceDisplay.textContent = formatCurrency(balance);

  // Tampilkan 10 transaksi terakhir di recentUpdates
  if (recentUpdates) {
    recentUpdates.innerHTML = '';
    const recent = transactions.slice(-10).reverse();
    recent.forEach(tx => {
      const item = document.createElement('li');
      item.textContent = `${formatDate(tx.date)} - ${tx.description} (${tx.category}): ${formatCurrency(tx.amount)}`;
      recentUpdates.appendChild(item);
    });
  }

  // Tampilkan grafik
  chartManager.renderBarChart(monthlyData); // Reset tiap bulan
  chartManager.renderYearlyChart(yearlyData); // Rekap bulanan selama 1 tahun
  chartManager.renderPieChart(categoryData);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const description = descriptionInput.value;
  const amount = parseFloat(amountInput.value);
  const category = categoryInput.value;
  const type = typeInput.value;

  if (description && !isNaN(amount) && category && type) {
    transactionManager.addTransaction({
      description,
      amount: type === 'expense' ? -amount : amount,
      category,
      date: new Date().toISOString()
    });
    form.reset();
    updateUI();
  }
});

resetButton.addEventListener('click', () => {
  const password = prompt('Masukkan password untuk mereset data:');
  if (password === 'hansohe') {
    transactionManager.resetTransactions();
    updateUI();
    alert('Data berhasil direset.');
  } else {
    alert('Password salah!');
  }
});

document.addEventListener('DOMContentLoaded', updateUI);
