import { formatRupiah } from './utils.js';

export class TransactionManager {
    constructor(storageKey = 'transactions') {
    this.storageKey = storageKey;
    this.transactions = JSON.parse(localStorage.getItem(this.storageKey)) || [];
}

add(tx) {
    this.transactions.push(tx);
    this.save();
}

delete(index) {
    this.transactions.splice(index, 1);
    this.save();
}

filter({ start, end, category }) {
    return this.transactions.filter(tx => {
        const date = new Date(tx.date);
        if (start && date < new Date(start)) return false;
        if (end && date > new Date(end)) return false;
        if (category && tx.category !== category) return false;
        return true;
    });
}

getTotal(filtered = this.transactions) {
    return filtered.reduce((sum, tx) => sum + Number(tx.amount), 0);
}

getStats(filtered = this.transactions) {
    const stats = {};
    filtered.forEach(tx => {
        if (!stats[tx.category]) stats[tx.category] = 0;
        stats[tx.category] += Number(tx.amount);
    });
    return stats;
}

save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.transactions));
}
}
