import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { formatCurrency } from './utils.js'; 

export default class TransactionManager {
  constructor(supabaseUrl, supabaseAnonKey, userId) {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    this.userId = userId;
    this.transactions = []; // Data akan dimuat dari Supabase
  }

  // Memuat transaksi dari Supabase
  async loadTransactions() {
    if (!this.userId) {
      console.warn("User ID not available. Cannot load transactions.");
      this.transactions = [];
      return;
    }
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', this.userId) // Filter berdasarkan user_id
        .order('id', { ascending: false }); // Urutkan berdasarkan ID terbaru

      if (error) throw error;
      this.transactions = data || [];
      console.log("Transactions loaded from Supabase:", this.transactions);
    } catch (error) {
      console.error("Error loading transactions from Supabase:", error.message);
      this.transactions = [];
    }
  }

  async addTransaction(data) {
    if (!this.userId) {
      console.error("User not authenticated. Cannot add transaction.");
      return;
    }
    const newData = {
      id: Date.now(), // Gunakan timestamp sebagai ID unik
      user_id: this.userId, // Tambahkan user_id
      ...data
    };
    try {
      const { data: insertedData, error } = await this.supabase
        .from('transactions')
        .insert([newData])
        .select(); // Mengembalikan data yang baru saja dimasukkan

      if (error) throw error;
      this.transactions.push(insertedData[0]); // Tambahkan transaksi baru ke array lokal
      console.log("Transaction added to Supabase:", insertedData[0]);
    } catch (error) {
      console.error("Error adding transaction to Supabase:", error.message);
    }
  }

  async deleteTransaction(id) {
    if (!this.userId) {
      console.error("User not authenticated. Cannot delete transaction.");
      return;
    }
    try {
      const { error } = await this.supabase
        .from('transactions')
        .delete()
        .eq('id', parseInt(id))
        .eq('user_id', this.userId); // Pastikan hanya menghapus transaksi milik user ini

      if (error) throw error;
      this.transactions = this.transactions.filter(t => t.id !== parseInt(id));
      console.log("Transaction deleted from Supabase:", id);
    } catch (error) {
      console.error("Error deleting transaction from Supabase:", error.message);
    }
  }

  async resetAll() {
    if (!this.userId) {
      console.error("User not authenticated. Cannot reset all transactions.");
      return;
    }
    try {
      // Hapus semua transaksi milik user ini
      const { error } = await this.supabase
        .from('transactions')
        .delete()
        .eq('user_id', this.userId);

      if (error) throw error;
      this.transactions = [];
      console.log("All transactions reset in Supabase for user:", this.userId);
    } catch (error) {
      console.error("Error resetting all transactions in Supabase:", error.message);
    }
  }

  // Metode save() tidak lagi diperlukan karena operasi langsung ke Supabase
  // save() {
  //   saveToStorage(this.storageKey, this.transactions);
  // }

  getTransactions() {
    return this.transactions; // Mengembalikan data yang ada di memori lokal
  }

  search(keyword) {
    // Pencarian dilakukan pada data yang sudah dimuat di memori
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
