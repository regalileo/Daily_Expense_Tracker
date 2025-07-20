import TransactionManager from './transactionManager.js';
import ChartManager from './chartManager.js';
import { formatCurrency, downloadJSON, readJSONFile } from './utils.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://qfefytzsknodsqbvfwxt.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZWZ5dHpza25vZHNxYnZmd3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjM0MjUsImV4cCI6MjA2ODU5OTQyNX0.Uasy9CgDOlmTrHf2LunrJIFM_bCr7gnDYplbkD-dexA'; 

let supabase;
let transactionManager;
let chartManager;
let currentUserId = null; // Untuk menyimpan ID pengguna yang sedang login

document.addEventListener('DOMContentLoaded', async () => {
  // --- DEBUGGING SUPABASE INITIALIZATION ---
  console.log('Debugging Supabase Client Initialization:');
  console.log('SUPABASE_URL value:', SUPABASE_URL);
  console.log('SUPABASE_URL type:', typeof SUPABASE_URL);
  console.log('SUPABASE_ANON_KEY value:', SUPABASE_ANON_KEY);
  console.log('SUPABASE_ANON_KEY type:', typeof SUPABASE_ANON_KEY);
  // --- END DEBUGGING ---

  // Inisialisasi Supabase Client HANYA DI SINI
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (initError) {
    console.error("Error initializing Supabase client:", initError);
    // Jika inisialisasi gagal di sini, hentikan eksekusi lebih lanjut
    return;
  }


  // Otentikasi Anonim (untuk contoh sederhana)
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Error signing in anonymously:", error.message);
      return;
    }
    currentUserId = data.user.id;
    console.log("Signed in anonymously with user ID:", currentUserId);
  } catch (err) {
    console.error("Failed to sign in anonymously:", err.message);
    return;
  }

  // Inisialisasi TransactionManager dengan instance Supabase yang sudah ada dan user ID
  transactionManager = new TransactionManager(supabase, currentUserId);

  // Inisialisasi ChartManager
  chartManager = new ChartManager();

  // Muat transaksi dari Supabase dan perbarui UI
  await transactionManager.loadTransactions();
  await renderTransactions();
  await updateSummary();
  await updateCharts();

  // Event listener untuk form penambahan transaksi
  const form = document.getElementById('transaction-form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const title = form.title.value.trim();
      const amount = parseInt(form.amount.value);
      const category = form.category.value;
      const type = form.type.value;

      if (!title || isNaN(amount) || !category || !type) {
        console.error("Harap isi semua kolom dengan benar!");
        return;
      }

      const newTransaction = { title, amount, category, type };
      await transactionManager.addTransaction(newTransaction);
      await transactionManager.loadTransactions();
      await renderTransactions();
      await updateSummary();
      await updateCharts();
    });
  }

  // Event listener untuk input pencarian
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', async e => {
      const keyword = e.target.value;
      await renderTransactions(keyword);
    });
  }

  // Event listener untuk tombol reset
  const resetBtn = document.getElementById('reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      showPasswordModal();
    });
  }

  // Event listener untuk tombol backup (export)
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const allTransactions = transactionManager.getTransactions();
      downloadJSON(allTransactions, 'expense_backup.json');
    });
  }

  // Event listener untuk tombol restore (import)
  const importBtn = document.getElementById('import-btn');
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'application/json';
      fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
          readJSONFile(file, async (importedData) => {
            console.warn("Fungsi 'Restore' saat ini hanya memuat data ke memori lokal. Untuk sinkronisasi ke Supabase, diperlukan implementasi lebih lanjut.");

            transactionManager.transactions = importedData;

            await renderTransactions();
            await updateSummary();
            await updateCharts();
            console.log("Data berhasil dimuat dari file. Untuk sinkronisasi ke Supabase, perlu implementasi lebih lanjut.");
          });
        }
      };
      fileInput.click();
    });
  }

  // Event listener untuk navigasi sidebar
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

  // Event listener untuk tombol "New Transaction" (toggle form)
  const addTransactionBtn = document.getElementById('add-transaction-btn');
  const formSection = document.getElementById('form-section');
  if (addTransactionBtn && formSection) {
    addTransactionBtn.addEventListener('click', () => {
      formSection.classList.toggle('hidden');
    });
  }

  // Logika modal password reset
  const passwordModal = document.getElementById('password-modal');
  const resetPasswordInput = document.getElementById('reset-password');
  const confirmResetBtn = document.getElementById('confirm-reset');

  function showPasswordModal() {
    if (passwordModal) {
      passwordModal.classList.remove('hidden');
      resetPasswordInput.value = '';
      resetPasswordInput.focus();
    }
  }

  function hidePasswordModal() {
    if (passwordModal) {
      passwordModal.classList.add('hidden');
    }
  }

  if (confirmResetBtn) {
    confirmResetBtn.addEventListener('click', async () => {
      const password = resetPasswordInput.value;
      if (password === "hansohe") {
        if (confirm('Apakah yakin ingin mereset semua transaksi?')) {
          await transactionManager.resetAll();
          await transactionManager.loadTransactions();
          await renderTransactions();
          await updateSummary();
          await updateCharts();
          hidePasswordModal();
          console.log("Data berhasil direset!");
        } else {
          hidePasswordModal();
        }
      } else {
        console.error("Password salah. Reset dibatalkan.");
        hidePasswordModal();
      }
    });
  }

  if (passwordModal) {
    passwordModal.addEventListener('click', (e) => {
      if (e.target === passwordModal) {
        hidePasswordModal();
      }
    });
  }
});

// Fungsi untuk merender daftar transaksi
async function renderTransactions(keyword = '') {
  const list = document.getElementById('transaction-list');
  if (!list) return;

  list.innerHTML = '';

  const transactions = keyword
    ? transactionManager.search(keyword)
    : transactionManager.getTransactions();

  const totalTransactionsEl = document.getElementById('total-transactions');
  if (totalTransactionsEl) totalTransactionsEl.textContent = transactions.length;

  if (transactions.length === 0) {
    list.innerHTML = '<tr><td colspan="4" class="text-center">Belum ada transaksi</td></tr>';
    return;
  }

  transactions.forEach(t => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${t.title}</td>
      <td>${t.category}</td>
      <td>${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
      <td>
        <button class="btn btn-sm btn-danger" data-id="${t.id}">Hapus</button>
      </td>
    `;
    list.appendChild(row);
  });

  document.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await transactionManager.deleteTransaction(btn.dataset.id);
      await transactionManager.loadTransactions();
      await renderTransactions(keyword);
      await updateSummary();
      await updateCharts();
    });
  });
}

// Fungsi untuk memperbarui ringkasan (income, expense, balance)
async function updateSummary() {
  const { income, expense, balance } = transactionManager.getSummary();
  const incomeEl = document.getElementById('income');
  const expenseEl = document.getElementById('expense');
  const balanceEl = document.getElementById('balance');

  if (incomeEl) incomeEl.textContent = formatCurrency(income);
  if (expenseEl) expenseEl.textContent = formatCurrency(expense);
  if (balanceEl) balanceEl.textContent = formatCurrency(balance);
}

// Fungsi untuk memperbarui semua grafik
async function updateCharts() {
  const monthlyData = transactionManager.getMonthlySummary();
  chartManager.renderBarChart(monthlyData);

  const categoryData = transactionManager.getDataGroupedByCategory();
  chartManager.renderPieChart(categoryData);

  chartManager.renderYearlyChart(monthlyData);
}
