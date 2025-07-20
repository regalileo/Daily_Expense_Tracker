export default class ChartManager {
  constructor(barChartEl) {
    this.barChartEl = barChartEl;
    this.barChart = null;
  }

  renderBarChart(monthlyData) {
    const labels = Object.keys(monthlyData).sort(); // ['2025-06', '2025-07']
    const incomeData = labels.map(month => monthlyData[month].income);
    const expenseData = labels.map(month => monthlyData[month].expense);

    const ctx = this.barChartEl.getContext('2d');

    if (this.barChart) this.barChart.destroy();

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(label => this.convertToMonthName(label)),
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
            text: 'Perbandingan Bulanan Pemasukan vs Pengeluaran'
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

  convertToMonthName(key) {
    const [year, month] = key.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
}
