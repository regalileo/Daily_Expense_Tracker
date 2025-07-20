import { formatRupiah } from "./utils.js";

export class ChartManager {
  constructor() {
    this.categoryCtx = document.getElementById("categoryChart");
    this.dateCtx = document.getElementById("dateChart");
    this.categoryChart = null;
    this.dateChart = null;
  }

  renderCategoryChart(data) {
    const labels = Object.keys(data);
    const values = Object.values(data);
    this.categoryChart?.destroy();
    this.categoryChart = new Chart(this.categoryCtx, {
      type: "pie",
      data: {
        labels,
        datasets: [{ data: values }]
      },
    });
  }

  renderDateChart(data) {
    const labels = Object.keys(data);
    const values = Object.values(data);
    this.dateChart?.destroy();
    this.dateChart = new Chart(this.dateCtx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Pengeluaran Harian",
          data: values,
          borderColor: "green",
          fill: false
        }]
      }
    });
  }
}
