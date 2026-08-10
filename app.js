const DB_KEY = 'CBT_SAFE_EXAM_STORE_2026_V6_0';

const initialData = {
    users: [
        { id: 'ADMIN01', name: 'Administrator Utama', role: 'admin', pass: 'admin123', deviceId: null },
        { id: '19850101', name: 'Pak Budi Santoso, M.Pd', role: 'guru', pass: 'guru123', mapel: 'Matematika Dasar', deviceId: null },
        { id: '19850102', name: 'Bu Siti Rahma, S.Pd', role: 'guru', pass: 'guru123', mapel: 'Bahasa Indonesia', deviceId: null },
        { id: '2024001', name: 'Ahmad Rizky (X-IPA-1)', role: 'murid', pass: '123456', deviceId: null },
        { id: '2024002', name: 'Bunga Citra (X-IPA-1)', role: 'murid', pass: '123456', deviceId: null },
        { id: '2024003', name: 'Deni Kurniawan (X-IPA-2)', role: 'murid', pass: '123456', deviceId: null }
    ],
    packages: [
        {
            id: 'PKG-MTK-A',
            guruNip: '19850101',
            mapel: 'Matematika Dasar',
            packageName: 'Paket A - Penilaian Akhir Semester',
            token: 'MTK88',
            durationMinutes: 45,
            isActive: true,
            questions: [
                {
                    id: 'q1',
                    type: 'pg',
                    text: 'Berapakah hasil dari akar kuadrat dari 144 dikalikan 2?',
                    imageUrl: '',
                    audioUrl: '',
                    options: ['20', '24', '28', '32', '36'],
                    correctAnswer: '24',
                    score: 20
                },
                {
                    id: 'q2',
                    type: 'pg_kompleks',
                    text: 'Manakah dari bilangan berikut yang merupakan bilangan prima? (Pilih semua yang benar)',
                    imageUrl: '[https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=60](https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=60)',
                    audioUrl: '',
                    options: ['2', '9', '13', '15', '17'],
                    correctAnswer: ['2', '13', '17'],
                    score: 20
                },
                {
                    id: 'q3',
                    type: 'mengurutkan',
                    text: 'Urutkan pecahan berikut dari nilai TERKECIL ke TERBESAR:',
                    imageUrl: '',
                    audioUrl: '',
                    items: ['1/4', '1/2', '3/4', '1'],
                    correctAnswer: ['1/4', '1/2', '3/4', '1'],
                    score: 20
                },
                {
                    id: 'q4',
                    type: 'menjodohkan',
                    text: 'Jodohkan bangun datar berikut dengan rumus luasnya:',
                    pairs: [
                        { left: 'Persegi', right: 'Sisi x Sisi' },
                        { left: 'Segitiga', right: '1/2 x Alas x Tinggi' },
                        { left: 'Lingkaran', right: 'π x r²' }
                    ],
                    score: 20
                },
                {
                    id: 'q5',
                    type: 'essay',
                    text: 'Dengarkan audio penjelasan berikut, lalu jelaskan penerapan rumus Phytagoras dalam kehidupan sehari-hari!',
                    imageUrl: '',
                    audioUrl: '[https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3](https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3)',
                    correctAnswer: 'Koreksi Manual Guru',
                    score: 20
                }
            ]
        },
        {
            id: 'PKG-MTK-B',
            guruNip: '19850101',
            mapel: 'Matematika Dasar',
            packageName: 'Paket B - Remedial & Ujian Susulan',
            token: 'MTK99',
            durationMinutes: 30,
            isActive: false,
            questions: []
        },
        {
            id: 'PKG-MTK-C',
            guruNip: '19850101',
            mapel: 'Matematika Dasar',
            packageName: 'Paket C - Ujian Cadangan',
            token: 'MTK77',
            durationMinutes: 45,
            isActive: false,
            questions: []
        },
        {
            id: 'PKG-IND-A',
            guruNip: '19850102',
            mapel: 'Bahasa Indonesia',
            packageName: 'Paket A - Ujian Harian Bahasa Indonesia',
            token: 'IND123',
            durationMinutes: 60,
            isActive: true,
            questions: []
        }
    ],
    examResults: [],
    cheatingLogs: []
};

class CBTApp {
    constructor() {
        this.currentUser = null;
        this.activeExam = null;
        this.examTimerInterval = null;
        this.violations = 0;
        this.maxViolations = 3;
        this.confirmCallback = null;
        this.stagedImportQuestions = [];
        
        this.initStore();
        this.setupSecurityListeners();
    }

    initStore() {
        if (!localStorage.getItem(DB_KEY)) {
            localStorage.setItem(DB_KEY, JSON.stringify(initialData));
        }
        this.data = JSON.parse(localStorage.getItem(DB_KEY));
    }

    saveStore() {
        localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    }

    getDeviceId() {
        let devId = localStorage.getItem('CBT_DEVICE_LOCK_ID');
        if (!devId) {
            devId = 'DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase();
            localStorage.setItem('CBT_DEVICE_LOCK_ID', devId);
        }
        return devId;
    }

    showAlertModal(title, body, icon = 'fa-circle-info', colorClass = 'text-emerald-600') {
        document.getElementById('alert-modal-title').innerText = title;
        document.getElementById('alert-modal-body').innerText = body;
        document.getElementById('alert-modal-icon').className = `w-12 h-12 rounded-2xl flex items-center justify-center mx-auto text-xl ${colorClass} bg-slate-100`;
        document.getElementById('alert-modal-icon').innerHTML = `<i class="fa-solid ${icon}"></i>`;
        document.getElementById('alert-modal').classList.remove('hidden');
    }

    closeAlertModal() {
        document.getElementById('alert-modal').classList.add('hidden');
    }

    showConfirmModal(title, body, onConfirm) {
        document.getElementById('confirm-modal-title').innerText = title;
        document.getElementById('confirm-modal-body').innerText = body;
        this.confirmCallback = onConfirm;
        document.getElementById('confirm-modal').classList.remove('hidden');
    }

    handleConfirmChoice(choice) {
        document.getElementById('confirm-modal').classList.add('hidden');
        if (choice && typeof this.confirmCallback === 'function') {
            this.confirmCallback();
        }
        this.confirmCallback = null;
    }

    showToast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const colors = {
            info: 'bg-slate-800 text-white',
            success: 'bg-emerald-600 text-white',
            error: 'bg-red-600 text-white',
            warning: 'bg-amber-500 text-white'
        };
        toast.className = `${colors[type] || colors.info} px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 transition-all transform duration-300 pointer-events-auto`;
        toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${msg}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    setupSecurityListeners() {
        document.addEventListener('visibilitychange', () => {
            if (this.activeExam && !this.activeExam.submitted && document.hidden) {
                this.handleViolation("Berpindah Tab / Membuka Aplikasi Lain");
            }
        });

        window.addEventListener('blur', () => {
            if (this.activeExam && !this.activeExam.submitted) {
                this.handleViolation("Aplikasi Kehilangan Fokus / Layar Beralih");
            }
        });

        let lastHeight = window.innerHeight;
        window.addEventListener('resize', () => {
            if (this.activeExam && !this.activeExam.submitted) {
                if (Math.abs(window.innerHeight - lastHeight) > 140) {
                    this.handleViolation("Mode Bagi Layar (Split Screen) Terdeteksi");
                }
                lastHeight = window.innerHeight;
            }
        });

        document.addEventListener('contextmenu', e => { if (this.activeExam) e.preventDefault(); });
        document.addEventListener('copy', e => { if (this.activeExam) e.preventDefault(); });
        document.addEventListener('cut', e => { if (this.activeExam) e.preventDefault(); });
        document.addEventListener('paste', e => { if (this.activeExam) e.preventDefault(); });

        document.addEventListener('keydown', e => {
            if (this.activeExam) {
                if (e.ctrlKey || e.altKey || e.key === 'F12' || e.key === 'Meta') {
                    e.preventDefault();
                    this.handleViolation("Kombinasi Tombol Terlarang Terdeteksi");
                }
            }
        });
    }

    handleViolation(reason) {
        if (!this.activeExam || this.activeExam.submitted) return;

        this.violations++;
        
        const logEntry = {
            nis: this.currentUser.id,
            studentName: this.currentUser.name,
            packageId: this.activeExam.package.id,
            packageName: this.activeExam.package.packageName,
            reason: reason,
            timestamp: new Date().toLocaleTimeString('id-ID')
        };
        this.data.cheatingLogs.unshift(logEntry);
        this.saveStore();

        document.getElementById('sec-modal-title').innerText = "PELANGGARAN DITETAPKAN!";
        document.getElementById('sec-modal-desc').innerText = `Terdeteksi: ${reason}. Ujian diawasi ketat secara real-time.`;
        document.getElementById('violation-count-badge').innerText = `${this.violations} / ${this.maxViolations}`;
        document.getElementById('security-modal').classList.remove('hidden');

        if (this.violations >= this.maxViolations) {
            document.getElementById('sec-modal-desc').innerText = "Anda telah melebihi batas 3 kali pelanggaran. Ujian dihentikan dan dikunci secara otomatis!";
            document.getElementById('sec-modal-btn').innerText = "Kunci & Serahkan Ujian";
            document.getElementById('sec-modal-btn').onclick = () => {
                this.closeSecurityModal();
                this.forceSubmitExam("LOCKED_CHEAT");
            };
        }
    }

    closeSecurityModal() {
        document.getElementById('security-modal').classList.add('hidden');
    }

    login(role, idInput, passInput) {
        const user = this.data.users.find(u => u.id.trim() === idInput.trim() && u.pass === passInput && u.role === role);
        
        if (!user) {
            this.showAlertModal("Gagal Login", "Kredensial salah! Periksa kembali ID/NIS/NIP dan Password Anda.", "fa-lock", "text-red-500");
            return;
        }

        const currentDevId = this.getDeviceId();
        if (user.deviceId && user.deviceId !== currentDevId) {
            this.showAlertModal("Akses Ditolak!", `Akun ${user.name} sudah terikat pada perangkat HP lain. Hubungi Admin untuk meriset pertautan perangkat.`, "fa-mobile-screen-button", "text-amber-500");
            return;
        }

        user.deviceId = currentDevId;
        this.currentUser = user;
        this.saveStore();

        this.updateUserBar();
        this.renderDashboard();
        this.showToast(`Selamat datang, ${user.name}`, 'success');
    }

    logout() {
        if (this.activeExam && !this.activeExam.submitted) {
            this.showConfirmModal("Konfirmasi Keluar", "Ujian sedang berlangsung! Yakin ingin keluar? Jawaban Anda saat ini akan disimpan.", () => {
                this.executeLogout();
            });
        } else {
            this.executeLogout();
        }
    }

    executeLogout() {
        this.currentUser = null;
        this.activeExam = null;
        clearInterval(this.examTimerInterval);
        document.getElementById('user-bar').classList.add('hidden');
        document.getElementById('watermark-overlay').classList.add('hidden');
        this.renderLogin();
        this.showToast("Berhasil keluar sistem", "info");
    }

    updateUserBar() {
        if (!this.currentUser) return;
        document.getElementById('user-bar').classList.remove('hidden');
        document.getElementById('user-display-name').innerText = this.currentUser.name;
        
        const roleLabels = { murid: 'Murid (NIS)', guru: 'Guru (NIP)', admin: 'Administrator' };
        document.getElementById('user-display-role').innerText = roleLabels[this.currentUser.role] || this.currentUser.role;
    }

    renderLogin() {
        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="max-w-md mx-auto my-6 bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
                <div class="bg-gradient-to-br from-teal-700 via-emerald-600 to-emerald-500 p-6 text-white text-center relative">
                    <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md shadow-inner">
                        <i class="fa-solid fa-graduation-cap text-3xl text-amber-300"></i>
                    </div>
                    <h2 class="text-2xl font-black tracking-tight">PORTAL UJIAN SAFE</h2>
                    <p class="text-xs text-emerald-100 mt-1 font-medium">Sistem Keamanan Tinggi Berbasis Smartphone</p>
                </div>

                <div class="flex border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-600">
                    <button id="tab-btn-murid" onclick="app.switchLoginTab('murid')" class="flex-1 py-3 border-b-2 border-emerald-600 text-emerald-700 bg-white">
                        <i class="fa-solid fa-user-graduate mr-1"></i> Murid (NIS)
                    </button>
                    <button id="tab-btn-guru" onclick="app.switchLoginTab('guru')" class="flex-1 py-3 border-b-2 border-transparent hover:text-emerald-600">
                        <i class="fa-solid fa-chalkboard-user mr-1"></i> Guru (NIP)
                    </button>
                    <button id="tab-btn-admin" onclick="app.switchLoginTab('admin')" class="flex-1 py-3 border-b-2 border-transparent hover:text-emerald-600">
                        <i class="fa-solid fa-user-shield mr-1"></i> Admin
                    </button>
                </div>

                <form id="login-form" onsubmit="event.preventDefault(); app.handleLoginSubmit();" class="p-6 space-y-4">
                    <input type="hidden" id="login-role" value="murid">
                    
                    <div>
                        <label id="login-id-label" class="block text-xs font-bold text-slate-700 mb-1">NIS (Nomor Induk Siswa)</label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                <i class="fa-solid fa-id-card"></i>
                            </span>
                            <input type="text" id="login-id-input" required placeholder="Contoh: 2024001" 
                                class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm font-semibold">
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Password</label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                                <i class="fa-solid fa-lock"></i>
                            </span>
                            <input type="password" id="login-pass-input" required placeholder="Masukkan Password" 
                                class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition text-sm font-semibold">
                        </div>
                    </div>

                    <button type="submit" class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white font-black py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2">
                        <i class="fa-solid fa-right-to-bracket"></i> Masuk Aplikasi
                    </button>

                    <div class="pt-4 border-t border-slate-100 space-y-2">
                        <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Akses Cepat Demo:</p>
                        <div class="flex flex-wrap gap-1.5">
                            <button type="button" onclick="app.fillDemo('murid', '2024001', '123456')" class="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-bold border border-emerald-200">Murid: 2024001</button>
                            <button type="button" onclick="app.fillDemo('guru', '19850101', 'guru123')" class="text-[11px] bg-teal-50 hover:bg-teal-100 text-teal-800 px-2.5 py-1 rounded-lg font-bold border border-teal-200">Guru: 19850101</button>
                            <button type="button" onclick="app.fillDemo('admin', 'ADMIN01', 'admin123')" class="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg font-bold border border-slate-300">Admin: ADMIN01</button>
                        </div>
                    </div>
                </form>
            </div>
        `;
    }

    switchLoginTab(role) {
        document.getElementById('login-role').value = role;
        const idLabel = document.getElementById('login-id-label');
        const idInput = document.getElementById('login-id-input');

        ['murid', 'guru', 'admin'].forEach(r => {
            const btn = document.getElementById(`tab-btn-${r}`);
            if (r === role) {
                btn.className = "flex-1 py-3 border-b-2 border-emerald-600 text-emerald-700 bg-white font-bold";
            } else {
                btn.className = "flex-1 py-3 border-b-2 border-transparent hover:text-emerald-600 text-slate-500 font-medium";
            }
        });

        if (role === 'murid') {
            idLabel.innerText = 'NIS (Nomor Induk Siswa)';
            idInput.placeholder = 'Contoh: 2024001';
        } else if (role === 'guru') {
            idLabel.innerText = 'NIP (Nomor Induk Pegawai)';
            idInput.placeholder = 'Contoh: 19850101';
        } else {
            idLabel.innerText = 'ID Administrator';
            idInput.placeholder = 'Contoh: ADMIN01';
        }
    }

    fillDemo(role, id, pass) {
        this.switchLoginTab(role);
        document.getElementById('login-id-input').value = id;
        document.getElementById('login-pass-input').value = pass;
    }

    handleLoginSubmit() {
        const role = document.getElementById('login-role').value;
        const id = document.getElementById('login-id-input').value;
        const pass = document.getElementById('login-pass-input').value;
        this.login(role, id, pass);
    }

    renderDashboard() {
        if (!this.currentUser) {
            this.renderLogin();
            return;
        }
        if (this.currentUser.role === 'murid') this.renderMuridDashboard();
        else if (this.currentUser.role === 'guru') this.renderGuruDashboard();
        else if (this.currentUser.role === 'admin') this.renderAdminDashboard();
    }

    renderAdminDashboard() {
        const container = document.getElementById('app-container');
        const users = this.data.users;

        container.innerHTML = `
            <div class="space-y-4">
                <div class="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-5 text-white shadow-lg flex justify-between items-center">
                    <div>
                        <span class="bg-white/20 text-[11px] px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">Dashboard Administrator</span>
                        <h2 class="text-xl font-black mt-1.5">${this.currentUser.name}</h2>
                        <p class="text-xs text-slate-300 mt-0.5">Kelola data Guru & Murid, Import Excel/CSV, dan Riset Pertautan HP</p>
                    </div>
                    <i class="fa-solid fa-user-gear text-4xl text-slate-400 opacity-80 hidden sm:block"></i>
                </div>

                <div class="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm text-xs font-bold text-slate-600 overflow-x-auto">
                    <button id="admin-tab-users" onclick="app.switchAdminTab('users')" class="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 text-white font-extrabold transition">
                        <i class="fa-solid fa-users mr-1"></i> Daftar Pengguna (${users.length})
                    </button>
                    <button id="admin-tab-import" onclick="app.switchAdminTab('import')" class="flex-1 py-2.5 px-3 rounded-xl hover:text-slate-800 transition">
                        <i class="fa-solid fa-file-import mr-1"></i> Import Guru & Murid
                    </button>
                    <button id="admin-tab-add" onclick="app.switchAdminTab('add')" class="flex-1 py-2.5 px-3 rounded-xl hover:text-slate-800 transition">
                        <i class="fa-solid fa-user-plus mr-1"></i> Tambah Pengguna Manual
                    </button>
                </div>

                <div id="admin-dynamic-content"></div>
            </div>
        `;

        this.switchAdminTab('users');
    }

    switchAdminTab(tab) {
        ['users', 'import', 'add'].forEach(t => {
            const btn = document.getElementById(`admin-tab-${t}`);
            if (btn) {
                if (t === tab) btn.className = "flex-1 py-2.5 px-3 rounded-xl bg-slate-800 text-white font-extrabold transition shadow-sm";
                else btn.className = "flex-1 py-2.5 px-3 rounded-xl hover:text-slate-800 text-slate-600 font-bold transition";
            }
        });

        const contentArea = document.getElementById('admin-dynamic-content');
        if (!contentArea) return;

        if (tab === 'users') contentArea.innerHTML = this.renderAdminUsersList();
        else if (tab === 'import') contentArea.innerHTML = this.renderAdminImportPanel();
        else if (tab === 'add') contentArea.innerHTML = this.renderAdminAddUserForm();
    }

    renderAdminUsersList() {
        const users = this.data.users;

        return `
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div>
                        <h3 class="font-black text-slate-800 text-base">Daftar Pengguna Terdaftar</h3>
                        <p class="text-xs text-slate-500">Masing-masing Guru memiliki hubungan ketat **1 Guru = 1 Mata Pelajaran**.</p>
                    </div>
                    <span class="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-xl">Total: ${users.length} Akun</span>
                </div>

                <div class="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                <th class="p-3">ID / NIP / NIS</th>
                                <th class="p-3">Nama Lengkap</th>
                                <th class="p-3">Peran</th>
                                <th class="p-3">Mata Pelajaran (Khusus Guru)</th>
                                <th class="p-3">Status HP / Device ID</th>
                                <th class="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                            ${users.map(u => `
                                <tr class="hover:bg-slate-50 transition">
                                    <td class="p-3 font-mono font-bold text-slate-800">${u.id}</td>
                                    <td class="p-3 font-bold text-slate-900">${u.name}</td>
                                    <td class="p-3">
                                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : u.role === 'guru' ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'}">
                                            ${u.role}
                                        </span>
                                    </td>
                                    <td class="p-3 font-bold text-teal-700">${u.role === 'guru' ? (u.mapel || '-') : '-'}</td>
                                    <td class="p-3 font-mono text-[11px]">
                                        ${u.deviceId ? `<span class="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold"><i class="fa-solid fa-mobile-screen mr-1"></i>${u.deviceId}</span>` : '<span class="text-slate-400 italic">Belum Terikat</span>'}
                                    </td>
                                    <td class="p-3 text-center flex justify-center gap-1.5">
                                        ${u.deviceId ? `
                                            <button onclick="app.resetUserDevice('${u.id}')" title="Riset Pautan HP" class="bg-amber-50 hover:bg-amber-100 text-amber-700 p-2 rounded-xl text-xs font-bold transition border border-amber-200">
                                                <i class="fa-solid fa-rotate-left"></i>
                                            </button>
                                        ` : ''}
                                        ${u.id !== 'ADMIN01' ? `
                                            <button onclick="app.deleteUser('${u.id}')" title="Hapus Akun" class="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl text-xs font-bold transition border border-red-200">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        ` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderAdminImportPanel() {
        return `
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                    <div>
                        <h3 class="font-black text-slate-800 text-base flex items-center gap-2">
                            <i class="fa-solid fa-file-excel text-emerald-600 text-lg"></i> Import Massal Data Guru & Murid
                        </h3>
                        <p class="text-xs text-slate-500 mt-0.5">Unggah data pengguna dari berkas Excel (.xlsx) atau CSV secara praktis.</p>
                    </div>
                    <button onclick="app.downloadUserImportTemplate()" class="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl shadow transition flex items-center gap-1.5">
                        <i class="fa-solid fa-download text-amber-300"></i> Unduh Template Excel Pengguna
                    </button>
                </div>

                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                    <span class="font-extrabold text-slate-800 flex items-center gap-1">
                        <i class="fa-solid fa-circle-info text-emerald-600"></i> Ketentuan Kolom Excel/CSV Pengguna:
                    </span>
                    <ul class="list-disc pl-5 text-slate-600 space-y-1">
                        <li><strong>Kolom 1 (Peran)</strong>: Isikan <code>guru</code> atau <code>murid</code>.</li>
                        <li><strong>Kolom 2 (ID/NIP/NIS)</strong>: Nomor Induk / ID Unik Pengguna.</li>
                        <li><strong>Kolom 3 (Nama_Lengkap)</strong>: Nama Lengkap Pengguna.</li>
                        <li><strong>Kolom 4 (Password)</strong>: Password Kata Laluan Akun.</li>
                        <li><strong>Kolom 5 (Mata_Pelajaran)</strong>: Wajib diisi untuk Peran <code>guru</code> (1 Guru = 1 Mapel).</li>
                    </ul>
                </div>

                <div class="space-y-3">
                    <label class="block text-xs font-bold text-slate-700">Pilih Berkas Excel / CSV Pengguna:</label>
                    <input type="file" id="user-import-input" accept=".csv, .xlsx, .xls" onchange="app.handleUserSpreadsheetUpload(event)" class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-900">
                </div>
            </div>
        `;
    }

    downloadUserImportTemplate() {
        const templateData = [
            ["Peran", "ID_NIP_NIS", "Nama_Lengkap", "Password", "Mata_Pelajaran"],
            ["guru", "19850103", "Pak Ahmad Fauzi, S.Pd", "guru123", "Fisika Dasar"],
            ["guru", "19850104", "Bu Dewi Lestari, M.Pd", "guru123", "Kimia Organik"],
            ["murid", "2024004", "Eka Saputra (X-IPA-2)", "123456", ""],
            ["murid", "2024005", "Fitriani (X-IPA-2)", "123456", ""]
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data_Pengguna");
        XLSX.writeFile(wb, "Template_Import_Pengguna_CBT.xlsx");
        this.showToast("Template Excel Pengguna berhasil diunduh!", "success");
    }

    handleUserSpreadsheetUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                this.processImportedUsers(jsonRows);
            } catch (err) {
                this.showAlertModal("Gagal Membaca File", "Format file tidak valid. Gunakan template Excel resmi.", "fa-triangle-exclamation", "text-red-500");
            }
        };
        reader.readAsArrayBuffer(file);
    }

    processImportedUsers(rows) {
        if (!rows || rows.length < 2) {
            this.showToast("File tidak berisi baris data pengguna!", "warning");
            return;
        }

        let count = 0;
        for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || !r[1]) continue;

            const role = String(r[0] || 'murid').toLowerCase().trim();
            const id = String(r[1] || '').trim();
            const name = String(r[2] || '').trim();
            const pass = String(r[3] || '123456').trim();
            const mapel = String(r[4] || '').trim();

            if (!id || !name) continue;

            const existingIdx = this.data.users.findIndex(u => u.id === id);
            const userObj = {
                id: id,
                name: name,
                role: role === 'guru' ? 'guru' : 'murid',
                pass: pass,
                mapel: role === 'guru' ? (mapel || 'Umum') : '',
                deviceId: null
            };

            if (existingIdx >= 0) {
                this.data.users[existingIdx] = userObj;
            } else {
                this.data.users.push(userObj);
            }
            count++;
        }

        this.saveStore();
        this.showToast(`Berhasil mengimpor ${count} data Guru & Murid!`, "success");
        this.switchAdminTab('users');
    }

    renderAdminAddUserForm() {
        return `
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4 max-w-xl mx-auto">
                <h3 class="font-black text-slate-800 text-base border-b border-slate-100 pb-3">Tambah Pengguna Manual</h3>
                
                <form onsubmit="event.preventDefault(); app.submitManualUser();" class="space-y-3.5 text-xs">
                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Peran Pengguna:</label>
                        <select id="add-user-role" onchange="app.toggleMapelFieldVis()" class="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800">
                            <option value="murid">Murid (NIS)</option>
                            <option value="guru">Guru (NIP)</option>
                        </select>
                    </div>

                    <div>
                        <label class="block font-bold text-slate-700 mb-1">ID / NIP / NIS:</label>
                        <input type="text" id="add-user-id" required placeholder="Contoh: 2024009" class="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800">
                    </div>

                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Nama Lengkap:</label>
                        <input type="text" id="add-user-name" required placeholder="Contoh: Ahmad Rizky" class="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800">
                    </div>

                    <div>
                        <label class="block font-bold text-slate-700 mb-1">Password:</label>
                        <input type="text" id="add-user-pass" required value="123456" class="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800">
                    </div>

                    <div id="add-user-mapel-container" class="hidden">
                        <label class="block font-bold text-teal-800 mb-1">Mata Pelajaran Spesifik (1 Guru = 1 Mapel):</label>
                        <input type="text" id="add-user-mapel" placeholder="Contoh: Fisika Dasar" class="w-full p-3 bg-teal-50 border border-teal-300 rounded-xl font-bold text-teal-900">
                    </div>

                    <button type="submit" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-3.5 rounded-xl shadow transition">
                        Simpan Akun Pengguna Baru
                    </button>
                </form>
            </div>
        `;
    }

    toggleMapelFieldVis() {
        const role = document.getElementById('add-user-role').value;
        const container = document.getElementById('add-user-mapel-container');
        if (role === 'guru') container.classList.remove('hidden');
        else container.classList.add('hidden');
    }

    submitManualUser() {
        const role = document.getElementById('add-user-role').value;
        const id = document.getElementById('add-user-id').value.trim();
        const name = document.getElementById('add-user-name').value.trim();
        const pass = document.getElementById('add-user-pass').value.trim();
        const mapel = document.getElementById('add-user-mapel').value.trim();

        if (!id || !name) {
            this.showToast("Isi semua data wajib!", "warning");
            return;
        }

        if (role === 'guru' && !mapel) {
            this.showToast("Guru wajib memiliki 1 Mata Pelajaran!", "warning");
            return;
        }

        const userObj = {
            id: id,
            name: name,
            role: role,
            pass: pass,
            mapel: role === 'guru' ? mapel : '',
            deviceId: null
        };

        const existingIdx = this.data.users.findIndex(u => u.id === id);
        if (existingIdx >= 0) {
            this.data.users[existingIdx] = userObj;
        } else {
            this.data.users.push(userObj);
        }

        this.saveStore();
        this.showToast(`Pengguna ${name} berhasil disimpan!`, "success");
        this.switchAdminTab('users');
    }

    resetUserDevice(userId) {
        const user = this.data.users.find(u => u.id === userId);
        if (user) {
            user.deviceId = null;
            this.saveStore();
            this.switchAdminTab('users');
            this.showToast(`Pautan perangkat HP ${user.name} berhasil diriset!`, "success");
        }
    }

    deleteUser(userId) {
        this.showConfirmModal("Hapus Pengguna", "Apakah Anda yakin ingin menghapus pengguna ini?", () => {
            this.data.users = this.data.users.filter(u => u.id !== userId);
            this.saveStore();
            this.switchAdminTab('users');
            this.showToast("Pengguna berhasil dihapus", "info");
        });
    }

    renderGuruDashboard() {
        const container = document.getElementById('app-container');
        const myPackages = this.data.packages.filter(p => p.guruNip === this.currentUser.id);

        container.innerHTML = `
            <div class="space-y-4">
                <div class="bg-gradient-to-r from-teal-700 to-emerald-600 rounded-3xl p-5 text-white shadow-lg flex justify-between items-center">
                    <div>
                        <span class="bg-white/20 text-[11px] px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">Dashboard Guru Pengampu</span>
                        <h2 class="text-xl font-black mt-1.5">${this.currentUser.name}</h2>
                        <p class="text-xs text-teal-100 mt-0.5">Mata Pelajaran: <span class="font-bold text-amber-300">${this.currentUser.mapel || 'Umum'}</span> • Kelola Paket Soal (A, B, C)</p>
                    </div>
                    <i class="fa-solid fa-chalkboard-user text-4xl text-teal-200 opacity-80 hidden sm:block"></i>
                </div>

                <div class="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm text-xs font-bold text-slate-600 overflow-x-auto">
                    <button id="guru-tab-paket" onclick="app.switchGuruTab('paket')" class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-extrabold transition">
                        <i class="fa-solid fa-cubes mr-1"></i> Paket Soal (${myPackages.length})
                    </button>
                    <button id="guru-tab-import" onclick="app.switchGuruTab('import')" class="flex-1 py-2.5 px-3 rounded-xl hover:text-emerald-600 transition">
                        <i class="fa-solid fa-file-arrow-up mr-1"></i> Import Soal (Excel/PDF/Word)
                    </button>
                    <button id="guru-tab-monitor" onclick="app.switchGuruTab('monitor')" class="flex-1 py-2.5 px-3 rounded-xl hover:text-emerald-600 transition">
                        <i class="fa-solid fa-triangle-exclamation mr-1 text-red-500"></i> Log Kecurangan
                    </button>
                    <button id="guru-tab-hasil" onclick="app.switchGuruTab('hasil')" class="flex-1 py-2.5 px-3 rounded-xl hover:text-emerald-600 transition">
                        <i class="fa-solid fa-square-poll-vertical mr-1"></i> Hasil & Koreksi Essay
                    </button>
                </div>

                <div id="guru-dynamic-content" class="space-y-4"></div>
            </div>
        `;

        this.switchGuruTab('paket');
    }

    switchGuruTab(tab) {
        ['paket', 'import', 'monitor', 'hasil'].forEach(t => {
            const btn = document.getElementById(`guru-tab-${t}`);
            if (btn) {
                if (t === tab) btn.className = "flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 text-white font-extrabold transition shadow-sm";
                else btn.className = "flex-1 py-2.5 px-3 rounded-xl hover:text-emerald-600 text-slate-600 font-bold transition";
            }
        });

        const contentArea = document.getElementById('guru-dynamic-content');
        if (!contentArea) return;

        if (tab === 'paket') contentArea.innerHTML = this.renderGuruPackagesPanel();
        else if (tab === 'import') contentArea.innerHTML = this.renderGuruMultiFormatImportPanel();
        else if (tab === 'monitor') contentArea.innerHTML = this.renderGuruMonitoringPanel();
        else if (tab === 'hasil') contentArea.innerHTML = this.renderGuruResultsPanel();
    }

    renderGuruPackagesPanel() {
        const myPackages = this.data.packages.filter(p => p.guruNip === this.currentUser.id);

        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                ${myPackages.map(pkg => `
                    <div class="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-4 flex flex-col justify-between">
                        <div class="space-y-3">
                            <div class="flex justify-between items-start">
                                <span class="bg-slate-100 text-slate-800 text-xs font-black px-2.5 py-1 rounded-xl border border-slate-200">${pkg.packageName.split(' - ')[0]}</span>
                                <button onclick="app.togglePackageStatus('${pkg.id}')" class="px-2.5 py-1 rounded-full text-[11px] font-black transition ${pkg.isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-500 border border-slate-200'}">
                                    ${pkg.isActive ? '<i class="fa-solid fa-toggle-on text-emerald-600"></i> Ujian Aktif' : '<i class="fa-solid fa-toggle-off"></i> Non-Aktif'}
                                </button>
                            </div>

                            <div>
                                <h4 class="font-black text-slate-800 text-base">${pkg.packageName}</h4>
                                <p class="text-xs text-slate-500 mt-0.5"><i class="fa-solid fa-book-bookmark text-emerald-600"></i> Mapel: ${pkg.mapel}</p>
                            </div>

                            <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                                <div class="flex justify-between items-center">
                                    <span class="text-slate-500 font-bold"><i class="fa-solid fa-key text-amber-500"></i> Token Ujian:</span>
                                    <span class="font-mono font-black text-slate-800 text-sm bg-white px-2 py-0.5 rounded-lg border border-slate-200">${pkg.token}</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-slate-500 font-bold"><i class="fa-regular fa-clock text-emerald-600"></i> Durasi:</span>
                                    <span class="font-black text-slate-800">${pkg.durationMinutes} Menit</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-slate-500 font-bold"><i class="fa-solid fa-list-check text-indigo-500"></i> Jumlah Soal:</span>
                                    <span class="font-black text-slate-800">${pkg.questions ? pkg.questions.length : 0} Butir</span>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-2 pt-2 border-t border-slate-100">
                            <button onclick="app.openQuestionListModal('${pkg.id}')" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-2.5 rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5">
                                <i class="fa-solid fa-eye"></i> Lihat & Kelola Soal (${pkg.questions ? pkg.questions.length : 0})
                            </button>
                            <div class="flex gap-2">
                                <button onclick="app.openAddQuestionModal('${pkg.id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 rounded-xl text-xs transition shadow flex items-center justify-center gap-1">
                                    <i class="fa-solid fa-plus-circle"></i> Tambah Soal
                                </button>
                                <button onclick="app.openEditTokenModal('${pkg.id}')" class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1">
                                    <i class="fa-solid fa-pen-to-square"></i> Edit Token
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    togglePackageStatus(pkgId) {
        const pkg = this.data.packages.find(p => p.id === pkgId);
        if (pkg) {
            pkg.isActive = !pkg.isActive;
            this.saveStore();
            this.switchGuruTab('paket');
            this.showToast(`Status ${pkg.packageName} diperbarui`, "success");
        }
    }

    openEditTokenModal(pkgId) {
        const pkg = this.data.packages.find(p => p.id === pkgId);
        if (!pkg) return;

        const newToken = prompt("Masukkan Token Ujian Baru:", pkg.token);
        if (newToken && newToken.trim()) {
            pkg.token = newToken.trim().toUpperCase();
            const newDur = prompt("Masukkan Durasi Ujian (Menit):", pkg.durationMinutes);
            if (newDur && !isNaN(newDur)) {
                pkg.durationMinutes = parseInt(newDur);
            }
            this.saveStore();
            this.switchGuruTab('paket');
            this.showToast("Token & Timer berhasil diperbarui!", "success");
        }
    }

    openQuestionListModal(pkgId) {
        const pkg = this.data.packages.find(p => p.id === pkgId);
        if (!pkg) return;

        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="max-w-4xl mx-auto bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
                <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                        <span class="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-lg">${pkg.mapel}</span>
                        <h3 class="font-extrabold text-slate-800 text-base mt-1">Daftar Soal - ${pkg.packageName}</h3>
                    </div>
                    <button onclick="app.renderDashboard()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-xl"></i></button>
                </div>

                ${(!pkg.questions || pkg.questions.length === 0) ? `
                    <div class="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                        <i class="fa-solid fa-folder-open text-3xl mb-2 text-slate-300"></i>
                        <p class="font-bold text-xs">Belum ada soal pada paket ini. Gunakan Tambah Soal Manual atau Import File (Excel/PDF/Word).</p>
                    </div>
                ` : `
                    <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                        ${pkg.questions.map((q, i) => `
                            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-start gap-3">
                                <div class="space-y-1.5 flex-1">
                                    <div class="flex items-center gap-2">
                                        <span class="bg-emerald-600 text-white font-mono text-xs px-2 py-0.5 rounded-md font-bold">No. ${i + 1}</span>
                                        <span class="bg-slate-200 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">${q.type}</span>
                                        <span class="text-[11px] text-slate-500 font-bold"><i class="fa-solid fa-star text-amber-500"></i> Bobot: ${q.score || 20}</span>
                                    </div>
                                    <p class="text-xs font-semibold text-slate-800 leading-snug">${q.text}</p>
                                </div>
                                <button onclick="app.deleteQuestionFromPackage('${pkg.id}', '${q.id}')" class="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl text-xs font-bold transition border border-red-200">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}

                <div class="flex justify-between items-center pt-2">
                    <button onclick="app.openAddQuestionModal('${pkg.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow transition">
                        <i class="fa-solid fa-plus-circle mr-1"></i> Tambah Soal Manual
                    </button>
                    <button onclick="app.renderDashboard()" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition">
                        Kembali ke Dashboard
                    </button>
                </div>
            </div>
        `;
    }

    deleteQuestionFromPackage(pkgId, qId) {
        this.showConfirmModal("Hapus Soal", "Apakah Anda yakin ingin menghapus butir soal ini dari paket?", () => {
            const pkg = this.data.packages.find(p => p.id === pkgId);
            if (pkg && pkg.questions) {
                pkg.questions = pkg.questions.filter(q => q.id !== qId);
                this.saveStore();
                this.openQuestionListModal(pkgId);
                this.showToast("Soal berhasil dihapus", "info");
            }
        });
    }

    openAddQuestionModal(pkgId) {
        const pkg = this.data.packages.find(p => p.id === pkgId);
        if (!pkg) return;

        const text = prompt("Masukkan Teks Pertanyaan Soal:");
        if (!text || !text.trim()) return;

        const optA = prompt("Opsi A:", "Opsi A");
        const optB = prompt("Opsi B:", "Opsi B");
        const optC = prompt("Opsi C:", "Opsi C");
        const optD = prompt("Opsi D:", "Opsi D");
        const key = prompt("Kunci Jawaban Tepat (Isikan A, B, C, atau D):", "A").toUpperCase().trim();

        const opts = [optA, optB, optC, optD].filter(Boolean);
        const keyMap = { A: optA, B: optB, C: optC, D: optD };

        const newQ = {
            id: 'q_' + Date.now(),
            type: 'pg',
            text: text.trim(),
            imageUrl: '',
            audioUrl: '',
            options: opts,
            correctAnswer: keyMap[key] || optA,
            score: 20
        };

        if (!pkg.questions) pkg.questions = [];
        pkg.questions.push(newQ);
        this.saveStore();
        this.showToast("Soal manual berhasil ditambahkan!", "success");
        this.openQuestionListModal(pkgId);
    }

    renderGuruMultiFormatImportPanel() {
        const myPkgs = this.data.packages.filter(p => p.guruNip === this.currentUser.id);

        return `
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5">
                <div class="border-b border-slate-100 pb-3">
                    <h3 class="font-black text-slate-800 text-base flex items-center gap-2">
                        <i class="fa-solid fa-file-arrow-up text-emerald-600 text-lg"></i> Import Soal Multi-Format (Excel, PDF, Word)
                    </h3>
                    <p class="text-xs text-slate-500 mt-0.5">Mendukung pembacaan soal otomatis dari file Spreadsheet Excel, PDF, dan Word (.docx).</p>
                </div>

                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Pilih Paket Soal Target:</label>
                    <select id="import-target-pkg" class="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 text-xs">
                        ${myPkgs.map(p => `<option value="${p.id}">${p.packageName} (Token: ${p.token})</option>`).join('')}
                    </select>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl space-y-3">
                        <div class="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                            <i class="fa-solid fa-file-excel text-emerald-600 text-xl"></i> 1. Excel / CSV (.xlsx)
                        </div>
                        <p class="text-[11px] text-slate-600 leading-snug">Format 11 kolom terpisah (Jenis_Soal, Teks, Opsi A-E, Kunci, Bobot).</p>
                        <button onclick="app.downloadQuestionTemplateExcel()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition shadow">
                            <i class="fa-solid fa-download mr-1"></i> Unduh Template Excel
                        </button>
                        <input type="file" accept=".xlsx, .xls, .csv" onchange="app.handleSpreadsheetUpload(event)" class="w-full text-[11px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-emerald-700 file:text-white file:font-bold">
                    </div>

                    <div class="bg-blue-50/60 border border-blue-200 p-4 rounded-2xl space-y-3">
                        <div class="flex items-center gap-2 text-blue-900 font-extrabold text-xs">
                            <i class="fa-solid fa-file-word text-blue-600 text-xl"></i> 2. Word (.docx)
                        </div>
                        <p class="text-[11px] text-slate-600 leading-snug">Membaca format bertingkat: 1. Soal, A. B. C. D., Kunci: A.</p>
                        <input type="file" accept=".docx" onchange="app.handleWordDocxUpload(event)" class="w-full text-[11px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white file:font-bold">
                    </div>

                    <div class="bg-purple-50/60 border border-purple-200 p-4 rounded-2xl space-y-3">
                        <div class="flex items-center gap-2 text-purple-900 font-extrabold text-xs">
                            <i class="fa-solid fa-file-pdf text-purple-600 text-xl"></i> 3. Berkas PDF (.pdf)
                        </div>
                        <p class="text-[11px] text-slate-600 leading-snug">Ekstraksi teks dari PDF & deteksi otomatis nomor dan opsi jawaban.</p>
                        <input type="file" accept=".pdf" onchange="app.handlePdfUpload(event)" class="w-full text-[11px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-purple-600 file:text-white file:font-bold">
                    </div>
                </div>

                <div id="import-preview-container" class="hidden space-y-3 pt-3 border-t border-slate-200">
                    <div class="flex justify-between items-center">
                        <h4 class="font-black text-slate-800 text-sm flex items-center gap-2">
                            <i class="fa-solid fa-list-check text-emerald-600"></i> Pratinjau Soal Terbaca (<span id="preview-count">0</span> Butir)
                        </h4>
                        <button onclick="app.commitImportedQuestions()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow transition flex items-center gap-1.5">
                            <i class="fa-solid fa-cloud-arrow-up"></i> Simpan ke Paket Soal
                        </button>
                    </div>
                    <div id="preview-questions-list" class="space-y-2 max-h-60 overflow-y-auto pr-1"></div>
                </div>
            </div>
        `;
    }

    downloadQuestionTemplateExcel() {
        const templateData = [
            ["Jenis_Soal", "Teks_Soal", "URL_Gambar", "URL_Audio", "Opsi_A", "Opsi_B", "Opsi_C", "Opsi_D", "Opsi_E", "Kunci_Jawaban", "Bobot"],
            ["pg", "Berapakah hasil dari akar kuadrat 144 x 2?", "", "", "20", "24", "28", "32", "36", "B", "20"],
            ["pg_kompleks", "Manakah dari bilangan berikut yang merupakan bilangan prima?", "", "", "2", "9", "13", "15", "17", "A,C,E", "20"],
            ["essay", "Jelaskan penerapan rumus Pythagoras dalam kehidupan sehari-hari:", "", "", "", "", "", "", "", "Koreksi Manual Guru", "20"]
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template_Soal_CBT");
        XLSX.writeFile(wb, "Template_Soal_CBT_Paket.xlsx");
        this.showToast("Template Excel (.xlsx) berhasil diunduh!", "success");
    }

    handleSpreadsheetUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                this.processImportedSpreadsheetRows(jsonRows);
            } catch (err) {
                this.showAlertModal("Gagal Membaca File", "Format file Excel/CSV tidak valid.", "fa-triangle-exclamation", "text-red-500");
            }
        };
        reader.readAsArrayBuffer(file);
    }

    processImportedSpreadsheetRows(rows) {
        if (!rows || rows.length < 2) {
            this.showToast("File tidak berisi data soal!", "warning");
            return;
        }

        this.stagedImportQuestions = [];

        for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || !r[1]) continue;

            const type = String(r[0] || 'pg').toLowerCase().trim();
            const text = String(r[1] || '').trim();
            const imageUrl = String(r[2] || '').trim();
            const audioUrl = String(r[3] || '').trim();
            const optA = String(r[4] || '').trim();
            const optB = String(r[5] || '').trim();
            const optC = String(r[6] || '').trim();
            const optD = String(r[7] || '').trim();
            const optE = String(r[8] || '').trim();
            const keyVal = String(r[9] || '').trim();
            const score = parseInt(r[10]) || 20;

            const newQ = {
                id: 'q_' + Date.now() + '_' + i,
                type: type,
                text: text,
                imageUrl: imageUrl,
                audioUrl: audioUrl,
                score: score
            };

            if (type === 'pg') {
                newQ.options = [optA, optB, optC, optD, optE].filter(Boolean);
                const keyLetter = keyVal.toUpperCase();
                const keyMap = { A: 0, B: 1, C: 2, D: 3, E: 4 };
                if (keyMap[keyLetter] !== undefined && newQ.options[keyMap[keyLetter]]) {
                    newQ.correctAnswer = newQ.options[keyMap[keyLetter]];
                } else {
                    newQ.correctAnswer = keyVal || optA;
                }
            } else if (type === 'pg_kompleks') {
                newQ.options = [optA, optB, optC, optD, optE].filter(Boolean);
                const keys = keyVal.split(',').map(k => k.trim().toUpperCase());
                const keyMap = { A: 0, B: 1, C: 2, D: 3, E: 4 };
                const correctArr = [];

                keys.forEach(k => {
                    if (keyMap[k] !== undefined && newQ.options[keyMap[k]]) {
                        correctArr.push(newQ.options[keyMap[k]]);
                    } else if (newQ.options.includes(k)) {
                        correctArr.push(k);
                    }
                });

                newQ.correctAnswer = correctArr.length > 0 ? correctArr : [newQ.options[0]];
            } else {
                newQ.correctAnswer = keyVal || 'Koreksi Manual Guru';
            }

            this.stagedImportQuestions.push(newQ);
        }

        this.renderStagedImportPreview();
    }

    handleWordDocxUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            if (window.mammoth) {
                mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                    .then(result => {
                        this.parseRawDocumentText(result.value);
                    })
                    .catch(err => {
                        this.showAlertModal("Gagal Ekstraksi Word", "Dokumen Word tidak dapat diproses.", "fa-file-word", "text-red-500");
                    });
            } else {
                this.showToast("Pustaka Mammoth.js belum dimuat penuh", "error");
            }
        };
        reader.readAsArrayBuffer(file);
    }

    handlePdfUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const typedarray = new Uint8Array(e.target.result);
            if (window.pdfjsLib) {
                pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                    let fullText = '';
                    let countPromises = [];

                    for (let i = 1; i <= pdf.numPages; i++) {
                        countPromises.push(
                            pdf.getPage(i).then(page => {
                                return page.getTextContent().then(textContent => {
                                    const pageText = textContent.items.map(item => item.str).join(' ');
                                    fullText += pageText + '\n';
                                });
                            })
                        );
                    }

                    Promise.all(countPromises).then(() => {
                        this.parseRawDocumentText(fullText);
                    });
                }).catch(err => {
                    this.showAlertModal("Gagal Ekstraksi PDF", "Gagal membaca struktur PDF.", "fa-file-pdf", "text-red-500");
                });
            } else {
                this.showToast("Pustaka PDF.js belum dimuat penuh", "error");
            }
        };
        reader.readAsArrayBuffer(file);
    }

    parseRawDocumentText(text) {
        if (!text || !text.trim()) {
            this.showToast("Tidak ada teks yang dapat diekstraksi dari dokumen.", "warning");
            return;
        }

        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        this.stagedImportQuestions = [];

        let currentQ = null;

        lines.forEach((line, idx) => {
            const qMatch = line.match(/^(\d+)[\.\)]\s*(.+)/i) || line.match(/^Soal\s*\d+[:\.]?\s*(.+)/i);
            if (qMatch) {
                if (currentQ && currentQ.text) {
                    this.stagedImportQuestions.push(currentQ);
                }
                currentQ = {
                    id: 'q_doc_' + Date.now() + '_' + idx,
                    type: 'pg',
                    text: qMatch[1] ? (isNaN(qMatch[1]) ? qMatch[1] : qMatch[2]) : line,
                    options: [],
                    correctAnswer: '',
                    score: 20
                };
                return;
            }

            const optMatch = line.match(/^[A-E][\.\)]\s*(.+)/i);
            if (optMatch && currentQ) {
                currentQ.options.push(optMatch[1].trim());
                return;
            }

            const keyMatch = line.match(/^(Kunci|Jawaban|Answer)[:\s]*([A-E])/i);
            if (keyMatch && currentQ) {
                const letter = keyMatch[2].toUpperCase();
                const keyMap = { A: 0, B: 1, C: 2, D: 3, E: 4 };
                if (keyMap[letter] !== undefined && currentQ.options[keyMap[letter]]) {
                    currentQ.correctAnswer = currentQ.options[keyMap[letter]];
                }
                return;
            }

            if (currentQ) {
                currentQ.text += ' ' + line;
            }
        });

        if (currentQ && currentQ.text) {
            this.stagedImportQuestions.push(currentQ);
        }

        this.stagedImportQuestions.forEach(q => {
            if (!q.correctAnswer && q.options.length > 0) {
                q.correctAnswer = q.options[0];
            }
            if (q.options.length === 0) {
                q.type = 'essay';
                q.correctAnswer = 'Koreksi Manual Guru';
            }
        });

        this.renderStagedImportPreview();
    }

    renderStagedImportPreview() {
        if (this.stagedImportQuestions.length === 0) {
            this.showToast("Tidak ada butir soal valid yang dapat terbaca.", "warning");
            return;
        }

        document.getElementById('preview-count').innerText = this.stagedImportQuestions.length;
        const listEl = document.getElementById('preview-questions-list');
        listEl.innerHTML = this.stagedImportQuestions.map((q, idx) => `
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                <div>
                    <span class="font-bold text-emerald-700 font-mono">#${idx+1} [${q.type.toUpperCase()}]</span>
                    <span class="font-semibold text-slate-800 ml-2">${q.text.substring(0, 60)}...</span>
                </div>
                <span class="font-bold text-slate-500">Opsi: ${q.options ? q.options.length : 0}</span>
            </div>
        `).join('');

        document.getElementById('import-preview-container').classList.remove('hidden');
        this.showToast(`Berhasil membaca ${this.stagedImportQuestions.length} butir soal!`, "success");
    }

    commitImportedQuestions() {
        const pkgId = document.getElementById('import-target-pkg').value;
        const pkg = this.data.packages.find(p => p.id === pkgId);

        if (!pkg) return;
        if (!pkg.questions) pkg.questions = [];

        pkg.questions.push(...this.stagedImportQuestions);
        this.saveStore();

        this.showToast(`Berhasil menyimpan ${this.stagedImportQuestions.length} soal ke ${pkg.packageName}!`, "success");
        this.stagedImportQuestions = [];
        this.switchGuruTab('paket');
    }

    renderGuruMonitoringPanel() {
        const logs = this.data.cheatingLogs;

        return `
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                        <h3 class="font-black text-slate-800 text-base flex items-center gap-2">
                            <i class="fa-solid fa-triangle-exclamation text-red-500"></i> Log Monitoring Kecurangan Real-Time
                        </h3>
                        <p class="text-xs text-slate-500 mt-0.5">Mencatat aktivitas keluar tab, split-screen, dan kehilangan fokus peserta ujian.</p>
                    </div>
                    <button onclick="app.clearCheatingLogs()" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition">
                        <i class="fa-solid fa-trash mr-1"></i> Bersihkan Log
                    </button>
                </div>

                ${logs.length === 0 ? `
                    <div class="p-8 text-center text-slate-400 border border-slate-200 rounded-2xl">
                        <i class="fa-solid fa-shield-cat text-4xl mb-2 text-emerald-400"></i>
                        <p class="font-bold text-xs text-slate-600">Tidak ada indikasi kecurangan terdeteksi.</p>
                    </div>
                ` : `
                    <div class="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                    <th class="p-3">Waktu</th>
                                    <th class="p-3">NIS</th>
                                    <th class="p-3">Nama Murid</th>
                                    <th class="p-3">Paket Soal</th>
                                    <th class="p-3">Jenis Pelanggaran</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                                ${logs.map(log => `
                                    <tr class="hover:bg-red-50/50 transition">
                                        <td class="p-3 font-mono text-slate-500">${log.timestamp}</td>
                                        <td class="p-3 font-mono font-bold text-slate-800">${log.nis}</td>
                                        <td class="p-3 font-bold text-slate-800">${log.studentName}</td>
                                        <td class="p-3 text-slate-600">${log.packageName}</td>
                                        <td class="p-3"><span class="bg-red-100 text-red-800 font-extrabold px-2.5 py-1 rounded-lg text-[11px]">${log.reason}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    }

    clearCheatingLogs() {
        this.showConfirmModal("Bersihkan Log", "Apakah Anda yakin ingin menghapus semua catatan kecurangan?", () => {
            this.data.cheatingLogs = [];
            this.saveStore();
            this.switchGuruTab('monitor');
            this.showToast("Log kecurangan dibersihkan", "info");
        });
    }

    renderGuruResultsPanel() {
        const results = this.data.examResults;

        return `
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
                <div class="border-b border-slate-100 pb-3">
                    <h3 class="font-black text-slate-800 text-base flex items-center gap-2">
                        <i class="fa-solid fa-square-poll-vertical text-emerald-600"></i> Hasil Ujian Murid & Koreksi Essay
                    </h3>
                    <p class="text-xs text-slate-500 mt-0.5">Penilaian objektif terhitung otomatis. Berikan skor manual untuk soal essay.</p>
                </div>

                ${results.length === 0 ? `
                    <div class="p-8 text-center text-slate-400 border border-slate-200 rounded-2xl">
                        <i class="fa-solid fa-inbox text-4xl mb-2 text-slate-300"></i>
                        <p class="font-bold text-xs">Belum ada murid yang menyerahkan hasil ujian.</p>
                    </div>
                ` : `
                    <div class="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                    <th class="p-3">Waktu Selesai</th>
                                    <th class="p-3">NIS & Nama Murid</th>
                                    <th class="p-3">Paket Soal</th>
                                    <th class="p-3">Skor Otomatis</th>
                                    <th class="p-3">Skor Essay</th>
                                    <th class="p-3">Total Nilai</th>
                                    <th class="p-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                                ${results.map((r, i) => {
                                    const total = (r.autoScore || 0) + (r.essayGrade || 0);
                                    return `
                                        <tr class="hover:bg-slate-50 transition">
                                            <td class="p-3 font-mono text-slate-500">${r.submittedAt}</td>
                                            <td class="p-3">
                                                <div class="font-bold text-slate-800">${r.studentName}</div>
                                                <div class="font-mono text-[10px] text-slate-400">NIS: ${r.nis}</div>
                                            </td>
                                            <td class="p-3 text-slate-600">${r.packageName}</td>
                                            <td class="p-3 font-mono font-bold text-emerald-700">${r.autoScore}</td>
                                            <td class="p-3 font-mono font-bold text-amber-600">${r.essayGrade || 0}</td>
                                            <td class="p-3 font-mono font-black text-slate-900 text-sm bg-emerald-50">${total}</td>
                                            <td class="p-3 text-center">
                                                <button onclick="app.openGradeEssayModal(${i})" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow transition">
                                                    Koreksi Essay
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    }

    openGradeEssayModal(resultIndex) {
        const res = this.data.examResults[resultIndex];
        if (!res) return;

        const pkg = this.data.packages.find(p => p.id === res.packageId);
        const essayQuestions = pkg ? pkg.questions.filter(q => q.type === 'essay') : [];

        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div class="max-w-2xl mx-auto bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-4">
                <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                        <h3 class="font-black text-slate-800 text-base">Koreksi Jawaban Essay</h3>
                        <p class="text-xs text-slate-500">${res.studentName} (${res.nis}) • ${res.packageName}</p>
                    </div>
                    <button onclick="app.renderDashboard()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-xl"></i></button>
                </div>

                ${essayQuestions.length === 0 ? `
                    <p class="text-xs text-slate-500 italic">Tidak ada soal essay pada paket ujian ini.</p>
                ` : `
                    <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        ${essayQuestions.map(eq => `
                            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                                <span class="font-extrabold text-emerald-800 block">Pertanyaan: ${eq.text}</span>
                                <div class="bg-white p-3 rounded-xl border border-slate-200 font-medium text-slate-800">
                                    <span class="text-[10px] font-bold text-slate-400 block mb-1">Jawaban Murid:</span>
                                    ${res.answers && res.answers[eq.id] ? res.answers[eq.id] : '<span class="text-red-400 italic">(Tidak Menjawab)</span>'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}

                <div class="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs space-y-2">
                    <label class="block font-extrabold text-amber-900">Masukkan Tambahan Nilai Essay (Maksimal ${essayQuestions.length * 20}):</label>
                    <input type="number" id="essay-grade-input" value="${res.essayGrade || 0}" class="w-full p-3 bg-white border border-amber-300 rounded-xl font-mono text-base font-black text-slate-800 focus:ring-2 focus:ring-amber-500">
                </div>

                <div class="flex gap-2 pt-2">
                    <button onclick="app.renderDashboard()" class="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-xs">Batal</button>
                    <button onclick="app.saveEssayGrade(${resultIndex})" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs shadow">Simpan Nilai Essay</button>
                </div>
            </div>
        `;
    }

    saveEssayGrade(resultIndex) {
        const val = parseInt(document.getElementById('essay-grade-input').value) || 0;
        if (this.data.examResults[resultIndex]) {
            this.data.examResults[resultIndex].essayGrade = val;
            this.saveStore();
            this.showToast("Nilai essay berhasil diperbarui!", "success");
            this.renderDashboard();
        }
    }

    renderMuridDashboard() {
        if (this.activeExam && !this.activeExam.submitted) {
            this.renderExamWorkspace();
            return;
        }

        const activePackages = this.data.packages.filter(p => p.isActive);
        const container = document.getElementById('app-container');

        container.innerHTML = `
            <div class="space-y-4">
                <div class="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-lg flex justify-between items-center">
                    <div>
                        <span class="bg-white/20 text-[11px] px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">Dashboard Murid</span>
                        <h2 class="text-xl font-black mt-1.5">${this.currentUser.name}</h2>
                        <p class="text-xs text-emerald-100 mt-0.5">Pilih paket soal aktif & minta Token resmi kepada Guru Pengawas.</p>
                    </div>
                    <i class="fa-solid fa-mobile-screen-button text-4xl text-emerald-200 opacity-80 hidden sm:block"></i>
                </div>

                <h3 class="font-black text-slate-800 text-sm flex items-center gap-2">
                    <i class="fa-solid fa-file-pen text-emerald-600"></i> Daftar Ujian & Paket Soal Aktif
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${activePackages.length === 0 ? `
                        <div class="col-span-full bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200">
                            <i class="fa-solid fa-folder-open text-4xl mb-2 text-slate-300"></i>
                            <p class="font-bold text-sm">Belum ada paket soal yang diaktifkan oleh Guru Pengampu.</p>
                        </div>
                    ` : activePackages.map(pkg => `
                        <div class="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 hover:shadow-md transition space-y-3.5">
                            <div class="flex justify-between items-start">
                                <span class="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-xl">${pkg.mapel}</span>
                                <span class="text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-xl"><i class="fa-regular fa-clock text-emerald-600"></i> ${pkg.durationMinutes} Menit</span>
                            </div>
                            <div>
                                <h4 class="font-black text-slate-800 text-base leading-snug">${pkg.packageName}</h4>
                                <p class="text-xs text-slate-500 mt-1 font-medium"><i class="fa-solid fa-user-tie text-emerald-600"></i> Pengampu: ${this.getGuruName(pkg.guruNip)}</p>
                            </div>

                            <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs flex justify-between items-center">
                                <span class="text-slate-600 font-bold"><i class="fa-solid fa-list-check text-emerald-600"></i> Jumlah Soal:</span>
                                <span class="font-black text-slate-800">${pkg.questions ? pkg.questions.length : 0} Butir Soal</span>
                            </div>
                            
                            <button onclick="app.openTokenModal('${pkg.id}')" class="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold py-3 rounded-2xl text-xs transition shadow-md flex items-center justify-center gap-2">
                                <i class="fa-solid fa-key text-amber-300"></i> Input Token & Mulai Ujian
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getGuruName(nip) {
        const g = this.data.users.find(u => u.id === nip);
        return g ? g.name : 'Guru Pengampu';
    }

    openTokenModal(pkgId) {
        const pkg = this.data.packages.find(p => p.id === pkgId);
        if (!pkg) return;

        if (!pkg.questions || pkg.questions.length === 0) {
            this.showAlertModal("Ujian Belum Siap", "Paket soal ini belum memiliki butir soal yang diunggah oleh guru.", "fa-folder-open", "text-amber-500");
            return;
        }

        this.targetTokenPkg = pkg;
        document.getElementById('token-modal-pkg-name').innerText = pkg.packageName;
        document.getElementById('token-modal-meta').innerText = `${pkg.mapel} • Durasi: ${pkg.durationMinutes} Menit (${pkg.questions.length} Soal)`;
        document.getElementById('token-input-field').value = '';
        document.getElementById('token-modal').classList.remove('hidden');
    }

    closeTokenModal() {
        document.getElementById('token-modal').classList.add('hidden');
        this.targetTokenPkg = null;
    }

    submitExamToken() {
        if (!this.targetTokenPkg) return;
        const inputVal = document.getElementById('token-input-field').value.trim().toUpperCase();

        if (!inputVal) {
            this.showToast("Ketikkan Token Ujian terlebih dahulu!", "warning");
            return;
        }

        if (inputVal !== this.targetTokenPkg.token.toUpperCase()) {
            this.showToast("TOKEN SALAH! Minta token yang tepat kepada Guru Pengawas.", "error");
            return;
        }

        const pkgToStart = this.targetTokenPkg;
        this.closeTokenModal();
        this.startExamSession(pkgToStart);
    }

    startExamSession(pkg) {
        this.violations = 0;
        this.activeExam = {
            package: pkg,
            answers: {},
            flagged: {},
            currentIdx: 0,
            remainingSeconds: pkg.durationMinutes * 60,
            submitted: false
        };

        pkg.questions.forEach(q => {
            if (q.type === 'pg_kompleks') this.activeExam.answers[q.id] = [];
            else if (q.type === 'mengurutkan') this.activeExam.answers[q.id] = [...(q.items || [])];
            else if (q.type === 'menjodohkan') this.activeExam.answers[q.id] = {};
            else this.activeExam.answers[q.id] = '';
        });

        const wm = document.getElementById('watermark-overlay');
        wm.innerText = `CBT SAFE • ${this.currentUser.id} • ${this.currentUser.name}`;
        wm.classList.remove('hidden');

        this.startTimer();
        this.renderExamWorkspace();
        this.showToast("Ujian Dimulai! Keamanan Safe Exam Aktif.", "success");
    }

    startTimer() {
        clearInterval(this.examTimerInterval);
        this.examTimerInterval = setInterval(() => {
            if (!this.activeExam || this.activeExam.submitted) {
                clearInterval(this.examTimerInterval);
                return;
            }

            this.activeExam.remainingSeconds--;
            this.updateTimerDisplay();

            if (this.activeExam.remainingSeconds <= 0) {
                clearInterval(this.examTimerInterval);
                this.showAlertModal("Waktu Habis!", "Waktu pengerjaan ujian telah selesai. Jawaban Anda disimpan otomatis.", "fa-clock", "text-amber-500");
                this.forceSubmitExam("TIMEOUT");
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerEl = document.getElementById('exam-timer-badge');
        if (!timerEl) return;

        const sec = this.activeExam.remainingSeconds;
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        
        timerEl.innerText = formatted;

        if (sec <= 300) {
            timerEl.classList.add('timer-warning');
        }
    }

    renderExamWorkspace() {
        const container = document.getElementById('app-container');
        const exam = this.activeExam;
        const questions = exam.package.questions;
        const q = questions[exam.currentIdx];

        container.innerHTML = `
            <div class="space-y-4 max-w-4xl mx-auto">
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-3">
                    <div>
                        <span class="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-lg uppercase">${exam.package.mapel}</span>
                        <h3 class="font-extrabold text-slate-800 text-sm mt-1">${exam.package.packageName}</h3>
                    </div>

                    <div class="flex items-center gap-2">
                        <div id="exam-timer-badge" class="bg-slate-100 border border-slate-300 text-slate-800 font-mono text-base font-black px-3.5 py-1.5 rounded-xl shadow-inner flex items-center gap-1.5">
                            <i class="fa-solid fa-hourglass-half text-amber-500"></i> 00:00
                        </div>
                        <button onclick="app.toggleQuestionDrawer()" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                            <i class="fa-solid fa-grip text-emerald-600"></i> Soal (${exam.currentIdx + 1}/${questions.length})
                        </button>
                    </div>
                </div>

                <div id="question-drawer" class="hidden bg-white rounded-2xl p-4 shadow-md border border-slate-200">
                    <p class="text-xs font-bold text-slate-700 mb-2">Navigasi Nomor Soal:</p>
                    <div class="grid grid-cols-5 sm:grid-cols-10 gap-2">
                        ${questions.map((item, idx) => {
                            const isCurrent = idx === exam.currentIdx;
                            const isAnswered = this.isQuestionAnswered(item);
                            const isFlagged = exam.flagged[item.id];

                            let bg = "bg-slate-100 text-slate-700 border-slate-200";
                            if (isFlagged) bg = "bg-amber-400 text-slate-900 border-amber-500 font-extrabold";
                            else if (isAnswered) bg = "bg-emerald-600 text-white border-emerald-700 font-extrabold";
                            if (isCurrent) bg += " ring-4 ring-emerald-300";

                            return `
                                <button onclick="app.jumpToQuestion(${idx})" class="${bg} py-2 rounded-xl text-xs border font-mono transition">
                                    ${idx + 1}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="bg-white rounded-3xl p-5 sm:p-7 shadow-md border border-slate-200 space-y-5">
                    <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                        <span class="font-extrabold text-emerald-700 text-sm">Soal Nomor ${exam.currentIdx + 1}</span>
                        <label class="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                            <input type="checkbox" onchange="app.toggleFlagQuestion('${q.id}')" ${exam.flagged[q.id] ? 'checked' : ''} class="w-4 h-4 rounded text-amber-500">
                            <span><i class="fa-solid fa-flag"></i> Ragu-Ragu</span>
                        </label>
                    </div>

                    ${q.imageUrl ? `
                        <div class="bg-slate-50 p-2 rounded-2xl border border-slate-200 text-center">
                            <img src="${q.imageUrl}" onclick="app.openLightbox('${q.imageUrl}')" class="max-h-60 mx-auto rounded-xl object-contain cursor-pointer hover:opacity-90 transition">
                            <p class="text-[10px] text-slate-400 font-bold mt-1"><i class="fa-solid fa-magnifying-glass-plus"></i> Klik gambar untuk memperbesar</p>
                        </div>
                    ` : ''}

                    ${q.audioUrl ? `
                        <div class="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 space-y-1.5">
                            <span class="text-xs font-extrabold text-purple-900 block"><i class="fa-solid fa-volume-high text-purple-600"></i> Pemutar Audio Soal:</span>
                            <audio controls class="w-full h-9">
                                <source src="${q.audioUrl}" type="audio/mpeg">
                                Browser tidak mendukung pemutar audio.
                            </audio>
                        </div>
                    ` : ''}

                    <div class="text-sm font-semibold text-slate-800 leading-relaxed">
                        ${q.text}
                    </div>

                    <div class="pt-2">
                        ${this.renderQuestionInputControls(q)}
                    </div>
                </div>

                <div class="flex justify-between items-center gap-2">
                    <button onclick="app.prevQuestion()" ${exam.currentIdx === 0 ? 'disabled class="opacity-50 cursor-not-allowed bg-slate-200 text-slate-400 px-4 py-3 rounded-2xl font-bold text-xs"' : 'class="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-2xl font-extrabold text-xs shadow transition flex items-center gap-1.5"'}>
                        <i class="fa-solid fa-arrow-left"></i> Sebelum
                    </button>

                    ${exam.currentIdx === questions.length - 1 ? `
                        <button onclick="app.confirmFinishExam()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-extrabold text-xs shadow-lg transition active:scale-95 flex items-center gap-1.5">
                            <i class="fa-solid fa-circle-check text-amber-300"></i> Selesaikan Ujian
                        </button>
                    ` : `
                        <button onclick="app.nextQuestion()" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-extrabold text-xs shadow-md transition flex items-center gap-1.5">
                            Berikut <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    `}
                </div>
            </div>
        `;

        this.updateTimerDisplay();
    }

    renderQuestionInputControls(q) {
        const exam = this.activeExam;
        const currentAns = exam.answers[q.id];

        if (q.type === 'pg') {
            return `
                <div class="space-y-2">
                    ${(q.options || []).map((opt, i) => {
                        const isChecked = currentAns === opt;
                        return `
                            <label onclick="app.saveAnswer('${q.id}', '${opt.replace(/'/g, "\\'")}')" class="flex items-center gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${isChecked ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-900 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'}">
                                <input type="radio" name="pg_${q.id}" ${isChecked ? 'checked' : ''} class="w-4 h-4 text-emerald-600 focus:ring-emerald-500">
                                <span class="text-xs">${String.fromCharCode(65 + i)}. ${opt}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            `;
        }

        if (q.type === 'pg_kompleks') {
            const selectedArr = Array.isArray(currentAns) ? currentAns : [];
            return `
                <div class="space-y-2">
                    <p class="text-[11px] text-emerald-700 font-extrabold mb-1"><i class="fa-solid fa-square-check"></i> Pilih satu atau lebih opsi jawaban:</p>
                    ${(q.options || []).map((opt, i) => {
                        const isChecked = selectedArr.includes(opt);
                        return `
                            <label onclick="app.togglePgKompleksAnswer('${q.id}', '${opt.replace(/'/g, "\\'")}')" class="flex items-center gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${isChecked ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-900 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'}">
                                <input type="checkbox" ${isChecked ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500">
                                <span class="text-xs">${String.fromCharCode(65 + i)}. ${opt}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            `;
        }

        if (q.type === 'mengurutkan') {
            const items = Array.isArray(currentAns) && currentAns.length > 0 ? currentAns : [...(q.items || [])];
            return `
                <div class="space-y-2">
                    <p class="text-[11px] text-emerald-700 font-extrabold mb-1"><i class="fa-solid fa-arrow-down-short-wide"></i> Gunakan tombol Panah untuk mengurutkan item dari atas ke bawah:</p>
                    ${items.map((item, idx) => `
                        <div class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-800">
                            <span class="flex items-center gap-2">
                                <span class="bg-emerald-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-mono">${idx + 1}</span>
                                ${item}
                            </span>
                            <div class="flex gap-1">
                                <button onclick="app.moveOrderItem('${q.id}', ${idx}, -1)" ${idx === 0 ? 'disabled class="opacity-30"' : ''} class="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs">
                                    <i class="fa-solid fa-arrow-up"></i>
                                </button>
                                <button onclick="app.moveOrderItem('${q.id}', ${idx}, 1)" ${idx === items.length - 1 ? 'disabled class="opacity-30"' : ''} class="p-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs">
                                    <i class="fa-solid fa-arrow-down"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (q.type === 'menjodohkan') {
            const pairs = q.pairs || [];
            const rightOptions = pairs.map(p => p.right);
            const userPairMap = typeof currentAns === 'object' && currentAns !== null ? currentAns : {};

            return `
                <div class="space-y-3">
                    <p class="text-[11px] text-emerald-700 font-extrabold mb-1"><i class="fa-solid fa-right-left"></i> Pasangkan item sebelah kiri dengan opsi sebelah kanan:</p>
                    ${pairs.map((p, idx) => `
                        <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                            <span class="text-xs font-extrabold text-slate-800 block">${idx + 1}. ${p.left}</span>
                            <select onchange="app.saveMatchingAnswer('${q.id}', '${p.left.replace(/'/g, "\\'")}', this.value)" class="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500">
                                <option value="">-- Pilih Pasangan Jawaban --</option>
                                ${rightOptions.map(rOpt => `
                                    <option value="${rOpt}" ${userPairMap[p.left] === rOpt ? 'selected' : ''}>${rOpt}</option>
                                `).join('')}
                            </select>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (q.type === 'essay') {
            return `
                <div class="space-y-2">
                    <label class="block text-xs font-extrabold text-emerald-800">Tuliskan Jawaban Uraian / Essay Anda:</label>
                    <textarea oninput="app.saveAnswer('${q.id}', this.value)" placeholder="Ketik jawaban lengkap di sini..." class="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 min-h-[120px] focus:bg-white transition">${currentAns || ''}</textarea>
                </div>
            `;
        }

        return '';
    }

    isQuestionAnswered(q) {
        const ans = this.activeExam.answers[q.id];
        if (!ans) return false;
        if (Array.isArray(ans)) return ans.length > 0;
        if (typeof ans === 'object') return Object.keys(ans).length > 0;
        return String(ans).trim().length > 0;
    }

    toggleQuestionDrawer() {
        const el = document.getElementById('question-drawer');
        if (el) el.classList.toggle('hidden');
    }

    jumpToQuestion(idx) {
        this.activeExam.currentIdx = idx;
        this.renderExamWorkspace();
    }

    toggleFlagQuestion(qId) {
        this.activeExam.flagged[qId] = !this.activeExam.flagged[qId];
        this.renderExamWorkspace();
    }

    saveAnswer(qId, val) {
        this.activeExam.answers[qId] = val;
    }

    togglePgKompleksAnswer(qId, val) {
        if (!Array.isArray(this.activeExam.answers[qId])) {
            this.activeExam.answers[qId] = [];
        }
        const arr = this.activeExam.answers[qId];
        const idx = arr.indexOf(val);
        if (idx >= 0) arr.splice(idx, 1);
        else arr.push(val);

        this.renderExamWorkspace();
    }

    moveOrderItem(qId, idx, direction) {
        const items = this.activeExam.answers[qId];
        if (!Array.isArray(items)) return;

        const targetIdx = idx + direction;
        if (targetIdx < 0 || targetIdx >= items.length) return;

        const temp = items[idx];
        items[idx] = items[targetIdx];
        items[targetIdx] = temp;

        this.renderExamWorkspace();
    }

    saveMatchingAnswer(qId, leftKey, rightVal) {
        if (typeof this.activeExam.answers[qId] !== 'object' || this.activeExam.answers[qId] === null) {
            this.activeExam.answers[qId] = {};
        }
        this.activeExam.answers[qId][leftKey] = rightVal;
    }

    prevQuestion() {
        if (this.activeExam.currentIdx > 0) {
            this.activeExam.currentIdx--;
            this.renderExamWorkspace();
        }
    }

    nextQuestion() {
        const questions = this.activeExam.package.questions;
        if (this.activeExam.currentIdx < questions.length - 1) {
            this.activeExam.currentIdx++;
            this.renderExamWorkspace();
        }
    }

    openLightbox(imgSrc) {
        document.getElementById('lightbox-img').src = imgSrc;
        document.getElementById('lightbox-modal').classList.remove('hidden');
    }

    closeLightbox() {
        document.getElementById('lightbox-modal').classList.add('hidden');
    }

    confirmFinishExam() {
        this.showConfirmModal("Selesaikan Ujian", "Apakah Anda yakin ingin menyerahkan semua jawaban ujian?", () => {
            this.forceSubmitExam("SUBMIT_USER");
        });
    }

    forceSubmitExam(reasonType) {
        if (!this.activeExam || this.activeExam.submitted) return;

        clearInterval(this.examTimerInterval);
        this.activeExam.submitted = true;

        let autoScore = 0;
        const questions = this.activeExam.package.questions || [];

        questions.forEach(q => {
            const userAns = this.activeExam.answers[q.id];
            const qScore = q.score || 20;

            if (q.type === 'pg') {
                if (userAns === q.correctAnswer) autoScore += qScore;
            } else if (q.type === 'pg_kompleks') {
                const correctArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
                const userArr = Array.isArray(userAns) ? userAns : [];

                if (correctArr.length === userArr.length && correctArr.every(val => userArr.includes(val))) {
                    autoScore += qScore;
                }
            } else if (q.type === 'mengurutkan') {
                const correctItems = q.correctAnswer || q.items || [];
                const userItems = Array.isArray(userAns) ? userAns : [];

                if (JSON.stringify(correctItems) === JSON.stringify(userItems)) {
                    autoScore += qScore;
                }
            } else if (q.type === 'menjodohkan') {
                const pairs = q.pairs || [];
                let correctCount = 0;
                const userPairMap = typeof userAns === 'object' && userAns !== null ? userAns : {};

                pairs.forEach(p => {
                    if (userPairMap[p.left] === p.right) correctCount++;
                });

                if (pairs.length > 0) {
                    autoScore += Math.round((correctCount / pairs.length) * qScore);
                }
            }
        });

        const resultRecord = {
            nis: this.currentUser.id,
            studentName: this.currentUser.name,
            packageId: this.activeExam.package.id,
            packageName: this.activeExam.package.packageName,
            autoScore: autoScore,
            essayGrade: 0,
            answers: this.activeExam.answers,
            status: reasonType,
            submittedAt: new Date().toLocaleTimeString('id-ID')
        };

        this.data.examResults.unshift(resultRecord);
        this.saveStore();

        // Optional: Sync to Google Apps Script Backend if configured
        if (typeof GAS_API_URL !== 'undefined' && GAS_API_URL.trim().length > 0) {
            fetch(GAS_API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resultRecord)
            }).catch(e => console.error("GAS Sync error:", e));
        }

        document.getElementById('watermark-overlay').classList.add('hidden');
        this.activeExam = null;

        this.showAlertModal("Ujian Selesai!", `Jawaban Anda berhasil diserahkan. Nilai Objektif Otomatis Anda: ${autoScore}`, "fa-circle-check", "text-emerald-600");
        this.renderDashboard();
    }
}

// Global App Initialization
const app = new CBTApp();
document.addEventListener('DOMContentLoaded', () => {
    app.renderDashboard();
});
