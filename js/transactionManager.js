import { formatCurrency, saveToStorage, loadFromStorage } from './utils.js';

export default class TransactionManager {
  constructor(storageKey = 'transactions') {
    this.storageKey = storageKey;
    this.transactions = loadFromStorage(this.storageKey) || [];
  }

  addTransaction(data) {
    const newData = {
      id: Date.now(),
      ...data
    };
    this.transactions.push(newData);
    this.save();
  }

  deleteTransaction(id) {
    this.transactions = this.transactions.filter(t => t.id !== parseInt(id)); // Pastikan id adalah integer
    this.save();
  }

  resetAll() {
    this.transactions = [];
    this.save();
  }

  save() {
    saveToStorage(this.storageKey, this.transactions);
  }

  getTransactions() {
    return this.transactions;
  }

  search(keyword) {
    return this.transactions.filter(t =>
      t.title.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  getTotalByType(type) {
    return this.transactions
      .filter(t => t.type === type)
      .reduce((sum, t) => sum + parseInt(t.amount), 0);
  }

  getSummary() {
    const income = this.getTotalByType("income");
    const expense = this.getTotalByType("expense");
    return {
      income,
      expense,
      balance: income - expense
    };
  }

  // Memperbarui logika ini agar hanya menghitung pengeluaran per kategori untuk Pie Chart
  getDataGroupedByCategory() {
    const data = {};
    for (const t of this.transactions) {
      // Hanya tambahkan pengeluaran ke dalam perhitungan kategori
      if (t.type === "expense") {
        if (!data[t.category]) data[t.category] = 0;
        data[t.category] += parseInt(t.amount);
      }
    }
    return data;
  }

  getMonthlySummary() {
    const summary = {};

    this.transactions.forEach(t => {
      const date = new Date(t.id); // id = timestamp
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!summary[key]) {
        summary[key] = { income: 0, expense: 0 };
      }

      if (t.type === 'income') {
        summary[key].income += parseInt(t.amount);
      } else {
        summary[key].expense += parseInt(t.amount);
      }
    });

    return summary;
  }
}
