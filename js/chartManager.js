import { formatRupiah } from './utils.js';

export default class ChartManager {
  constructor(ctxBar, ctxPie) {
    this.ctxBar = ctxBar;
    this.ctxPie = ctxPie;
    this.barChart = null;
    this.pieChart = null;
  }

  renderBarChart(dataByCategory) {
    const labels = Object.keys(dataByCategory);
    const data = Object.values(dataByCategory);

    if (this.barChart) this.barChart.destroy();

    this.barChart = new Chart(this.ctxBar, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Pengeluaran/Kategori',
          data,
          backgroundColor: this._generateColors(labels.length),
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: context => formatRupiah(context.parsed.y)
            }
          }
        },
        scales: {
          y: {
            ticks: {
              callback: value => formatRupiah(value)
            }
          }
        }
      }
    });
  }

  renderPieChart(dataByCategory) {
    const labels = Object.keys(dataByCategory);
    const data = Object.values(dataByCategory);

    if (this.pieChart) this.pieChart.destroy();

    this.pieChart = new Chart(this.ctxPie, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          label: 'Distribusi Pengeluaran',
          data,
          backgroundColor: this._generateColors(labels.length),
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ccc',
              font: { size: 14 }
            }
          },
          tooltip: {
            callbacks: {
              label: context => `${context.label}: ${formatRupiah(context.parsed)}`
            }
          }
        }
      }
    });
  }

  _generateColors(count) {
    const baseColors = [
      '#00b894', '#6c5ce7', '#fd79a8', '#e17055', '#fab1a0',
      '#0984e3', '#ffeaa7', '#d63031', '#55efc4', '#a29bfe'
    ];
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(baseColors[i % baseColors.length]);
    }
    return result;
  }
}
