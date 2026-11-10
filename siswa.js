// ==========================================
// FILE: siswa.js
// FUNGSI: Logika Portal Siswa & Ruang Ujian (CBT)
// ==========================================

// 1. PROSES LOGIN SISWA
function prosesLoginSiswa(e) {
    e.preventDefault(); // Mencegah halaman refresh saat tombol ditekan
    
    const usernameInput = document.getElementById('siswaUsername').value.trim();
    const passwordInput = document.getElementById('siswaPassword').value.trim();
    const btn = e.target.querySelector('button');
    const btnTeksAsli = btn.innerHTML;
    
    if(!usernameInput || !passwordInput) {
        sesAlert("Data Kosong", "Harap isi ID Peserta dan Password.", "fas fa-exclamation-triangle", "#f59e0b");
        return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memeriksa Data...';
    btn.disabled = true;
    
    // Cari data siswa di koleksi Firestore 'users_tryout'
    db.collection("users_tryout")
      .where("username", "==", usernameInput)
      .where("password", "==", passwordInput)
      .get()
      .then(snapshot => {
          if (snapshot.empty) {
              sesAlert("Login Gagal", "ID Peserta atau Password salah! Periksa kembali kredensial Anda dari Admin.", "fas fa-shield-alt", "#ef4444");
              btn.innerHTML = btnTeksAsli;
              btn.disabled = false;
          } else {
              // Ambil data siswa pertama yang cocok
              const docSiswa = snapshot.docs[0];
              const dataSiswa = docSiswa.data();
              dataSiswa.id = docSiswa.id;
              
              // Simpan sesi ke LocalStorage browser
              localStorage.setItem("ses_siswa_login", JSON.stringify(dataSiswa));
              
              tampilkanToast(`Berhasil login! Memuat ruang belajar...`);
              
              // Tunda sedikit agar toast terlihat, lalu muat data
              setTimeout(() => {
                  document.getElementById('siswaLoginScreen').style.display = 'none';
                  muatDataSiswaAktif();
                  btn.innerHTML = btnTeksAsli;
                  btn.disabled = false;
              }, 1000);
          }
      })
      .catch(error => {
          console.error("Error login:", error);
          tampilkanToast("Terjadi kesalahan sistem.", "error");
          btn.innerHTML = btnTeksAsli;
          btn.disabled = false;
      });
}

// 2. CEK SESI SAAT HALAMAN DIMUAT
document.addEventListener('DOMContentLoaded', () => {
    muatDataSiswaAktif();
    muatKatalogPaketSiswa();
    muatLeaderboardSiswa();
    
    // 👇 Tambahkan pemanggilan grafik di sini 👇
    setTimeout(() => {
        inisialisasiGrafik();
        updateGrafikRiwayat();
    }, 800); 
});

// ==========================================
// FUNGSI GLOBAL: RENDER BADGE TIPE AKUN DI TOPBAR
// ==========================================
function renderBadgeTipeAkunTopbar(tipeAkses) {
    const teksTier = document.getElementById('teksTierTopbar');
    const badgeEl = document.getElementById('badgeTipeAkunTopbar');
    
    if (teksTier && badgeEl) {
        const tier = (tipeAkses || "Basic").toUpperCase();
        teksTier.textContent = tier;
        
        if (tier === "ULTIMATE") {
            badgeEl.style.background = "#fffbeb";
            badgeEl.style.color = "#b45309";
            badgeEl.style.borderColor = "#fde68a";
        } else if (tier === "PRO") {
            badgeEl.style.background = "#eff6ff";
            badgeEl.style.color = "#1d4ed8";
            badgeEl.style.borderColor = "#bfdbfe";
        } else {
            badgeEl.style.background = "#f1f5f9";
            badgeEl.style.color = "#475569";
            badgeEl.style.borderColor = "#cbd5e1";
        }
    }
}

function muatDataSiswaAktif() {
    const sesiSiswa = localStorage.getItem("ses_siswa_login");
    const loginScreen = document.getElementById('siswaLoginScreen');
    
    if (!sesiSiswa) {
        if(loginScreen) loginScreen.style.display = 'flex';
        return;
    }
    
    if(loginScreen) loginScreen.style.display = 'none';
    const siswaLokal = JSON.parse(sesiSiswa);
    
    // Sinkronisasi real-time dengan database Firestore
    if (siswaLokal.id) {
        db.collection("users_tryout").doc(siswaLokal.id).onSnapshot(doc => {
            if (doc.exists) {
                const dataTerbaru = doc.data();
                dataTerbaru.id = doc.id;
                localStorage.setItem("ses_siswa_login", JSON.stringify(dataTerbaru));
                renderBadgeTipeAkunTopbar(dataTerbaru.tipeAkses);
            }
        });
    }

    // Render data teks ke Beranda (UI) menggunakan 'siswaLokal'
    renderBadgeTipeAkunTopbar(siswaLokal.tipeAkses);
    document.getElementById('topbarNamaSiswa').textContent = siswaLokal.nama;
    document.getElementById('salamSiswa').textContent = `Halo, ${siswaLokal.nama}! 👋`;
    document.getElementById('infoUsername').textContent = siswaLokal.username;
    document.getElementById('infoSekolah').textContent = siswaLokal.sekolah || 'Mandiri';
    document.getElementById('infoPaket').textContent = siswaLokal.paketAktif || 'Tryout Umum';
    
    // Render data ke Kartu Peserta
    const elKartuNama = document.getElementById('kartuNamaSiswa');
    if(elKartuNama) {
        elKartuNama.textContent = siswaLokal.nama;
        document.getElementById('kartuAsalSekolah').textContent = siswaLokal.sekolah || 'Mandiri';
        document.getElementById('kartuPaket').textContent = siswaLokal.paketAktif || 'Tryout Umum';
        document.getElementById('kartuIdSiswa').textContent = `ID: ${siswaLokal.username}`;
        document.getElementById('qrCodeKartu').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${siswaLokal.username}&color=003780`;
    }

    // TARIK FOTO PROFIL
    db.collection("pendaftaran_tryout").where("noWa", "==", siswaLokal.wa).get().then(snap => {
        let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(siswaLokal.nama)}&background=0058c6&color=fff&bold=true`;
        if(!snap.empty) {
            const pendaftaran = snap.docs[0].data();
            if(pendaftaran.fotoProfilUrl) avatarUrl = pendaftaran.fotoProfilUrl;
        }
        
        const topbarAvatar = document.getElementById('topbarAvatarContainer');
        if(topbarAvatar) topbarAvatar.innerHTML = `<img src="${avatarUrl}" class="student-avatar" alt="Foto">`;
        
        const fotoKartu = document.getElementById('fotoKartuPeserta');
        if(fotoKartu) fotoKartu.src = avatarUrl;
    }).catch(err => console.log("Gagal memuat foto profil:", err));

    muatRiwayatSiswa(siswaLokal.username);
    muatSertifikatKelulusan(siswaLokal);
    muatJadwalSiswa(siswaLokal.id);
    updateStatistikCepat();
    muatFiturInteraktifSiswa(siswaLokal);
    muatPengumumanLKP();
}

// 3. LOGOUT SISWA
function logoutSiswa() {
    localStorage.removeItem("ses_siswa_login");
    window.location.reload();
}

// 4. NAVIGASI MENU SISWA
function gantiMenuSiswa(idMenu, element) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
    document.getElementById(`view-${idMenu}`).classList.add('active');
    element.classList.add('active');
}

// 5. MUAT KATALOG PAKET UNTUK UJIAN (Dengan Fitur Pengunci Tipe Akun / Tier)
function muatKatalogPaketSiswa() {
    const filterDropdown = document.getElementById('filterModePaket');
    const filterValue = filterDropdown ? filterDropdown.value : 'Semua';

    db.collection("paket_tryout").onSnapshot(snap => {
        const container = document.getElementById('katalogUjianContainer');
        if(!container) return;
        
        if(snap.empty) {
            return container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px; width: 100%; grid-column: 1 / -1;">Belum ada paket ujian tersedia.</p>';
        }
        
        let daftarPaket = [];
        snap.forEach(doc => daftarPaket.push(doc.data()));
        daftarPaket.sort((a, b) => a.namaPaket.localeCompare(b.namaPaket, undefined, {numeric: true, sensitivity: 'base'}));

        const dataSiswa = JSON.parse(localStorage.getItem("ses_siswa_login") || "{}");
        const paketSelesai = dataSiswa.paketSelesai || []; 
        const targetKKMSiswa = Number(dataSiswa.targetNilai) || 75;
        
        // 👇 BACA TIPE AKSES SISWA (Default ke Premium agar akun lama tidak error) 👇
        const tipeAksesSiswa = dataSiswa.tipeAkses || "Premium";

        let totalSkor = 0;
        let jumlahMapel = 0;
        let mapelTerakhir = {};

        // 1. Tarik dari skor_ lama
        Object.keys(dataSiswa).forEach(key => {
            if (key.startsWith("skor_") && !key.startsWith("riwayat_skor_")) {
                let mapel = key.replace("skor_", "");
                let val = Number(dataSiswa[key]);
                if (!isNaN(val) && val !== null) mapelTerakhir[mapel] = val;
            }
        });

        // 2. Timpa dengan riwayat terbaru
        if (dataSiswa.riwayat_lengkap && Array.isArray(dataSiswa.riwayat_lengkap)) {
            dataSiswa.riwayat_lengkap.forEach(item => {
                if(item.mapel && item.skor !== undefined) {
                    mapelTerakhir[item.mapel] = Number(item.skor) || 0;
                }
            });
        }
        
        let arrSkor = Object.values(mapelTerakhir);
        if (arrSkor.length > 0) {
            totalSkor = arrSkor.reduce((a, b) => a + b, 0);
            jumlahMapel = arrSkor.length;
        }

        const rataRata = jumlahMapel > 0 ? Math.round(totalSkor / jumlahMapel) : 0;

        // Labeling Status per Paket & PENGUNCIAN
        daftarPaket.forEach(p => {
            let status = "Belum Dikerjakan";
            const jenis = (p.jenisPaket || "Ujian").toLowerCase();
            
            // Logika Hierarki Kunci Level Akses: Basic (1) < Pro (2) < Ultimate (3)
            const levelValue = { "basic": 1, "pro": 2, "ultimate": 3, "premium": 3 };
            let isTerkunciAkses = false;
            
            // Konversi teks menjadi angka level untuk dibandingkan
            let valSiswa = levelValue[tipeAksesSiswa.toLowerCase()] || 1;
            let valPaket = levelValue[jenis.toLowerCase()] || 1;

            // Jika level siswa lebih rendah dari level paket soal, maka KUNCI!
            if (valSiswa < valPaket) {
                isTerkunciAkses = true; 
            }
            
            // Basic hanya dikunci jika mencoba membuka paket "Ujian"
            if (tipeAksesSiswa === "Basic" && jenis === "ujian") {
                isTerkunciAkses = true; 
            }
            // Catatan: Pro dan Ultimate bisa membuka semuanya (tidak di-set true)

            if (isTerkunciAkses) {
                status = "Terkunci";
            } else if (paketSelesai.includes(p.namaPaket)) {
                let batasKKM = (jenis === "latihan") ? targetKKMSiswa : 75;
                status = (rataRata >= batasKKM) ? "Lulus" : "Belum Lulus";
            } else if (dataSiswa.paketAktif === p.namaPaket) {
                status = "Paket Aktif";
            }
            
            p.statusSiswa = status; 
        });

        // Filtering
        if (filterValue !== 'Semua') {
            daftarPaket = daftarPaket.filter(p => {
                let jenis = p.jenisPaket || "Ujian";
                if (filterValue === "Basic" || filterValue === "Pro" || filterValue === "Ultimate") {
                    return jenis.toLowerCase() === filterValue.toLowerCase();
                }
                if (filterValue === "Lulus") return p.statusSiswa === "Lulus";
                if (filterValue === "Belum Lulus") return p.statusSiswa === "Belum Lulus";
                if (filterValue === "Belum Dikerjakan") return (p.statusSiswa === "Belum Dikerjakan" || p.statusSiswa === "Paket Aktif");
                return true;
            });
        }

        if(daftarPaket.length === 0) {
            return container.innerHTML = '<div style="text-align: center; padding: 40px; width: 100%; grid-column: 1 / -1; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;"><i class="fas fa-search" style="font-size:3rem; color:#cbd5e1; margin-bottom:15px; display:block;"></i><p style="color: var(--text-muted); font-weight: 700;">Tidak ada paket yang sesuai dengan filter.</p></div>';
        }

        let html = '';
        const warnaLatarTeks = [
            'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)', 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)', 
            'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)', 'linear-gradient(180deg, #faf5ff 0%, #f3e8ff 100%)', 
            'linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)'
        ];
        let urutanWarna = 0;

        // Render Kartu
        daftarPaket.forEach(d => {
            const jenis = d.jenisPaket || "Ujian"; 
            const bgAreaTeks = warnaLatarTeks[urutanWarna % warnaLatarTeks.length];
            urutanWarna++;
            
            const gambarSampul = d.thumbnail ? d.thumbnail : "https://res.cloudinary.com/x28w7gjn/image/upload/v1791382186/o74vocbwaiaahr94fogz.png";
            
            let jenisTarget = jenis.toLowerCase();
            let labelModePremium = '';
            
            if (jenisTarget === 'basic') {
                labelModePremium = `<span class="badge-mode-premium" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);"><i class="fas fa-unlock"></i> BASIC</span>`;
            } else if (jenisTarget === 'pro') {
                labelModePremium = `<span class="badge-mode-premium" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);"><i class="fas fa-shield-alt"></i> PRO</span>`;
            } else {
                labelModePremium = `<span class="badge-mode-premium" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);"><i class="fas fa-crown"></i> ULTIMATE</span>`;
            }
            
            let badgeStatusHtml = '';
            
            // 👇 VISUALISASI STATUS BERDASARKAN KUNCI 👇
            if (d.statusSiswa === "Terkunci") {
                badgeStatusHtml = `<span style="color: #64748b; background: #f1f5f9; padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; border: 1px solid #cbd5e1;"><i class="fas fa-lock" style="margin-right: 5px;"></i> Terkunci (Beda Tipe Akun)</span>`;
            } else if (d.statusSiswa === "Lulus") {
                badgeStatusHtml = `<span style="color: #059669; background: #dcfce7; padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; border: 1px solid #86efac; box-shadow: 0 4px 10px rgba(16,185,129,0.15);"><i class="fas fa-check-circle" style="margin-right: 5px;"></i> Tuntas (Target Tercapai)</span>`;
            } else if (d.statusSiswa === "Belum Lulus") {
                badgeStatusHtml = `<span style="color: #e11d48; background: #ffe4e6; padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; border: 1px solid #fda4af; box-shadow: 0 4px 10px rgba(225,29,72,0.15);"><i class="fas fa-times-circle" style="margin-right: 5px;"></i> Belum Capai Target</span>`;
            } else if (d.statusSiswa === "Paket Aktif") {
                badgeStatusHtml = `<span style="color: #b45309; background: #fef3c7; padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; border: 1px solid #fde68a; box-shadow: 0 4px 10px rgba(245,158,11,0.15);"><i class="fas fa-spinner fa-spin" style="margin-right: 5px;"></i> Paket Aktif Anda</span>`;
            } else {
                badgeStatusHtml = `<span style="color: #64748b; background: rgba(255,255,255,0.9); padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; border: 1px solid #cbd5e1;"><i class="fas fa-circle" style="color: #cbd5e1; font-size: 0.5rem; margin-right: 5px; vertical-align: middle;"></i> Belum Dikerjakan</span>`;
            }

            // 👇 CEGAH KLIK JIKA TERKUNCI 👇
            // 👇 CEGAH KLIK JIKA TERKUNCI 👇
            let pesanKunci = `Akun Anda saat ini adalah <b>Level ${tipeAksesSiswa}</b> dan tidak memiliki izin untuk membuka paket soal Ujian TKA ini.<br><br>Silakan hubungi Admin LKP SES untuk <b>Upgrade ke akun PRO atau ULTIMATE</b>.`;
            
            let aksiKlik = d.statusSiswa === "Terkunci" 
                ? `sesAlert('Akses Ditolak', '${pesanKunci}', 'fas fa-lock', '#ef4444')` 
                : `bukaDetailPaket('${d.namaPaket}', '${jenis}')`;

            let opacityCard = d.statusSiswa === "Terkunci" ? "0.6" : "1"; // Redupkan sedikit jika terkunci
            let kursorCard = d.statusSiswa === "Terkunci" ? "not-allowed" : "pointer";

            html += `
                <div class="card-paket-premium" style="background: white; padding: 0; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); transition: transform 0.3s ease; border: 1px solid #e2e8f0; display: flex; flex-direction: column; cursor: ${kursorCard}; border-radius: 16px; opacity: ${opacityCard};" onclick="${aksiKlik}" onmouseover="if('${d.statusSiswa}' !== 'Terkunci') { this.style.transform='translateY(-8px)'; this.style.boxShadow='0 20px 40px rgba(0, 55, 128, 0.15)'; }" onmouseout="this.style.transform='none'; this.style.boxShadow='0 10px 25px rgba(0,0,0,0.08)';">
                    
                    <div style="width: 100%; height: 200px; background: #e2e8f0; position: relative; border-bottom: 3px solid var(--ses-gold);">
                        <img src="${gambarSampul}" alt="Cover Paket" style="width: 100%; height: 100%; object-fit: cover; object-position: center;">
                        ${labelModePremium}
                    </div>
                    
                    <div style="width: 100%; box-sizing: border-box; padding: 22px 20px; display: flex; flex-direction: column; align-items: center; text-align: center; flex: 1; background: ${bgAreaTeks};">
                        
                        <!-- 👇 TEKS JUDUL DIPERKECIL & DIFORMAT PROFESIONAL 👇 -->
                        <span style="font-size: 0.75rem; font-weight: 800; color: var(--ses-blue); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; display: block;"><i class="fas fa-bookmark"></i> Paket Ujian TKA</span>
                        <h4 style="font-size: 1.2rem; font-weight: 800; color: var(--ses-blue-dark); margin: 0 0 14px 0; line-height: 1.3;">${d.namaPaket}</h4>
                        
                        <div style="margin-bottom: 20px; width: 100%;">
                            ${badgeStatusHtml}
                        </div>
                        
                        <button class="btn-paket-action" style="width: 100%; padding: 11px; border-radius: 10px; background: ${d.statusSiswa === 'Terkunci' ? '#94a3b8' : 'var(--ses-blue)'}; color: white; border: none; font-weight: 800; font-size: 0.9rem; pointer-events: none; margin-top: auto; box-shadow: 0 4px 15px rgba(0, 88, 198, 0.2); display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <i class="fas ${d.statusSiswa === 'Terkunci' ? 'fa-lock' : 'fa-list-ul'}"></i> ${d.statusSiswa === 'Terkunci' ? 'Terkunci' : 'Lihat Mata Pelajaran'}
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    });
}

// ==========================================
// 5B. MUAT DAFTAR MAPEL DALAM PAKET SECARA DINAMIS (DENGAN GEMBOK WAKTU EVENT & JALUR VIP TESTER)
// ==========================================
let intervalCountdownEvent = null; 

async function bukaDetailPaket(namaPaket, jenisPaket = "Ujian") {
    const container = document.getElementById('katalogUjianContainer');
    container.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--ses-blue); margin-bottom: 15px;"></i><p style="color: var(--text-muted); font-weight: 700;">Menyiapkan Ruang Ujian yang Menyenangkan...</p></div>';

    if (intervalCountdownEvent) clearInterval(intervalCountdownEvent);

    try {
        const snapshotSoal = await db.collection("bank_soal").where("paket", "==", namaPaket).get();
        if(snapshotSoal.empty) {
            container.innerHTML = `
                <button onclick="muatKatalogPaketSiswa()" class="btn btn-outline" style="margin-bottom: 20px;"><i class="fas fa-arrow-left"></i> Kembali ke Daftar Paket</button>
                <div style="text-align: center; padding: 40px; background: white; border-radius: 12px; border: 1px dashed #cbd5e1;"><i class="fas fa-folder-open" style="font-size:3rem; color:#cbd5e1; margin-bottom:15px; display:block;"></i>Admin belum memasukkan soal apapun ke dalam paket ini.</div>
            `;
            return;
        }

        const snapshotPaket = await db.collection("paket_tryout").where("namaPaket", "==", namaPaket).get();
        let jadwalMatematika = null;
        let jadwalBIndo = null;
        if (!snapshotPaket.empty) {
            const dataPaketDb = snapshotPaket.docs[0].data();
            jadwalMatematika = dataPaketDb.jadwalMatematika || null;
            jadwalBIndo = dataPaketDb.jadwalBahasaIndonesia || null;
        }

        let mapelSet = new Set();
        snapshotSoal.forEach(doc => mapelSet.add(doc.data().mapel));
        let daftarMapel = Array.from(mapelSet);
        
        const dataSiswa = JSON.parse(localStorage.getItem("ses_siswa_login") || "{}");
        const waktuSekarangSatelit = new Date().getTime(); 
        
        const isTesterVIP = dataSiswa.username && (
            dataSiswa.username.toUpperCase().includes("ADMIN") || 
            dataSiswa.username.toUpperCase().includes("TEST") ||
            dataSiswa.username === "TKA-8365" // ID Zilla dimasukkan sebagai tester sah
        );

        let html = `
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 25px; background: white; padding: 20px 25px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); border-left: 6px solid var(--ses-gold); grid-column: 1 / -1; width: 100%; box-sizing: border-box;">
                <div>
                    <h3 style="color: var(--ses-blue-dark); margin: 0 0 5px 0; font-weight: 900; font-size: 1.4rem;">
                        <i class="fas fa-folder-open" style="color: var(--ses-gold); margin-right: 8px;"></i> ${namaPaket}
                    </h3>
                    <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem; font-weight: 600;">Ayo pilih petualangan belajarmu hari ini!</p>
                </div>
                
                <button onclick="muatKatalogPaketSiswa()" class="btn" style="background: #ef4444; color: white; font-weight: 900; font-size: 0.95rem; padding: 12px 24px; border-radius: 12px; border: none; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3); transition: all 0.3s ease; margin-top: 10px; display: flex; align-items: center; gap: 8px; cursor: pointer;" onmouseover="this.style.background='#dc2626'; this.style.transform='translateY(-3px)';" onmouseout="this.style.background='#ef4444'; this.style.transform='none';">
                    <i class="fas fa-arrow-left"></i> Kembali & Pilih Paket Lain
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; grid-column: 1 / -1; width: 100%;">
        `;

        let targetCountdown = [];

        daftarMapel.forEach((mapel) => {
            let riwayatMapelIni = (dataSiswa.riwayat_lengkap || []).filter(r => r.paket === namaPaket && r.mapel === mapel);
            let skorTertinggi = 0; let skorPertama = 0; let sudahDikerjakan = false;

            if (riwayatMapelIni.length > 0) {
                sudahDikerjakan = true;
                skorTertinggi = Math.max(...riwayatMapelIni.map(r => Number(r.skor) || 0));
                skorPertama = Number(riwayatMapelIni[0].skor) || 0; 
            } else if (dataSiswa[`skor_${mapel}`] !== undefined && (dataSiswa.paketAktif === namaPaket || (dataSiswa.paketSelesai||[]).includes(namaPaket))) {
                sudahDikerjakan = true;
                skorTertinggi = Number(dataSiswa[`skor_${mapel}`]);
                skorPertama = skorTertinggi;
            }

            let namaKecil = mapel.toLowerCase();
            let icon = "fas fa-star"; let colorHex = "#8b5cf6"; let colorSoft = "#f3e8ff";
            if (namaKecil.includes("matematika")) { icon = "fas fa-calculator"; colorHex = "#3b82f6"; colorSoft = "#eff6ff"; } 
            else if (namaKecil.includes("bahasa")) { icon = "fas fa-book-reader"; colorHex = "#f59e0b"; colorSoft = "#fffbeb"; } 

            let jenis = jenisPaket.toLowerCase();
            
            // 👇 LOGIKA GEMBOK WAKTU DENGAN OVERRIDE MASTER SWITCH ADMIN 👇
            let isWaktuTerkunci = false;
            let statusWaktuVisual = "";
            let htmlWaktuHitungMundur = "";
            
            // Cek status darurat global dari Admin (Master Switch)
            // Jika Admin menekan BUKA_PAKSA atau TUTUP_PAKSA, abaikan jadwal jam otomatis
            let globalMasterStatus = window.SES_MASTER_SWITCH_STATUS || "NORMAL"; 

            if (globalMasterStatus === "BUKA_PAKSA") {
                isWaktuTerkunci = false;
                statusWaktuVisual = `<span style="color: #10b981;"><i class="fas fa-lock-open"></i> DIBUKA ADMIN (DARURAT)</span>`;
            } 
            else if (globalMasterStatus === "TUTUP_PAKSA") {
                isWaktuTerkunci = true;
                statusWaktuVisual = `<span style="color: #dc2626;"><i class="fas fa-lock"></i> DIKUNCI ADMIN</span>`;
                htmlWaktuHitungMundur = `<div style="background: #fef2f2; border: 1px dashed #ef4444; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 15px;"><strong style="font-size: 0.85rem; color: #b91c1c;">Ujian dikunci sementara oleh Pengawas/Admin.</strong></div>`;
            } 
            else if (jenis === "ultimate") {
                // Jika status NORMAL, jalankan pengecekan waktu satelit seperti biasa
                let jadwalMapelIni = namaKecil.includes("matematika") ? jadwalMatematika : jadwalBIndo;
                
                if (jadwalMapelIni && jadwalMapelIni.mulai && jadwalMapelIni.tutup) {
                    let waktuBuka = new Date(jadwalMapelIni.mulai).getTime();
                    let waktuTutup = new Date(jadwalMapelIni.tutup).getTime();
                    
                    if (waktuSekarangSatelit < waktuBuka) {
                        isWaktuTerkunci = true;
                        statusWaktuVisual = `<span style="color: #ea580c;"><i class="fas fa-lock"></i> Belum Waktunya</span>`;
                        let idHitungMundur = `cd_${mapel.replace(/\s+/g, '')}`;
                        htmlWaktuHitungMundur = `<div style="background: #fffbeb; border: 1px dashed #f59e0b; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 15px;"><strong style="font-size: 0.8rem; color: #b45309; display: block; margin-bottom: 5px;">UJIAN TERBUKA DALAM:</strong><span id="${idHitungMundur}" style="font-size: 1.3rem; font-weight: 900; color: #ea580c; font-variant-numeric: tabular-nums;">--:--:--</span></div>`;
                        targetCountdown.push({ id: idHitungMundur, waktuBuka: waktuBuka, mapel: mapel, paket: namaPaket, jenis: jenisPaket });
                        
                        if (isTesterVIP) {
                            isWaktuTerkunci = false;
                            statusWaktuVisual = `<span style="color: #10b981; background: #dcfce7; padding: 2px 8px; border-radius: 12px; font-size: 0.65rem;"><i class="fas fa-unlock-alt"></i> BYPASS TESTER</span>`;
                        }

                    } else if (waktuSekarangSatelit > waktuTutup) {
                        isWaktuTerkunci = true;
                        statusWaktuVisual = `<span style="color: #dc2626;"><i class="fas fa-times-circle"></i> Sesi Berakhir</span>`;
                        htmlWaktuHitungMundur = `<div style="background: #fef2f2; border: 1px dashed #ef4444; padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 15px;"><strong style="font-size: 0.85rem; color: #b91c1c;"><i class="fas fa-exclamation-triangle"></i> Waktu Ujian Telah Habis & Ditutup</strong></div>`;
                        
                        if (isTesterVIP) {
                            isWaktuTerkunci = false;
                            statusWaktuVisual = `<span style="color: #10b981; background: #dcfce7; padding: 2px 8px; border-radius: 12px; font-size: 0.65rem;"><i class="fas fa-unlock-alt"></i> BYPASS TESTER</span>`;
                        }
                    } else {
                        statusWaktuVisual = `<span style="color: #10b981; animation: blink 1.5s infinite;"><i class="fas fa-satellite-dish"></i> SEDANG BERLANGSUNG</span>`;
                    }
                }
            }

            let isTerkunci = false;
            let tombolUjian = "";
            let teksStatusLencana = "Siap Dikerjakan!";
            let iconLencana = "fas fa-rocket";

            if (isWaktuTerkunci) {
                isTerkunci = true;
                teksStatusLencana = "Terkunci Jadwal";
                iconLencana = "fas fa-lock";
                tombolUjian = `<button class="tombol-aksi-fun" style="background: #e2e8f0; color: #64748b; cursor: not-allowed;" disabled><i class="fas fa-clock"></i> Menunggu Jadwal Ujian</button>`;
            } 
            else if (sudahDikerjakan) {
                // JIKA AKUN TESTER, ABAIKAN ATURAN SINGLE-ATTEMPT ULTIMATE
                if (jenis === "ultimate" && !isTesterVIP) {
                    isTerkunci = true;
                    teksStatusLencana = "Selesai (Skor Mutlak)";
                    iconLencana = "fas fa-check-double";
                    tombolUjian = `<button class="tombol-aksi-fun" style="background: #e2e8f0; color: #64748b; cursor: not-allowed;" disabled><i class="fas fa-check-double"></i> Selesai (Nilai Mutlak: ${skorPertama})</button>`;
                } else {
                    isTerkunci = false;
                    teksStatusLencana = isTesterVIP ? "Mode Tester (Ulang Terus)" : "Selesai Dikerjakan";
                    iconLencana = "fas fa-redo";
                    let teksTombol = isTesterVIP ? "Uji Coba Ulang Ujian" : `Ulangi Latihan (Max Skor: ${skorTertinggi})`;
                    tombolUjian = `<button onclick="mulaiUjianMapel('${namaPaket}', '${mapel}')" class="tombol-aksi-fun" style="background: ${colorHex}; color: white; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.15);"><i class="fas fa-redo"></i> ${teksTombol}</button>`;
                }
            } else {
                isTerkunci = false;
                teksStatusLencana = isTesterVIP ? "Mode Tester Aktif" : "Siap Dikerjakan!";
                iconLencana = "fas fa-play";
                tombolUjian = `<button onclick="mulaiUjianMapel('${namaPaket}', '${mapel}')" class="tombol-aksi-fun" style="background: ${colorHex}; color: white; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.15);"><i class="fas fa-play-circle"></i> Mulai Ujian Sekarang!</button>`;
            }

            let bgKartu = isTerkunci ? '#f8fafc' : colorSoft;
            let garisKartu = isTerkunci ? '#cbd5e1' : colorHex;
            let warnaTeks = isTerkunci ? '#64748b' : colorHex;

            html += `
                <div class="card-mapel-fun" style="background-color: ${bgKartu}; border-color: ${garisKartu};">
                    <i class="${icon} watermark-ikon-fun" style="color: ${warnaTeks};"></i>
                    
                    <div style="display: flex; flex-direction: column; align-items: flex-start; z-index: 2;">
                        <div class="icon-utama-wadah" style="background-color: ${isTerkunci ? '#94a3b8' : colorHex}; color: white;">
                            <i class="${icon}"></i>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                            <h4 class="judul-mapel-teks" style="color: ${isTerkunci ? '#475569' : '#1e293b'};">${mapel}</h4>
                            <div style="font-size: 0.75rem; font-weight: 800;">${statusWaktuVisual}</div>
                        </div>
                        
                        <div class="lencana-status-fun" style="background: ${isTerkunci ? '#e2e8f0' : 'white'}; color: ${isTerkunci ? '#64748b' : colorHex}; border: 1px solid ${isTerkunci ? '#cbd5e1' : colorHex}; margin-top: 10px;">
                            <i class="${iconLencana}"></i> ${teksStatusLencana}
                        </div>
                    </div>

                    <div class="kotak-petunjuk-fun">
                        ${htmlWaktuHitungMundur}
                        <div style="font-size: 0.8rem; font-weight: 800; color: ${isTerkunci ? '#94a3b8' : colorHex}; margin-bottom: 8px; text-transform: uppercase;"><i class="fas fa-lightbulb"></i> Misi Ujian</div>
                        <ul style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: #475569; font-weight: 700; line-height: 1.6;">
                            <li>Waktu Pengerjaan: <strong style="color: #1e293b;">90 Menit</strong></li>
                            <li>${jenis === "ultimate" ? "<span style='color:#ef4444; font-weight:bold;'>Kesempatan menjawab hanya 1 kali.</span>" : "<span style='color:#10b981; font-weight:bold;'>Bisa diulang untuk mencapai skor 100.</span>"}</li>
                        </ul>
                    </div>
                    
                    <div style="z-index: 2;">
                        ${tombolUjian}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;

        if (targetCountdown.length > 0) {
            intervalCountdownEvent = setInterval(() => {
                let currentNow = new Date().getTime();
                let isNeedRefresh = false;

                targetCountdown.forEach(cd => {
                    let distance = cd.waktuBuka - currentNow;
                    
                    if (distance <= 0) {
                        isNeedRefresh = true;
                    } else {
                        let days = Math.floor(distance / (1000 * 60 * 60 * 24));
                        let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                        let seconds = Math.floor((distance % (1000 * 60)) / 1000);
                        
                        let displayTxt = "";
                        if (days > 0) displayTxt += `${days}Hari `;
                        displayTxt += `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                        
                        const elSpan = document.getElementById(cd.id);
                        if(elSpan) elSpan.textContent = displayTxt;
                    }
                });

                if (isNeedRefresh) {
                    clearInterval(intervalCountdownEvent);
                    bukaDetailPaket(namaPaket, jenisPaket);
                }
            }, 1000);
        }

    } catch (err) {
        console.error(err);
        container.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 30px;"><i class="fas fa-times-circle" style="font-size: 3rem; margin-bottom: 15px;"></i><p>Gagal memuat mata pelajaran. Periksa koneksi internet.</p></div>';
    }
}

// 6. FUNGSI UNTUK MEMULAI UJIAN (Level 3: Arahkan ke CBT)
function mulaiUjianMapel(namaPaket, mapel) {
    sesConfirm("Mulai Ujian?", `Apakah Anda yakin ingin memulai ujian <b>${mapel}</b> pada <b>${namaPaket}</b> sekarang?<br><br>Waktu mundur <b>90 Menit</b> akan langsung berjalan dan ujian tidak dapat dihentikan di tengah jalan.`, "fas fa-laptop-code", "var(--ses-blue)")
    .then(konfirmasi => {
        if(konfirmasi) {
            // Simpan variabel penting ke browser agar terbaca oleh file ujian.html nanti
            localStorage.setItem("ses_ujian_aktif_paket", namaPaket);
            localStorage.setItem("ses_ujian_aktif_mapel", mapel);
            
            // Arahkan ke ruang CBT
            window.location.href = "ujian.html"; 
        }
    });
}

// ==========================================
// 7. MUAT RIWAYAT NILAI SISWA (VERSI FINAL ANTI GAGAL)
// ==========================================
function muatRiwayatSiswa(usernameSiswa) {
    db.collection("users_tryout").where("username", "==", usernameSiswa).onSnapshot(snap => {
        if(snap.empty) {
            renderTabelRiwayatDinamis([], []);
            return;
        }
        
        const docSiswa = snap.docs[0];
        const d = docSiswa.data();
        
        let dataSiswaLogin = JSON.parse(localStorage.getItem("ses_siswa_login") || "{}");
        dataSiswaLogin.id = docSiswa.id;
        
        // Ambil riwayat lengkap dari database
        let riwayatGabungan = d.riwayat_lengkap || [];
        
        // Jika riwayat_lengkap kosong, buat otomatis dari field skor_ yang ada di dokumen
        if (riwayatGabungan.length === 0) {
            let namaPaketAktif = d.paketAktif || "Paket Ujian TKA";
            Object.keys(d).forEach(key => {
                if (key.startsWith("skor_") && !key.startsWith("riwayat_skor_")) {
                    let mapel = key.replace("skor_", "");
                    let skor = d[key];
                    if (skor !== undefined && skor !== null) {
                        riwayatGabungan.push({
                            paket: namaPaketAktif,
                            mapel: mapel,
                            skor: skor,
                            waktu: new Date().getTime()
                        });
                    }
                }
            });
        }
        
        dataSiswaLogin.riwayat_lengkap = riwayatGabungan;
        
        // Salin juga semua data skor ke sesi lokal
        Object.keys(d).forEach(k => {
            if (k.startsWith("skor_") || k.startsWith("riwayat_skor_") || k.startsWith("jawaban_")) {
                dataSiswaLogin[k] = d[k];
            }
        });
        
        localStorage.setItem("ses_siswa_login", JSON.stringify(dataSiswaLogin));
        
        // Perbarui Opsi Dropdown Filter Paket pada Grafik
        const dropdown = document.getElementById('filterPaketChart');
        if (dropdown) {
            let paketUnik = new Set();
            riwayatGabungan.forEach(r => paketUnik.add(r.paket));
            let pilihanAktif = dropdown.value; 
            
            dropdown.innerHTML = '<option value="Semua">Semua Paket Ujian</option>';
            paketUnik.forEach(paket => {
                dropdown.innerHTML += `<option value="${paket}">${paket}</option>`;
            });

            if (paketUnik.has(pilihanAktif)) dropdown.value = pilihanAktif;
            else dropdown.value = "Semua";
        }
        
        updateGrafikRiwayat();
    });
}

function updateGrafikRiwayat() {
    const dataSiswa = JSON.parse(localStorage.getItem("ses_siswa_login") || "{}");
    if(!chartProgresSiswa) return;
    
    const filterPaketEl = document.getElementById('filterPaketChart');
    const filterPaket = filterPaketEl ? filterPaketEl.value : "Semua";
    let riwayatLengkap = dataSiswa.riwayat_lengkap || [];
    
    if (riwayatLengkap.length === 0) {
        Object.keys(dataSiswa).forEach(key => {
            if (key.startsWith("skor_") && !key.startsWith("riwayat_skor_")) {
                let mapel = key.replace("skor_", "");
                let skor = dataSiswa[key];
                if (skor !== undefined && skor !== null) {
                    riwayatLengkap.push({
                        paket: dataSiswa.paketAktif || "Paket 1",
                        mapel: mapel,
                        skor: skor,
                        waktu: new Date().getTime()
                    });
                }
            }
        });
    }

    // 1. Saring data murni berdasarkan pilihan paket di dropdown
    let dataTerfilter = riwayatLengkap;
    if (filterPaket !== "Semua") {
        dataTerfilter = riwayatLengkap.filter(r => r.paket === filterPaket);
    }
    
    // 2. KIRIM HANYA DATA TERFILTER KE TABEL (Agar tabel ikut bersih jika paket belum dikerjakan)
    renderTabelRiwayatDinamis(dataTerfilter, riwayatLengkap);

    // 3. Olah data untuk Chart.js
    let mapelData = {};
    dataTerfilter.forEach(item => {
        if (!mapelData[item.mapel]) mapelData[item.mapel] = [];
        mapelData[item.mapel].push(item.skor);
    });

    const warnaGrafik = ['#0058c6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];
    let datasetsBaru = [];
    let maxLength = 0;
    let colorIndex = 0;

    for (let mapel in mapelData) {
        let skorArray = mapelData[mapel];
        if (skorArray.length > maxLength) maxLength = skorArray.length;

        datasetsBaru.push({
            label: mapel,
            data: skorArray,
            borderColor: warnaGrafik[colorIndex % warnaGrafik.length],
            backgroundColor: warnaGrafik[colorIndex % warnaGrafik.length] + '1A', 
            borderWidth: 3,
            pointBackgroundColor: warnaGrafik[colorIndex % warnaGrafik.length],
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            tension: 0.4,
            fill: true
        });
        colorIndex++;
    }

    let labelX = [];
    for (let i = 1; i <= Math.max(maxLength, 3); i++) {
        labelX.push(`Percobaan ${i}`);
    }

    chartProgresSiswa.data.labels = labelX;
    chartProgresSiswa.data.datasets = datasetsBaru;
    chartProgresSiswa.update();
}

// ==========================================
// 7B. RENDER TABEL RIWAYAT (DENGAN PENGUNCIAN PEMBAHASAN)
// ==========================================
function renderTabelRiwayatDinamis(dataRiwayatTerfilter, seluruhRiwayatAsli) {
    const tbody = document.getElementById('tabelRiwayatSiswa');
    if(!tbody) return;
    
    // Gunakan murni data terfilter yang dikirimkan dari grafik
    let sumberData = dataRiwayatTerfilter;
    
    // Ambil data siswa dari sesi lokal
    const dataSiswaLogin = JSON.parse(localStorage.getItem("ses_siswa_login") || "{}");
    
    // Ambil target minimal (KKM) siswa, jika belum diset maka default 75
    const targetKKM = Number(dataSiswaLogin.targetNilai) || 75;

    // Jika parameter terfilter belum diinisialisasi sama sekali, ambil dari localStorage sebagai cadangan awal
    if (sumberData === undefined || sumberData === null) {
        sumberData = dataSiswaLogin.riwayat_lengkap || [];
    }

    tbody.innerHTML = '';
    
    // Jika setelah difilter ternyata kosong, tampilkan pesan kosong
    if(!sumberData || sumberData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 30px; color: var(--text-muted); font-weight: bold;"><i class="fas fa-folder-open" style="font-size: 2rem; color: #cbd5e1; display: block; margin-bottom: 10px;"></i>Belum ada riwayat ujian pada paket ini.</td></tr>';
        return;
    }
    
    // Urutkan dari yang terbaru ke terlama
    let riwayatTerbaru = [...sumberData].reverse();
    
    riwayatTerbaru.forEach((item, index) => {
        let skorUjian = item.skor !== undefined ? item.skor : 0;
        let statusLulus = skorUjian >= targetKKM 
            ? '<span class="badge" style="background:#dcfce7; color:#166534; border: 1px solid #86efac;"><i class="fas fa-check-circle"></i> Tuntas / Lulus</span>' 
            : '<span class="badge" style="background:#fee2e2; color:#b91c1c; border: 1px solid #fca5a5;"><i class="fas fa-times-circle"></i> Remedial</span>';
        
        let formatWaktu = "";
        if(item.waktu) {
            const date = new Date(item.waktu);
            formatWaktu = `<br><span style="font-size: 0.75rem; color: #64748b; font-weight: 700; background: #f1f5f9; padding: 2px 8px; border-radius: 12px; margin-top: 5px; display: inline-block;"><i class="fas fa-clock" style="color: var(--ses-blue);"></i> ${date.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit'})}</span>`;
        }

        let paketNama = item.paket || "Paket Ujian TKA";
        let mapelNama = item.mapel || "Matematika";
        
        let originalIndex = seluruhRiwayatAsli ? seluruhRiwayatAsli.findIndex(r => r.waktu === item.waktu) : index;
        if (originalIndex === -1) originalIndex = index;

        // 👇 LOGIKA PENGUNCIAN PEMBAHASAN BERDASARKAN TARGET KKM 👇
        let tombolPembahasan = "";
        if (skorUjian >= targetKKM) {
            // Jika nilai mencapai target, tombol terbuka warna biru
            tombolPembahasan = `
                <button onclick="bukaPembahasanSoal('${mapelNama}', '${paketNama}', ${originalIndex})" class="btn btn-outline btn-sm" style="border-color: var(--ses-blue); color: var(--ses-blue); border-radius: 10px; font-weight: 800; box-shadow: 0 2px 5px rgba(0,88,198,0.1);">
                    <i class="fas fa-search-plus"></i> Lihat Pembahasan
                </button>
            `;
        } else {
            // Jika nilai di bawah target, tombol digembok warna abu-abu
            let pesanGembok = `Kunci jawaban dan pembahasan baru bisa dibuka jika nilaimu mencapai target minimal <b>${targetKKM}</b>. Ayo ulangi latihanmu dan raih skor yang lebih tinggi!`;
            tombolPembahasan = `
                <button onclick="sesAlert('Pembahasan Terkunci', '${pesanGembok}', 'fas fa-lock', '#f59e0b')" class="btn btn-outline btn-sm" style="border-color: #cbd5e1; color: #94a3b8; background: #f8fafc; border-radius: 10px; font-weight: 800;">
                    <i class="fas fa-lock"></i> Terkunci
                </button>
            `;
        }

        tbody.innerHTML += `
            <tr style="transition: all 0.3s ease;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                <td>
                    <strong style="color: var(--ses-blue-dark); font-size: 1.05rem;">${paketNama}</strong><br>
                    <span style="font-size: 0.85rem; color: #475569; font-weight: 700;"><i class="fas fa-book" style="color: var(--ses-gold);"></i> Mapel: ${mapelNama}</span>
                    ${formatWaktu}
                </td>
                <td style="font-weight: 900; color: var(--ses-blue); font-size: 1.4rem; text-align: center;">${skorUjian}</td>
                <td style="text-align: center;">${statusLulus}</td>
                <td style="text-align: center;">
                    ${tombolPembahasan}
                </td>
            </tr>
        `;
    });
}

// ==========================================
// FUNGSI PEMBAHASAN DI DASHBOARD SISWA (MULTI-PAKET + KIDS FUN UI)
// ==========================================
async function bukaPembahasanSoal(mapel, paketDiklik, riwayatIndex = -1) {
    const paket = paketDiklik || "Tryout Umum"; 
    const dataSiswa = JSON.parse(localStorage.getItem("ses_siswa_login"));
    
    let jawabanSiswaMap = {};
    if (riwayatIndex !== -1 && dataSiswa.riwayat_lengkap && dataSiswa.riwayat_lengkap[riwayatIndex]) {
        jawabanSiswaMap = dataSiswa.riwayat_lengkap[riwayatIndex].jawaban || {};
    } else {
        jawabanSiswaMap = dataSiswa[`jawaban_${mapel}`] || {}; 
    }

    const wadah = document.getElementById("isiPembahasanDashboard");
    document.getElementById("judulMapelPembahasan").textContent = `- ${mapel} (${paket})`;

    wadah.innerHTML = '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 4rem; color: #10b981; margin-bottom: 15px;"></i><p style="font-weight: 800; color: #047857; font-size: 1.1rem;">Sedang membuka buku catatan saktimu...</p></div>';
    document.getElementById("modalPembahasanDashboard").classList.add("show");

    try {
        const snapshot = await db.collection("bank_soal")
            .where("mapel", "==", mapel)
            .where("paket", "==", paket) 
            .get();

        if (snapshot.empty) {
            wadah.innerHTML = `<div style="text-align: center; padding: 40px; color: #ef4444;"><i class="fas fa-search-minus" style="font-size: 4rem; margin-bottom: 15px;"></i><p style="font-weight: 800; font-size: 1.1rem;">Waduh! Soal untuk ${mapel} pada ${paket} belum ditemukan.</p></div>`;
            return;
        }

        let soalArray = [];
        snapshot.forEach(doc => { soalArray.push(doc.data()); });
        soalArray.sort((a, b) => a.nomor - b.nomor);
        
        const letters = ["A","B","C","D"];
        wadah.innerHTML = "";

        soalArray.forEach(q => {
            const r = jawabanSiswaMap[q.nomor]; 
            let isBenar = false;
            let teksJawabanSiswa = "<i style='color: #ef4444;'>Kosong / Tidak Dijawab</i>";
            let teksKunciJawaban = "";

            if (q.type === "pg") {
                isBenar = r === q.answer;
                
                let imgSiswa = (q.optionsImg && r !== null && q.optionsImg[r]) ? `<br><img src="${q.optionsImg[r]}" style="max-height:80px; margin-top:8px; border-radius:8px; border: 2px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">` : "";
                let imgKunci = (q.optionsImg && q.optionsImg[q.answer]) ? `<br><img src="${q.optionsImg[q.answer]}" style="max-height:80px; margin-top:8px; border-radius:8px; border: 2px solid #cbd5e1; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">` : "";
                
                if (r !== null && r !== undefined) teksJawabanSiswa = `<b>${letters[r]}.</b> ${(q.options[r] || "").replace(/\n/g, "<br>")} ${imgSiswa}`;
                teksKunciJawaban = `<b>${letters[q.answer]}.</b> ${(q.options[q.answer] || "").replace(/\n/g, "<br>")} ${imgKunci}`;
            } 
            else if (q.type === "multi") {
                const a = Array.isArray(r) ? [...r].sort() : []; 
                const b = [...q.answer].slice(0, 3).sort((x, y) => x - y);

                isBenar = a.length === b.length && a.every((v, j) => v === b[j]);
                if (a.length > 0) {
                    teksJawabanSiswa = a.map(idx => {
                        let img = (q.optionsImg && q.optionsImg[idx]) ? `<br><img src="${q.optionsImg[idx]}" style="max-height:60px; margin-top:5px; border-radius:8px; border: 2px solid #cbd5e1;">` : "";
                        return `<b>Pilihan ke-${idx + 1}</b>${img}`;
                    }).join("<br>");
                }
                teksKunciJawaban = b.map(idx => {
                    let img = (q.optionsImg && q.optionsImg[idx]) ? `<br><img src="${q.optionsImg[idx]}" style="max-height:60px; margin-top:5px; border-radius:8px; border: 2px solid #cbd5e1;">` : "";
                    return `<b>Pilihan ke-${idx + 1}</b>${img}`;
                }).join("<br>");
            } 
            else if (q.type === "tf") {
                let labelBenar = (q.tfType === "tepat-tidak") ? "Tepat" : (q.tfType === "sesuai-tidak" ? "Sesuai" : "Benar");
                let labelSalah = (q.tfType === "tepat-tidak") ? "Tidak Tepat" : (q.tfType === "sesuai-tidak" ? "Tidak Sesuai" : "Salah");

                let cekSemuaBenar = true;
                let tempSiswa = []; let tempKunci = [];

                q.statements.forEach((stmt, idx) => {
                    let jwbSiswa = (Array.isArray(r) && r[idx] !== null) ? (r[idx] ? labelBenar : labelSalah) : "Kosong";
                    let jwbKunci = q.answer[idx] ? labelBenar : labelSalah;
                    
                    let imgTf = (q.statementsImg && q.statementsImg[idx]) ? `<br><img src="${q.statementsImg[idx]}" style="max-height:60px; margin-top:5px; border-radius:8px; border: 2px solid #cbd5e1;">` : "";
                    
                    let bgKunci = q.answer[idx] ? "#d1fae5" : "#fee2e2";
                    let colorKunci = q.answer[idx] ? "#059669" : "#dc2626";
                    let badgeKunci = `<span style="background-color: ${bgKunci}; color: ${colorKunci}; padding: 4px 12px; border-radius: 15px; font-size: 0.75rem; font-weight: bold; letter-spacing: 0.5px;">${jwbKunci.toUpperCase()}</span>`;

                    let bgSiswa = "#f1f5f9"; let colorSiswa = "#475569";
                    if (jwbSiswa === labelBenar) { bgSiswa = "#d1fae5"; colorSiswa = "#059669"; }
                    else if (jwbSiswa === labelSalah) { bgSiswa = "#fee2e2"; colorSiswa = "#dc2626"; }
                    let badgeSiswa = `<span style="background-color: ${bgSiswa}; color: ${colorSiswa}; padding: 4px 12px; border-radius: 15px; font-size: 0.75rem; font-weight: bold; letter-spacing: 0.5px;">${jwbSiswa.toUpperCase()}</span>`;

                    let barisStyle = "border-bottom: 2px dashed #f1f5f9;";
                    let selStyle = "padding: 12px 10px; vertical-align: middle;";

                    tempSiswa.push(`
                        <tr style="${barisStyle}">
                            <td style="${selStyle} width: 40px; text-align: center; font-weight: 900; color: var(--ses-blue);">${idx + 1}</td>
                            <td style="${selStyle} font-weight: 600;">${stmt} ${imgTf}</td>
                            <td style="${selStyle} text-align: center; width: 120px;">${badgeSiswa}</td>
                        </tr>
                    `);

                    tempKunci.push(`
                        <tr style="${barisStyle}">
                            <td style="${selStyle} width: 40px; text-align: center; font-weight: 900; color: var(--ses-blue);">${idx + 1}</td>
                            <td style="${selStyle} font-weight: 600;">${stmt} ${imgTf}</td>
                            <td style="${selStyle} text-align: center; width: 120px;">${badgeKunci}</td>
                        </tr>
                    `);
                    
                    if (jwbSiswa !== jwbKunci) cekSemuaBenar = false;
                });
                
                isBenar = cekSemuaBenar;
                let tableHeader = `<table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.95rem; color: #333; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.02);"><thead><tr style="border-bottom: 2px solid #e2e8f0; background: #f8fafc;"><th style="padding: 12px; text-align: center; color: #475569; font-weight: 900;">No.</th><th style="padding: 12px; text-align: left; color: #475569; font-weight: 900;">Pernyataan</th><th style="padding: 12px; text-align: center; color: #475569; font-weight: 900;">Jawaban</th></tr></thead><tbody>`;
                let tableFooter = `</tbody></table>`;
                
                teksJawabanSiswa = `<div style="font-weight: 900; color: #475569; font-size: 1rem; text-transform: uppercase;"><i class="fas fa-clipboard-list" style="color: var(--ses-blue);"></i> Rekap Jawabanmu</div>${tableHeader}${tempSiswa.join("")}${tableFooter}`;
                teksKunciJawaban = `<div style="font-weight: 900; color: #b45309; font-size: 1rem; text-transform: uppercase;"><i class="fas fa-star"></i> Rekap Kunci Jawaban</div>${tableHeader}${tempKunci.join("")}${tableFooter}`;
            }

            let badgeStatus = isBenar 
                ? `<span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 6px 15px; border-radius: 20px; font-size: 0.85rem; font-weight: 900; box-shadow: 0 4px 10px rgba(16,185,129,0.3); border: 2px solid #a7f3d0;"><i class="fas fa-laugh-beam"></i> BENAR!</span>`
                : `<span style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 6px 15px; border-radius: 20px; font-size: 0.85rem; font-weight: 900; box-shadow: 0 4px 10px rgba(239,68,68,0.3); border: 2px solid #fecaca;"><i class="fas fa-sad-tear"></i> SALAH</span>`;
            
            if(r === null || r === undefined || (Array.isArray(r) && r.length === 0) || (Array.isArray(r) && r.every(v=> v===null))) {
                badgeStatus = `<span style="background: #94a3b8; color: white; padding: 6px 15px; border-radius: 20px; font-size: 0.85rem; font-weight: 900; border: 2px solid #e2e8f0;"><i class="fas fa-minus-circle"></i> KOSONG</span>`;
            }

            let htmlCard = `
                <div class="card-pembahasan-item">
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px dashed #bbf7d0; padding-bottom: 15px;">
                        <strong style="color: #064e3b; font-size: 1.2rem; font-weight: 900;"><i class="fas fa-book-open" style="color: #10b981; margin-right: 5px;"></i> Soal No. ${q.nomor}</strong>
                        ${badgeStatus}
                    </div>
                    
                    <div style="color: #1e293b; margin-bottom: 20px; font-size: 1.05rem; line-height: 1.7; font-weight: 600;">${(q.text || "").replace(/\n/g, "<br>")}</div>
                    ${q.image ? `<img src="${q.image}" style="max-width: 100%; border-radius: 12px; margin-bottom: 20px; border: 2px solid #cbd5e1; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">` : ""}
                    
                    <div style="background: #f8fafc; padding: 15px 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 5px;">
                        <span style="font-size: 0.85rem; color: #64748b; font-weight: 800; text-transform: uppercase;"><i class="fas fa-user-edit" style="color: var(--ses-blue);"></i> Jawabanmu:</span>
                        <div style="color: #333; font-size: 1rem; margin-top: 8px; font-weight: 600;">${teksJawabanSiswa}</div>
                    </div>

                    <button class="btn-toggle-kunci" onclick="let div = this.nextElementSibling; if(div.style.display==='none'){div.style.display='block'; this.innerHTML='<i class=\\'fas fa-chevron-up\\'></i> Tutup Kunci & Pembahasan'; this.style.background='#64748b';}else{div.style.display='none'; this.innerHTML='<i class=\\'fas fa-search-plus\\'></i> Lihat Kunci & Pembahasan Lengkap'; this.style.background='linear-gradient(135deg, var(--ses-blue) 0%, #1d4ed8 100%)';}" style="width: 100%; background: linear-gradient(135deg, var(--ses-blue) 0%, #1d4ed8 100%); border: none; padding: 14px 20px; border-radius: 12px; color: white; font-weight: 800; cursor: pointer; transition: all 0.3s ease; margin-top: 15px; font-size: 0.95rem; box-shadow: 0 4px 15px rgba(0, 88, 198, 0.25); display: flex; align-items: center; justify-content: center; gap: 8px;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 88, 198, 0.35)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 15px rgba(0, 88, 198, 0.25)';">
                        <i class="fas fa-search-plus"></i> Lihat Kunci & Pembahasan Lengkap
                    </button>
                    
                    <div style="display: none; margin-top: 20px; animation: fadeIn 0.4s ease;">
                        
                        <div style="background: #fffbeb; padding: 20px; border-radius: 14px; border: 2px dashed #f59e0b; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.05);">
                            <p style="margin: 0 0 10px; font-size: 0.9rem; color: #b45309; font-weight: 900; text-transform: uppercase;"><i class="fas fa-key"></i> Kunci Jawaban Benar:</p>
                            <div style="margin: 0; color: #1e293b; font-size: 1.05rem; font-weight: 700;">${teksKunciJawaban}</div>
                        </div>
                        
                        <div style="background: #eff6ff; padding: 25px; border-radius: 14px; border: 2px solid #bfdbfe;">
                            <p style="margin: 0 0 15px; font-size: 1rem; color: #1d4ed8; font-weight: 900; border-bottom: 2px dotted #93c5fd; padding-bottom: 10px;">
                                <i class="fas fa-lightbulb" style="color: #f59e0b; margin-right: 5px; font-size: 1.2rem;"></i> PENJELASAN / PEMBAHASAN:
                            </p>
                            <div style="margin: 0; color: #1e293b; font-size: 1.05rem; line-height: 1.8; white-space: pre-line; font-weight: 600;">${q.pembahasan || '<i style="color:#94a3b8;">Admin belum memasukkan penjelasan khusus untuk soal ini.</i>'}</div>
                        </div>
                    </div>

                </div>
            `;
            wadah.innerHTML += htmlCard;
        });

        if (window.MathJax) { MathJax.typesetPromise(); }

    } catch (err) {
        console.error(err);
        wadah.innerHTML = '<div style="text-align: center; padding: 40px; color: #ef4444;"><p>Gagal menarik data pembahasan dari database. Periksa koneksi.</p></div>';
    }
}
// ==========================================
// 8. PAPAN PERINGKAT NASIONAL SISWA (FILTER PAKET & MAPEL SPESIFIK)
// ==========================================
function muatLeaderboardSiswa() {
    // Render Tipe Akun Siswa ke Badge Header
    const dataSiswaLogin = JSON.parse(localStorage.getItem("ses_siswa_login") || "{}");
    const teksTier = document.getElementById('teksTierAkunSiswa');
    if (teksTier) {
        const tier = dataSiswaLogin.tipeAkses || "Basic";
        teksTier.textContent = tier.toUpperCase();
        
        const badgeEl = document.getElementById('badgeTipeAkunLeaderboard');
        if (badgeEl) {
            if (tier.toLowerCase() === "ultimate") {
                badgeEl.style.background = "#fffbeb";
                badgeEl.style.color = "#b45309";
                badgeEl.style.borderColor = "#fde68a";
            } else if (tier.toLowerCase() === "pro") {
                badgeEl.style.background = "#eff6ff";
                badgeEl.style.color = "#1d4ed8";
                badgeEl.style.borderColor = "#bfdbfe";
            }
        }
    }

    // Muat daftar opsi paket ke dropdown secara terurut jika belum ada
    db.collection("paket_tryout").get().then(snap => {
        const dropdown = document.getElementById('filterLeaderboardPaket');
        if (dropdown && dropdown.options.length <= 1) {
            let listPaketDb = [];
            snap.forEach(doc => listPaketDb.push(doc.data()));
            listPaketDb.sort((a, b) => a.namaPaket.localeCompare(b.namaPaket, undefined, {numeric: true, sensitivity: 'base'}));
            
            listPaketDb.forEach(d => {
                dropdown.innerHTML += `<option value="${d.namaPaket}" data-jenis="${d.jenisPaket || 'Ujian'}">${d.namaPaket}</option>`;
            });
        }
    });

    const filterPaketEl = document.getElementById('filterLeaderboardPaket');
    const filterMapelEl = document.getElementById('filterLeaderboardMapel');
    
    const paketDipilih = filterPaketEl ? filterPaketEl.value : "Semua";
    const mapelDipilih = filterMapelEl ? filterMapelEl.value : "Semua";
    
    // Ubah teks judul kolom tabel sesuai filter mapel
    const kolomHeader = document.getElementById('kolomHeaderSkorLeaderboard');
    if (kolomHeader) {
        kolomHeader.textContent = mapelDipilih === "Semua" ? "Skor Rata-Rata" : `Skor ${mapelDipilih}`;
    }

    let jenisPaketDipilih = "Semua";
    if (filterPaketEl && filterPaketEl.selectedIndex !== -1) {
        jenisPaketDipilih = filterPaketEl.options[filterPaketEl.selectedIndex].getAttribute('data-jenis') || "Semua";
    }

    db.collection("users_tryout").onSnapshot(snap => {
        let users = [];
        
        snap.forEach(doc => {
            const d = doc.data();
            
            // Validasi Hak Akses Tipe Akun
            if (paketDipilih !== "Semua") {
                const tierSiswa = (d.tipeAkses || "Basic").toLowerCase();
                const tierPaket = jenisPaketDipilih.toLowerCase();
                const levelValue = { "basic": 1, "pro": 2, "ultimate": 3, "premium": 3 };
                
                if ((levelValue[tierSiswa] || 1) < (levelValue[tierPaket] || 1) && d.paketAktif !== paketDipilih) {
                    return; 
                }
            }

            let riwayat = d.riwayat_lengkap || [];
            let mapelGroup = {};
            
            // Saring riwayat berdasarkan Paket dan Mapel yang dipilih
            riwayat.forEach(item => {
                let isPaketCocok = (paketDipilih === "Semua" || item.paket === paketDipilih);
                let isMapelCocok = (mapelDipilih === "Semua" || item.mapel === mapelDipilih);

                if (isPaketCocok && isMapelCocok && item.mapel && item.skor !== undefined && item.skor !== null) {
                    if (!mapelGroup[item.mapel]) mapelGroup[item.mapel] = [];
                    mapelGroup[item.mapel].push(Number(item.skor) || 0);
                }
            });

            // Fallback data lama jika riwayat lengkap kosong
            if (Object.keys(mapelGroup).length === 0 && paketDipilih === "Semua") {
                Object.keys(d).forEach(key => {
                    if (key.startsWith("skor_") && !key.startsWith("riwayat_skor_")) {
                        let mapel = key.replace("skor_", "");
                        if (mapelDipilih === "Semua" || mapel === mapelDipilih) {
                            let nilai = Number(d[key]);
                            if (!isNaN(nilai) && nilai !== 0) mapelGroup[mapel] = [nilai];
                        }
                    }
                });
            }

            let totalSkorMapel = 0;
            let jumlahMapelUnik = 0;

            Object.keys(mapelGroup).forEach(mapel => {
                let arrNilai = mapelGroup[mapel];
                let nilaiTerbaik = Math.max(...arrNilai); // Ambil skor terbaik per mapel
                totalSkorMapel += nilaiTerbaik;
                jumlahMapelUnik++;
            });

            if (jumlahMapelUnik > 0) {
                const skorAkhirSiswa = mapelDipilih === "Semua" ? Math.round(totalSkorMapel / jumlahMapelUnik) : totalSkorMapel;
                users.push({ 
                    username: d.username, 
                    nama: d.nama, 
                    sekolah: d.sekolah || 'Mandiri', 
                    skorAkhir: skorAkhirSiswa 
                });
            }
        });
        
        users.sort((a, b) => b.skorAkhir - a.skorAkhir); // Urutkan dari skor tertinggi
        
        const myRankIndex = users.findIndex(u => u.username === dataSiswaLogin.username);
        const elRank = document.getElementById('statRank');
        
        if (elRank && paketDipilih === "Semua" && mapelDipilih === "Semua") {
            if (myRankIndex !== -1) {
                elRank.innerHTML = `#${myRankIndex + 1}`;
            } else {
                elRank.innerHTML = '<span style="color:#94a3b8; font-size: 1rem;">-</span>';
            }
        }

        const tbody = document.getElementById('tabelLeaderboardSiswa');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        if(users.length === 0) return tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">Belum ada data peringkat untuk kategori, paket, atau mapel ini.</td></tr>';
        
        users.forEach((u, index) => {
            let medali = index + 1;
            if(index === 0) medali = '<i class="fas fa-medal" style="color: #fbbf24; font-size: 1.5rem;"></i>';
            if(index === 1) medali = '<i class="fas fa-medal" style="color: #94a3b8; font-size: 1.5rem;"></i>';
            if(index === 2) medali = '<i class="fas fa-medal" style="color: #b45309; font-size: 1.5rem;"></i>';

            let isMe = u.username === dataSiswaLogin.username ? 'style="background: #f0f9ff;"' : '';

            tbody.innerHTML += `
                <tr ${isMe}>
                    <td style="text-align: center; font-weight: 900; color: var(--ses-blue);">${medali}</td>
                    <td><strong style="color: var(--ses-blue-dark);">${u.nama} ${isMe ? '<span class="badge" style="background:#3b82f6;color:white;font-size:0.6rem;padding:2px 6px;">SAYA</span>' : ''}</strong></td>
                    <td>${u.sekolah || 'Mandiri'}</td>
                    <td style="text-align: center; font-weight: 900; color: #10b981; font-size: 1.2rem;">${u.skorAkhir}</td>
                </tr>
            `;
        });
    });
}
// ==========================================
// FUNGSI: Pengecekan Akses Fitur Kartu & Sertifikat (KHUSUS ULTIMATE)
// ==========================================
function cekDanBukaMenu(idMenu, element) {
    const dataSiswa = JSON.parse(localStorage.getItem("ses_siswa_login"));
    
    if (!dataSiswa) {
        sesAlert("Sesi Berakhir", "Silakan login kembali.", "fas fa-sign-in-alt", "#ef4444");
        return;
    }

    const tipeAksesSiswa = dataSiswa.tipeAkses || "Basic";
    
    // Jika BUKAN Ultimate, maka blokir akses ke Kartu dan Sertifikat!
    if (tipeAksesSiswa !== "Ultimate") {
         sesAlert(
            "Fitur Ultimate Terkunci", 
            `Fitur Cetak Kartu Anggota, Sertifikat Kelulusan, dan Tiket Event Offline hanya eksklusif untuk pemilik <b>Akun Level ULTIMATE</b>.<br><br>Akun Anda saat ini adalah <b>${tipeAksesSiswa}</b>. Silakan hubungi Admin LKP SES untuk Upgrade Akun Anda agar bisa mencetak dokumen penting ini.`, 
            "fas fa-crown", 
            "#f59e0b"
        );
        return;
    }

    // Jika Ultimate, persilakan masuk
    gantiMenuSiswa(idMenu, element); 
}
// ==========================================
// 9. FUNGSI GENERATOR SERTIFIKAT OTOMATIS (TABEL 3 KOLOM DINAMIS)
// ==========================================
function muatSertifikatKelulusan(dataSiswa) {
    const areaTerkunci = document.getElementById('areaSertifikatTerkunci');
    const areaTerbuka = document.getElementById('areaSertifikatTerbuka');
    if(!areaTerkunci || !areaTerbuka) return;

    let totalSkor = 0;
    let jumlahMapel = 0;
    let barisTabelHTML = '';

    // Fungsi kecil pengubah angka jadi predikat
    const getPredikat = (nilai) => {
        if (nilai >= 90) return "Sangat Baik (A)";
        if (nilai >= 80) return "Baik (B+)";
        if (nilai >= 75) return "Baik (B)";
        if (nilai >= 60) return "Cukup (C)";
        return "Kurang (D)";
    };

    // Ambil semua nilai mata pelajaran
    Object.keys(dataSiswa).forEach(key => {
        if (key.startsWith("skor_") && !key.startsWith("riwayat_skor_")) {
            let mapel = key.replace("skor_", "");
            let skor = Number(dataSiswa[key]);
            
            if (!isNaN(skor) && dataSiswa[key] !== null && dataSiswa[key] !== undefined) {
                totalSkor += skor;
                jumlahMapel++;
                
                // Render 3 Kolom: Mapel | Angka | Predikat
                barisTabelHTML += `
                    <tr>
                        <td style="text-align: left; padding-left: 15px;">${mapel}</td>
                        <td style="text-align: center;">${skor}</td>
                        <td style="text-align: center;">${getPredikat(skor)}</td>
                    </tr>
                `;
            }
        }
    });

    if (jumlahMapel > 0) {
        areaTerkunci.style.display = 'none';
        areaTerbuka.style.display = 'block';

        const rataRata = Math.round(totalSkor / jumlahMapel);
        const statusLulus = rataRata >= 75; 

        // 1. Isi Data Identitas
        document.getElementById('namaDiSertifikat').textContent = dataSiswa.nama;
        document.getElementById('paketDiSertifikat').textContent = dataSiswa.paketAktif || "Tryout TKA Nasional";
        document.getElementById('idPesertaSertifikat').textContent = dataSiswa.username;
        document.getElementById('sekolahSertifikat').textContent = dataSiswa.sekolah || "Peserta Mandiri";
        
        // Atur Nomor Urut
        const angkaId = (dataSiswa.username || "124").replace(/\D/g, '') || "124";
        const elNoUrut = document.getElementById('noUrutSertifikat');
        if (elNoUrut) elNoUrut.textContent = angkaId;

        // 2. Atur Tanggal
        const hariIni = new Date();
        const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const angkaBulanRomawi = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
        
        document.getElementById('tanggalSertifikat').textContent = `${hariIni.getDate()} ${namaBulan[hariIni.getMonth()]} ${hariIni.getFullYear()}`;
        document.getElementById('bulanSertifikat').textContent = angkaBulanRomawi[hariIni.getMonth()];
        document.getElementById('tahunSertifikat').textContent = hariIni.getFullYear();

        // 3. Pasang Foto Profil
        const elFotoSertifikat = document.getElementById('fotoSertifikat');
        const avatarDefault = `https://ui-avatars.com/api/?name=${encodeURIComponent(dataSiswa.nama)}&background=0058c6&color=fff&bold=true&size=300`;
        
        const fotoDariKartu = document.getElementById('fotoKartuPeserta');
        if (fotoDariKartu && fotoDariKartu.src && !fotoDariKartu.src.endsWith(window.location.pathname)) {
            elFotoSertifikat.src = fotoDariKartu.src;
        } else {
            elFotoSertifikat.src = avatarDefault;
        }

        if (dataSiswa.wa) {
            db.collection("pendaftaran_tryout").where("noWa", "==", dataSiswa.wa).get().then(snap => {
                if (!snap.empty && snap.docs[0].data().fotoProfilUrl) {
                    elFotoSertifikat.src = snap.docs[0].data().fotoProfilUrl;
                }
            }).catch(() => {});
        }
        
        // 4. Masukkan Tabel Nilai & Rata-Rata
        const wadahSkor = document.getElementById('wadahSkorSertifikat');
        if (wadahSkor) wadahSkor.innerHTML = barisTabelHTML;
        document.getElementById('rataRataSertifikat').textContent = rataRata;
        
        // Isi Predikat Rata-Rata di Baris Paling Bawah
        const elPredikatRata = document.getElementById('predikatRataRataSertifikat');
        if (elPredikatRata) elPredikatRata.textContent = getPredikat(rataRata);
        
        // 5. Status Kelulusan
        const elStatus = document.getElementById('statusKelulusanSertifikat');
        if (statusLulus) {
            elStatus.textContent = "LULUS";
            elStatus.style.color = "#16a34a"; 
        } else {
            elStatus.textContent = "BELUM LULUS";
            elStatus.style.color = "#dc2626"; 
        }

        // 6. Generate QR Code
        const qrData = encodeURIComponent(`VERIFIED-LKP-SES|${dataSiswa.username}|${dataSiswa.nama}|RATA-RATA:${rataRata}`);
        const qrBiruUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}&color=0058c6`;
        const qrHitamUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrData}&color=0f172a`;

        if (document.getElementById('qrSertifikatAtas')) document.getElementById('qrSertifikatAtas').src = qrBiruUrl;
        if (document.getElementById('qrSertifikatBawah')) document.getElementById('qrSertifikatBawah').src = qrHitamUrl;
        if (document.getElementById('qrSertifikatKanan')) document.getElementById('qrSertifikatKanan').src = qrHitamUrl;

    } else {
        areaTerkunci.style.display = 'block';
        areaTerbuka.style.display = 'none';
    }
}
// ==========================================
// 10. FUNGSI TARGET PRESTASI CIRCULAR & KOMITMEN
// ==========================================

// Fungsi Real-time memutar lingkaran saat slider digeser
function putarLingkaranTarget(nilaiTarget, rataRataSaatIni = null) {
    document.getElementById('teksAngkaTarget').textContent = nilaiTarget;
    
    // Kalkulasi derajat lingkaran (0-100 diubah ke 0-360 derajat)
    const derajat = (nilaiTarget / 100) * 360;
    const lingkaran = document.getElementById('lingkaranTarget');
    
    // Default warna cincin: Emas
    let warnaCincin = '#f59e0b'; 
    
    // Jika rata-rata sudah melampaui target, cincin menyala Hijau
    if (rataRataSaatIni !== null && rataRataSaatIni >= nilaiTarget && rataRataSaatIni > 0) {
        warnaCincin = '#10b981';
    }
    
    // Eksekusi putaran warna
    lingkaran.style.background = `conic-gradient(${warnaCincin} ${derajat}deg, #e2e8f0 0deg)`;
}

// Menyimpan target ke Firebase
function simpanTargetSiswa() {
    const fokusBelajar = document.getElementById('inputFokusBelajar').value.trim();
    const targetNilai = Number(document.getElementById('sliderTargetNilai').value);
    const dataSiswa = JSON.parse(localStorage.getItem("ses_siswa_login"));
    
    if(!fokusBelajar || targetNilai === 0) {
        return sesAlert("Target Belum Lengkap", "Ketik komitmen/fokus belajarmu dan geser slider target nilainya!", "fas fa-exclamation-triangle", "#f59e0b");
    }

    db.collection("users_tryout").doc(dataSiswa.id).update({
        fokusBelajar: fokusBelajar,
        targetNilai: targetNilai
    }).then(() => {
        tampilkanToast("Target berhasil dikunci! Semangat belajar! 🚀");
        dataSiswa.fokusBelajar = fokusBelajar;
        dataSiswa.targetNilai = targetNilai;
        localStorage.setItem("ses_siswa_login", JSON.stringify(dataSiswa));
        
        // Memperbarui status di kartu statistik atas secara real-time
        if (typeof updateStatistikCepat === "function") {
            updateStatistikCepat(); 
        }
    }).catch(err => {
        console.error(err);
        tampilkanToast("Gagal menyimpan target.", "error");
    });
}

// FUNGSI TAMBAHAN: Tampilkan teks komitmen yang sudah tersimpan saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const dataSiswa = JSON.parse(localStorage.getItem("ses_siswa_login") || "{}");
        const elInputFokus = document.getElementById('inputFokusBelajar');
        const elSlider = document.getElementById('sliderTargetNilai');
        
        if (dataSiswa.fokusBelajar && elInputFokus) {
            elInputFokus.value = dataSiswa.fokusBelajar;
        }
        if (dataSiswa.targetNilai && elSlider) {
            elSlider.value = dataSiswa.targetNilai;
            putarLingkaranTarget(dataSiswa.targetNilai); // Memutar posisi lingkaran ke angka terakhir
        }
    }, 1000);
});
// ==========================================
// 11. GRAFIK & FILTER RIWAYAT PROGRESS (VERSI FINAL)
// ==========================================
let chartProgresSiswa = null;

function inisialisasiGrafik() {
    const ctx = document.getElementById('chartRiwayat');
    if(!ctx) return;

    chartProgresSiswa = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: {
                y: { beginAtZero: true, max: 100, grid: { borderDash: [5, 5] } },
                x: { grid: { display: false } }
            }
        }
    });
    
    muatDropdownPaketGrafik();
}

function muatDropdownPaketGrafik() {
    db.collection("paket_tryout").get().then(snap => {
        const dropdown = document.getElementById('filterPaketChart');
        if(!dropdown) return;
        
        let pilihanAktif = dropdown.value;
        dropdown.innerHTML = '<option value="Semua">Semua Paket Ujian</option>';
        snap.forEach(doc => {
            const d = doc.data();
            dropdown.innerHTML += `<option value="${d.namaPaket}">${d.namaPaket}</option>`;
        });
        dropdown.value = pilihanAktif;
    });
}

function updateGrafikRiwayat() {
    const dataSiswa = JSON.parse(localStorage.getItem("ses_siswa_login") || "{}");
    if(!chartProgresSiswa) return;
    
    const filterPaketEl = document.getElementById('filterPaketChart');
    const filterPaket = filterPaketEl ? filterPaketEl.value : "Semua";
    let riwayatLengkap = dataSiswa.riwayat_lengkap || [];
    
    if (riwayatLengkap.length === 0) {
        Object.keys(dataSiswa).forEach(key => {
            if (key.startsWith("skor_") && !key.startsWith("riwayat_skor_")) {
                let mapel = key.replace("skor_", "");
                let skor = dataSiswa[key];
                if (skor !== undefined && skor !== null) {
                    riwayatLengkap.push({
                        paket: dataSiswa.paketAktif || "Paket 1",
                        mapel: mapel,
                        skor: skor,
                        waktu: new Date().getTime()
                    });
                }
            }
        });
    }

    let dataTerfilter = riwayatLengkap;
    if (filterPaket !== "Semua") {
        dataTerfilter = riwayatLengkap.filter(r => r.paket === filterPaket);
    }
    
    renderTabelRiwayatDinamis(dataTerfilter, riwayatLengkap);

    let mapelData = {};
    dataTerfilter.forEach(item => {
        if (!mapelData[item.mapel]) mapelData[item.mapel] = [];
        mapelData[item.mapel].push(item.skor);
    });

    const warnaGrafik = ['#0058c6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];
    let datasetsBaru = [];
    let maxLength = 0;
    let colorIndex = 0;

    for (let mapel in mapelData) {
        let skorArray = mapelData[mapel];
        if (skorArray.length > maxLength) maxLength = skorArray.length;

        datasetsBaru.push({
            label: mapel,
            data: skorArray,
            borderColor: warnaGrafik[colorIndex % warnaGrafik.length],
            backgroundColor: warnaGrafik[colorIndex % warnaGrafik.length] + '1A', 
            borderWidth: 3,
            pointBackgroundColor: warnaGrafik[colorIndex % warnaGrafik.length],
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            tension: 0.4,
            fill: true
        });
        colorIndex++;
    }

    let labelX = [];
    for (let i = 1; i <= Math.max(maxLength, 3); i++) {
        labelX.push(`Percobaan ${i}`);
    }

    chartProgresSiswa.data.labels = labelX;
    chartProgresSiswa.data.datasets = datasetsBaru;
    chartProgresSiswa.update();
}
// ==========================================
// 12. FITUR STUDY PLANNER (JADWAL MANDIRI)
// ==========================================
function bukaModalJadwal() {
    document.getElementById('modalJadwal').style.display = 'flex';
}

function tutupModalJadwal() {
    document.getElementById('modalJadwal').style.display = 'none';
}

function simpanJadwalMandiri() {
    const mapel = document.getElementById('jadwalMapel').value;
    const tanggal = document.getElementById('jadwalTanggal').value;
    const jam = document.getElementById('jadwalJam').value;
    const dataSiswa = JSON.parse(localStorage.getItem("ses_siswa_login"));

    if(!tanggal || !jam) {
        return sesAlert("Waktu Belum Lengkap", "Harap isi tanggal dan jam latihan dengan benar!", "fas fa-exclamation-triangle", "#f59e0b");
    }

    // Gabungkan tanggal dan jam menjadi format standar ISO
    const waktuGabungan = `${tanggal}T${jam}`;

    let jadwalBaru = { mapel: mapel, waktu: waktuGabungan, status: 'Aktif' };
    
    db.collection("users_tryout").doc(dataSiswa.id).get().then(doc => {
        let listJadwal = doc.data().jadwalBelajar || [];
        listJadwal.push(jadwalBaru);

        db.collection("users_tryout").doc(dataSiswa.id).update({
            jadwalBelajar: listJadwal
        }).then(() => {
            tampilkanToast("Jadwal latihan berhasil disimpan!");
            tutupModalJadwal();
            muatJadwalSiswa(dataSiswa.id);
        });
    }).catch(err => {
        console.error(err);
        tampilkanToast("Gagal menyimpan jadwal.", "error");
    });
}

function muatJadwalSiswa(siswaId) {
    db.collection("users_tryout").doc(siswaId).onSnapshot(doc => {
        if(!doc.exists) return;
        const d = doc.data();
        const container = document.getElementById('daftarJadwalSiswa');
        if(!container) return;

        const listJadwal = d.jadwalBelajar || [];
        if(listJadwal.length === 0) {
            return container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">Belum ada jadwal latihan yang diatur. Mari buat jadwal konsisten belajarmu!</p>';
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
        listJadwal.forEach((j, index) => {
            let formatWaktu = new Date(j.waktu).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
            html += `
                <div style="background: #f8fafc; padding: 15px 20px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <span class="badge" style="background: #eff6ff; color: var(--ses-blue); margin-bottom: 5px; display: inline-block;"><i class="fas fa-book"></i> ${j.mapel}</span>
                        <h4 style="margin: 0; color: var(--ses-blue-dark); font-size: 1rem; font-weight: 800;"><i class="fas fa-calendar-check" style="color: #10b981; margin-right: 5px;"></i> ${formatWaktu}</h4>
                    </div>
                    <button onclick="hapusJadwalSiswa(${index})" class="btn btn-danger btn-sm" style="padding: 6px 12px;"><i class="fas fa-trash-alt"></i> Hapus</button>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    });
}

function hapusJadwalSiswa(indexJadwal) {
    const dataSiswa = JSON.parse(localStorage.getItem("ses_siswa_login"));
    db.collection("users_tryout").doc(dataSiswa.id).get().then(doc => {
        let listJadwal = doc.data().jadwalBelajar || [];
        listJadwal.splice(indexJadwal, 1); // Hapus berdasarkan indeks

        db.collection("users_tryout").doc(dataSiswa.id).update({
            jadwalBelajar: listJadwal
        }).then(() => {
            tampilkanToast("Jadwal berhasil dihapus.");
            muatJadwalSiswa(dataSiswa.id);
        });
    });
}
// ==========================================
// FUNGSI HELPER: HITUNG RATA-RATA (FOKUS PER PAKET AKTIF)
// ==========================================
function hitungStatistikNilaiSiswa(dataSiswa) {
    let skorPerMapel = {}; 
    let paketFokus = dataSiswa.paketAktif || ""; 

    if (!paketFokus) return { rataRata: 0, jumlahUjian: 0, skorPerMapel: {} };

    // 1. Tarik nilai dari riwayat lengkap pada paket aktif
    if (dataSiswa.riwayat_lengkap && Array.isArray(dataSiswa.riwayat_lengkap)) {
        dataSiswa.riwayat_lengkap.forEach(item => {
            if (item.paket === paketFokus && item.mapel && item.skor !== undefined && item.skor !== null) {
                let nilai = Number(item.skor) || 0;
                // Selalu ambil nilai tertinggi (Max Score) untuk memacu semangat siswa!
                if (skorPerMapel[item.mapel] === undefined || nilai > skorPerMapel[item.mapel]) {
                    skorPerMapel[item.mapel] = nilai;
                }
            }
        });
    }

    // 2. Jaring pengaman data lama
    let daftarPaketSelesai = dataSiswa.paketSelesai || [];
    if (Object.keys(skorPerMapel).length === 0 && (dataSiswa.paketAktif === paketFokus || daftarPaketSelesai.includes(paketFokus))) {
        Object.keys(dataSiswa).forEach(key => {
            if (key.startsWith("skor_") && !key.startsWith("riwayat_skor_")) {
                let mapel = key.replace("skor_", "");
                let nilai = Number(dataSiswa[key]);
                if (!isNaN(nilai) && nilai !== null) {
                    skorPerMapel[mapel] = nilai;
                }
            }
        });
    }

    let semuaSkor = Object.values(skorPerMapel);
    let totalSkor = semuaSkor.reduce((a, b) => a + b, 0);
    let jumlahMapel = semuaSkor.length;
    let rataRata = jumlahMapel > 0 ? Math.round(totalSkor / jumlahMapel) : 0;

    return { rataRata: rataRata, jumlahUjian: jumlahMapel, skorPerMapel: skorPerMapel };
}

// ==========================================
// FUNGSI UPDATE STATISTIK KILAT (REAL-TIME FIREBASE - VERSI FINAL)
// ==========================================
function updateStatistikCepat() {
    const dataSiswaLokal = JSON.parse(localStorage.getItem("ses_siswa_login") || "{}");
    if (!dataSiswaLokal.username) return;

    db.collection("users_tryout").where("username", "==", dataSiswaLokal.username).onSnapshot(snap => {
        if (snap.empty) return;
        
        const docSiswa = snap.docs[0];
        const dataSiswa = docSiswa.data();
        dataSiswa.id = docSiswa.id;

        // 1. Hitung Total Paket Selesai
        const paketSelesai = dataSiswa.paketSelesai || [];
        const elTotal = document.getElementById('statTotalUjian');
        if (elTotal) elTotal.textContent = paketSelesai.length;
        
        // 2. Kalkulasi Rata-Rata Multi-Paket
        const stat = hitungStatistikNilaiSiswa(dataSiswa);
        const rataRata = stat.rataRata;
        
        // Update Kartu Nilai Rata-rata
        const elRata = document.getElementById('statRataRata');
        if (elRata) elRata.textContent = rataRata;
        
        // Update Angka Rata-rata di Lingkaran Target Bawah
        const elRataProgress = document.getElementById('teksRataRataProgress');
        if (elRataProgress) elRataProgress.textContent = rataRata;
        
        // 3. Kalkulasi Status Target
        const target = Number(dataSiswa.targetNilai) || 75;
        const elTarget = document.getElementById('statTarget');
        if (elTarget) {
            if (stat.jumlahUjian === 0) {
                elTarget.innerHTML = '<span style="color:#94a3b8; font-size: 0.95rem;">Belum Ujian</span>';
            } else if (rataRata >= target) {
                elTarget.innerHTML = '<span style="color:#10b981;"><i class="fas fa-arrow-up"></i> Tercapai</span>';
            } else {
                elTarget.innerHTML = '<span style="color:#ef4444;"><i class="fas fa-arrow-down"></i> Kurang ' + (target - rataRata) + '</span>';
            }
        }
        
        // Putar lingkaran progress target & sinkronkan fitur interaktif
        if (typeof putarLingkaranTarget === "function") {
            putarLingkaranTarget(target, rataRata);
        }
        muatFiturInteraktifSiswa(dataSiswa);
        muatSertifikatKelulusan(dataSiswa);
    });
}

// ==========================================
// FUNGSI BARU: FITUR REKOMENDASI CERDAS & RAK MEDALI
// ==========================================
function muatFiturInteraktifSiswa(dataSiswa) {
    if (!dataSiswa) return;

    const targetKKMSiswa = Number(dataSiswa.targetNilai) || 75;
    const stat = hitungStatistikNilaiSiswa(dataSiswa);
    const skorMapel = stat.skorPerMapel;

    let mapelTerendah = "";
    let nilaiTerendah = 101;
    let adaUjian = false;

    Object.keys(skorMapel).forEach(mapel => {
        adaUjian = true;
        let skor = Number(skorMapel[mapel]);
        if (skor < nilaiTerendah) {
            nilaiTerendah = skor;
            mapelTerendah = mapel;
        }
    });

    const wadahRekomendasi = document.getElementById("wadahRekomendasi");
    if (wadahRekomendasi) {
        if (!adaUjian) {
            wadahRekomendasi.innerHTML = `<p style="margin: 0; font-size: 0.85rem; color: var(--ses-blue-dark); font-weight: 700; line-height: 1.6;"><i class="fas fa-lightbulb" style="color: var(--ses-blue); margin-right: 5px;"></i> Kamu belum mengerjakan ujian apa pun. Mulai langkah pertamamu sekarang dengan mencoba <b>Paket 1</b>!</p>`;
        } else if (nilaiTerendah < targetKKMSiswa) {
            wadahRekomendasi.innerHTML = `<p style="margin: 0; font-size: 0.85rem; color: #991b1b; font-weight: 700; line-height: 1.6;"><i class="fas fa-exclamation-circle" style="color: #dc2626; margin-right: 5px;"></i> Nilai <b>${mapelTerendah}</b> kamu (${nilaiTerendah}) masih di bawah target (${targetKKMSiswa}). Fokus pelajari materi ini dan kerjakan ulang ya!</p>`;
        } else {
            wadahRekomendasi.innerHTML = `<p style="margin: 0; font-size: 0.85rem; color: var(--ses-blue-dark); font-weight: 700; line-height: 1.6;"><i class="fas fa-star" style="color: #d97706; margin-right: 5px;"></i> Luar biasa! Semua nilaimu sudah mencapai target. Pertahankan prestasimu dan tantang dirimu di paket berikutnya!</p>`;
        }
    }

    const wadahMedali = document.getElementById("wadahRakMedali");
    if (wadahMedali) {
        let htmlMedali = "";
        
        Object.keys(skorMapel).forEach(mapel => {
            let skor = Number(skorMapel[mapel]);
            if (skor >= 90) {
                htmlMedali += `<div title="${mapel}: ${skor}" style="font-size: 2.3rem; color: #fbbf24; filter: drop-shadow(0 4px 6px rgba(251,191,36,0.4)); cursor: help; transition: 0.3s;" onmouseover="this.style.transform='scale(1.15) translateY(-3px)'" onmouseout="this.style.transform='none'"><i class="fas fa-medal"></i></div>`;
            } else if (skor >= 80) {
                htmlMedali += `<div title="${mapel}: ${skor}" style="font-size: 2.3rem; color: #cbd5e1; filter: drop-shadow(0 4px 6px rgba(203,213,225,0.3)); cursor: help; transition: 0.3s;" onmouseover="this.style.transform='scale(1.15) translateY(-3px)'" onmouseout="this.style.transform='none'"><i class="fas fa-medal"></i></div>`;
            } else if (skor >= targetKKMSiswa) {
                htmlMedali += `<div title="${mapel}: ${skor}" style="font-size: 2.3rem; color: #d97706; filter: drop-shadow(0 4px 6px rgba(217,119,6,0.4)); cursor: help; transition: 0.3s;" onmouseover="this.style.transform='scale(1.15) translateY(-3px)'" onmouseout="this.style.transform='none'"><i class="fas fa-medal"></i></div>`;
            }
        });

        if (htmlMedali !== "") {
            wadahMedali.innerHTML = htmlMedali;
        } else {
            wadahMedali.innerHTML = `
                <div style="background: rgba(255, 255, 255, 0.15); padding: 15px; border-radius: 8px; border-left: 4px solid #fde047; width: 100%;">
                    <p style="margin: 0; font-size: 0.85rem; color: #f8fafc; font-weight: 600; line-height: 1.6;">
                        <i class="fas fa-info-circle" style="color: #fde047; margin-right: 5px;"></i> Belum ada medali. Ayo raih nilai <b>${targetKKMSiswa}</b> ke atas untuk mengoleksinya!
                    </p>
                </div>
            `;
        }
    }
}

// ==========================================
// FUNGSI PENGUMUMAN REAL-TIME DARI ADMIN
// ==========================================
function muatPengumumanLKP() {
    db.collection("pengaturan").doc("pengumuman").onSnapshot(doc => {
        const wadah = document.getElementById("wadahPengumuman");
        if (!wadah) return;

        if (doc.exists && doc.data().teks) {
            wadah.innerHTML = `
                <p style="margin: 0; font-size: 0.85rem; color: #f8fafc; font-weight: 600; line-height: 1.6;">
                    <span style="background: #fde047; color: var(--ses-blue-dark); font-size: 0.65rem; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px; display: inline-block; font-weight: 900; letter-spacing: 0.5px;">INFO TERBARU</span><br>
                    ${doc.data().teks}
                </p>
            `;
        } else {
            wadah.innerHTML = `
                <p style="margin: 0; font-size: 0.85rem; color: rgba(255,255,255,0.7); font-weight: 600; font-style: italic;">
                    <i class="fas fa-mug-hot" style="margin-right: 5px;"></i> Belum ada pengumuman saat ini. Semangat belajarnya!
                </p>
            `;
        }
    });
}
// ==========================================
// FUNGSI ANIMASI CONFETTI JUARA (GRAND CHAMPION)
// ==========================================
function tembakConfetti() {
    var duration = 4 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999999 };

    function randomInRange(min, max) { return Math.random() * (max - min) + min; }

    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        
        var particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}
// Listener Real-time Master Switch dari Admin
window.SES_MASTER_SWITCH_STATUS = "NORMAL";
document.addEventListener("DOMContentLoaded", () => {
    db.collection("pengaturan").doc("master_switch").onSnapshot(doc => {
        if (doc.exists && doc.data().status) {
            window.SES_MASTER_SWITCH_STATUS = doc.data().status;
        }
    });
});