// 🔥 GANTI DENGAN SUPABASE URL & ANON KEY ANDA
const SUPABASE_URL = 'https://sogguvzsujmjopnbyyuh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvZ2d1dnpzdWptam9wbmJ5eXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NzEzMDYsImV4cCI6MjA5MDU0NzMwNn0.P4R0EHgZSmK1cz95KSDhmLMbqL062snenQAySNlgQ1Q ';

const {
    createClient
} = supabase; // ← BENAR!
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class FinancialApp {
    constructor() {
        this.transactions = [];
        // this.loading = true;
        this.init();
    }

    async init() {
        this.showLoading();

        setTimeout(() => {
            this.loadData()
                .then(() => {
                    this.render(); // Show data
                    this.updateSummary();
                })
                .catch(error => {
                    // console.error(error);
                    this.showError(); // Show error
                });
        }, 1500); // 1.5 detik loading

        this.bindEvents();
    }

    showLoading() {
        const tbody = document.getElementById('transactionsBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center p-5">
                    <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
                    <div>Memuat data dari cloud...</div>
                </td>
            </tr>
        `;
    }

    async testConnection() {
        try {
            const {
                data,
                error
            } = await supabaseClient
                .from('transactions')
                .select('id', {
                    count: 'exact',
                    head: true
                });

            // console.log('✅ Supabase Connected!', data);
            this.showToast('🚀 Supabase Ready!', 'success');
        } catch (error) {
            // console.error('❌ Supabase Error:', error);
            this.showToast('❌ Config salah! Cek URL & Key', 'danger');
        }
    }

    bindEvents() {
        document.getElementById('transactionForm').addEventListener('submit', (e) => this.addTransaction(e));
        document.getElementById('clearForm').addEventListener('click', () => this.clearForm());
    }

    async loadData() {
        try {
            const {
                data,
                error
            } = await supabaseClient
                .from('transactions')
                .select('*')
                .order('created_at', {
                    ascending: false
                });

            if (error) throw error;
            this.transactions = data || [];
            // console.log('📊 Loaded:', this.transactions.length, 'transactions');
        } catch (error) {
            // console.error('Load error:', error);
            this.showToast('Error load data', 'danger');
        }
    }

    async addTransaction(e) {
        e.preventDefault();

        // ✅ FIX: ES5 safe
        var typeEl = document.getElementById('type');
        var catEl = document.getElementById('category');
        var amtEl = document.getElementById('amount');
        var descEl = document.getElementById('description');

        var type = typeEl ? typeEl.value : '';
        var category = catEl ? catEl.value : '';
        var amount = parseInt(amtEl ? amtEl.value : '0');
        var description = descEl ? (descEl.value || '').trim() : null;

        if (!type || !category || amount <= 0 || isNaN(amount)) {
            this.showToast('Lengkapi semua field!', 'warning');
            return;
        }

        try {
            var btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = 'Saving...';

            var {
                data,
                error
            } = await supabaseClient
                .from('transactions')
                .insert([{
                    type: type,
                    category: category,
                    amount: amount,
                    description: description,
                    date: new Date().toLocaleDateString('id-ID')
                }])
                .select()
                .single();

            if (error) throw error;

            // Refresh data
            await this.loadData();
            this.render();
            this.updateSummary();
            this.clearForm();
            this.showToast('✅ Berhasil disimpan!', 'success');

        } catch (error) {
            this.showToast('Error: ' + error.message, 'danger');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save me-1"></i>Add';
        }
    }

    async confirmDelete(title = 'Hapus data?', text = 'Aksi ini tidak bisa dibatalkan!') {
        const result = await Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: '<i class="fas fa-trash-alt me-1"></i>Ya, hapus!',
            cancelButtonText: '<i class="fas fa-times me-1"></i>Batal',
            buttonsStyling: false,
            reverseButtons: true,
            customClass: {
                confirmButton: 'btn btn-danger px-4 ms-2',
                cancelButton: 'btn btn-secondary px-4 me-2'
            }
        });
        return result.isConfirmed;
    }

    async deleteTransaction(id) {
        if (!(await this.confirmDelete('Hapus transaksi?', 'Data tidak bisa dikembalikan!'))) {
            return;
        }

        try {
            const {
                error
            } = await supabaseClient
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            this.transactions = this.transactions.filter(t => t.id !== id);
            this.render();
            this.updateSummary();
            this.showToast('🗑️ Terhapus!', 'warning');
        } catch (error) {
            this.showToast('Error hapus', 'danger');
        }
    }


    clearForm() {
        document.getElementById('transactionForm').reset();
    }

    formatDisplay(value) {
        return (value == null || value === '' || value.trim() === '') ? '-' : value;
    }

    render() {
        const tbody = document.getElementById('transactionsBody');

        // if (this.loading) {
        //     tbody.innerHTML = '<tr><td colspan="6" class="text-center p-5"><div class="spinner-border text-primary"></div></td></tr>';
        //     return;
        // }

        if (this.transactions.length === 0) {
            tbody.innerHTML = `<tr>
                    <td colspan="6" class="text-center py-4 text-light">
                        <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                        Belum ada transaksi
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = this.transactions.map(t => `
            <tr class="fade-in ${t.type}">
                <td><button class="btn btn-sm py-0 px-3 btn-outline-danger rounded" onclick="app.deleteTransaction(${t.id})"><i class="fas fa-trash"></i></button></td>
                <td>${this.formatDisplay(t.date)}</td>
                <td><span class="badge ${t.type=='income'?'bg-success':'bg-danger'}">${t.type=='income'?'Pemasukan':'Pengeluaran'}</span></td>
                <td>${this.formatDisplay(t.category)}</td>
                <td class="fw-bold ${t.type=='income'?'text-success':'text-danger'}">
                ${t.type=='income'?' +':'-'}Rp ${Number(t.amount).toLocaleString('id-ID')}
                </td>
                <td>${this.formatDisplay(t.description)}</td>
            </tr>
        `).join('');
    }

    updateSummary() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((s, t) => s + Number(t.amount || 0), 0);
        const expense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((s, t) => s + Number(t.amount || 0), 0);
        const balance = income - expense;

        document.getElementById('totalIncome').textContent = `Rp ${income.toLocaleString('id-ID')}`;
        document.getElementById('totalExpense').textContent = `Rp ${expense.toLocaleString('id-ID')}`;
        document.getElementById('balance').textContent = `Rp ${balance.toLocaleString('id-ID')}`;
        document.getElementById('totalTransactions').textContent = this.transactions.length;
    }

    showToast(msg, type = 'info') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            icon: type,
            title: msg
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new FinancialApp();
});