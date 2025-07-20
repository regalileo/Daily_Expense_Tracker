export class ChartManager {
    constructor(ctx) {
    this.ctx = ctx;
    this.chart = null;
}

render(data) {
    const labels = Object.keys(data);
    const values = Object.values(data);

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(this.ctx, {
        type: 'pie',
        data: {
        labels,
        datasets: [{
            label: 'Pengeluaran',
            data: values,
            backgroundColor: [
            '#60A5FA', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6']
        }]
    }
    });
}
}
