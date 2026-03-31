class FinancialApp {
    constructor() {
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateSummary();
    }

    bindEvents() {
        document.getElementById('transactionForm').addEventListener('submit', (e) => this.addTransaction(e));
        document.getElementById('clearForm').addEventListener('click', () => this.clearForm());
        document.getElementById('deleteAll').addEventListener('click', () => this.deleteAll());
    }

    // Tambahkan method ini di dalam class FinancialApp
    formatDisplay(value) {
        // Cek null, undefined, empty string, whitespace, atau NaN
        if (value == null || value === '' || value.trim() === '' || Number.isNaN(value)) {
            return '-';
        }
        return value;
    }

    addTransaction(e) {
        e.preventDefault();

        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        const amount = parseInt(document.getElementById('amount').value);
        const description = document.getElementById('description').value;

        if (!type || !category || !amount) {
            alert('Mohon lengkapi semua field!');
            return;
        }

        const transaction = {
            id: Date.now(),
            type,
            category,
            amount,
            description,
            date: new Date().toLocaleDateString('id-ID')
        };

        this.transactions.unshift(transaction);
        this.saveData();
        this.render();
        this.updateSummary();
        this.clearForm();

        // Show success message
        this.showToast('Transaksi berhasil ditambahkan!', 'success');
    }

    deleteTransaction(id) {
        if (confirm('Yakin ingin menghapus transaksi ini?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveData();
            this.render();
            this.updateSummary();
            this.showToast('Transaksi berhasil dihapus!', 'danger');
        }
    }

    deleteAll() {
        if (confirm('Yakin ingin menghapus SEMUA transaksi?')) {
            this.transactions = [];
            this.saveData();
            this.render();
            this.updateSummary();
            this.showToast('Semua transaksi dihapus!', 'warning');
        }
    }

    clearForm() {
        document.getElementById('transactionForm').reset();
    }

    render() {
        const tbody = document.getElementById('transactionsBody');

        if (this.transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-light">
                        <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                        Belum ada transaksi
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.transactions.map(transaction => `
            <tr class="fade-in ${transaction.type}">
                <td class="text-center">
                    <button class="btn btn-sm py-0 px-3 btn-outline-danger rounded" onclick="app.deleteTransaction(${transaction.id})">
                        <small class="fas fa-trash"></small>
                    </button>
                </td>
                <td>${transaction.date}</td>
                <td>
                    <span class="badge ${transaction.type === 'income' ? 'bg-success' : 'bg-danger'}">
                        ${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                </td>
                <td>${transaction.category}</td>
                <td class="text-rupiah ${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                    ${transaction.type === 'income' ? '+' : '-'} Rp.${transaction.amount.toLocaleString('id-ID')}
                </td>
                <td>${this.formatDisplay(transaction.description)}</td>
            </tr>
        `).join('');
    }

    updateSummary() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = totalIncome - totalExpense;

        document.getElementById('totalIncome').textContent = `Rp.${totalIncome.toLocaleString('id-ID')}`;
        document.getElementById('totalExpense').textContent = `Rp.${totalExpense.toLocaleString('id-ID')}`;
        document.getElementById('balance').textContent = `Rp.${balance.toLocaleString('id-ID')}`;
        document.getElementById('totalTransactions').textContent = this.transactions.length;
    }

    saveData() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    showToast(message, type = 'info') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed fade-in`;
        toast.style.cssText = `
            top: 20px; right: 20px; z-index: 9999; 
            min-width: 300px; border-radius: 10px;
        `;
        toast.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>${message}
            <button type="button" class="btn-close btn-close-white ms-auto d-none d-sm-block" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinancialApp();
});