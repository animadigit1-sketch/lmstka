// ==========================================
// FILE: admin.js
// FUNGSI: Logika Dashboard Admin & Studio Soal
// ==========================================

function prosesLoginAdmin(e) {
    e.preventDefault();
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    if(user === 'admin' && pass === 'ses123') {
        document.getElementById('adminLoginScreen').style.display = 'none';
        tampilkanToast("Selamat Datang, Admin SES!");
    } else {
        sesAlert("Akses Ditolak!", "Username atau Password Anda salah. Silakan coba lagi.", "fas fa-shield-alt", "#ef4444");
    }
}

function togglePasswordAdmin() {
    const inputPass = document.getElementById("adminPass");
    const iconMata = document.getElementById("iconMataAdmin");
    if (inputPass.type === "password") {
        inputPass.type = "text"; 
        iconMata.classList.replace("fa-eye", "fa-eye-slash"); 
        iconMata.style.color = "var(--ses-blue)"; 
    } else {
        inputPass.type = "password"; 
        iconMata.classList.replace("fa-eye-slash", "fa-eye"); 
        iconMata.style.color = "var(--text-muted)";
    }
}

function tampilkanToast(pesan, tipe = "success") {
    const toast = document.getElementById('toast');
    toast.textContent = pesan;
    toast.style.background = tipe === "error" ? "#ef4444" : "#10b981";
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function gantiMenu(idMenu, element) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
    document.getElementById(`view-${idMenu}`).classList.add('active');
    element.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    muatAntreanPendaftar();
    muatPesertaAktif();
    muatDataPaket();
    muatDataKeuangan();
    muatGaleriGambar(); 
    
    setTimeout(() => {
        renderGrafikTrend();
        muatMiniLeaderboard();
        muatAktivitasTerkini();
    }, 500); 
});

let jumlahAntreanSebelumnya = 0; 
let inisialisasiAwal = true;

// ==========================================
// FUNGSI ADMIN: MUAT ANTREAN PENDAFTAR (DIREVISI)
// ==========================================
function muatAntreanPendaftar() {
    // SEKARANG MEMBACA DARI KOLEKSI 'leads' SESUAI DAFTAR.JS
    db.collection("leads")
      .where("status", "in", ["Lead Baru", "Sedang Chat", "Demo Produk", "Negosiasi", "Menunggu Verifikasi", "Belum Bayar"])
      .onSnapshot(snap => {
        const tbody = document.getElementById('tabelAntrean');
        const badgeSidebar = document.getElementById('badgeAntrean');
        const badgeLonceng = document.getElementById('loncengBadge'); 
        
        const dashCount = document.getElementById('dashCountAntrean');
        if(dashCount) dashCount.textContent = snap.size;
        
        if(!tbody) return;
        tbody.innerHTML = '';
        const jumlahSekarang = snap.size;

        if (jumlahSekarang > 0) {
            if (badgeSidebar) { badgeSidebar.style.display = 'inline-block'; badgeSidebar.textContent = jumlahSekarang; }
            if (badgeLonceng) { badgeLonceng.style.display = 'inline-block'; badgeLonceng.textContent = jumlahSekarang; }
            
            if (!inisialisasiAwal && jumlahSekarang > jumlahAntreanSebelumnya) {
                tampilkanToast("🔔 Ada Pendaftar Baru Masuk!");
                // mainkanSuaraNotifikasi(); // Aktifkan jika Anda punya fungsi audio
            }
        } else {
            if (badgeSidebar) badgeSidebar.style.display = 'none';
            if (badgeLonceng) badgeLonceng.style.display = 'none';
        }
        
        jumlahAntreanSebelumnya = jumlahSekarang;
        inisialisasiAwal = false;

        if(snap.empty) {
            return tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px;">Belum ada antrean pendaftar baru.</td></tr>';
        }
        
        snap.forEach(doc => {
            const d = doc.data(); 
            const idDoc = doc.id;
            const fotoHtml = d.fotoProfilUrl ? `<img src="${d.fotoProfilUrl}" class="avatar-img" alt="Foto">` : `<div class="avatar-img" style="background:#e2e8f0; display:flex; align-items:center; justify-content:center;"><i class="fas fa-user"></i></div>`;
            
            // Logika Status Bayar (Mengikuti field baru di daftar.js)
            let statusHtml = (d.statusPembayaran === 'sudah' || d.status === 'Menunggu Verifikasi') 
                ? `<span class="badge badge-success"><i class="fas fa-check-circle"></i> Sudah Bayar</span><br>${d.buktiBayarUrl ? `<a href="${d.buktiBayarUrl}" target="_blank" style="font-size:0.8rem; color:var(--ses-blue); text-decoration:none; font-weight:bold; margin-top:5px; display:inline-block;"><i class="fas fa-external-link-alt"></i> Cek Bukti</a>` : ''}` 
                : `<span class="badge badge-warning"><i class="fas fa-clock"></i> Belum Bayar</span>`;

            // Menarik pilihan tipe akses (tier)
            const tier = d.tipeAkses || "Premium";
            
            // MENGGUNAKAN NAMA FIELD BARU: namaProspek, minatProduk
            const namaSiswa = d.namaProspek || d.namaPeserta || "Anonim";
            const namaPaket = d.minatProduk || d.paketTryout || "-";
            const nomorWa = d.noWa || "-";
            const asalSekolah = d.asalSekolah || "-";

            tbody.innerHTML += `
                <tr>
                    <td><div class="td-user">${fotoHtml}<div><strong style="color:var(--ses-blue-dark); font-size:1rem;">${namaSiswa}</strong><br><span style="font-size:0.8rem; color:var(--text-muted);">${asalSekolah}</span></div></div></td>
                    <td style="font-weight: 700;">${nomorWa}</td>
                    <td><span style="background:#eff6ff; color:var(--ses-blue); padding:4px 10px; border-radius:6px; font-size:0.8rem; font-weight:bold;">${namaPaket}</span></td>
                    <td>${statusHtml}</td>
                    <td style="text-align: center;">
                        <select id="akses_${idDoc}" class="form-control" style="font-size:0.75rem; padding:6px; margin-bottom:8px; border-color:var(--ses-blue);">
                            <option value="Ultimate" ${tier === 'Ultimate' ? 'selected' : ''}>👑 Ultimate (Full Akses + Cetak)</option>
                            <option value="Pro" ${tier === 'Pro' ? 'selected' : ''}>🥈 Pro (Latihan + Ujian)</option>
                            <option value="Basic" ${tier === 'Basic' || (!tier && tier !== 'Pro' && tier !== 'Ultimate') ? 'selected' : ''}>🥉 Basic (Hanya Latihan)</option>
                        </select>
                        <!-- Panggil terimaPendaftar dengan parameter yang benar -->
                        <button onclick="terimaPendaftar('${idDoc}', '${namaSiswa.replace(/'/g, "\\'")}', '${nomorWa}', '${asalSekolah.replace(/'/g, "\\'")}', '${namaPaket.replace(/'/g, "\\'")}', document.getElementById('akses_${idDoc}').value)" class="btn btn-success" style="width: 100%;"><i class="fas fa-check"></i> ACC & Buat ID</button>
                    </td>
                </tr>`;
        });
    });
}

// ==========================================
// FUNGSI ADMIN: TERIMA PENDAFTAR & BUAT ID (DIREVISI)
// ==========================================
async function terimaPendaftar(idDoc, nama, wa, sekolah, paket, tipeAkses) {
    const konfirmasi = await sesConfirm("Terima Pendaftar?", `Terima pendaftar <b>${nama}</b> dan berikan Tipe Akun <b>${tipeAkses}</b>?`, "fas fa-user-check", "var(--ses-blue)");
    if (!konfirmasi) return; 

    const newUsername = "TKA-" + Math.floor(1000 + Math.random() * 9000);
    const newPassword = "SES" + Math.floor(100 + Math.random() * 900);
    
    const btn = document.querySelector(`button[onclick*="${idDoc}"]`);
    if(btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...'; btn.disabled = true; }
    
    try {
        // 1. Cek Data Pendaftaran di koleksi 'leads'
        const docDaftar = await db.collection("leads").doc(idDoc).get();
        const dataDaftar = docDaftar.data();
        const kodeReferral = dataDaftar.affiliate || dataDaftar.referralDari || null;

        // 2. Ambil Harga Paket
        let nominalPemasukan = 0;
        const snapshotPaket = await db.collection("paket_tryout").where("namaPaket", "==", paket).get();
        if (!snapshotPaket.empty) {
            nominalPemasukan = Number(snapshotPaket.docs[0].data().hargaPaket) || 0;
        }

        // 3. Buat Akun Siswa Baru di tabel 'users_tryout'
        await db.collection("users_tryout").add({ 
            username: newUsername, 
            password: newPassword, 
            nama: nama, 
            sekolah: sekolah, 
            wa: wa, 
            paketAktif: paket, 
            tipeAkses: tipeAkses, 
            waktuDiterima: firebase.firestore.FieldValue.serverTimestamp() 
        });
        
        // 4. Ubah Status Pendaftaran di tabel 'leads' menjadi Closing agar terekam sukses di Affiliate
        await db.collection("leads").doc(idDoc).update({ status: "Closing" });

        // 👇 5. LOGIKA SPLIT KEUANGAN & KOMISI AFFILIATE 👇
        if (nominalPemasukan > 0) {
            if (kodeReferral) {
                // Ada Referral! Potong komisi untuk guru (Contoh: 20%)
                const persentaseKomisi = 0.20; 
                let nominalKomisiGuru = nominalPemasukan * persentaseKomisi;
                let kasBersihSES = nominalPemasukan - nominalKomisiGuru;

                // A. Catat kas bersih (80%) ke Buku Keuangan Utama SES
                await db.collection("keuangan_ses").add({
                    jenis: "masuk",
                    nominal: kasBersihSES,
                    keterangan: `Pembayaran Tryout: ${nama} (${paket}) [Via Referral: ${kodeReferral}]`,
                    waktuDibuat: firebase.firestore.FieldValue.serverTimestamp()
                });

                // B. Catat saldo komisi (20%) ke tabel komisi agar terbaca di dashboard Affiliate
                await db.collection("komisi").add({
                    usernameAff: kodeReferral,
                    produk: paket,
                    jumlah: nominalKomisiGuru,
                    waktu: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                });
                
                tampilkanToast(`Akun dibuat! Kas LKP & Komisi Affiliate tercatat otomatis!`);
            } else {
                // Tanpa Referral: 100% masuk Kas SES
                await db.collection("keuangan_ses").add({
                    jenis: "masuk",
                    nominal: nominalPemasukan,
                    keterangan: `Pembayaran Tryout Mandiri: ${nama} (${paket})`,
                    waktuDibuat: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                tampilkanToast(`Akun berhasil dibuat & Kas tercatat otomatis!`);
            }
        } else {
            tampilkanToast(`Akun berhasil dibuat (Paket Gratis)!`);
        }

        // 6. Kirim WhatsApp ke Siswa
        let noWaFormat = wa.replace(/\D/g, '');
        if (noWaFormat.startsWith('0')) noWaFormat = '62' + noWaFormat.substring(1);
        
        const pesan = `Halo *${nama}*! Selamat, pendaftaran Tryout Nasional Anda telah kami konfirmasi. 🥳\n\n📌 *Tipe Akun:* ${tipeAkses}\n\nBerikut adalah akses ruang ujian Anda:\n👤 *ID Peserta:* ${newUsername}\n🔑 *Password:* ${newPassword}\n\nSilakan akses ruang ujian pada jadwal yang ditentukan. Semangat! 🚀`;
        
        setTimeout(() => { window.open(`https://wa.me/${noWaFormat}?text=${encodeURIComponent(pesan)}`, '_blank'); }, 1500);
        
    } catch(error) { 
        console.error(error); 
        tampilkanToast("Gagal memproses pendaftaran. Coba lagi.", "error"); 
        if(btn) { btn.innerHTML = '<i class="fas fa-check"></i> ACC & Buat ID'; btn.disabled = false; }
    }
}

// ==========================================
// FUNGSI ADMIN: MUAT PESERTA AKTIF (DIREVISI: TAMBAH TOMBOL EDIT)
// ==========================================
function muatPesertaAktif() {
    db.collection("users_tryout").onSnapshot(snap => {
        let countAktif = snap.size;
        let countBelum = 0;
        const tbody = document.getElementById('tabelPesertaAktif');
        if(!tbody) return;
        
        // Memastikan Header Tabel memiliki kolom "Aksi"
        const thead = tbody.previousElementSibling;
        if (thead) {
            thead.innerHTML = `
                <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                    <th>ID Login (Username)</th>
                    <th>Password</th>
                    <th>Nama Peserta</th>
                    <th>Asal Sekolah</th>
                    <th>No. WA</th>
                    <th style="text-align: center; width: 140px;">Tipe Akun</th>
                    <th style="text-align: center; width: 80px;">Aksi</th>
                </tr>
            `;
        }

        tbody.innerHTML = '';
        
        if(snap.empty) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">Belum ada peserta aktif.</td></tr>';
        } else {
            snap.forEach(doc => {
                const d = doc.data();
                const idDoc = doc.id;
                const tierAktif = d.tipeAkses || "Basic";
                
                let sudahUjian = false;
                Object.keys(d).forEach(key => {
                    if (key.startsWith("skor_") || key.startsWith("riwayat_skor_")) {
                        sudahUjian = true;
                    }
                });
                
                if (!sudahUjian) countBelum++; 

                // Logika Format Nomor WA
                let waHtml = "-";
                if (d.wa) {
                    let cleanWa = d.wa.replace(/\D/g, ''); 
                    if (cleanWa.startsWith('0')) cleanWa = '62' + cleanWa.substring(1); 
                    
                    let pesanTemplate = encodeURIComponent(`Halo ${d.nama}, ini dari Admin LKP SES...`);
                    waHtml = `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span>${d.wa}</span>
                            <a href="https://wa.me/${cleanWa}?text=${pesanTemplate}" target="_blank" class="btn btn-success btn-sm" style="padding: 4px 8px; font-size: 0.75rem; border-radius: 6px; text-decoration: none;" title="Chat WhatsApp">
                                <i class="fab fa-whatsapp"></i> Chat
                            </a>
                        </div>
                    `;
                }
                
                tbody.innerHTML += `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td><strong style="color: var(--ses-blue); font-size: 1.05rem;">${d.username}</strong></td>
                        <td style="font-family: monospace; font-size: 1.05rem; letter-spacing: 1px; color: #475569;">${d.password}</td>
                        <td><strong style="text-transform: uppercase; color: var(--ses-blue-dark);">${d.nama}</strong></td>
                        <td>${d.sekolah || 'Mandiri'}</td>
                        <td style="font-weight: 700;">${waHtml}</td>
                        <td style="text-align: center;">
                            <select id="editTier_${idDoc}" class="form-control" style="font-size: 0.75rem; padding: 6px; border-color: var(--ses-blue); font-weight: 700; cursor: pointer;" onchange="ubahTipeAksesSiswa('${idDoc}', this.value)">
                                <option value="Basic" ${tierAktif === 'Basic' ? 'selected' : ''}>🥉 Basic</option>
                                <option value="Pro" ${tierAktif === 'Pro' ? 'selected' : ''}>🥈 Pro</option>
                                <option value="Ultimate" ${tierAktif === 'Ultimate' ? 'selected' : ''}>👑 Ultimate</option>
                            </select>
                        </td>
                        <td style="text-align: center;">
                            <button onclick="bukaModalEditPeserta('${idDoc}')" class="btn btn-warning btn-sm" style="padding: 6px 12px; font-size: 0.75rem; border-radius: 6px; background: #f59e0b; color: white; border: none; cursor: pointer;" title="Edit Data Peserta">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
        
        const elPeserta = document.getElementById('dashCountPeserta');
        const elBelum = document.getElementById('dashCountBelumUjian');
        if(elPeserta) elPeserta.textContent = countAktif;
        if(elBelum) elBelum.textContent = countBelum;
    });
}

// ==========================================
// FUNGSI ADMIN: MUAT DAFTAR PAKET
// ==========================================
function muatDataPaket() {
    db.collection("paket_tryout").orderBy("waktuDibuat", "desc").onSnapshot(snap => {
        const dashCount = document.getElementById('dashCountPaket');
        if(dashCount) dashCount.textContent = snap.size;

        const tbody = document.getElementById('tabelPaket');
        const selectPaketSoal = document.getElementById('pilihPaketSoal'); 
        const selectPaketRekap = document.getElementById('filterPaketRekap'); 
        
        if (tbody) tbody.innerHTML = '';
        if (selectPaketSoal) selectPaketSoal.innerHTML = '<option value="" disabled selected>-- Pilih Paket Ujian --</option>';
        if (selectPaketRekap) selectPaketRekap.innerHTML = '<option value="" disabled selected>-- Pilih Paket Ujian --</option>';

        if(snap.empty) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 25px;">Belum ada paket tryout. Silakan tambahkan.</td></tr>';
            return;
        }
        
        snap.forEach(doc => {
            const d = doc.data(); 
            const jenis = d.jenisPaket || "Ujian"; 
            
            let labelWarna = '';
            if (jenis.toLowerCase() === 'basic') labelWarna = '<span class="badge" style="background:#dcfce7; color:#166534;">🥉 Basic</span>';
            else if (jenis.toLowerCase() === 'pro') labelWarna = '<span class="badge" style="background:#e0f2fe; color:#0369a1;">🥈 Pro</span>';
            else labelWarna = '<span class="badge" style="background:#fffbeb; color:#b45309;">👑 Ultimate</span>';

            // Indikator visual jika paket memiliki jadwal (Time-Locked)
            let jadwalInfo = "";
            if (d.waktuMulai && d.waktuTutup) {
                jadwalInfo = `<br><span style="font-size:0.75rem; color:#d97706; font-weight:800; background:#fef3c7; padding:2px 8px; border-radius:10px; margin-top:5px; display:inline-block;"><i class="fas fa-clock"></i> Terjadwal Serentak</span>`;
            }

            // 👇 Logika teks untuk kolom Harga (BARU)
            let hargaTeks = d.hargaPaket && d.hargaPaket > 0 
                ? "Rp " + d.hargaPaket.toLocaleString('id-ID') 
                : '<span style="color:#10b981; font-weight:800;">GRATIS</span>';

            if (tbody) tbody.innerHTML += `
                <tr>
                    <td><strong style="color: var(--ses-blue-dark); font-size: 1.05rem;">${d.namaPaket}</strong><br>${labelWarna} ${jadwalInfo}</td>
                    
                    <!-- 👇 Cetak harga di sini (BARU) -->
                    <td style="font-weight: 700; color: #475569;">${hargaTeks}</td>
                    
                    <td style="text-align: center; white-space: nowrap;">
                        <button onclick="editPaket('${doc.id}')" class="btn btn-sm" style="background: #f59e0b; color: white; margin-right: 5px; border: none;"><i class="fas fa-edit"></i> Edit</button>
                        <button onclick="hapusPaket('${doc.id}', '${d.namaPaket}')" class="btn btn-danger btn-sm"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>`;
            
            if (selectPaketSoal) selectPaketSoal.innerHTML += `<option value="${d.namaPaket}">${d.namaPaket}</option>`;
            if (selectPaketRekap) selectPaketRekap.innerHTML += `<option value="${d.namaPaket}" data-jenis="${jenis}">${d.namaPaket}</option>`; 
        });
    });
}

// Fitur Animasi Muncul/Hilang Kotak Pengaturan Jadwal
function toggleJadwalPaket() {
    const jenis = document.getElementById('jenisPaketBaru').value;
    const areaJadwal = document.getElementById('areaJadwalPaket');
    
    if (jenis === 'Ultimate') {
        areaJadwal.style.display = 'block';
    } else {
        areaJadwal.style.display = 'none';
        document.getElementById('inputWaktuMulaiMat').value = '';
        document.getElementById('inputWaktuTutupMat').value = '';
        document.getElementById('inputWaktuMulaiIndo').value = '';
        document.getElementById('inputWaktuTutupIndo').value = '';
    }
}

async function tambahPaket(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSimpanPaket');
    const teksAsli = btn.innerHTML;
    
    const idEdit = document.getElementById('editIdPaket').value;
    const namaPaket = document.getElementById('inputNamaPaket').value.trim();
    
    // 👇 Penangkapan nilai harga (BARU)
    const hargaPaket = Number(document.getElementById('inputHargaPaket').value) || 0; 
    
    const jenisPaket = document.getElementById('jenisPaketBaru').value;
    const thumbnailPaket = document.getElementById('inputThumbnailPaket').value.trim(); 
    
    // Ambil nilai tanggal jadwal per mapel
    const jadwalMat = {
        mulai: document.getElementById('inputWaktuMulaiMat').value || null,
        tutup: document.getElementById('inputWaktuTutupMat').value || null
    };
    const jadwalIndo = {
        mulai: document.getElementById('inputWaktuMulaiIndo').value || null,
        tutup: document.getElementById('inputWaktuTutupIndo').value || null
    };
    
    if(!namaPaket || !jenisPaket) {
        return sesAlert("Data Tidak Valid", "Pastikan nama dan jenis (label) paket sudah dipilih!", "fas fa-exclamation-triangle", "#f59e0b");
    }
    
    // Validasi Logika Waktu
    if (jenisPaket === 'Ultimate') {
        if (jadwalMat.mulai && jadwalMat.tutup && new Date(jadwalMat.mulai) >= new Date(jadwalMat.tutup)) {
            return sesAlert("Waktu Tidak Logis", "Waktu tutup Matematika harus lebih besar dari waktu mulainya!", "fas fa-clock", "#ef4444");
        }
        if (jadwalIndo.mulai && jadwalIndo.tutup && new Date(jadwalIndo.mulai) >= new Date(jadwalIndo.tutup)) {
            return sesAlert("Waktu Tidak Logis", "Waktu tutup Bahasa Indonesia harus lebih besar dari waktu mulainya!", "fas fa-clock", "#ef4444");
        }
    }
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; 
    btn.disabled = true;
    
    let dataSimpan = {
        namaPaket: namaPaket, 
        hargaPaket: hargaPaket, // 👇 Disimpan ke database (BARU)
        jenisPaket: jenisPaket, 
        thumbnail: thumbnailPaket,
        jadwalMatematika: jadwalMat,
        jadwalBahasaIndonesia: jadwalIndo
    };
    
    try {
        if (idEdit) {
            await db.collection("paket_tryout").doc(idEdit).update(dataSimpan);
            tampilkanToast("Perubahan paket dan jadwal berhasil disimpan!");
        } else {
            dataSimpan.waktuDibuat = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection("paket_tryout").add(dataSimpan);
            tampilkanToast("Paket Ujian baru berhasil ditambahkan!");
        }
        batalEditPaket(); 
    } catch(err) { 
        console.error(err); 
        tampilkanToast("Gagal memproses paket", "error"); 
    } finally { 
        btn.innerHTML = teksAsli; 
        btn.disabled = false; 
    }
}

async function editPaket(idDoc) {
    try {
        const doc = await db.collection("paket_tryout").doc(idDoc).get();
        if(!doc.exists) return tampilkanToast("Data paket tidak ditemukan!", "error");
        
        const d = doc.data();
        
        document.getElementById('editIdPaket').value = doc.id;
        document.getElementById('inputNamaPaket').value = d.namaPaket;
        
        // 👇 Memuat harga saat form diedit (BARU)
        document.getElementById('inputHargaPaket').value = d.hargaPaket || 0;
        
        document.getElementById('jenisPaketBaru').value = d.jenisPaket || "Ujian";
        document.getElementById('inputThumbnailPaket').value = d.thumbnail || "";
        
        toggleJadwalPaket();
        
        // Ekstrak jadwal jika ada
        const jMat = d.jadwalMatematika || {};
        const jIndo = d.jadwalBahasaIndonesia || {};
        
        document.getElementById('inputWaktuMulaiMat').value = jMat.mulai || "";
        document.getElementById('inputWaktuTutupMat').value = jMat.tutup || "";
        document.getElementById('inputWaktuMulaiIndo').value = jIndo.mulai || "";
        document.getElementById('inputWaktuTutupIndo').value = jIndo.tutup || "";
        
        const btnSimpan = document.getElementById('btnSimpanPaket');
        btnSimpan.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
        btnSimpan.className = 'btn btn-warning';
        btnSimpan.style.background = '#f59e0b';
        btnSimpan.style.color = 'white';
        
        const btnBatal = document.getElementById('btnBatalEditPaket');
        if (btnBatal) btnBatal.style.display = 'inline-flex';
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(err) {
        console.error(err);
        tampilkanToast("Gagal menarik data paket dari server", "error");
    }
}

function batalEditPaket() {
    document.getElementById('editIdPaket').value = '';
    document.getElementById('formPaket').reset();
    toggleJadwalPaket(); 
    
    const btnSimpan = document.getElementById('btnSimpanPaket');
    btnSimpan.innerHTML = '<i class="fas fa-plus"></i> Simpan Paket';
    btnSimpan.className = 'btn btn-primary';
    btnSimpan.style.background = '';
    
    const btnBatal = document.getElementById('btnBatalEditPaket');
    if (btnBatal) btnBatal.style.display = 'none';
}

// FUNGSI HAPUS PAKET & PEMBERSIHAN DATA SOAL OTOMATIS
async function hapusPaket(idDoc, namaPaket) {
    const konfirmasi = await sesConfirm(
        "Hapus Paket & Soal?", 
        `Yakin ingin menghapus paket <b>${namaPaket}</b>? <br><br><span style="color:#ef4444; font-weight:bold;"><i class="fas fa-exclamation-triangle"></i> PERINGATAN: Semua soal yang berada di dalam paket ini juga akan ikut dihapus secara permanen!</span>`, 
        "fas fa-trash-alt", 
        "#ef4444"
    );
    
    if(konfirmasi) {
        try {
            // 1. Cari dan hapus semua soal yang berkaitan dengan paket ini secara massal (Batch Delete)
            const soalTerkait = await db.collection("bank_soal").where("paket", "==", namaPaket).get();
            let batch = db.batch();
            
            soalTerkait.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Eksekusi penghapusan massal soal
            await batch.commit();

            // 2. Hapus dokumen paket utamanya
            await db.collection("paket_tryout").doc(idDoc).delete(); 
            
            tampilkanToast(`Paket dihapus beserta ${soalTerkait.size} butir soal di dalamnya.`);
        } catch (err) {
            console.error(err);
            tampilkanToast("Gagal menghapus data. Periksa koneksi internet.", "error");
        }
    }
}

// ==========================================
// LOGIKA FORM STUDIO BANK SOAL (TAMBAH, EDIT, HAPUS, REKAP)
// ==========================================

function aturFormSoal() {
    const tipe = document.getElementById('tipeSoal').value;
    document.getElementById('areaPG').classList.add('hidden'); 
    document.getElementById('areaMulti').classList.add('hidden');
    document.getElementById('areaTF').classList.add('hidden'); 
    document.getElementById('wadahTfType').classList.add('hidden');
    
    const radioPG = document.querySelectorAll('input[name="kunciPG"]'); 
    radioPG[0].required = false;
    
    if (tipe === 'pg') { 
        document.getElementById('areaPG').classList.remove('hidden'); 
        radioPG[0].required = true; 
    } 
    else if (tipe === 'multi') { 
        document.getElementById('areaMulti').classList.remove('hidden'); 
    } 
    else if (tipe === 'tf') { 
        document.getElementById('areaTF').classList.remove('hidden'); 
        document.getElementById('wadahTfType').classList.remove('hidden');
        perbaruiLabelTabelTF();
        document.getElementById('tfTypeSelect').addEventListener('change', perbaruiLabelTabelTF);
    }
}

function perbaruiLabelTabelTF() {
    const jenisTabel = document.getElementById('tfTypeSelect').value;
    let labelKiri = "Benar (Kiri)";
    let labelKanan = "Salah (Kanan)";
    
    if (jenisTabel === "tepat-tidak") {
        labelKiri = "Tepat (Kiri)";
        labelKanan = "Tidak Tepat (Kanan)";
    } else if (jenisTabel === "sesuai-tidak") {
        labelKiri = "Sesuai (Kiri)";
        labelKanan = "Tidak Sesuai (Kanan)";
    }
    
    for (let i = 0; i < 3; i++) {
        const selectKunci = document.getElementById(`tfKunci${i}`);
        if (selectKunci) {
            selectKunci.options[0].text = labelKiri;
            selectKunci.options[1].text = labelKanan;
        }
    }
}

// VARIABEL GLOBAL UNTUK MODE EDIT SOAL
let idEditSoalAktif = null;

async function simpanSoalLMS(e) {
    e.preventDefault();
    
    const nomorSoal = parseInt(document.getElementById('inputNomorSoal').value);
    const paket = document.getElementById('pilihPaketSoal').value;
    const mapel = document.getElementById('pilihMapelSoal').value;
    const teksSoal = document.getElementById('teksSoal').value.trim();
    const pembahasan = document.getElementById('teksPembahasan').value.trim();
    const tipe = document.getElementById('tipeSoal').value;
    
    if (!nomorSoal || !paket || !mapel || !teksSoal || !pembahasan) {
        sesAlert("Data Belum Lengkap", "Harap isi Nomor Soal, Pilih Paket, Mata Pelajaran, Teks Pertanyaan, dan Pembahasan dengan lengkap!", "fas fa-exclamation-triangle", "#f59e0b");
        return;
    }
    
    const btn = e.target.querySelector('button[type="submit"]'); 
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...'; 
    btn.disabled = true;
    
    try {
        // Cek Nomor Ganda
        const cekGanda = await db.collection("bank_soal")
                                 .where("paket", "==", paket)
                                 .where("mapel", "==", mapel)
                                 .where("nomor", "==", nomorSoal)
                                 .get();
                                 
        let isGanda = false;
        if (!cekGanda.empty) {
            cekGanda.forEach(doc => {
                if (doc.id !== idEditSoalAktif) isGanda = true;
            });
        }
                                 
        if (isGanda) {
            sesAlert("Nomor Soal Ganda!", `Soal nomor <b>${nomorSoal}</b> sudah dipakai pada paket ini. Silakan gunakan nomor lain.`, "fas fa-ban", "#ef4444");
            btn.innerHTML = idEditSoalAktif ? '<i class="fas fa-save"></i> Update Soal' : '<i class="fas fa-cloud-upload-alt"></i> Simpan ke Bank Soal'; 
            btn.disabled = false;
            return;
        }

        let dataSoal = { 
            nomor: nomorSoal,
            paket: paket,
            mapel: mapel,
            type: tipe, 
            text: teksSoal, 
            image: document.getElementById('linkGambar').value.trim() || null, 
            pembahasan: pembahasan
        };
        
        if (tipe === 'pg') {
            const radios = document.querySelectorAll('input[name="kunciPG"]'); 
            let kunci = null; 
            radios.forEach(r => { if(r.checked) kunci = parseInt(r.value); });
            if(kunci === null) throw new Error("Kunci jawaban Pilihan Ganda belum dipilih.");
            
            dataSoal.options = [ document.getElementById('pgA').value, document.getElementById('pgB').value, document.getElementById('pgC').value, document.getElementById('pgD').value ]; 
            
            // 👇 TAMBAHAN: Menyimpan link gambar opsi PG
            dataSoal.optionsImg = [ 
                document.getElementById('pgImgA').value.trim(), 
                document.getElementById('pgImgB').value.trim(), 
                document.getElementById('pgImgC').value.trim(), 
                document.getElementById('pgImgD').value.trim() 
            ];
            
            dataSoal.answer = kunci;
        } 
        else if (tipe === 'multi') {
            let kunciArray = []; 
            for(let i=0; i<3; i++) { if(document.getElementById(`kunciMulti${i}`).checked) kunciArray.push(i); }
            if(kunciArray.length === 0) {
                sesAlert("Kunci Belum Dipilih", "Pilih minimal satu kunci jawaban benar.", "fas fa-exclamation-triangle", "#f59e0b");
                btn.innerHTML = idEditSoalAktif ? '<i class="fas fa-save"></i> Update Soal' : '<i class="fas fa-cloud-upload-alt"></i> Simpan ke Bank Soal'; 
                btn.disabled = false;
                return;
            }
            
            // PERBAIKAN: Membaca ID yang sudah disinkronkan menjadi angka 0, 1, 2
            dataSoal.options = [ 
                document.getElementById('multi0').value, 
                document.getElementById('multi1').value, 
                document.getElementById('multi2').value 
            ]; 
            
            dataSoal.optionsImg = [ 
                document.getElementById('multiImg0').value.trim(), 
                document.getElementById('multiImg1').value.trim(), 
                document.getElementById('multiImg2').value.trim() 
            ];
            
            dataSoal.answer = kunciArray;
        } 
        else if (tipe === 'tf') {
            dataSoal.tfType = document.getElementById('tfTypeSelect').value;
            
            // PERBAIKAN: Memastikan urutan pembacaan elemen tabel konsisten
            dataSoal.statements = [ 
                document.getElementById('tfTeks0').value, 
                document.getElementById('tfTeks1').value, 
                document.getElementById('tfTeks2').value 
            ];
            
            dataSoal.statementsImg = [ 
                document.getElementById('tfImg0').value.trim(), 
                document.getElementById('tfImg1').value.trim(), 
                document.getElementById('tfImg2').value.trim() 
            ];
            
            dataSoal.answer = [ 
                document.getElementById('tfKunci0').value === "true", 
                document.getElementById('tfKunci1').value === "true", 
                document.getElementById('tfKunci2').value === "true" 
            ];
        }
        
        // Mode Update atau Tambah Baru
        if (idEditSoalAktif) {
            dataSoal.waktuDiupdate = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection("bank_soal").doc(idEditSoalAktif).update(dataSoal); 
            tampilkanToast(`Soal Nomor ${nomorSoal} berhasil diupdate!`);
            batalEditSoalLMS(); 
        } else {
            dataSoal.waktuDibuat = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection("bank_soal").add(dataSoal); 
            tampilkanToast(`Soal Nomor ${nomorSoal} berhasil ditambahkan!`);
            document.getElementById('formBankSoal').reset(); 
            aturFormSoal(); 
        }
        
        muatDaftarSoalTable(); 
        
    } catch (err) { 
        console.error(err); 
        tampilkanToast(err.message || "Gagal menyimpan soal.", "error"); 
    } finally { 
        btn.innerHTML = idEditSoalAktif ? '<i class="fas fa-save"></i> Update Soal' : '<i class="fas fa-cloud-upload-alt"></i> Simpan ke Bank Soal'; 
        btn.disabled = false; 
    }
}

async function editBankSoalLMS(idDoc) {
    try {
        const doc = await db.collection("bank_soal").doc(idDoc).get();
        if (!doc.exists) return tampilkanToast("Data tidak ditemukan!", "error");
        
        const d = doc.data();
        
        document.getElementById('pilihPaketSoal').value = d.paket;
        document.getElementById('pilihMapelSoal').value = d.mapel;
        document.getElementById('tipeSoal').value = d.type;
        document.getElementById('inputNomorSoal').value = d.nomor;
        document.getElementById('teksSoal').value = d.text;
        document.getElementById('linkGambar').value = d.image || "";
        document.getElementById('teksPembahasan').value = d.pembahasan || "";
        // Memicu penyesuaian tinggi otomatis secara instan saat data dimuat
        document.getElementById('teksSoal').dispatchEvent(new Event('input'));
        document.getElementById('teksPembahasan').dispatchEvent(new Event('input'));
        
        aturFormSoal(); 

        if (d.type === 'pg') {
            document.getElementById('pgA').value = d.options[0] || "";
            document.getElementById('pgB').value = d.options[1] || "";
            document.getElementById('pgC').value = d.options[2] || "";
            document.getElementById('pgD').value = d.options[3] || "";
            
            // 👇 TAMBAHAN: Memuat link gambar opsi PG
            if (d.optionsImg) {
                document.getElementById('pgImgA').value = d.optionsImg[0] || "";
                document.getElementById('pgImgB').value = d.optionsImg[1] || "";
                document.getElementById('pgImgC').value = d.optionsImg[2] || "";
                document.getElementById('pgImgD').value = d.optionsImg[3] || "";
            } else {
                document.getElementById('pgImgA').value = ""; document.getElementById('pgImgB').value = "";
                document.getElementById('pgImgC').value = ""; document.getElementById('pgImgD').value = "";
            }

            const radios = document.querySelectorAll('input[name="kunciPG"]');
            radios.forEach(r => r.checked = false);
            if (d.answer !== undefined) radios[d.answer].checked = true;
        } 
        else if (d.type === 'multi') {
            // PERBAIKAN: Melempar data kembali ke ID HTML yang benar (0, 1, 2)
            document.getElementById('multi0').value = d.options[0] || "";
            document.getElementById('multi1').value = d.options[1] || "";
            document.getElementById('multi2').value = d.options[2] || "";
            
            if (d.optionsImg) {
                document.getElementById('multiImg0').value = d.optionsImg[0] || "";
                document.getElementById('multiImg1').value = d.optionsImg[1] || "";
                document.getElementById('multiImg2').value = d.optionsImg[2] || "";
            } else {
                document.getElementById('multiImg0').value = ""; document.getElementById('multiImg1').value = ""; document.getElementById('multiImg2').value = "";
            }

            for(let i=0; i<3; i++) {
                document.getElementById(`kunciMulti${i}`).checked = d.answer.includes(i);
            }
        }
        else if (d.type === 'tf') {
            document.getElementById('tfTypeSelect').value = d.tfType || "benar-salah";
            perbaruiLabelTabelTF();
            for (let i = 0; i < 3; i++) {
                document.getElementById(`tfTeks${i}`).value = d.statements[i] || "";
                document.getElementById(`tfKunci${i}`).value = d.answer[i] ? "true" : "false";
                
                // 👇 TAMBAHAN: Memuat link gambar tabel TF
                if (d.statementsImg && d.statementsImg[i]) {
                    document.getElementById(`tfImg${i}`).value = d.statementsImg[i];
                } else {
                    document.getElementById(`tfImg${i}`).value = "";
                }
            }
        }

        idEditSoalAktif = idDoc; 

        // Ubah UI Form Menjadi Mode Update
        const btnSubmit = document.querySelector('#formBankSoal button[type="submit"]');
        btnSubmit.innerHTML = '<i class="fas fa-save"></i> Update Soal';
        btnSubmit.classList.replace('btn-success', 'btn-warning');
        btnSubmit.style.background = '#f59e0b';
        
        let btnBatal = document.getElementById('btnBatalEditSoal');
        if (!btnBatal) {
            btnBatal = document.createElement('button');
            btnBatal.type = 'button';
            btnBatal.id = 'btnBatalEditSoal';
            btnBatal.className = 'btn btn-outline';
            btnBatal.style.width = '100%';
            btnBatal.style.marginTop = '10px';
            btnBatal.innerHTML = '<i class="fas fa-times"></i> Batal Edit';
            btnBatal.onclick = batalEditSoalLMS;
            document.getElementById('formBankSoal').appendChild(btnBatal);
        }
        btnBatal.style.display = 'block';

        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
        console.error(err);
        tampilkanToast("Gagal menarik data soal", "error");
    }
}

function batalEditSoalLMS() {
    idEditSoalAktif = null;
    document.getElementById('formBankSoal').reset();
    aturFormSoal();
    
    const btnSubmit = document.querySelector('#formBankSoal button[type="submit"]');
    btnSubmit.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Simpan ke Bank Soal';
    btnSubmit.classList.replace('btn-warning', 'btn-success');
    btnSubmit.style.background = ''; 
    
    const btnBatal = document.getElementById('btnBatalEditSoal');
    if (btnBatal) btnBatal.style.display = 'none';
}

function updateFilterPaketSoal() {
    const sumberPilihan = document.getElementById('pilihPaketSoal');
    const filterPilihan = document.getElementById('filterPaketSoalTable');
    if (!sumberPilihan || !filterPilihan) return;

    filterPilihan.innerHTML = '<option value="">Semua Paket</option>';
    
    for (let i = 1; i < sumberPilihan.options.length; i++) {
        const opt = sumberPilihan.options[i];
        filterPilihan.innerHTML += `<option value="${opt.value}">${opt.text}</option>`;
    }
}

async function muatDaftarSoalTable() {
    const paket = document.getElementById('filterPaketSoalTable').value;
    const mapel = document.getElementById('filterMapelSoalTable').value;
    const tbody = document.getElementById('tabelDaftarSoal');
    
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 25px;"><i class="fas fa-spinner fa-spin"></i> Memuat data soal...</td></tr>';

    try {
        let query = db.collection("bank_soal");
        
        // Hanya tambahkan batasan (filter) JIKA Admin memilihnya dari dropdown
        if (paket && paket !== "") query = query.where("paket", "==", paket);
        if (mapel && mapel !== "") query = query.where("mapel", "==", mapel);
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 25px; color: var(--text-muted); font-weight: bold;">Belum ada soal pada kriteria tersebut.</td></tr>';
            return;
        }

        let daftarSoal = [];
        snapshot.forEach(doc => {
            daftarSoal.push({ id: doc.id, ...doc.data() });
        });

        // Urutkan secara lokal berdasarkan Nomor Soal agar rapi
        daftarSoal.sort((a, b) => a.nomor - b.nomor);

        tbody.innerHTML = '';
        
        daftarSoal.forEach(d => {
            let labelTipe = "PG Biasa";
            if (d.type === "multi") labelTipe = "PGK MCMA";
            if (d.type === "tf") labelTipe = "PGK Kategori";

            let cuplikanTeks = d.text.replace(/(<([^>]+)>)/gi, "");
            if (cuplikanTeks.length > 55) cuplikanTeks = cuplikanTeks.substring(0, 55) + "...";

            tbody.innerHTML += `
                <tr>
                    <td style="text-align: center; font-weight: 900; font-size: 1.1rem; color: var(--ses-blue);">${d.nomor}</td>
                    <td>
                        <span class="badge" style="background:#eff6ff; color:var(--ses-blue-dark); border: 1px solid #bfdbfe; font-size: 0.7rem; margin-bottom: 6px; display: inline-block;">${labelTipe}</span><br>
                        <span style="color: #475569; line-height: 1.4;">${cuplikanTeks}</span>
                    </td>
                    <td style="text-align: center; vertical-align: middle; white-space: nowrap;">
                        <button onclick="editBankSoalLMS('${d.id}')" class="btn btn-warning btn-sm" style="padding: 8px 12px; border-radius: 6px; background: #f59e0b; color: white; border: none; margin-right: 5px;" title="Edit Soal">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="hapusBankSoalLMS('${d.id}', ${d.nomor})" class="btn btn-danger btn-sm" style="padding: 8px 12px; border-radius: 6px;" title="Hapus Soal">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        if (window.MathJax) { MathJax.typesetPromise(); }

    } catch (error) {
        console.error("Gagal memuat daftar soal:", error);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 25px; color: #ef4444; font-weight:bold;"><i class="fas fa-exclamation-triangle"></i> Gagal mengambil data.</td></tr>';
    }
}

async function hapusBankSoalLMS(idDoc, nomor) {
    const konfirmasi = await sesConfirm("Hapus Soal?", `Anda yakin ingin menghapus permanen Soal Nomor <b>${nomor}</b> dari database? Tindakan ini tidak dapat dibatalkan.`, "fas fa-trash-alt", "#ef4444");
    if (!konfirmasi) return;

    try {
        await db.collection("bank_soal").doc(idDoc).delete();
        tampilkanToast(`Soal Nomor ${nomor} berhasil dihapus.`);
        muatDaftarSoalTable(); 
    } catch (err) {
        console.error(err);
        tampilkanToast("Gagal menghapus soal.", "error");
    }
}

const observerPaket = new MutationObserver(() => { updateFilterPaketSoal(); });
const targetPilihPaket = document.getElementById('pilihPaketSoal');
if (targetPilihPaket) observerPaket.observe(targetPilihPaket, { childList: true });

// ==========================================
// FITUR KEUANGAN & BUKU KAS (DENGAN FILTER & CETAK)
// ==========================================

let dataKeuanganGlobal = []; // Variabel untuk menyimpan semua data kas di memori browser

function muatDataKeuangan() {
    db.collection("keuangan_ses").orderBy("waktuDibuat", "desc").onSnapshot(snap => {
        dataKeuanganGlobal = []; // Bersihkan data lama
        
        snap.forEach(doc => {
            const d = doc.data();
            d.id = doc.id; // Simpan ID untuk tombol hapus
            dataKeuanganGlobal.push(d);
        });
        
        // Panggil fungsi filter untuk merender tabel berdasarkan pilihan dropdown saat ini
        terapkanFilterKas(); 
    });
}

// Fungsi untuk menampilkan/menyembunyikan input tanggal jika pilih "Custom"
function ubahFilterKas() {
    const val = document.getElementById('filterPeriodeKas').value;
    const wadahCustom = document.getElementById('wadahCustomTanggal');
    
    if (val === 'custom') {
        wadahCustom.style.display = 'flex';
    } else {
        wadahCustom.style.display = 'none';
        terapkanFilterKas();
    }
}

// Fungsi utama penyaring data berdasarkan tanggal
function terapkanFilterKas() {
    const periode = document.getElementById('filterPeriodeKas').value;
    const tbody = document.getElementById('tabelRiwayatKas');
    if (!tbody) return;
    
    let filteredData = [];
    const now = new Date();
    
    let startDate = null;
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999); // Set akhir hari ini

    // Menentukan rentang tanggal
    if (periode === 'hari_ini') {
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
    } else if (periode === 'minggu_ini') {
        startDate = new Date(now);
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Geser ke hari Senin
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
    } else if (periode === 'bulan_ini') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (periode === 'tahun_ini') {
        startDate = new Date(now.getFullYear(), 0, 1);
    } else if (periode === 'custom') {
        const tglMulai = document.getElementById('tglKasMulai').value;
        const tglSelesai = document.getElementById('tglKasSelesai').value;
        if (tglMulai) {
            startDate = new Date(tglMulai);
            startDate.setHours(0, 0, 0, 0);
        }
        if (tglSelesai) {
            endDate = new Date(tglSelesai);
            endDate.setHours(23, 59, 59, 999);
        }
    }

    // Melakukan penyaringan (filter)
    filteredData = dataKeuanganGlobal.filter(d => {
        if (periode === 'semua') return true;
        if (!d.waktuDibuat || typeof d.waktuDibuat.toDate !== 'function') return true; // Toleransi data tanpa tanggal
        
        const tglTransaksi = d.waktuDibuat.toDate();
        if (startDate && endDate) {
            return tglTransaksi >= startDate && tglTransaksi <= endDate;
        }
        return true;
    });

    renderTabelKeuangan(filteredData, periode);
}

// Fungsi untuk menggambar tabel dan menghitung ulang total berdasarkan data yang sudah difilter
function renderTabelKeuangan(data, periodeLabel) {
    let totalMasuk = 0;
    let totalKeluar = 0;
    
    const tbody = document.getElementById('tabelRiwayatKas');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted); font-weight:bold;">Tidak ada transaksi kas pada periode yang dipilih.</td></tr>';
    }

    const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    
    data.forEach(d => {
        const nominal = Number(d.nominal) || 0;
        
        if (d.jenis === "masuk") totalMasuk += nominal;
        if (d.jenis === "keluar") totalKeluar += nominal;
        
        let badgeJenis = d.jenis === "masuk" 
            ? `<span style="background:#dcfce7; color:#166534; padding:4px 8px; border-radius:6px; font-weight:bold; font-size:0.75rem;"><i class="fas fa-arrow-down"></i> Masuk</span>` 
            : `<span style="background:#fee2e2; color:#b91c1c; padding:4px 8px; border-radius:6px; font-weight:bold; font-size:0.75rem;"><i class="fas fa-arrow-up"></i> Keluar</span>`;
        
        let warnaNominal = d.jenis === "masuk" ? "#10b981" : "#ef4444";
        
        let tanggalTxt = "-";
        if (d.waktuDibuat && typeof d.waktuDibuat.toDate === 'function') {
            const dateObj = d.waktuDibuat.toDate();
            tanggalTxt = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth()+1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
        }

        tbody.innerHTML += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="font-weight: 700; color: #475569;">${tanggalTxt}</td>
                <td style="text-align: center;">${badgeJenis}</td>
                <td style="color: var(--ses-blue-dark); font-weight: 600;">${d.keterangan || '-'}</td>
                <td style="text-align: right; font-weight: 900; color: ${warnaNominal};">${formatRp(nominal)}</td>
                <td style="text-align: center;" class="hide-on-print">
                    <button class="btn btn-danger btn-sm" onclick="hapusTransaksiKas('${d.id}')" title="Hapus Transaksi"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    });
    
    const saldo = totalMasuk - totalKeluar;
    
    // Update Widget Dashboard Utama (Opsional: Tetap total semua, atau ikuti filter. Kita biarkan ikuti filter agar konsisten)
    const elMasuk = document.getElementById('dashCountPemasukan');
    const elKeluar = document.getElementById('dashCountPengeluaran');
    const elSaldo = document.getElementById('dashCountSaldo');
    if(elMasuk) elMasuk.textContent = formatRp(totalMasuk);
    if(elKeluar) elKeluar.textContent = formatRp(totalKeluar);
    if(elSaldo) elSaldo.textContent = formatRp(saldo);

    // Update Widget Menu Keuangan
    const menuMasuk = document.getElementById('keuanganTotalMasuk');
    const menuKeluar = document.getElementById('keuanganTotalKeluar');
    const menuSaldo = document.getElementById('keuanganTotalSaldo');
    if(menuMasuk) menuMasuk.textContent = formatRp(totalMasuk);
    if(menuKeluar) menuKeluar.textContent = formatRp(totalKeluar);
    if(menuSaldo) menuSaldo.textContent = formatRp(saldo);

    // Update Label Cetak di Kop Surat
    const labelCetak = document.getElementById('labelPeriodeCetak');
    if (labelCetak) {
        const dropdown = document.getElementById('filterPeriodeKas');
        let teksPeriode = dropdown.options[dropdown.selectedIndex].text;
        
        // Jika Custom, cetak tanggalnya
        if (periodeLabel === 'custom') {
            const tglMulai = document.getElementById('tglKasMulai').value || 'Awal';
            const tglSelesai = document.getElementById('tglKasSelesai').value || 'Akhir';
            teksPeriode = `${tglMulai} s/d ${tglSelesai}`;
        }
        
        labelCetak.textContent = `PERIODE: ${teksPeriode.toUpperCase()}`;
    }
}

async function hapusTransaksiKas(idDoc) {
    const konfirmasi = await sesConfirm("Hapus Transaksi?", "Yakin ingin menghapus riwayat transaksi ini dari buku kas? Saldo akan disesuaikan secara otomatis.", "fas fa-trash-alt", "#ef4444");
    if(konfirmasi) {
        try {
            await db.collection("keuangan_ses").doc(idDoc).delete();
            tampilkanToast("Transaksi berhasil dihapus dari pembukuan.");
        } catch (err) {
            console.error(err);
            tampilkanToast("Gagal menghapus transaksi.", "error");
        }
    }
}
// ==========================================
// FUNGSI MODAL KAS (KEMBALIKAN FUNGSI YANG HILANG)
// ==========================================

function bukaModalKas(jenis) {
    const modal = document.getElementById('modalKeuangan');
    const judul = document.getElementById('modalKasJudul');
    const inputJenis = document.getElementById('kasJenis');
    const btnSimpan = document.getElementById('btnSimpanKas');
    
    inputJenis.value = jenis;
    
    if(jenis === 'masuk') {
        judul.innerHTML = '<i class="fas fa-arrow-down" style="color: #10b981;"></i> Catat Pemasukan Kas';
        btnSimpan.className = 'btn btn-success';
        btnSimpan.innerHTML = '<i class="fas fa-save"></i> Simpan Pemasukan';
    } else {
        judul.innerHTML = '<i class="fas fa-arrow-up" style="color: #ef4444;"></i> Catat Pengeluaran Kas';
        btnSimpan.className = 'btn btn-danger';
        btnSimpan.innerHTML = '<i class="fas fa-save"></i> Simpan Pengeluaran';
    }
    
    modal.style.display = 'flex';
}

function tutupModalKas() {
    document.getElementById('modalKeuangan').style.display = 'none';
    document.getElementById('kasNominal').value = '';
    document.getElementById('kasKeterangan').value = '';
}

async function simpanTransaksiKas(e) {
    e.preventDefault();
    const jenis = document.getElementById('kasJenis').value;
    const nominal = Number(document.getElementById('kasNominal').value);
    const keterangan = document.getElementById('kasKeterangan').value.trim();
    
    if(!nominal || !keterangan) {
        sesAlert("Data Belum Lengkap", "Harap isi nominal dan keterangan transaksi dengan benar!", "fas fa-exclamation-triangle", "#f59e0b");
        return;
    }
    
    try {
        await db.collection("keuangan_ses").add({
            jenis: jenis,
            nominal: nominal,
            keterangan: keterangan,
            waktuDibuat: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        tampilkanToast("Transaksi keuangan berhasil dicatat!");
        tutupModalKas();
    } catch(err) {
        console.error(err);
        tampilkanToast("Gagal menyimpan transaksi.", "error");
    }
}

// ==========================================
// FITUR GRAFIK, FEED, & LEADERBOARD (DINAMIS FIREBASE)
// ==========================================

function renderGrafikTrend() {
    const ctx = document.getElementById('trendChart');
    if(!ctx) return;
    
    // Tarik data riwayat pendaftaran dari Firebase
    db.collection("pendaftaran_tryout").onSnapshot(snap => {
        try { // 👇 Menambahkan pelindung Error 👇
            const namaHari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
            let labelHari = [];
            let dataPendaftar = [0, 0, 0, 0, 0, 0, 0];

            for (let i = 6; i >= 0; i--) {
                let d = new Date();
                d.setDate(d.getDate() - i);
                labelHari.push(namaHari[d.getDay()]);
            }

            const hariIni = new Date();
            hariIni.setHours(23, 59, 59, 999);
            const batasBawah = new Date(hariIni);
            batasBawah.setDate(batasBawah.getDate() - 6);
            batasBawah.setHours(0, 0, 0, 0);

            snap.forEach(doc => {
                const d = doc.data();
                // 👇 Pengecekan ketat agar tidak error jika data waktu belum sinkron 👇
                if (d.waktuDaftar && typeof d.waktuDaftar.toDate === 'function') {
                    const waktu = d.waktuDaftar.toDate();
                    if (waktu >= batasBawah && waktu <= hariIni) {
                        const diffTime = waktu.getTime() - batasBawah.getTime();
                        const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
                        if (diffDays >= 0 && diffDays <= 6) {
                            dataPendaftar[diffDays]++;
                        }
                    }
                }
            });

            if(window.myTrendChart) window.myTrendChart.destroy();
            
            window.myTrendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labelHari,
                    datasets: [{
                        label: 'Pendaftar Baru',
                        data: dataPendaftar, 
                        borderColor: '#0058c6',
                        backgroundColor: 'rgba(0, 88, 198, 0.1)',
                        borderWidth: 3,
                        pointBackgroundColor: '#ffaa00',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { borderDash: [5, 5] } },
                        x: { grid: { display: false } }
                    }
                }
            });
        } catch (error) {
            console.error("Grafik tidak dapat dimuat:", error);
        }
    });
}

// ==========================================
// FUNGSI ADMIN: MINI LEADERBOARD DASHBOARD (DENGAN FILTER LENGKAP)
// ==========================================
function muatMiniLeaderboard() {
    db.collection("users_tryout").onSnapshot(snap => {
        try {
            // 1. Kloning otomatis daftar paket ke dalam dropdown filter
            const filterPaketDropdown = document.getElementById('filterDashLBPaket');
            const sumberPaket = document.getElementById('pilihPaketSoal');
            if (filterPaketDropdown && filterPaketDropdown.options.length <= 1 && sumberPaket) {
                filterPaketDropdown.innerHTML = '<option value="">Semua Paket</option>';
                for (let i = 1; i < sumberPaket.options.length; i++) {
                    filterPaketDropdown.innerHTML += `<option value="${sumberPaket.options[i].value}">${sumberPaket.options[i].text}</option>`;
                }
            }

            // 2. Tarik nilai filter saat ini
            const filterPaket = filterPaketDropdown ? filterPaketDropdown.value : "";
            const filterTipe = document.getElementById('filterDashLBTipe') ? document.getElementById('filterDashLBTipe').value : "";
            const filterMapel = document.getElementById('filterDashLBMapel') ? document.getElementById('filterDashLBMapel').value : "";
            
            let users = [];
            
            snap.forEach(doc => {
                const d = doc.data();
                
                // Lewati siswa jika Tipe Akun tidak cocok dengan filter
                if (filterTipe !== "" && d.tipeAkses !== filterTipe) return;
                
                let totalSkor = 0;
                let jumlahMapel = 0;
                let riwayat = d.riwayat_lengkap || [];
                let mapelGroup = {};
                
                // 3. Pilah skor dari riwayat siswa berdasarkan paket dan mapel yang difilter
                riwayat.forEach(item => {
                    if ((filterPaket === "" || item.paket === filterPaket) && 
                        (filterMapel === "" || item.mapel === filterMapel) && 
                        item.mapel && item.skor !== undefined && item.skor !== null) {
                        
                        if (!mapelGroup[item.mapel]) mapelGroup[item.mapel] = [];
                        mapelGroup[item.mapel].push(Number(item.skor) || 0);
                    }
                });
                
                // 4. Hitung skor final (Ambil skor tertinggi / Max Score dari tiap mapel yang lolos filter)
                Object.keys(mapelGroup).forEach(mapel => {
                    let arrSkor = mapelGroup[mapel];
                    if (arrSkor.length > 0) {
                        totalSkor += Math.max(...arrSkor);
                        jumlahMapel++;
                    }
                });
                
                // Jika siswa memiliki nilai dari kriteria tersebut, masukkan ke papan peringkat
                if (jumlahMapel > 0) {
                    // Jika pilih 1 mapel, pembaginya otomatis 1. Jika pilih gabungan, pembaginya sesuai jumlah mapel yang dikerjakan.
                    d.rataRataSkor = Math.round(totalSkor / jumlahMapel);
                    users.push(d);
                }
            });
            
            // 5. Urutkan nilai dari tertinggi ke terendah dan ambil 3 terbaik
            users.sort((a, b) => (b.rataRataSkor || 0) - (a.rataRataSkor || 0));
            const top3 = users.slice(0, 3);
            
            const tbody = document.getElementById('miniLeaderboard');
            if(!tbody) return;
            tbody.innerHTML = '';
            
            if (top3.length === 0) {
                return tbody.innerHTML = '<tr><td style="text-align: center; color: var(--text-muted); padding: 30px 10px; font-size: 0.85rem; font-weight:600;">Belum ada nilai yang sesuai kriteria filter.</td></tr>';
            }
            
            top3.forEach((u, index) => {
                let rankClass = "bronze"; let medali = "3";
                if(index === 0) { rankClass = "gold"; medali = "1"; }
                if(index === 1) { rankClass = "silver"; medali = "2"; }
                
                // Beri label warna berdasarkan tipe akunnya
                let warnaAkun = u.tipeAkses === 'Ultimate' ? '#b45309' : (u.tipeAkses === 'Pro' ? '#0369a1' : '#166534');
                
                tbody.innerHTML += `
                    <tr style="animation: fadeIn 0.3s ease;">
                        <td class="lb-rank ${rankClass}">${medali}</td>
                        <td>
                            <span class="lb-name">${u.nama}</span>
                            <span class="lb-school">${u.sekolah || 'Peserta Mandiri'} <br>
                                <span style="color: ${warnaAkun}; font-weight: 800; font-size: 0.7rem; text-transform: uppercase;">[ ${u.tipeAkses || 'Basic'} ]</span>
                            </span>
                        </td>
                        <td style="text-align: right;">
                            <span class="lb-score-box">${u.rataRataSkor}</span>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error("Leaderboard tidak dapat dimuat:", error);
        }
    });
}

function muatAktivitasTerkini() {
    db.collection("pendaftaran_tryout").limit(5).onSnapshot(snap => {
        const list = document.getElementById('activityFeed');
        if(!list) return;
        list.innerHTML = '';
        
        if(snap.empty) {
            return list.innerHTML = '<li style="text-align: center; color: var(--text-muted); padding: 20px;">Belum ada aktivitas terekam.</li>';
        }
        
        snap.forEach(doc => {
            const d = doc.data();
            let ikon = '<i class="fas fa-user-plus"></i>';
            let warnaBg = 'var(--ses-blue)';
            let teks = 'mendaftar Tryout baru.';
            
            if(d.status === "Diterima") {
                ikon = '<i class="fas fa-check"></i>';
                warnaBg = '#10b981';
                teks = 'telah divalidasi dan di-ACC Admin.';
            }

            list.innerHTML += `
                <li class="feed-item">
                    <div class="feed-icon" style="background: ${warnaBg};">${ikon}</div>
                    <div class="feed-text">
                        <h4>${d.namaPeserta}</h4>
                        <p>${teks}</p>
                    </div>
                    <div class="feed-time">Baru Saja</div>
                </li>
            `;
        });
    });
}

// ==========================================
// FITUR MANAJEMEN GAMBAR CLOUDINARY (MULTI-UPLOAD)
// ==========================================
let fileGambarTerpilih = []; // Sekarang menjadi array untuk menampung banyak file

function previewUploadGambar(event) {
    const files = event.target.files;
    if (files.length === 0) return;
    
    fileGambarTerpilih = Array.from(files); // Simpan semua file yang dipilih
    const container = document.getElementById('areaPreviewUpload');
    container.innerHTML = ''; // Bersihkan layar preview
    
    // Tampilkan preview untuk setiap gambar yang dipilih
    fileGambarTerpilih.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            container.innerHTML += `<img src="${e.target.result}" style="max-height: 100px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">`;
        }
        reader.readAsDataURL(file);
    });
    
    container.style.display = 'flex';
    document.getElementById('labelPilihFile').style.display = 'none';
    
    const btnProses = document.getElementById('btnProsesUpload');
    btnProses.innerHTML = `<i class="fas fa-cloud-upload-alt"></i> Unggah ${fileGambarTerpilih.length} Gambar Sekarang`;
    btnProses.classList.remove('hidden');
}

async function unggahKeCloudinary() {
    if (!fileGambarTerpilih || fileGambarTerpilih.length === 0) return;
    
    const btn = document.getElementById('btnProsesUpload');
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Mengunggah ${fileGambarTerpilih.length} Gambar...`;
    btn.disabled = true;
    
    const cloudName = "oj7ryexi"; 
    const uploadPreset = "LMS TKA"; 
    
    let suksesUpload = 0;
    
    try {
        // Melakukan perulangan (looping) untuk mengunggah setiap gambar secara berurutan
        for (let file of fileGambarTerpilih) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", uploadPreset);
            
            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: formData
            });
            
            const data = await response.json();
            
            if (data.secure_url) {
                // Simpan ke database firebase setiap kali 1 gambar berhasil diunggah
                await db.collection("galeri_gambar").add({
                    url: data.secure_url,
                    publicId: data.public_id,
                    waktuDibuat: firebase.firestore.FieldValue.serverTimestamp()
                });
                suksesUpload++;
            }
        }
        
        tampilkanToast(`${suksesUpload} gambar berhasil diunggah ke Cloudinary!`);
        
        // Reset tampilan setelah semua selesai
        fileGambarTerpilih = [];
        document.getElementById('inputfileGambar').value = '';
        document.getElementById('areaPreviewUpload').style.display = 'none';
        document.getElementById('labelPilihFile').style.display = 'block';
        btn.classList.add('hidden');
        
        muatGaleriGambar(); // Segarkan tabel riwayat gambar
        
    } catch(err) {
        console.error(err);
        tampilkanToast("Terjadi kesalahan saat mengunggah gambar.", "error");
    } finally {
        btn.disabled = false;
    }
}

function muatGaleriGambar() {
    db.collection("galeri_gambar").orderBy("waktuDibuat", "desc").onSnapshot(snap => {
        const tbody = document.getElementById('tabelGaleriGambar');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        if(snap.empty) {
            return tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px; color: var(--text-muted);">Belum ada gambar yang diunggah.</td></tr>';
        }
        
        snap.forEach(doc => {
            const d = doc.data();
            const idDoc = doc.id;
            
            tbody.innerHTML += `
                <tr>
                    <td style="text-align: center;">
                        <img src="${d.url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;" alt="Thumbnail">
                    </td>
                    <td>
                        <span style="font-size: 0.85rem; color: var(--ses-blue-dark); font-weight: 700; word-break: break-all;">${d.publicId}</span>
                    </td>
                    <td>
                        <input type="text" value="${d.url}" readonly class="form-control" style="font-size: 0.8rem; padding: 6px 10px; background: #f8fafc;" onclick="this.select()">
                    </td>
                    <td style="text-align: center; white-space: nowrap;">
                        <button class="btn btn-primary btn-sm" onclick="navigator.clipboard.writeText('${d.url}'); tampilkanToast('Link berhasil disalin!')" style="margin-right: 5px;" title="Salin Link">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="hapusGambarCloudinary('${idDoc}')" title="Hapus">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    });
}

async function hapusGambarCloudinary(idDoc) {
    const konfirmasi = await sesConfirm("Hapus Riwayat Gambar?", "Yakin ingin menghapus riwayat link gambar ini dari panel admin?", "fas fa-trash-alt", "#ef4444");
    if(konfirmasi) {
        await db.collection("galeri_gambar").doc(idDoc).delete();
        tampilkanToast("Riwayat gambar dihapus.");
    }
}
// ==========================================
// FUNGSI ADMIN: SIARKAN PENGUMUMAN KE SISWA
// ==========================================
function siarkanPengumuman() {
    const teks = document.getElementById("inputPengumumanAdmin").value.trim();
    
    if (!teks) {
        sesAlert("Pesan Kosong", "Harap ketik isi pengumuman terlebih dahulu sebelum menyiarkan!", "fas fa-exclamation-triangle", "#f59e0b");
        return;
    }

    const btn = document.querySelector('button[onclick="siarkanPengumuman()"]');
    const teksAsli = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyiarkan...';
    btn.disabled = true;

    // Mengirim atau memperbarui dokumen ke Firebase (Koleksi: pengaturan)
    db.collection("pengaturan").doc("pengumuman").set({
        teks: teks,
        waktuUpdate: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => {
        tampilkanToast("Pengumuman berhasil disiarkan secara Real-time!");
    })
    .catch(err => {
        console.error("Gagal menyiarkan pengumuman:", err);
        tampilkanToast("Terjadi kesalahan saat menyiarkan pengumuman.", "error");
    })
    .finally(() => {
        btn.innerHTML = teksAsli;
        btn.disabled = false;
    });
}

// Tambahan: Agar saat admin me-refresh halaman, kolom ketikan langsung berisi teks pengumuman terakhir yang ada di server
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const textarea = document.getElementById("inputPengumumanAdmin");
        if (textarea) {
            db.collection("pengaturan").doc("pengumuman").get().then(doc => {
                if (doc.exists && doc.data().teks) {
                    textarea.value = doc.data().teks;
                }
            });
        }
    }, 1500); // Dijeda sebentar agar tidak berebut koneksi dengan load awal
});
// ==========================================
// FUNGSI ADMIN: TOOLBAR FORMAT TEKS (BOLD, ITALIC)
// ==========================================
function formatTeksAdmin(idElemen, tagHTML) {
    const textarea = document.getElementById(idElemen);
    if (!textarea) return;
    
    // Ambil posisi teks yang diblok (disorot) oleh Admin
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const teksYangDiblok = textarea.value.substring(start, end);
    
    // Bungkus teks dengan tag HTML (misal: <b>teks</b>)
    const teksBaru = `<${tagHTML}>${teksYangDiblok}</${tagHTML}>`;
    
    // Masukkan kembali ke dalam kotak teks
    textarea.value = textarea.value.substring(0, start) + teksBaru + textarea.value.substring(end);
    
    // Kembalikan fokus kursor ke kotak teks agar Admin bisa langsung mengetik lagi
    textarea.focus();
    
    // Jika tidak ada teks yang diblok, taruh kursor tepat di tengah tag agar siap diketik
    if (start === end) {
        textarea.selectionEnd = start + tagHTML.length + 2; 
    } else {
        textarea.selectionEnd = start + teksBaru.length;
    }
}
// ==========================================
// FUNGSI ADMIN: MEMBUAT BLOK BACAAN / WACANA
// ==========================================
function formatWacanaAdmin(idElemen) {
    const textarea = document.getElementById(idElemen);
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const teksYangDiblok = textarea.value.substring(start, end);
    
    // 👇 BARIS INI YANG DIGANTI (Ditambah text-align: justify) 👇
    const tagBuka = `<div style="background-color: #e2e8f0; padding: 15px 20px; border-radius: 12px; margin-bottom: 15px; color: #333; line-height: 1.6; text-align: justify;">`;
    const tagTutup = `</div>`;
    
    const teksBaru = `${tagBuka}\n${teksYangDiblok}\n${tagTutup}`;
    
    textarea.value = textarea.value.substring(0, start) + teksBaru + textarea.value.substring(end);
    textarea.focus();
    
    if (start === end) {
        textarea.selectionEnd = start + tagBuka.length + 1; 
    } else {
        textarea.selectionEnd = start + teksBaru.length;
    }
    
    // Sesuaikan tinggi kotak otomatis
    textarea.dispatchEvent(new Event('input'));
}
// ==========================================
// FUNGSI ADMIN: FORMAT PERATAAN TEKS (ALIGNMENT)
// ==========================================
function formatAlignAdmin(idElemen, posisi) {
    const textarea = document.getElementById(idElemen);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let teksYangDiblok = textarea.value.substring(start, end);

    // Membungkus teks dengan tag div dan properti text-align yang dinamis
    const tagBuka = `<div style="text-align: ${posisi};">`;
    const tagTutup = `</div>`;

    const teksBaru = `${tagBuka}\n${teksYangDiblok}\n${tagTutup}`;

    textarea.value = textarea.value.substring(0, start) + teksBaru + textarea.value.substring(end);
    textarea.focus();

    if (start === end) {
        textarea.selectionEnd = start + tagBuka.length + 1; 
    } else {
        textarea.selectionEnd = start + teksBaru.length;
    }
    textarea.dispatchEvent(new Event('input'));
}
// ==========================================
// FUNGSI ADMIN: MEMBUAT KOTAK WARNA-WARNI & HIGHLIGHT
// ==========================================
function formatKotakWarna(idElemen, tipe) {
    const textarea = document.getElementById(idElemen);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let teksYangDiblok = textarea.value.substring(start, end);
    if (!teksYangDiblok) teksYangDiblok = "Ketik penjelasan Anda di sini..."; 

    let tagBuka = "";
    const tagTutup = `</div>`;

    // 1. Desain Kotak Sukses (Hijau Soft - Untuk Kunci Jawaban / Poin Benar)
    if (tipe === 'sukses') {
        tagBuka = `<div style="background-color: #f0fdf4; border: 2px solid #bbf7d0; padding: 15px 20px; border-radius: 12px; margin-bottom: 15px; color: #166534; line-height: 1.6; box-shadow: 0 4px 6px rgba(0,0,0,0.02);"><i class="fas fa-check-circle" style="color: #22c55e; margin-right: 8px; font-size: 1.15em;"></i><b>Jawaban Tepat:</b><br>`;
    } 
    // 2. Desain Kotak Penting (Kuning/Orange Soft - Untuk Rumus / Peringatan)
    else if (tipe === 'penting') {
        tagBuka = `<div style="background-color: #fffbeb; border: 2px dashed #fde68a; padding: 15px 20px; border-radius: 12px; margin-bottom: 15px; color: #b45309; line-height: 1.6; box-shadow: 0 4px 6px rgba(0,0,0,0.02);"><i class="fas fa-lightbulb" style="color: #f59e0b; margin-right: 8px; font-size: 1.15em;"></i><b>Catatan Penting:</b><br>`;
    }

    const teksBaru = `${tagBuka}${teksYangDiblok}${tagTutup}`;
    textarea.value = textarea.value.substring(0, start) + teksBaru + textarea.value.substring(end);
    textarea.focus();
    
    textarea.selectionStart = start + tagBuka.length;
    textarea.selectionEnd = start + tagBuka.length + teksYangDiblok.length;
    textarea.dispatchEvent(new Event('input'));
}

// Fungsi Untuk Memberi Warna Latar Teks (Seperti Stabilo)
function formatHighlight(idElemen) {
    const textarea = document.getElementById(idElemen);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let teksYangDiblok = textarea.value.substring(start, end);
    if (!teksYangDiblok) teksYangDiblok = "Teks Penting";

    // Desain Highlight Stabilo Kuning dengan Sudut Membulat
    const tagBuka = `<span style="background-color: #fef08a; padding: 2px 8px; border-radius: 6px; font-weight: bold; color: #854d0e;">`;
    const tagTutup = `</span>`;

    const teksBaru = `${tagBuka}${teksYangDiblok}${tagTutup}`;
    textarea.value = textarea.value.substring(0, start) + teksBaru + textarea.value.substring(end);
    textarea.focus();
    textarea.dispatchEvent(new Event('input'));
}
// ==========================================
// FUNGSI ADMIN: KOTAK WARNA, HIGHLIGHT, DAN RUMUS
// ==========================================
function formatKotakWarna(idElemen, tipe) {
    const textarea = document.getElementById(idElemen);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let teksYangDiblok = textarea.value.substring(start, end);
    if (!teksYangDiblok) teksYangDiblok = "Ketik isi kotak di sini..."; 

    let tagBuka = "";
    const tagTutup = `</div>`;

    if (tipe === 'sukses') {
        tagBuka = `<div style="background-color: #f0fdf4; border: 2px solid #bbf7d0; padding: 15px 20px; border-radius: 12px; margin-bottom: 15px; color: #166534; line-height: 1.6; box-shadow: 0 4px 6px rgba(0,0,0,0.02);"><i class="fas fa-check-circle" style="color: #22c55e; margin-right: 8px; font-size: 1.15em;"></i><b>Jawaban Tepat:</b><br>`;
    } else if (tipe === 'penting') {
        tagBuka = `<div style="background-color: #fffbeb; border: 2px dashed #fde68a; padding: 15px 20px; border-radius: 12px; margin-bottom: 15px; color: #b45309; line-height: 1.6; box-shadow: 0 4px 6px rgba(0,0,0,0.02);"><i class="fas fa-lightbulb" style="color: #f59e0b; margin-right: 8px; font-size: 1.15em;"></i><b>Catatan Penting:</b><br>`;
    } else if (tipe === 'info') {
        tagBuka = `<div style="background-color: #eff6ff; border: 2px solid #bfdbfe; padding: 15px 20px; border-radius: 12px; margin-bottom: 15px; color: #1d4ed8; line-height: 1.6; box-shadow: 0 4px 6px rgba(0,0,0,0.02);"><i class="fas fa-info-circle" style="color: #3b82f6; margin-right: 8px; font-size: 1.15em;"></i><b>Informasi Tambahan:</b><br>`;
    } else if (tipe === 'bahaya') {
        tagBuka = `<div style="background-color: #fef2f2; border: 2px solid #fecaca; padding: 15px 20px; border-radius: 12px; margin-bottom: 15px; color: #b91c1c; line-height: 1.6; box-shadow: 0 4px 6px rgba(0,0,0,0.02);"><i class="fas fa-exclamation-triangle" style="color: #ef4444; margin-right: 8px; font-size: 1.15em;"></i><b>Perhatian / Pengecualian:</b><br>`;
    }

    const teksBaru = `${tagBuka}${teksYangDiblok}${tagTutup}`;
    textarea.value = textarea.value.substring(0, start) + teksBaru + textarea.value.substring(end);
    textarea.focus();
    
    textarea.selectionStart = start + tagBuka.length;
    textarea.selectionEnd = start + tagBuka.length + teksYangDiblok.length;
    textarea.dispatchEvent(new Event('input'));
}

function formatHighlight(idElemen) {
    const textarea = document.getElementById(idElemen);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let teksYangDiblok = textarea.value.substring(start, end);
    if (!teksYangDiblok) teksYangDiblok = "Teks Penting";

    const tagBuka = `<span style="background-color: #fef08a; padding: 2px 8px; border-radius: 6px; font-weight: bold; color: #854d0e;">`;
    const tagTutup = `</span>`;

    const teksBaru = `${tagBuka}${teksYangDiblok}${tagTutup}`;
    textarea.value = textarea.value.substring(0, start) + teksBaru + textarea.value.substring(end);
    textarea.focus();
    textarea.dispatchEvent(new Event('input'));
}

// Fungsi Untuk Membungkus Kode Rumus Matematika (MathJax)
function formatMath(idElemen) {
    const textarea = document.getElementById(idElemen);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let teksYangDiblok = textarea.value.substring(start, end);
    if (!teksYangDiblok) teksYangDiblok = "x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}";

    // Membungkus dengan tanda blok rumus (MathJax akan merendernya otomatis di halaman siswa)
    const teksBaru = `$$${teksYangDiblok}$$`;
    
    textarea.value = textarea.value.substring(0, start) + teksBaru + textarea.value.substring(end);
    textarea.focus();
    
    textarea.selectionStart = start + 2;
    textarea.selectionEnd = start + 2 + teksYangDiblok.length;
    textarea.dispatchEvent(new Event('input'));
}
// ==========================================
// FUNGSI ADMIN: FORMAT PENOMORAN (NUMBERING & BULLET)
// ==========================================
function formatListAdmin(idElemen, type = 'ol') {
    const textarea = document.getElementById(idElemen);
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let teksYangDiblok = textarea.value.substring(start, end);

    if (!teksYangDiblok) {
        teksYangDiblok = "Langkah 1\nLangkah 2\nLangkah 3"; 
    }

    // Pecah per baris, buang baris kosong, hilangkan angka/simbol manual di awal, lalu bungkus <li>
    const listItems = teksYangDiblok.split('\n')
        .filter(item => item.trim() !== '')
        .map(item => `<li style="margin-bottom: 6px; padding-left: 5px; text-align: left;">${item.trim().replace(/^([0-9]+[\.\)]|[-•*])\s*/, '')}</li>`)
        .join('');

    // Format list tanpa enter (\n) antar tag agar fungsi perender soal di siswa tidak membuat celah kosong/br dobel
    const tagBuka = `<${type} style="margin-left: 25px; margin-top: 15px; margin-bottom: 15px; padding-left: 0;">`;
    const tagTutup = `</${type}>`;

    const teksBaru = `${tagBuka}${listItems}${tagTutup}`;

    textarea.value = textarea.value.substring(0, start) + teksBaru + textarea.value.substring(end);
    textarea.focus();

    // Blok hasil akhirnya agar admin mudah melihatnya
    textarea.selectionStart = start;
    textarea.selectionEnd = start + teksBaru.length;
    textarea.dispatchEvent(new Event('input'));
    // TAMBAHKAN BARIS INI DI BAWAH:
    cekStatusFormat(idElemen);
}
// ==========================================
// FUNGSI ADMIN: DETEKSI FORMAT AKTIF (TOMBOL MENYALA)
// ==========================================
function cekStatusFormat(idElemen) {
    const textarea = document.getElementById(idElemen);
    if (!textarea) return;

    // Ambil posisi kursor saat ini dan teks dari awal hingga kursor
    const cursorPos = textarea.selectionStart;
    const teksSebelumKursor = textarea.value.substring(0, cursorPos);

    // Fungsi canggih untuk melacak apakah sebuah format (tag HTML) sedang terbuka di posisi kursor
    const cekTagTerbuka = (tagBuka, tagTutup) => {
        const jmlBuka = (teksSebelumKursor.match(tagBuka) || []).length;
        const jmlTutup = (teksSebelumKursor.match(tagTutup) || []).length;
        return jmlBuka > jmlTutup; // Jika lebih banyak yang buka dibanding tutup, berarti sedang aktif
    };

    // 1. Lacak Format Dasar
    const isBold = cekTagTerbuka(/<b>/g, /<\/b>/g);
    const isItalic = cekTagTerbuka(/<i>/g, /<\/i>/g);
    const isUnderline = cekTagTerbuka(/<u>/g, /<\/u>/g);

    // 2. Lacak Format Daftar (Numbering / Bullet)
    const isOl = cekTagTerbuka(/<ol[^>]*>/g, /<\/ol>/g);
    const isUl = cekTagTerbuka(/<ul[^>]*>/g, /<\/ul>/g);

    // 3. Lacak Format Perataan Teks (Alignment)
    let currentAlign = 'left'; // Default aplikasi
    const alignMatches = [...teksSebelumKursor.matchAll(/<div style="text-align:\s*(left|center|right|justify);">/g)];
    if (alignMatches.length > 0) {
        const lastMatch = alignMatches[alignMatches.length - 1];
        const teksSetelahAlign = teksSebelumKursor.substring(lastMatch.index);
        const divTutupHabisAlign = (teksSetelahAlign.match(/<\/div>/g) || []).length;
        // Jika tag penutup (</div>) belum ditemukan setelah pembuka, berarti align masih aktif
        if (divTutupHabisAlign === 0) {
            currentAlign = lastMatch[1];
        }
    }


    // --- EKSEKUSI: NYALAKAN / MATIKAN TOMBOL ---
    const nyalakanTombol = (namaFungsi, param, kondisi) => {
        const query = `button[onclick*="${namaFungsi}('${idElemen}', '${param}')"]`;
        const btn = document.querySelector(query);
        if (btn) {
            if (kondisi) btn.classList.add('active-format');
            else btn.classList.remove('active-format');
        }
    };

    nyalakanTombol("formatTeksAdmin", "b", isBold);
    nyalakanTombol("formatTeksAdmin", "i", isItalic);
    nyalakanTombol("formatTeksAdmin", "u", isUnderline);
    
    nyalakanTombol("formatListAdmin", "ol", isOl);
    nyalakanTombol("formatListAdmin", "ul", isUl);

    nyalakanTombol("formatAlignAdmin", "left", currentAlign === 'left');
    nyalakanTombol("formatAlignAdmin", "center", currentAlign === 'center');
    nyalakanTombol("formatAlignAdmin", "right", currentAlign === 'right');
    nyalakanTombol("formatAlignAdmin", "justify", currentAlign === 'justify');
}
// ==========================================
// Variabel Global untuk Memantau Layar Live
// ==========================================
let pantauanLiveRekap = null;

// ==========================================
// FUNGSI ADMIN: REKAPITULASI NILAI (DENGAN LAPORAN WA OTOMATIS KE ORTU)
// ==========================================
function muatRekapNilai() {
    const dropdownPaket = document.getElementById('filterPaketRekap');
    const dropdownMapel = document.getElementById('filterMapelRekap');
    
    const paketDipilih = dropdownPaket.value;
    const mapelDipilih = dropdownMapel ? dropdownMapel.value : "Semua";
    
    const tbody = document.getElementById('tabelRekapNilai');
    const judul = document.getElementById('judulLaporanPaket');
    
    if (!paketDipilih || !tbody) return;
    
    // Matikan pantauan live sebelumnya jika admin mengganti pilihan paket agar tidak error
    if (pantauanLiveRekap) {
        pantauanLiveRekap();
    }
    
    const jenisPaket = dropdownPaket.options[dropdownPaket.selectedIndex].getAttribute('data-jenis').toLowerCase();
    
    let teksMode = jenisPaket === "ultimate" ? "SIMULASI MUTLAK" : (jenisPaket === "pro" ? "MAX SCORE" : "LATIHAN/RATA-RATA");
    let teksJudulMapel = mapelDipilih === "Semua" ? "GABUNGAN SEMUA MAPEL" : mapelDipilih.toUpperCase();
    
    judul.innerHTML = `
        PAKET: ${paketDipilih.toUpperCase()} 
        <br><span style="font-size:0.9rem; color:#64748b; margin-top:5px; display:inline-block;">MATA PELAJARAN: ${teksJudulMapel}</span>
        <span style="font-size:0.7rem; background:#ef4444; color:white; padding:3px 8px; border-radius:10px; vertical-align:middle; margin-left:10px; animation: blink 1.5s infinite;"><i class="fas fa-circle"></i> LIVE SCORE ${teksMode}</span>
    `;
    
    const thead = tbody.previousElementSibling;
    if (thead) {
        thead.innerHTML = `
            <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                <th style="text-align: center; width: 60px;">Peringkat</th>
                <th style="text-align: center; width: 100px;">No. Peserta</th>
                <th>Nama Lengkap Peserta</th>
                <th>Asal Lembaga / Sekolah</th>
                <th style="text-align: center;">Nilai Mapel</th>
                <th style="text-align: center; width: 120px;">Laporan Ortu</th>
                <th style="text-align: center; width: 110px;">Keterangan</th>
            </tr>
        `;
    }

    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--ses-blue);"><i class="fas fa-satellite-dish" style="font-size: 2rem; margin-bottom: 10px; display: block; animation: spin 2s linear infinite;"></i> Menghubungkan ke Server Live...</td></tr>`;
    
    pantauanLiveRekap = db.collection("users_tryout").onSnapshot(snap => {
        let rekapPeserta = [];
        
        snap.forEach(doc => {
            const d = doc.data();
            let riwayat = d.riwayat_lengkap || [];
            let mapelGroup = {};
            
            // Filter nilai sesuai paket
            riwayat.forEach(item => {
                if (item.paket === paketDipilih && item.mapel && item.skor !== undefined && item.skor !== null) {
                    if (!mapelGroup[item.mapel]) mapelGroup[item.mapel] = [];
                    mapelGroup[item.mapel].push(Number(item.skor) || 0);
                }
            });
            
            let skorMatematikaFinal = null;
            let skorBIndoFinal = null;
            let adaNilai = false;

            if (mapelGroup["Matematika"] && mapelGroup["Matematika"].length > 0) {
                adaNilai = true;
                let arrMat = mapelGroup["Matematika"];
                if (jenisPaket === "ultimate") skorMatematikaFinal = arrMat[0]; 
                else if (jenisPaket === "pro") skorMatematikaFinal = Math.max(...arrMat); 
                else skorMatematikaFinal = Math.round(arrMat.reduce((a, b) => a + b, 0) / arrMat.length);
            }

            if (mapelGroup["Bahasa Indonesia"] && mapelGroup["Bahasa Indonesia"].length > 0) {
                adaNilai = true;
                let arrIndo = mapelGroup["Bahasa Indonesia"];
                if (jenisPaket === "ultimate") skorBIndoFinal = arrIndo[0]; 
                else if (jenisPaket === "pro") skorBIndoFinal = Math.max(...arrIndo); 
                else skorBIndoFinal = Math.round(arrIndo.reduce((a, b) => a + b, 0) / arrIndo.length);
            }

            if (adaNilai) {
                if (mapelDipilih === "Semua") {
                    let totalMapelUnik = 0;
                    let jumlahTotalSkor = 0;

                    if (skorMatematikaFinal !== null) { totalMapelUnik++; jumlahTotalSkor += skorMatematikaFinal; }
                    if (skorBIndoFinal !== null) { totalMapelUnik++; jumlahTotalSkor += skorBIndoFinal; }

                    let rataRataAkhir = totalMapelUnik > 0 ? Math.round(jumlahTotalSkor / totalMapelUnik) : 0;
                    
                    rekapPeserta.push({
                        username: d.username || '-',
                        nama: d.nama,
                        sekolah: d.sekolah || 'Peserta Mandiri',
                        wa: d.wa || '',
                        tipeAkses: d.tipeAkses || 'Basic', // Simpan tipe akses siswa
                        matematika: skorMatematikaFinal !== null ? skorMatematikaFinal : "-",
                        bIndo: skorBIndoFinal !== null ? skorBIndoFinal : "-",
                        rataRata: rataRataAkhir,
                        skorSort: rataRataAkhir
                    });
                } else {
                    let skorSpesifik = null;
                    if (mapelDipilih === "Matematika" && skorMatematikaFinal !== null) skorSpesifik = skorMatematikaFinal;
                    if (mapelDipilih === "Bahasa Indonesia" && skorBIndoFinal !== null) skorSpesifik = skorBIndoFinal;

                    if (skorSpesifik !== null) {
                        rekapPeserta.push({
                            username: d.username || '-',
                            nama: d.nama,
                            sekolah: d.sekolah || 'Peserta Mandiri',
                            wa: d.wa || '',
                            tipeAkses: d.tipeAkses || 'Basic',
                            skorMapel: skorSpesifik,
                            skorSort: skorSpesifik
                        });
                    }
                }
            }
        });
        
        rekapPeserta.sort((a, b) => b.skorSort - a.skorSort);
        tbody.innerHTML = '';
        
        let totalSeluruhPeserta = rekapPeserta.length;

        if (totalSeluruhPeserta === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted); font-weight: 600;"><i class="fas fa-users-slash" style="font-size: 2rem; color: #cbd5e1; display: block; margin-bottom: 10px;"></i> Menunggu peserta menyelesaikan ujian...</td></tr>`;
            return;
        }
        
        rekapPeserta.forEach((p, idx) => {
            let rank = idx + 1;
            let medaliVisual = rank;
            if (rank === 1) medaliVisual = '<i class="fas fa-medal" style="color: #fbbf24; font-size: 1.3rem;"></i>';
            if (rank === 2) medaliVisual = '<i class="fas fa-medal" style="color: #94a3b8; font-size: 1.2rem;"></i>';
            if (rank === 3) medaliVisual = '<i class="fas fa-medal" style="color: #b45309; font-size: 1.1rem;"></i>';
            
            // Menentukan kelulusan
            let skorAkhirCek = mapelDipilih === "Semua" ? p.rataRata : p.skorMapel;
            let statusKelulusan = skorAkhirCek >= 75 ? "✅ LULUS / SANGAT BAIK" : "⚠️ PERLU PENDAMPINGAN (REMEDIAL)";
            let ketHtml = skorAkhirCek >= 75 
                ? `<span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 6px; font-weight: 800; font-size: 0.75rem;">Lulus / Baik</span>`
                : `<span style="background: #fee2e2; color: #b91c1c; padding: 4px 8px; border-radius: 6px; font-weight: 800; font-size: 0.75rem;">Remedial</span>`;

            // 👇 FORMAT LAPORAN WA OTOMATIS SUPER LENGKAP 👇
            let waHtml = "-";
            if (p.wa) {
                let cleanWa = p.wa.replace(/\D/g, '');
                if (cleanWa.startsWith('0')) cleanWa = '62' + cleanWa.substring(1);

                // Merakit string nilai tergantung filter (Semua Mapel atau Spesifik)
                let rincianNilaiWA = mapelDipilih === "Semua"
                    ? `📘 *Matematika:* ${p.matematika}\n📙 *B. Indonesia:* ${p.bIndo}\n⭐ *RATA-RATA AKHIR:* ${p.rataRata}`
                    : `📚 *${mapelDipilih.toUpperCase()}:* ${p.skorMapel}`;

                // Merakit isi pesan WhatsApp untuk orang tua
                let pesanTemplate = 
`📊 *LAPORAN HASIL TRYOUT LKP SES* 📊

Kepada Yth. Orang Tua/Wali dari ananda:
👤 *${p.nama.toUpperCase()}*

Berikut adalah hasil evaluasi belajar dan rekap nilai ananda pada platform CBT (Computer Based Test) LKP Smart Education Solution:

📝 *Nama Paket Ujian:* ${paketDipilih.toUpperCase()}
👑 *Kategori Akun:* ${p.tipeAkses.toUpperCase()}

*RINCIAN NILAI & PROGRES:*
${rincianNilaiWA}

🏆 *PERINGKAT KESELURUHAN:*
Ananda berada di peringkat ke-*${rank}* dari total *${totalSeluruhPeserta}* siswa peserta pada paket ini.

📌 *CATATAN / STATUS EVALUASI:*
${statusKelulusan}

Terus berikan motivasi dan semangat belajar untuk ananda tercinta demi meraih prestasi yang lebih tinggi! 🚀

Salam hormat,
*Pambudi, S.Pd.SD*
(Pimpinan / Pengelola LKP SES)`;

                waHtml = `<a href="https://wa.me/${cleanWa}?text=${encodeURIComponent(pesanTemplate)}" target="_blank" class="btn btn-success btn-sm" style="padding: 6px 10px; font-size: 0.8rem; font-weight: 800; border-radius: 6px; text-decoration: none; background: #25D366; border-color: #25D366; color: white; display: flex; align-items: center; justify-content: center; gap: 5px;" title="Kirim Laporan via WA"><i class="fab fa-whatsapp" style="font-size: 1.1rem;"></i> Lapor Ortu</a>`;
            }

            let tampilanNilai = "";
            if (mapelDipilih === "Semua") {
                tampilanNilai = `Mat: <strong>${p.matematika}</strong> | Indo: <strong>${p.bIndo}</strong><br><span style="color:#10b981; font-weight:900;">Rata-rata: ${p.rataRata}</span>`;
            } else {
                tampilanNilai = `<strong style="font-size: 1.1rem; color: var(--ses-blue);">${p.skorMapel}</strong>`;
            }

            tbody.innerHTML += `
                <tr style="animation: fadeIn 0.5s ease; border-bottom: 1px solid #e2e8f0;">
                    <td style="text-align: center; font-weight: 900; color: var(--ses-blue-dark); font-size: 1.1rem;">${medaliVisual}</td>
                    <td style="text-align: center; font-family: monospace; font-weight: 800; color: #475569;">${p.username}</td>
                    <td>
                        <strong style="color: var(--ses-blue); text-transform: uppercase;">${p.nama}</strong><br>
                        <span style="font-size: 0.75rem; color: #b45309; font-weight: 800; text-transform: uppercase;">[ ${p.tipeAkses} ]</span>
                    </td>
                    <td style="color: #334155; font-weight: 700;">${p.sekolah}</td>
                    <td style="text-align: center;">${tampilanNilai}</td>
                    <td style="text-align: center;">${waHtml}</td>
                    <td style="text-align: center;">${ketHtml}</td>
                </tr>
            `;
        });
        
    }, err => {
        console.error("Gagal menarik data live:", err);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 30px; font-weight: bold;"><i class="fas fa-exclamation-triangle"></i> Terputus dari Server Live.</td></tr>`;
    });
}
// ==========================================
// FUNGSI ADMIN: KONTROL DARURAT (MASTER SWITCH)
// ==========================================
async function ubahStatusDarurat(statusAksi) {
    let pesanKonfirmasi = "";
    let warnaModal = "var(--ses-blue)";
    
    if (statusAksi === "BUKA_PAKSA") {
        pesanKonfirmasi = "Yakin ingin <b>MBUKA PAKSA</b> seluruh ujian sekarang? Seluruh gembok di HP peserta akan terbuka seketika.";
        warnaModal = "#10b981";
    } else if (statusAksi === "TUTUP_PAKSA") {
        pesanKonfirmasi = "Yakin ingin <b>MENUTUP / MENGUNCI</b> seluruh ujian sekarang? Peserta tidak akan bisa melanjutkan ujian.";
        warnaModal = "#ef4444";
    } else {
        pesanKonfirmasi = "Mengembalikan sistem ke mode jadwal otomatis normal.";
        warnaModal = "#64748b";
    }

    const konfirmasi = await sesConfirm("Konfirmasi Master Switch", pesanKonfirmasi, "fas fa-satellite-dish", warnaModal);
    if (!konfirmasi) return;

    try {
        // Menyimpan status master switch ke koleksi pengaturan Firebase
        await db.collection("pengaturan").doc("master_switch").set({
            status: statusAksi, // BUKA_PAKSA, TUTUP_PAKSA, atau NORMAL
            waktuUpdate: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        tampilkanToast(`Berhasil! Sinyal Darurat [${statusAksi}] disiarkan ke seluruh perangkat peserta.`);
    } catch (err) {
        console.error("Gagal mengubah status darurat:", err);
        tampilkanToast("Terjadi kesalahan saat mengirim sinyal.", "error");
    }
}
// ==========================================
// FUNGSI ADMIN: UBAH TIPE AKSES SISWA LANGSUNG
// ==========================================
async function ubahTipeAksesSiswa(idDoc, jenisAksesBaru) {
    try {
        // Update langsung ke koleksi users_tryout di Firebase
        await db.collection("users_tryout").doc(idDoc).update({
            tipeAkses: jenisAksesBaru
        });
        
        tampilkanToast(`Tipe akses berhasil diubah menjadi [${jenisAksesBaru}]!`);
    } catch (err) {
        console.error("Gagal mengubah tipe akses:", err);
        tampilkanToast("Gagal menyimpan perubahan tipe akun.", "error");
    }
}
// ==========================================
// FUNGSI ADMIN: ANALISIS BUTIR SOAL & KESULITAN
// ==========================================

// Inisialisasi pilihan paket saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const selectPaketAnalisis = document.getElementById('filterAnalisisPaket');
        const sumberPaket = document.getElementById('pilihPaketSoal');
        if (selectPaketAnalisis && sumberPaket && sumberPaket.options.length > 1) {
            selectPaketAnalisis.innerHTML = '';
            for (let i = 1; i < sumberPaket.options.length; i++) {
                const opt = sumberPaket.options[i];
                selectPaketAnalisis.innerHTML += `<option value="${opt.value}">${opt.text}</option>`;
            }
            // Panggil analisis otomatis untuk paket pertama
            muatDataAnalisisSoal();
        }
    }, 2000);
});

async function muatDataAnalisisSoal() {
    const paketDropdown = document.getElementById('filterAnalisisPaket');
    const mapelDropdown = document.getElementById('filterAnalisisMapel');
    const tbody = document.getElementById('tabelAnalisisSoal');
    
    if (!paketDropdown || !mapelDropdown || !tbody) return;
    
    const paketPilihan = paketDropdown.value;
    const mapelPilihan = mapelDropdown.value;
    
    if (!paketPilihan) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">Pilih paket tryout terlebih dahulu.</td></tr>';
        return;
    }

    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--ses-blue);"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i> Menganalisis jawaban seluruh peserta...</td></tr>`;

    try {
        // 1. Ambil seluruh soal pada paket & mapel tersebut untuk mendapatkan Kunci Jawaban
        const snapshotSoal = await db.collection("bank_soal")
            .where("paket", "==", paketPilihan)
            .where("mapel", "==", mapelPilihan)
            .get();

        if (snapshotSoal.empty) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">Tidak ada bank soal untuk kriteria ini.</td></tr>';
            return;
        }

        let petaSoalKunci = {};
        let daftarSoalUrut = [];
        snapshotSoal.forEach(doc => {
            const soal = doc.data();
            
            // 👇 INI TAMBAHAN KUNCINYA: Menyimpan ID dokumen Firestore 👇
            soal.id = doc.id; 
            
            petaSoalKunci[soal.nomor] = soal;
            daftarSoalUrut.push(soal);
        });
        daftarSoalUrut.sort((a, b) => a.nomor - b.nomor);
        // 2. Ambil seluruh data peserta ujian dari koleksi users_tryout
        const snapshotSiswa = await db.collection("users_tryout").get();
        if (snapshotSiswa.empty) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">Belum ada data peserta yang tersimpan.</td></tr>';
            return;
        }

        // 3. Rekapitulasi jawaban peserta
        let statistikSoal = {};
        daftarSoalUrut.forEach(soal => {
            statistikSoal[soal.nomor] = { totalDijawab: 0, totalBenar: 0, teks: soal.aid || soal.text || "" };
        });

        snapshotSiswa.forEach(doc => {
            const d = doc.data();
            let petaJawabanSiswa = null;

            // Cari objek jawaban siswa yang sesuai dengan mapel tersebut
            if (d[`jawaban_${mapelPilihan}`]) {
                petaJawabanSiswa = d[`jawaban_${mapelPilihan}`];
            } else if (d.riwayat_lengkap && Array.isArray(d.riwayat_lengkap)) {
                let riwayatDitemukan = d.riwayat_lengkap.find(r => r.paket === paketPilihan && r.mapel === mapelPilihan);
                if (riwayatDitemukan && riwayatDitemukan.jawaban) {
                    petaJawabanSiswa = riwayatDitemukan.jawaban;
                }
            }

            if (petaJawabanSiswa) {
                Object.keys(petaJawabanSiswa.current || petaJawabanSiswa).forEach(nomorStr => {
                    let nomor = Number(nomorStr);
                    let jawabanSiswa = (petaJawabanSiswa.current || petaJawabanSiswa)[nomorStr];
                    let soalObj = petaSoalKunci[nomor];

                    if (soalObj && statistikSoal[nomor] !== undefined && jawabanSiswa !== null && jawabanSiswa !== undefined) {
                        statistikSoal[nomor].totalDijawab++;
                        
                        let isBenar = false;
                        if (soalObj.type === "pg") {
                            isBenar = (jawabanSiswa === soalObj.answer);
                        } else if (soalObj.type === "multi") {
                            let a = Array.isArray(jawabanSiswa) ? [...jawabanSiswa].sort() : [];
                            let b = [...soalObj.answer].slice(0, 3).sort((x, y) => x - y);
                            isBenar = a.length === b.length && a.every((v, j) => v === b[j]);
                        } else if (soalObj.type === "tf") {
                            if (Array.isArray(jawabanSiswa) && Array.isArray(soalObj.answer)) {
                                isBenar = jawabanSiswa.every((val, idx) => val === soalObj.answer[idx]);
                            }
                        }

                        if (isBenar) {
                            statistikSoal[nomor].totalBenar++;
                        }
                    }
                });
            }
        });

        // 4. Render ke dalam Tabel Admin
        tbody.innerHTML = '';
        daftarSoalUrut.forEach(soal => {
            let stat = statistikSoal[soal.nomor];
            let persentase = stat.totalDijawab > 0 ? Math.round((stat.totalBenar / stat.totalDijawab) * 100) : 0;
            
            let badgeKesulitan = '';
            if (stat.totalDijawab === 0) {
                badgeKesulitan = `<span style="background: #f1f5f9; color: #64748b; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.75rem;">Belum Ada Data</span>`;
            } else if (persentase >= 75) {
                badgeKesulitan = `<span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.75rem;"><i class="fas fa-smile"></i> Mudah (${persentase}%)</span>`;
            } else if (persentase >= 40) {
                badgeKesulitan = `<span style="background: #fffbeb; color: #b45309; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.75rem;"><span style="color: #f59e0b;">●</span> Sedang (${persentase}%)</span>`;
            } else {
                badgeKesulitan = `<span style="background: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.75rem;"><i class="fas fa-exclamation-triangle"></i> Sukar (${persentase}%)</span>`;
            }

            let cuplikanTeks = (soal.text || "").replace(/(<([^>]+)>)/gi, "");
            if (cuplikanTeks.length > 50) cuplikanTeks = cuplikanTeks.substring(0, 50) + "...";

            // 👇 Tombol Pintasan Edit yang langsung mengarahkan Admin ke menu Studio Bank Soal & membuka form edit 👇
            let tombolEditAksi = `
                <button onclick="pindahDanEditSoal('${soal.id}')" class="btn btn-warning btn-sm" style="padding: 6px 12px; font-size: 0.75rem; border-radius: 6px; background: #f59e0b; color: white; border: none; cursor: pointer;" title="Edit Soal Ini">
                    <i class="fas fa-edit"></i> Edit Soal
                </button>
            `;

            tbody.innerHTML += `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="text-align: center; font-weight: 900; color: var(--ses-blue); font-size: 1.1rem;">${soal.nomor}</td>
                    <td style="color: #334155; font-weight: 600; line-height: 1.4;">${cuplikanTeks}</td>
                    <td style="text-align: center; font-weight: 700; color: #475569;">${stat.totalDijawab} Siswa</td>
                    <td style="text-align: center; font-weight: 800; color: var(--ses-blue-dark);">${stat.totalBenar} Benar</td>
                    <td style="text-align: center;">${badgeKesulitan}</td>
                    <td style="text-align: center;">${tombolEditAksi}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Gagal melakukan analisis soal:", err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #ef4444; font-weight: bold;">Terjadi kesalahan saat memproses data analisis.</td></tr>';
    }
}
// ==========================================
// FUNGSI PINTASAN: PINDAH KE STUDIO SOAL & EDIT (DIREVISI TOTAL)
// ==========================================
async function pindahDanEditSoal(idBankSoal) {
    // 1. Pindahkan tampilan aktif ke menu Studio Bank Soal ('view-studio')
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
    
    const targetView = document.getElementById('view-studio');
    if (targetView) targetView.classList.add('active');
    
    // Nyalakan menu sidebar "Studio Bank Soal" agar ikut menyala aktif
    const menuStudioSidebar = document.querySelector('.nav-menu li[onclick*="\'studio\'"]') || document.querySelectorAll('.nav-menu li')[4];
    if (menuStudioSidebar) menuStudioSidebar.classList.add('active');

    tampilkanToast("Membuka formulir dan memuat data soal...");

    try {
        // 2. Ambil data soal terlebih dahulu dari Firestore berdasarkan ID-nya
        const docSoal = await db.collection("bank_soal").doc(idBankSoal).get();
        if (!docSoal.exists) {
            tampilkanToast("Data soal tidak ditemukan di database!", "error");
            return;
        }
        const d = docSoal.data();

        // 3. Pastikan dropdown pilihan paket di studio soal sudah terisi opsi
        const selectPaketSoal = document.getElementById('pilihPaketSoal');
        if (selectPaketSoal && selectPaketSoal.options.length <= 1) {
            // Jika belum termuat, tarik data paket secara kilat
            const snapPaket = await db.collection("paket_tryout").get();
            selectPaketSoal.innerHTML = '<option value="" disabled selected>-- Pilih Paket Ujian --</option>';
            snap.forEach(pDoc => {
                const pData = pDoc.data();
                selectPaketSoal.innerHTML += `<option value="${pData.namaPaket}">${pData.namaPaket}</option>`;
            });
        }

        // 4. Set nilai dropdown Paket dan Mapel agar sinkron dengan soal yang akan diedit
        document.getElementById('pilihPaketSoal').value = d.paket || "";
        document.getElementById('pilihMapelSoal').value = d.mapel || "";

        // 5. Eksekusi fungsi edit standar untuk mengisi seluruh formulir
        if (typeof editBankSoalLMS === "function") {
            await editBankSoalLMS(idBankSoal);
        }

        // 6. Gulir (scroll) halaman ke paling atas agar form langsung terlihat oleh Admin
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
        console.error("Gagal membuka soal untuk diedit:", err);
        tampilkanToast("Gagal memuat data soal.", "error");
    }
}
// ==========================================
// FUNGSI ADMIN: EDIT DATA PESERTA (MODAL)
// ==========================================
async function bukaModalEditPeserta(idDoc) {
    try {
        tampilkanToast("Mengambil data peserta...");
        const docSnap = await db.collection("users_tryout").doc(idDoc).get();
        
        if (!docSnap.exists) {
            return sesAlert("Error", "Data peserta tidak ditemukan di database!", "fas fa-exclamation-triangle", "#ef4444");
        }
        
        const data = docSnap.data();
        
        // Isi otomatis form di dalam pop-up
        document.getElementById('editPesertaId').value = idDoc;
        document.getElementById('editPesertaNama').value = data.nama || "";
        document.getElementById('editPesertaPassword').value = data.password || "";
        document.getElementById('editPesertaWa').value = data.wa || "";
        document.getElementById('editPesertaSekolah').value = data.sekolah || "";
        document.getElementById('editPesertaFoto').value = data.fotoProfilUrl || "";
        
        // Tampilkan Modal
        document.getElementById('modalEditPeserta').style.display = 'flex';
    } catch (error) {
        console.error("Gagal membuka data peserta:", error);
        tampilkanToast("Terjadi kesalahan saat memuat data.", "error");
    }
}

function tutupModalEditPeserta() {
    document.getElementById('modalEditPeserta').style.display = 'none';
    document.getElementById('editPesertaId').value = '';
}

async function simpanEditPeserta(e) {
    e.preventDefault();
    const idDoc = document.getElementById('editPesertaId').value;
    const nama = document.getElementById('editPesertaNama').value.trim();
    const password = document.getElementById('editPesertaPassword').value.trim();
    const wa = document.getElementById('editPesertaWa').value.trim();
    const sekolah = document.getElementById('editPesertaSekolah').value.trim();
    const fotoProfilUrl = document.getElementById('editPesertaFoto').value.trim();
    
    const btn = document.getElementById('btnSimpanEditPeserta');
    const teksAsli = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    btn.disabled = true;
    
    try {
        // Simpan pembaruan (update) ke Firebase Database
        await db.collection("users_tryout").doc(idDoc).update({
            nama: nama,
            password: password,
            wa: wa,
            sekolah: sekolah,
            fotoProfilUrl: fotoProfilUrl
        });
        
        tampilkanToast(`Data peserta ${nama} berhasil diperbarui!`);
        tutupModalEditPeserta(); // Tutup Pop-Up
    } catch (error) {
        console.error("Gagal menyimpan edit peserta:", error);
        tampilkanToast("Terjadi kesalahan saat menyimpan perubahan data.", "error");
    } finally {
        btn.innerHTML = teksAsli;
        btn.disabled = false;
    }
}
// ==========================================
// FUNGSI CHAT WA UNTUK FOLLOW UP LEAD / PEMBELI (ADMIN TRYOUT)
// ==========================================
window.chatWA = function(nomor, nama, status, produk) {
    let formatNomor = nomor.replace(/^0/, '62'); 
    let faqHtml = '';

    // FAQ Khusus Tryout TKA / Bimbel SES
    faqHtml = `
        <div class="mt-4 mb-2 fw-bold text-success" style="font-size: 0.85rem; border-bottom: 2px solid #10b981; padding-bottom: 5px;">
            <i class="fa-solid fa-clipboard-question"></i> Jawaban Cepat FAQ LKP SES
        </div>
        <button class="btn btn-light border text-start w-100 mb-2 p-2" onclick="kirimPesanWA('${formatNomor}', '${nama}', '${produk}', 'faq_cara_login')">
            <div class="fw-semibold text-dark" style="font-size: 0.8rem;">1. Bagaimana cara siswa login ke Tryout?</div>
        </button>
        <button class="btn btn-light border text-start w-100 mb-2 p-2" onclick="kirimPesanWA('${formatNomor}', '${nama}', '${produk}', 'faq_hp_atau_laptop')">
            <div class="fw-semibold text-dark" style="font-size: 0.8rem;">2. Apakah bisa dikerjakan di HP / Laptop?</div>
        </button>
        <button class="btn btn-light border text-start w-100 mb-2 p-2" onclick="kirimPesanWA('${formatNomor}', '${nama}', '${produk}', 'faq_jadwal')">
            <div class="fw-semibold text-dark" style="font-size: 0.8rem;">3. Kapan jadwal Tryout dimulai & ditutup?</div>
        </button>
        <button class="btn btn-light border text-start w-100 mb-2 p-2" onclick="kirimPesanWA('${formatNomor}', '${nama}', '${produk}', 'faq_sertifikat')">
            <div class="fw-semibold text-dark" style="font-size: 0.8rem;">4. Bagaimana cara cetak Sertifikat Kelulusan?</div>
        </button>
        <button class="btn btn-light border text-start w-100 mb-2 p-2" onclick="kirimPesanWA('${formatNomor}', '${nama}', '${produk}', 'faq_laporan')">
            <div class="fw-semibold text-dark" style="font-size: 0.8rem;">5. Apakah orang tua mendapat hasil tryout?</div>
        </button>
    `;

    Swal.fire({
        title: '<span style="font-size: 1.1rem; font-weight: 700;">Pilih Pesan Balasan WA</span>',
        html: `
            <div class="text-start mt-2" style="max-height: 60vh; overflow-y: auto; overflow-x: hidden; padding-right: 8px;">
                
                <div class="fw-bold mb-2 text-primary" style="font-size: 0.85rem; border-bottom: 2px solid #2563eb; padding-bottom: 5px;">
                    <i class="fa-solid fa-bullhorn"></i> Skrip Penjualan Utama
                </div>

                <button class="btn btn-outline-primary w-100 mb-2 text-start p-2 rounded-3" onclick="kirimPesanWA('${formatNomor}', '${nama}', '${produk}', 'sapaan')">
                    <div class="fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-hand-wave me-2"></i>Sapaan Awal (Lead Baru)</div>
                </button>

                <button class="btn btn-outline-info w-100 mb-2 text-start p-2 rounded-3" onclick="kirimPesanWA('${formatNomor}', '${nama}', '${produk}', 'followup')">
                    <div class="fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-rotate-right me-2"></i>Follow-up Biasa</div>
                </button>

                <button class="btn btn-outline-success w-100 mb-2 text-start p-2 rounded-3" onclick="kirimPesanWA('${formatNomor}', '${nama}', '${produk}', 'link')">
                    <div class="fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-link me-2"></i>Kirim Link Pendaftaran Promo</div>
                </button>

                <button class="btn btn-outline-warning w-100 mb-2 text-start p-2 rounded-3 text-dark" onclick="kirimPesanWA('${formatNomor}', '${nama}', '${produk}', 'mahal')">
                    <div class="fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-shield-heart me-2"></i>Jurus Menjawab "Harga Mahal"</div>
                </button>

                <button class="btn btn-outline-secondary w-100 mb-2 text-start p-2 rounded-3" onclick="kirimPesanWA('${formatNomor}', '${nama}', '${produk}', 'closing')">
                    <div class="fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-check-double me-2"></i>Ucapan Closing (Terima Kasih)</div>
                </button>
                
                <button class="btn btn-outline-dark w-100 mb-2 text-start p-2 rounded-3" onclick="kirimPesanWA('${formatNomor}', '${nama}', '${produk}', 'cara_beli')">
                    <div class="fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-cart-shopping text-warning me-2"></i>Panduan Cara Pemesanan</div>
                </button>

                <button class="btn btn-outline-dark w-100 mb-2 text-start p-2 rounded-3" onclick="kirimPesanWA('${formatNomor}', '${nama}', '${produk}', 'cara_bayar')">
                    <div class="fw-bold" style="font-size: 0.85rem;"><i class="fa-solid fa-money-bill-wave text-success me-2"></i>Informasi Rekening Pembayaran</div>
                </button>

                ${faqHtml}
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true,
        width: '450px'
    });
};

window.kirimPesanWA = function(nomor, nama, produk, tipe) {
    const baseHref = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const linkUtama = baseHref + "daftar.html"; 
    
    let pesan = "";

    // --- 1. SKRIP JUALAN UTAMA LKP SES ---
    if(tipe === 'sapaan') {
        pesan = `Halo Ayah/Bunda dari ananda *${nama}*, perkenalkan saya tim Edukasi LKP SES. Kami melihat ada ketertarikan untuk mengikuti program *${produk || 'Tryout TKA Nasional'}*. Ada informasi pendaftaran yang bisa saya bantu jelaskan Bunda? 😊`;
    } else if(tipe === 'followup') {
        pesan = `Halo Bunda dari *${nama}*, saya ingin menindaklanjuti rencana pendaftaran *${produk || 'Tryout TKA'}*. Apakah ananda sudah siap? Jangan sampai kehabisan kuota diskon pendaftarannya ya Bunda. 🙏`;
    } else if(tipe === 'link') {
        pesan = `Halo Bunda, terkait pendaftaran *${produk || 'Tryout TKA LKP SES'}*, Bunda bisa melihat detail fitur lengkap (Sertifikat, Papan Peringkat, dll) dan melakukan pendaftaran langsung melalui link resmi kami ini ya: \n\n👉 ${linkUtama}`;
    } else if(tipe === 'mahal') {
        pesan = `Betul Bunda, di awal mungkin terasa ada biaya. Tapi dengan biaya tersebut, ananda sudah mendapatkan akses ke ratusan soal berstandar AKM Nasional, simulasi CBT mirip ujian asli, dan laporan evaluasi lengkap.\n\nJika ikut bimbel atau beli buku kumpulan soal di luar, biayanya bisa ratusan ribu lho Bunda. Ini investasi yang sangat terjangkau untuk prestasi anak! 🏆`;
    } else if(tipe === 'closing') {
        pesan = `Halo Bunda dari *${nama}*, terima kasih banyak telah mempercayakan pendidikan ananda di *LKP SES*. ID Login dan Password akan segera diproses oleh tim kami. Jika ada hal yang perlu dibantu ke depannya, jangan ragu hubungi tim support kami ya. Sukses selalu untuk ananda! ✨`;
    } else if(tipe === 'cara_beli') {
        pesan = `Untuk cara pendaftarannya sangat mudah Bunda!\n\n1️⃣ Bunda cukup buka link pendaftaran: ${linkUtama}\n2️⃣ Isi formulir data diri ananda secara lengkap.\n3️⃣ Pilih paket yang diinginkan (Basic/Pro/Ultimate).\n4️⃣ Lakukan pembayaran ke rekening resmi kami dan sertakan bukti transfernya di form.\n\nSetelah klik Kirim, tim kami akan langsung merespons dan membuatkan ID Login ruang ujian untuk ananda. 🚀`;
    } else if(tipe === 'cara_bayar') {
        pesan = `Baik Bunda, untuk pembayarannya bisa ditransfer ke rekening resmi Lembaga kami berikut ini ya:\n\n💳 *BRI* : 618601014043531 a.n PAMBUDI\n📱 *DANA/OVO/GoPay* : 085855111386 a.n PAMBUDI\n\nKhusus untuk pembayaran via *QRIS*, mohon konfirmasi ke kami terlebih dahulu ya Bunda.\n\nSetelah transfer, mohon foto/screenshot struknya dikirim ke chat ini agar bisa langsung kami aktifkan akun ujian ananda. Terima kasih! 🙏`;
    }
    
    // --- 2. SKRIP FAQ TRYOUT SES ---
    else if(tipe === 'faq_cara_login') {
        pesan = `Gampang banget Bunda! Nanti setelah pembayaran terkonfirmasi, ananda akan mendapatkan *ID Peserta* dan *Password*. Bunda cukup buka website LKP SES, masukkan ID tersebut di layar Portal Siswa, dan ananda langsung bisa masuk ke Ruang Ujian CBT. 🚀`;
    } else if(tipe === 'faq_hp_atau_laptop') {
        pesan = `Sangat bisa Bunda! Sistem Ujian (CBT) kami sangat ringan dan fleksibel. Ananda bisa mengerjakannya menggunakan HP (Android/iPhone), Tablet, ataupun Laptop/PC kesayangan di rumah. Pastikan koneksi internetnya stabil ya Bunda. 📱💻`;
    } else if(tipe === 'faq_jadwal') {
        pesan = `Untuk Paket Latihan, ananda bisa mengerjakannya kapan saja 24 Jam secara mandiri. Namun untuk Paket Ujian Simulasi (Khusus Paket Pro & Ultimate), jadwal pembukaan dan penutupan soalnya akan dikendalikan langsung oleh Admin Pusat LKP SES agar serentak layaknya ujian nasional Bunda. ⏰`;
    } else if(tipe === 'faq_sertifikat') {
        pesan = `Sertifikat Kelulusan Resmi (Khusus Akun Ultimate) akan otomatis terbuka dan bisa dicetak (PDF) langsung dari Dashboard Siswa jika nilai rata-rata ujian ananda sudah mencapai batas KKM (di atas 75). Ini sangat bagus untuk memacu semangat ananda meraih nilai terbaik! 🏆`;
    } else if(tipe === 'faq_laporan') {
        pesan = `Betul Bunda. Selain nilai yang langsung keluar setelah ujian selesai, sistem LKP SES juga menyusun *Laporan Evaluasi Progres Belajar* berbentuk PDF. Laporan ini bisa Bunda download untuk melihat titik lemah ananda, sehingga belajar ke depannya bisa lebih fokus. 📊`;
    }

    Swal.close(); 
    let formatNomor = nomor.replace(/^0/, '62'); 
    window.open(`https://wa.me/${formatNomor}?text=${encodeURIComponent(pesan)}`, '_blank'); 
};

// ==========================================
// FUNGSI CHAT WA KHUSUS ADMIN KE AFFILIATE (MITRA)
// ==========================================
window.chatAffiliateAdmin = function(noWa, nama) {
    if (!noWa || noWa === '-' || noWa.trim() === '') {
        Swal.fire('Oops!', 'Nomor WhatsApp affiliate ini kosong atau tidak valid.', 'warning');
        return;
    }
    let formatNomor = noWa.replace(/^0/, '62');
    let pesan = encodeURIComponent(`Halo Kak *${nama}*, saya Admin LKP dan Bimbel SES.\n\nBagaimana kabarnya? Apakah ada kendala terkait promosi program Tryout atau pencairan komisi yang bisa saya bantu?`);
    window.open(`https://wa.me/${formatNomor}?text=${pesan}`, '_blank');
};