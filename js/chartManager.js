import { transactionManager } from './transactionManager.js';

let barChart = null;

export function updateCharts() {
  const monthlyData = transactionManager.getMonthlySummary();

  const labels = Object.keys(monthlyData).sort(); // contoh: ['2025-06', '2025-07']
  const incomeData = labels.map(month => monthlyData[month].income);
  const expenseData = labels.map(month => monthlyData[month].expense);

  const ctx = document.getElementById('barChart').getContext('2d');

  if (barChart) {
    barChart.destroy();
  }

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.map(label => convertToMonthName(label)), // '2025-07' -> 'Juli 2025'
      datasets: [
        {
          label: 'Pemasukan',
          data: incomeData,
          backgroundColor: 'rgba(54, 162, 235, 0.7)'
        },
        {
          label: 'Pengeluaran',
          data: expenseData,
          backgroundColor: 'rgba(255, 99, 132, 0.7)'
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Perbandingan Bulanan Pemasukan & Pengeluaran'
        },
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return 'Rp' + value.toLocaleString('id-ID');
            }
          }
        }
      }
    }
  });
}

// Fungsi bantu untuk ubah '2025-07' → 'Juli 2025'
function convertToMonthName(key) {
  const [year, month] = key.split('-');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}
