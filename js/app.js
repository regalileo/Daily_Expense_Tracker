import TransactionManager from './transactionManager.js';
import ChartManager from './chartManager.js';
import ExpensePageManager from './expensePageManager.js';
import { formatCurrency, downloadJSON, readJSONFile } from './utils.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://qfefytzsknodsqbvfwxt.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZWZ5dHpza25vZHNxYnZmd3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjM0MjUsImV4cCI6MjA2ODU5OTQyNX0.Uasy9CgDOlmTrHf2LunrJIFM_bCr7gnDYplbkD-dexA'; 

let supabase;
let transactionManager;
let chartManager;
let expensePageManager;
let currentUserId = null;

// Referensi elemen UI otentikasi
const loginPage = document.getElementById('login-page');
const homePage = document.getElementById('home');
const logoutBtn = document.getElementById('logout-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const authMessage = document.getElementById('auth-message');
const usernameEl = document.getElementById('profile-username'); // Menggunakan ID baru

document.addEventListener('DOMContentLoaded', async () => {
  // Inisialisasi Supabase Client HANYA DI SINI
  try {
    const urlToUse = SUPABASE_URL.trim();
    const keyToUse = SUPABASE_ANON_KEY.trim();

    console.log('Final URL being passed to createClient:', urlToUse);
    console.log('Final Key being passed to createClient:', keyToUse);
    console.log('Type of URL:', typeof urlToUse);
    console.log('Type of Key:', typeof keyToUse);

    supabase = createClient(urlToUse, keyToUse);
  } catch (initError) {
    console.error("Error initializing Supabase client:", initError);
    if (authMessage) {
        authMessage.textContent = "Error inisialisasi aplikasi. Pastikan URL Supabase benar.";
        loginPage.classList.remove('hidden');
        homePage.classList.add('hidden');
    }
    return;
  }

  // Event listener untuk perubahan status otentikasi
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    handleAuthChange(session);
  });

  // Cek status otentikasi awal
  const { data: { session } } = await supabase.auth.getSession();
  handleAuthChange(session);


  // Inisialisasi ChartManager
  chartManager = new ChartManager();

  // Event listener untuk form penambahan transaksi (hanya aktif setelah login)
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
      form.reset();
      await transactionManager.loadTransactions();
      await renderTransactions();
      await updateSummary();
      await updateCharts();
      if (!document.getElementById('expenses').classList.contains('hidden')) {
        expensePageManager.renderExpensesPage();
      }
    });
  }

  // Event listener untuk input pencarian (hanya aktif setelah login)
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', async e => {
      const keyword = e.target.value;
      await renderTransactions(keyword);
    });
  }

  // Event listener untuk tombol reset (hanya aktif setelah login)
  const resetBtn = document.getElementById('reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      showPasswordModal();
    });
  }

  // Event listener untuk tombol backup (export) (hanya aktif setelah login)
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const allTransactions = transactionManager.getTransactions();
      downloadJSON(allTransactions, 'expense_backup.json');
    });
  }

  // Event listener untuk tombol restore (import) (hanya aktif setelah login)
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
            if (!document.getElementById('expenses').classList.contains('hidden')) {
              expensePageManager.renderExpensesPage();
            }
            console.log("Data berhasil dimuat dari file. Untuk sinkronisasi ke Supabase, perlu implementasi lebih lanjut.");
          });
        }
      };
      fileInput.click();
    });
  }

  // Event listener untuk navigasi sidebar (hanya aktif setelah login)
  document.querySelectorAll('.menu-link').forEach(link => {
    link.addEventListener('click', async e => {
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

      if (targetId === 'expenses') {
        await transactionManager.loadTransactions();
        expensePageManager.renderExpensesPage();
      }
      if (targetId === 'home') {
        await transactionManager.loadTransactions();
        await renderTransactions();
        await updateSummary();
        await updateCharts();
      }
    });
  });

  // Event listener untuk tombol "New Transaction" (toggle form) (hanya aktif setelah login)
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
          if (!document.getElementById('expenses').classList.contains('hidden')) {
            expensePageManager.renderExpensesPage();
          }
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

  // Event listener global untuk memicu pembaruan UI setelah operasi CRUD dari halaman Expenses
  document.addEventListener('transactionUpdated', async () => {
    await transactionManager.loadTransactions();
    await renderTransactions();
    await updateSummary();
    await updateCharts();
  });

  // --- Logika Otentikasi ---
  // Tampilkan/sembunyikan form register
  if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      authMessage.textContent = '';
    });
  }

  if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      registerForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      authMessage.textContent = '';
    });
  }

  // Handle Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm['login-email'].value;
      const password = loginForm['login-password'].value;
      authMessage.textContent = 'Memproses...';

      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // handleAuthChange akan dipanggil oleh onAuthStateChange listener
      } catch (error) {
        authMessage.textContent = `Login Gagal: ${error.message}`;
        console.error('Login error:', error.message);
      }
    });
  }

  // Handle Register Form Submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = registerForm['register-email'].value;
      const password = registerForm['register-password'].value;
      authMessage.textContent = 'Mendaftar...';

      try {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        authMessage.textContent = 'Pendaftaran berhasil! Silakan masuk.';
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        loginForm['login-email'].value = email; // Isi email di form login
        loginForm['login-password'].focus();
      } catch (error) {
        authMessage.textContent = `Pendaftaran Gagal: ${error.message}`;
        console.error('Register error:', error.message);
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        // handleAuthChange akan dipanggil oleh onAuthStateChange listener
      } catch (error) {
        console.error('Logout error:', error.message);
      }
    });
  }

  // Fungsi untuk menangani perubahan status otentikasi
  async function handleAuthChange(session) {
    if (session) {
      // Pengguna sudah login
      currentUserId = session.user.id;
      console.log('User logged in:', currentUserId);

      // Inisialisasi TransactionManager dan ExpensePageManager hanya setelah login
      if (!transactionManager) {
        transactionManager = new TransactionManager(supabase, currentUserId);
      } else {
        transactionManager.userId = currentUserId;
      }
      if (!expensePageManager) {
        expensePageManager = new ExpensePageManager(transactionManager, chartManager);
      }

      // Sembunyikan halaman login, tampilkan halaman utama
      if (loginPage) loginPage.classList.add('hidden');
      if (homePage) homePage.classList.remove('hidden');
      if (logoutBtn) logoutBtn.classList.remove('hidden');
      if (usernameEl && session.user.email) {
        usernameEl.textContent = session.user.email; // Tampilkan email user
      } else {
        usernameEl.textContent = 'User'; // Default jika email tidak tersedia
      }


      // Muat data dan perbarui UI
      await transactionManager.loadTransactions();
      await renderTransactions();
      await updateSummary();
      await updateCharts();
      if (!document.getElementById('expenses').classList.contains('hidden')) {
        expensePageManager.renderExpensesPage();
      }

    } else {
      // Pengguna belum login atau logout
      currentUserId = null;
      console.log('User logged out or not authenticated.');

      // Sembunyikan halaman utama, tampilkan halaman login
      if (loginPage) loginPage.classList.remove('hidden');
      if (homePage) homePage.classList.add('hidden');
      if (logoutBtn) logoutBtn.classList.add('hidden');
      if (usernameEl) usernameEl.textContent = 'Guest'; // Set nama user ke Guest

      // Kosongkan data dan UI jika tidak login
      if (transactionManager) {
        transactionManager.transactions = [];
      }
      await renderTransactions();
      await updateSummary();
      await updateCharts();
    }
  }
});

// Fungsi untuk merender daftar transaksi (Home Page)
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
      if (!document.getElementById('expenses').classList.contains('hidden')) {
        expensePageManager.renderExpensesPage();
      }
    });
  });
}

// Fungsi untuk memperbarui ringkasan (Home Page)
async function updateSummary() {
  const { income, expense, balance } = transactionManager.getSummary();
  const incomeEl = document.getElementById('income');
  const expenseEl = document.getElementById('expense');
  const balanceEl = document.getElementById('balance');

  if (incomeEl) incomeEl.textContent = formatCurrency(income);
  if (expenseEl) expenseEl.textContent = formatCurrency(expense);
  if (balanceEl) balanceEl.textContent = formatCurrency(balance);
}

// Fungsi untuk memperbarui semua grafik (Home Page)
async function updateCharts() {
  const monthlyData = transactionManager.getMonthlySummary();
  chartManager.renderBarChart(monthlyData);

  const categoryData = transactionManager.getDataGroupedByCategory();
  chartManager.renderPieChart(categoryData, 'pieChart', 'Expenses by Category');

  chartManager.renderYearlyChart(monthlyData);
}
