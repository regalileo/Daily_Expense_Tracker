import { formatRupiah, saveToStorage, loadFromStorage } from 'js/utils.js';

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
    this.transactions = this.transactions.filter(t => t.id !== id);
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

  getDataGroupedByCategory() {
    const data = {};
    for (const t of this.transactions) {
      if (!data[t.category]) data[t.category] = 0;
      if (t.type === "income") {
        data[t.category] += parseInt(t.amount);
      } else {
        data[t.category] -= parseInt(t.amount);
      }
    }
    return data;
  }
}
