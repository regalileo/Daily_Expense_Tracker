import { TransactionManager } from './transactionManager.js';
import { ChartManager } from './chartManager.js';
import { formatRupiah } from './utils.js';

const tm = new TransactionManager();
const chart = new ChartManager(document.getElementById('chart'));

const form = document.getElementById('transactionForm');
const list = document.getElementById('transactionList');
const totalBalance = document.getElementById('totalBalance');
const statsElem = document.getElementById('stats');

function render(filtered = null) {
    const data = filtered || tm.transactions;
    list.innerHTML = '';
    data.forEach((tx, i) => {
    const li = document.createElement('li');
    li.className = 'p-2 border rounded flex justify-between';
    li.innerHTML = `
    <span>${tx.date} - ${tx.description} (${tx.category})</span>
    <span>${formatRupiah(tx.amount)} <button data-index="${i}" class="text-red-500">✖</button></span>
    `;
    list.appendChild(li);
});
totalBalance.textContent = formatRupiah(tm.getTotal(data));
const stats = tm.getStats(data);
statsElem.textContent = Object.entries(stats).map(([k, v]) => `${k}: ${formatRupiah(v)}`).join(', ');
chart.render(stats);
}

form.onsubmit = e => {
e.preventDefault();
const tx = {
    date: document.getElementById('date').value,
    description: document.getElementById('description').value,
    amount: Number(document.getElementById('amount').value),
    category: document.getElementById('category').value
};
tm.add(tx);
form.reset();
render();
};

list.onclick = e => {
if (e.target.tagName === 'BUTTON') {
    tm.delete(Number(e.target.dataset.index));
    render();
}
};

document.getElementById('applyFilter').onclick = () => {
const start = document.getElementById('startDate').value;
const end = document.getElementById('endDate').value;
const cat = document.getElementById('filterCategory').value;
render(tm.filter({ start, end, category: cat }));
};

document.getElementById('exportCSV').onclick = () => {
const rows = [['Tanggal', 'Deskripsi', 'Jumlah', 'Kategori']];
tm.transactions.forEach(tx => {
    rows.push([tx.date, tx.description, tx.amount, tx.category]);
});
const csv = rows.map(r => r.join(',')).join('\n');
const blob = new Blob([csv], { type: 'text/csv' });
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = 'transaksi.csv';
link.click();
};

document.getElementById('toggleDarkMode').onclick = () => {
document.body.classList.toggle('dark');
};

render();
