import TransactionManager from './transactionManager.js';
import ChartManager from './chartManager.js';
import { formatCurrency, downloadJSON, readJSONFile } from './utils.js'; // Import downloadJSON dan readJSONFile

const transactionManager = new TransactionManager();
let chartManager;

document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi ChartManager
  chartManager = new ChartManager(); // Tidak perlu parameter di sini karena chartManager akan mencari elemen canvas sendiri

  // Render awal transaksi, ringkasan, dan grafik
  renderTransactions();
  updateSummary();
  updateCharts();

  // Event listener untuk form penambahan transaksi
  const form = document.getElementById('transaction-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const title = form.title.value.trim();
      const amount = parseInt(form.amount.value);
      const category = form.category.value;
      const type = form.type.value;

      if (!title || isNaN(amount) || !category || !type) {
        // Mengganti alert dengan modal kustom atau pesan di UI
        console.error("Harap isi semua kolom dengan benar!");
        // Anda bisa menambahkan logika untuk menampilkan pesan error di UI di sini
        return;
      }

      const newTransaction = { title, amount, category, type };
      transactionManager.addTransaction(newTransaction);
      form.reset(); // Mereset form setelah submit
      renderTransactions(); // Memperbarui daftar transaksi
      updateSummary(); // Memperbarui ringkasan
      updateCharts(); // Memperbarui grafik
    });
  }

  // Event listener untuk input pencarian
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      const keyword = e.target.value;
      renderTransactions(keyword); // Memperbarui daftar transaksi berdasarkan kata kunci
    });
  }

  // Event listener untuk tombol reset
  const resetBtn = document.getElementById('reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Menggunakan modal kustom untuk password reset
      showPasswordModal();
    });
  }

  // Event listener untuk tombol backup (export)
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const allTransactions = transactionManager.getTransactions();
      downloadJSON(allTransactions, 'expense_backup.json'); // Memanggil fungsi downloadJSON dari utils.js
    });
  }

  // Event listener untuk tombol restore (import)
  const importBtn = document.getElementById('import-btn');
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      // Membuat input file secara dinamis
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'application/json'; // Hanya menerima file JSON
      fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          readJSONFile(file, (importedData) => {
            // Mengganti data transaksi yang ada dengan data yang diimpor
            transactionManager.transactions = importedData;
            transactionManager.save(); // Menyimpan data yang diimpor ke localStorage
            renderTransactions(); // Memperbarui daftar transaksi
            updateSummary(); // Memperbarui ringkasan
            updateCharts(); // Memperbarui grafik
            // Anda bisa menambahkan pesan sukses di UI di sini
            console.log("Data berhasil diimpor!");
          });
        }
      };
      fileInput.click(); // Memicu klik pada input file tersembunyi
    });
  }


  // Event listener untuk navigasi sidebar
  document.querySelectorAll('.menu-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetId = link.dataset.target;

      // Sembunyikan semua halaman
      document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
      });

      // Hapus kelas 'active' dari semua link menu
      document.querySelectorAll('.menu-link').forEach(link => {
        link.classList.remove('active');
      });

      // Tampilkan halaman target
      const targetPage = document.getElementById(targetId);
      if (targetPage) {
        targetPage.classList.remove('hidden');
      }

      // Tambahkan kelas 'active' ke link yang diklik
      link.classList.add('active');
    });
  });

  // Event listener untuk tombol "New Transaction" (toggle form)
  const addTransactionBtn = document.getElementById('add-transaction-btn');
  const formSection = document.getElementById('form-section');
  if (addTransactionBtn && formSection) {
    addTransactionBtn.addEventListener('click', () => {
      formSection.classList.toggle('hidden'); // Toggle visibilitas form
    });
  }

  // Logika modal password reset
  const passwordModal = document.getElementById('password-modal');
  const resetPasswordInput = document.getElementById('reset-password');
  const confirmResetBtn = document.getElementById('confirm-reset');

  function showPasswordModal() {
    if (passwordModal) {
      passwordModal.classList.remove('hidden');
      resetPasswordInput.value = ''; // Kosongkan input password
      resetPasswordInput.focus(); // Fokuskan input
    }
  }

  function hidePasswordModal() {
    if (passwordModal) {
      passwordModal.classList.add('hidden');
    }
  }

  if (confirmResetBtn) {
    confirmResetBtn.addEventListener('click', () => {
      const password = resetPasswordInput.value;
      if (password === "hansohe") { // Password hardcoded
        // Mengganti confirm dengan modal kustom jika diperlukan, atau langsung reset
        if (confirm('Apakah yakin ingin mereset semua transaksi?')) { // Menggunakan confirm bawaan browser untuk contoh
          transactionManager.resetAll();
          renderTransactions();
          updateSummary();
          updateCharts();
          hidePasswordModal();
          console.log("Data berhasil direset!");
        } else {
          hidePasswordModal();
        }
      } else {
        console.error("Password salah. Reset dibatalkan.");
        // Anda bisa menambahkan pesan error di UI di sini
        hidePasswordModal();
      }
    });
  }

  // Tambahkan event listener untuk menutup modal jika mengklik di luar konten modal
  if (passwordModal) {
    passwordModal.addEventListener('click', (e) => {
      if (e.target === passwordModal) {
        hidePasswordModal();
      }
    });
  }
});

// Fungsi untuk merender daftar transaksi
function renderTransactions(keyword = '') {
  const list = document.getElementById('transaction-list');
  if (!list) return;

  list.innerHTML = ''; // Kosongkan daftar transaksi sebelumnya

  // Dapatkan transaksi berdasarkan kata kunci pencarian
  const transactions = keyword
    ? transactionManager.search(keyword)
    : transactionManager.getTransactions();

  // Perbarui total transaksi di dashboard
  const totalTransactionsEl = document.getElementById('total-transactions');
  if (totalTransactionsEl) totalTransactionsEl.textContent = transactions.length;


  if (transactions.length === 0) {
    list.innerHTML = '<tr><td colspan="4" class="text-center">Belum ada transaksi</td></tr>'; // Ubah colspan menjadi 4
    return;
  }

  // Render setiap transaksi ke dalam tabel
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

  // Tambahkan event listener untuk tombol hapus pada setiap transaksi
  document.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      transactionManager.deleteTransaction(btn.dataset.id); // Hapus transaksi
      renderTransactions(keyword); // Perbarui daftar transaksi
      updateSummary(); // Perbarui ringkasan
      updateCharts(); // Perbarui grafik
    });
  });
}

// Fungsi untuk memperbarui ringkasan (income, expense, balance)
function updateSummary() {
  const { income, expense, balance } = transactionManager.getSummary();
  const incomeEl = document.getElementById('income');
  const expenseEl = document.getElementById('expense');
  const balanceEl = document.getElementById('balance');

  if (incomeEl) incomeEl.textContent = formatCurrency(income);
  if (expenseEl) expenseEl.textContent = formatCurrency(expense);
  if (balanceEl) balanceEl.textContent = formatCurrency(balance);
}

// Fungsi untuk memperbarui semua grafik
function updateCharts() {
  const monthlyData = transactionManager.getMonthlySummary();
  chartManager.renderBarChart(monthlyData);

  // Perbarui pie chart (pengeluaran berdasarkan kategori)
  const categoryData = transactionManager.getDataGroupedByCategory();
  chartManager.renderPieChart(categoryData);

  // Perbarui yearly chart
  chartManager.renderYearlyChart(monthlyData); // Menggunakan data bulanan yang sama untuk yearly chart
}
