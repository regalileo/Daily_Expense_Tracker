import { formatCurrency, formatDate } from './utils.js';
import ChartManager from './chartManager.js'; // menggunakan ChartManager untuk grafik

export default class ExpensePageManager {
  constructor(transactionManager, chartManagerInstance) {
    this.transactionManager = transactionManager;
    this.chartManager = chartManagerInstance; // Menerima instance ChartManager dari app.js

    this.expenseCategoryFilter = document.getElementById('expense-category-filter');
    this.expenseStartDate = document.getElementById('expense-start-date');
    this.expenseEndDate = document.getElementById('expense-end-date');
    this.applyExpenseFiltersBtn = document.getElementById('apply-expense-filters');
    this.filteredExpenseTotalEl = document.getElementById('filtered-expense-total');
    this.fullExpenseListEl = document.getElementById('full-expense-list');
    this.expenseCategoryPieChartCanvas = document.getElementById('expenseCategoryPieChart');

    this.addEventListeners();
  }

  addEventListeners() {
    if (this.applyExpenseFiltersBtn) {
      this.applyExpenseFiltersBtn.addEventListener('click', () => this.renderExpensesPage());
    }
    // Tambahkan event listener untuk perubahan filter secara langsung (opsional)
    if (this.expenseCategoryFilter) {
      this.expenseCategoryFilter.addEventListener('change', () => this.renderExpensesPage());
    }
    if (this.expenseStartDate) {
      this.expenseStartDate.addEventListener('change', () => this.renderExpensesPage());
    }
    if (this.expenseEndDate) {
      this.expenseEndDate.addEventListener('change', () => this.renderExpensesPage());
    }
  }

  // Metode utama untuk merender halaman Expenses
  async renderExpensesPage() {
    // Dapatkan semua transaksi
    const allTransactions = this.transactionManager.getTransactions();

    // Filter hanya pengeluaran
    let expenses = allTransactions.filter(t => t.type === 'expense');

    // Terapkan filter kategori
    const selectedCategory = this.expenseCategoryFilter ? this.expenseCategoryFilter.value : '';
    if (selectedCategory) {
      expenses = expenses.filter(t => t.category === selectedCategory);
    }

    // Terapkan filter tanggal
    const startDate = this.expenseStartDate ? this.expenseStartDate.value : '';
    const endDate = this.expenseEndDate ? this.expenseEndDate.value : '';

    if (startDate) {
      const startTimestamp = new Date(startDate).getTime();
      expenses = expenses.filter(t => new Date(t.id).getTime() >= startTimestamp);
    }
    if (endDate) {
      const endTimestamp = new Date(endDate).getTime();
      // Tambahkan 23:59:59 untuk mencakup seluruh hari akhir
      expenses = expenses.filter(t => new Date(t.id).getTime() <= endTimestamp + (24 * 60 * 60 * 1000 - 1));
    }

    // Urutkan pengeluaran berdasarkan tanggal (terbaru ke terlama)
    expenses.sort((a, b) => b.id - a.id);

    // Perbarui total pengeluaran yang difilter
    const totalFilteredExpense = expenses.reduce((sum, t) => sum + parseInt(t.amount), 0);
    if (this.filteredExpenseTotalEl) {
      this.filteredExpenseTotalEl.textContent = formatCurrency(totalFilteredExpense);
    }

    // Render daftar pengeluaran ke tabel
    this.renderExpenseList(expenses);

    // Render grafik pengeluaran per kategori
    this.renderExpenseCharts(expenses);
  }

  renderExpenseList(expenses) {
    if (!this.fullExpenseListEl) return;

    this.fullExpenseListEl.innerHTML = ''; // Kosongkan daftar sebelumnya

    if (expenses.length === 0) {
      this.fullExpenseListEl.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada pengeluaran yang difilter</td></tr>';
      return;
    }

    expenses.forEach(t => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatDate(t.id)}</td>
        <td>${t.title}</td>
        <td>${t.category}</td>
        <td>${formatCurrency(t.amount)}</td>
        <td>
          <button class="btn btn-sm btn-danger" data-id="${t.id}">Hapus</button>
        </td>
      `;
      this.fullExpenseListEl.appendChild(row);
    });

    // Tambahkan event listener untuk tombol hapus pada daftar pengeluaran lengkap
    this.fullExpenseListEl.querySelectorAll('button[data-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await this.transactionManager.deleteTransaction(btn.dataset.id);
        await this.transactionManager.loadTransactions(); // Muat ulang data dari Supabase
        this.renderExpensesPage(); // Render ulang halaman expenses
  
        const customEvent = new CustomEvent('transactionUpdated');
        document.dispatchEvent(customEvent);
      });
    });
  }

  renderExpenseCharts(expenses) {
    // Hitung data pengeluaran per kategori dari daftar yang difilter
    const categoryData = {};
    expenses.forEach(t => {
      if (!categoryData[t.category]) categoryData[t.category] = 0;
      categoryData[t.category] += parseInt(t.amount);
    });

    // Render pie chart khusus pengeluaran per kategori
    if (this.expenseCategoryPieChartCanvas && this.chartManager) {
      this.chartManager.renderPieChart(categoryData, 'expenseCategoryPieChart', 'Distribusi Pengeluaran per Kategori');
    }
  }
}
