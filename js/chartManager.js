export default class ChartManager {
  constructor() {
    this.barChart = null;
    this.pieChart = null;
    this.yearlyChart = null;
  }

  renderBarChart(data) {
    const ctx = document.getElementById('barChart').getContext('2d');
    if (this.barChart) this.barChart.destroy();

    const months = Object.keys(data).slice(-1); // Hanya bulan ini
    const incomes = months.map(month => data[month].income || 0);
    const expenses = months.map(month => data[month].expense || 0);
    const balances = months.map((month, i) => (incomes[i] - expenses[i]));

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Income',
            data: incomes,
            backgroundColor: '#4caf50'
          },
          {
            label: 'Expense',
            data: expenses,
            backgroundColor: '#f44336'
          },
          {
            label: 'Balance',
            data: balances,
            backgroundColor: '#2196f3'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'This Month: Income, Expense, and Balance'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  renderYearlyChart(data) {
    const ctx = document.getElementById('yearlyChart').getContext('2d');
    if (this.yearlyChart) this.yearlyChart.destroy();

    const months = Object.keys(data).slice(-12); // 12 bulan terakhir
    const incomes = months.map(month => data[month].income || 0);
    const expenses = months.map(month => data[month].expense || 0);
    const balances = months.map((month, i) => (incomes[i] - expenses[i]));

    this.yearlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Income',
            data: incomes,
            backgroundColor: '#4caf50'
          },
          {
            label: 'Expense',
            data: expenses,
            backgroundColor: '#f44336'
          },
          {
            label: 'Balance',
            data: balances,
            backgroundColor: '#2196f3'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Yearly Recap: Income, Expense, and Balance'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  renderPieChart(data) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    if (this.pieChart) this.pieChart.destroy();

    const categories = Object.keys(data);
    const values = categories.map(cat => data[cat]);

    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: categories,
        datasets: [
          {
            label: 'Category Breakdown',
            data: values,
            backgroundColor: [
              '#ff6384',
              '#36a2eb',
              '#ffce56',
              '#4caf50',
              '#9c27b0',
              '#ff9800'
            ]
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Expenses by Category'
          }
        }
      }
    });
  }
}
