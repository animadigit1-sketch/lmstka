// ==========================================
// FILE: dashboard.js
// FUNGSI: Logika Login & Portal Siswa SES
// ==========================================
const $ = id => document.getElementById(id);

// 1. Cek Sesi Login saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
    const sesi = sessionStorage.getItem("siswaAktifSES");
    if(sesi) {
        tampilkanDashboard(JSON.parse(sesi));
    }
});

// 2. Fungsi Login Siswa
async function loginSiswa(e) {
    e.preventDefault();
    const username = $("loginBarcode").value.trim();
    const password = $("loginPassword").value;
    const btn = $("btnLogin");

    if(!username || !password) return alert("Lengkapi ID Peserta dan Password!");

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memeriksa Data...';
    btn.disabled = true;

    try {
        // Cari user di database
        const snap = await db.collection("users_tryout").where("username", "==", username).get();
        if (snap.empty) throw new Error("ID Peserta tidak ditemukan di sistem.");

        let pesertaData = null;
        snap.forEach(doc => { pesertaData = { id: doc.id, ...doc.data() }; });

        if (pesertaData.password !== password) throw new Error("Kata sandi salah!");

        // Simpan sesi ke browser peserta agar tidak perlu login terus
        sessionStorage.setItem("siswaAktifSES", JSON.stringify(pesertaData));
        
        tampilkanDashboard(pesertaData);

    } catch (error) {
        alert(error.message);
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk Dashboard';
        btn.disabled = false;
    }
}

// 3. Merender Tampilan Dashboard
function tampilkanDashboard(data) {
    // Sembunyikan form login, tampilkan dashboard
    $("loginScreen").style.display = "none";
    $("dashNavbar").style.display = "flex";
    $("dashboardScreen").style.display = "block";

    // Isi teks UI dengan data peserta
    $("dashNamaPanggilan").textContent = data.nama.split(" ")[0]; // Ambil kata pertama untuk panggilan
    $("dashNamaLengkap").textContent = data.nama.toUpperCase();
    $("dashIdSiswa").textContent = data.username;
    $("dashSekolah").textContent = data.sekolah;
    $("dashWa").textContent = data.wa;
    
    // Tampilkan paket yang dibeli
    const namaPaket = data.paketAktif || "Paket Tryout Reguler";
    $("dashPaket").textContent = namaPaket;
    $("namaPaketUjian").textContent = namaPaket;

    // Pintar: Cari foto profil dari data pendaftaran berdasarkan nomor WA
    db.collection("pendaftaran_tryout").where("noWa", "==", data.wa).get().then(snap => {
        if(!snap.empty) {
            const p = snap.docs[0].data();
            if(p.fotoProfilUrl) {
                $("dashFoto").src = p.fotoProfilUrl;
            } else {
                $("dashFoto").src = "https://ui-avatars.com/api/?name=" + data.nama + "&background=0058c6&color=fff";
            }
        } else {
            // Jika tidak ada foto, buatkan avatar inisial nama
            $("dashFoto").src = "https://ui-avatars.com/api/?name=" + data.nama + "&background=0058c6&color=fff";
        }
    });
}

// 4. Tombol Menuju Ujian
function bukaRuangUjian() {
    // Arahkan siswa langsung ke ruang ujian
    window.location.href = "ujian.html";
}

// 5. Tombol Keluar / Logout
function logoutSiswa() {
    if(confirm("Apakah Anda yakin ingin keluar dari Portal Siswa?")) {
        sessionStorage.removeItem("siswaAktifSES");
        window.location.reload();
    }
}

// 6. Animasi Mata Password
function toggleLihatPassword() {
    const inputPass = $("loginPassword");
    const iconMata = $("iconMata");
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