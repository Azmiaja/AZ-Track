// 🔥 GANTI DENGAN SUPABASE URL & ANON KEY ANDA
const SUPABASE_URL = 'https://sogguvzsujmjopnbyyuh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZ2d1dnpzdWptam9wbmJ5eXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NzEzMDYsImV4cCI6MjA5MDU0NzMwNn0.P4R0EHgZSmK1cz95KSDhmLMbqL062snenQAySNlgQ1Q ';

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class FinancialApp {
    constructor() {
        this.transactions = [];
        this.loading = true;
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadData();
        this.render();
        this.updateSummary();
        this.loading = false;
    }

    bindEvents() {
        document.getElementById('transactionForm').addEventListener('submit', (e) => this.addTransaction(e));
        document.getElementById('clearForm').addEventListener('click', () => this.clearForm());
        document.getElementById('deleteAll').addEventListener('click', () => this.deleteAll());
    }

    async loadData() {
        try {
            const {
                data,
                error
            } = await supabase
                .from('transactions')
                .select('*')
                .order('created_at', {
                    ascending: false
                });

            if (error) throw error;
            this.transactions = data || [];
        } catch (error) {
            console.error('Error loading data:', error);
            this.showToast('Error memuat data: ' + error.message, 'danger');
        }
    }

    async addTransaction(e) {
        e.preventDefault();

        // Ambil nilai form
        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        const amountInput = document.getElementById('amount').value;
        const descElement = document.getElementById('description');

        const amount = parseInt(amountInput);
        const description = descElement ? descElement.value.trim() : '';

        // Validasi
        if (!type || !category || !amountInput || amount <= 0 || isNaN(amount)) {
            this.showToast('❌ Mohon lengkapi field wajib dan nominal > 0!', 'danger');
            return;
        }

        // Loading
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Menyimpan...';
        submitBtn.disabled = true;

        try {
            const {
                data,
                error
            } = await supabase
                .from('transactions')
                .insert([{
                    type,
                    category,
                    description: description || null,
                    amount,
                    date: new Date().toLocaleDateString('id-ID')
                }])
                .select()
                .single();

            if (error) throw error;

            this.transactions.unshift(data);
            this.render();
            this.updateSummary();
            this.clearForm();
            this.showToast('✅ Transaksi berhasil ditambahkan!', 'success');

        } catch (error) {
            console.error('Error adding transaction:', error);
            this.showToast('❌ Error: ' + error.message, 'danger');
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async deleteTransaction(id) {
        if (confirm('Yakin ingin menghapus transaksi ini?')) {
            try {
                const {
                    error
                } = await supabase
                    .from('transactions')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                this.transactions = this.transactions.filter(t => t.id !== id);
                this.render();
                this.updateSummary();
                this.showToast('🗑️ Transaksi berhasil dihapus!', 'warning');
            } catch (error) {
                console.error('Error deleting:', error);
                this.showToast('❌ Error hapus: ' + error.message, 'danger');
            }
        }
    }

    async deleteAll() {
        if (confirm('⚠️ Yakin ingin menghapus SEMUA transaksi? Data tidak bisa dikembalikan!')) {
            try {
                const {
                    error
                } = await supabase
                    .from('transactions')
                    .delete()
                    .neq('id', 0); // Hapus semua

                if (error) throw error;

                this.transactions = [];
                this.render();
                this.updateSummary();
                this.showToast('🗑️ Semua transaksi dihapus!', 'danger');
            } catch (error) {
                console.error('Error delete all:', error);
                this.showToast('❌ Error hapus semua: ' + error.message, 'danger');
            }
        }
    }

    clearForm() {
        document.getElementById('transactionForm').reset();
    }

    formatDisplay(value) {
        if (value == null || value === '' || value.trim() === '' || Number.isNaN(value)) {
            return '-';
        }
        return value;
    }

    render() {
        const tbody = document.getElementById('transactionsBody');

        if (this.loading) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

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
                <td>
                    <button class="btn btn-sm py-0 px-3 btn-outline-danger rounded" onclick="app.deleteTransaction(${transaction.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
                <td>${this.formatDisplay(transaction.date)}</td>
                <td>
                    <span class="badge ${transaction.type === 'income' ? 'bg-success' : 'bg-danger'}">
                        ${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                </td>
                <td>${this.formatDisplay(transaction.category)}</td>
                <td>${this.formatDisplay(transaction.description)}</td>
                <td class="text-rupiah ${transaction.type === 'income' ? 'text-success' : 'text-danger'} fw-bold">
                    ${transaction.type === 'income' ? '+' : '-'} Rp ${this.formatDisplay(transaction.amount)?.toLocaleString('id-ID')}
                </td>
            </tr>
        `).join('');
    }

    updateSummary() {
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalExpense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const balance = totalIncome - totalExpense;

        document.getElementById('totalIncome').textContent = `Rp ${totalIncome.toLocaleString('id-ID')}`;
        document.getElementById('totalExpense').textContent = `Rp ${totalExpense.toLocaleString('id-ID')}`;
        document.getElementById('balance').textContent = `Rp ${balance.toLocaleString('id-ID')}`;
        document.getElementById('totalTransactions').textContent = this.transactions.length;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed fade-in border-0`;
        toast.style.cssText = `
            top: 20px; right: 20px; z-index: 9999; 
            min-width: 320px; max-width: 400px;
        `;
        toast.innerHTML = `
            <strong>${message}</strong>
            <button type="button" class="btn-close btn-close-white ms-auto" onclick="this.parentElement.remove()"></button>
        `;

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinancialApp();
});