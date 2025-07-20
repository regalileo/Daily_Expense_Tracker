import { formatRupiah, saveToStorage, getFromStorage } from "./utils.js";

export class TransactionManager {
  constructor() {
    this.transactions = getFromStorage("transactions", []);
  }

  addTransaction(data) {
    this.transactions.push({ ...data, id: Date.now() });
    this.save();
  }

  deleteTransaction(id) {
    this.transactions = this.transactions.filter(t => t.id !== id);
    this.save();
  }

  editTransaction(id, newData) {
    this.transactions = this.transactions.map(t => t.id === id ? { ...t, ...newData } : t);
    this.save();
  }

  filterTransactions(keyword) {
    return this.transactions.filter(t => t.description.toLowerCase().includes(keyword.toLowerCase()));
  }

  save() {
    saveToStorage("transactions", this.transactions);
  }

  getTodayTotal() {
    const today = new Date().toISOString().slice(0, 10);
    return this.transactions
      .filter(t => t.date === today)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  }

  getMonthTotal() {
    const month = new Date().toISOString().slice(0, 7);
    return this.transactions
      .filter(t => t.date.startsWith(month))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  }

  getBalance(initial) {
    return initial - this.transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  }

  getCategoryStats() {
    const result = {};
    this.transactions.forEach(t => {
      result[t.category] = (result[t.category] || 0) + parseFloat(t.amount);
    });
    return result;
  }

  getDateStats() {
    const result = {};
    this.transactions.forEach(t => {
      result[t.date] = (result[t.date] || 0) + parseFloat(t.amount);
    });
    return result;
  }

  resetAll() {
    this.transactions = [];
    this.save();
  }
}
