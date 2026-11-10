// ==========================================
// FILE: daftar.js
// FUNGSI: Logika Form Pendaftaran Tryout
// ==========================================

const cloudName = "x28w7gjn"; 
const uploadPreset = "ses_bimbel_preset"; 

function tampilkanNamaFile(input, targetId) {
    const display = document.getElementById(targetId);
    if (input.files.length > 0) {
        let fileName = input.files[0].name;
        if(fileName.length > 20) fileName = fileName.substring(0, 17) + "...";
        display.innerHTML = `<i class="fas fa-check-circle"></i> ${fileName}`;
    } else {
        display.innerHTML = '';
    }
}

function tampilkanToast(pesan, tipe = "success") {
    const toast = document.getElementById('toast');
    toast.textContent = pesan;
    toast.className = tipe === "error" ? "error show" : "show";
    setTimeout(() => { toast.classList.remove('show'); }, 4000);
}

function aturFormPembayaran() {
    const status = document.querySelector('input[name="statusBayar"]:checked').value;
    const wadahBukti = document.getElementById('wadahBuktiBayar');
    const inputBukti = document.getElementById('inputBuktiBayar');
    const gridUpload = document.getElementById('wadahGridUpload');
    const lblSudah = document.getElementById('lblSudah');
    const lblBelum = document.getElementById('lblBelum');

    if (status === 'sudah') {
        wadahBukti.style.display = 'block';
        inputBukti.required = true;
        gridUpload.classList.remove('single');
        lblSudah.classList.add('active');
        lblBelum.classList.remove('active');
    } else {
        wadahBukti.style.display = 'none';
        inputBukti.required = false;
        gridUpload.classList.add('single');
        lblBelum.classList.add('active');
        lblSudah.classList.remove('active');
    }
}

// Di sistem baru, pilihan paket ditarik dari setting khusus atau dikunci ke 1 Event utama.
// Kita hardcode event utamanya agar pendaftar tidak bingung.
document.addEventListener('DOMContentLoaded', () => {
    const selectPaket = document.getElementById('inputPaket');
    if(selectPaket) {
        selectPaket.innerHTML = `
            <option value="" disabled selected>-- Pilih Event Tryout --</option>
            <option value="Event Tryout TKA SD">🚀 EVENT TRYOUT TKA TINGKAT SD</option>
            <option value="Event Tryout Literasi Numerasi">🚀 EVENT LITERASI & NUMERASI</option>
        `;
    }
});

function muatPaketCadangan() {
    const selectPaket = document.getElementById('inputPaket');
    selectPaket.innerHTML = `
        <option value="" disabled selected>-- Pilih Event / Mata Pelajaran --</option>
        <option value="Tryout TKA Kelas 6 SD (Paket Lengkap)">Tryout TKA Kelas 6 SD (Paket Lengkap) - Rp 35.000</option>
        <option value="Tryout Matematika SD Dasar">Tryout Matematika SD Dasar - Rp 20.000</option>
        <option value="Tryout Literasi & Numerasi AKM">Tryout Literasi & Numerasi AKM - Rp 25.000</option>
    `;
}

async function uploadKeCloudinary(file) {
    if (!file) return null; 
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
    });
    const data = await res.json();
    if (!data.secure_url) throw new Error("Gagal mengunggah foto.");
    return data.secure_url;
}

async function prosesPendaftaran(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmit');
    const teksAsli = btn.innerHTML;
    
    const nama = document.getElementById('inputNama').value.trim();
    const sekolah = document.getElementById('inputSekolah').value.trim();
    const wa = document.getElementById('inputWa').value.trim();
    const paket = document.getElementById('inputPaket').value;
    const statusBayar = document.querySelector('input[name="statusBayar"]:checked').value;
    const tipeAkses = document.getElementById('inputTipeAkses').value;
    
    const fileFotoProfil = document.getElementById('inputFotoProfil').files[0];
    const fileBuktiBayar = document.getElementById('inputBuktiBayar').files[0];

    if (statusBayar === 'sudah' && !fileBuktiBayar) return tampilkanToast("Mohon unggah bukti pembayaran Anda!", "error");
    if (!nama || !sekolah || !wa || !paket || !tipeAkses || !fileFotoProfil) return tampilkanToast("Mohon lengkapi seluruh data pendaftaran!", "error");

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengunggah Berkas (Mohon Tunggu)...';

    try {
        let fotoProfilUrl = null;
        let buktiBayarUrl = null;

        if (statusBayar === 'sudah') {
            [fotoProfilUrl, buktiBayarUrl] = await Promise.all([ uploadKeCloudinary(fileFotoProfil), uploadKeCloudinary(fileBuktiBayar) ]);
        } else {
            fotoProfilUrl = await uploadKeCloudinary(fileFotoProfil);
        }

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan Data...';
        const statusPendaftaran = (statusBayar === 'sudah') ? "Menunggu Verifikasi" : "Belum Bayar";

        // 👇 1. RADAR AFFILIATE: Membaca URL saat ini untuk mencari kode referral 👇
        const urlParams = new URLSearchParams(window.location.search);
        const kodeReferral = urlParams.get('ref') || ""; // Akan kosong jika siswa daftar mandiri tanpa link guru

        // 👇 2. SISIPKAN KODE REFERRAL KE FIREBASE 👇
        // 🚀 2. SISIPKAN DATA KE LACI 'leads' AGAR MUNCUL DI PAPAN KANBAN ADMIN/AFFILIATE 🚀
        await db.collection("leads").add({
            namaProspek: nama,            // Diubah dari namaPeserta
            noWa: wa,                     // Tetap (digunakan untuk tombol chat)
            minatProduk: paket,           // Diubah dari paketTryout
            tipeAkses: tipeAkses,
            asalSekolah: sekolah,
            statusPembayaran: statusBayar,
            fotoProfilUrl: fotoProfilUrl,   
            buktiBayarUrl: buktiBayarUrl || "",   
            status: "Lead Baru",          // Diubah mutlak jadi Lead Baru agar masuk ke kolom pertama Kanban
            affiliate: kodeReferral,      // Diubah dari referralDari
            waktuMasuk: new Date().toISOString() // Diubah dari serverTimestamp agar format waktunya seragam
        });

        // 🔔 3. NOTIFIKASI LONCENG KE ADMIN (Opsional tapi disarankan)
        await db.collection("notifikasi").add({
            tipe: "lead", 
            pesan: `Pendaftar Tryout Baru: ${nama} (${paket}).`,
            waktu: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' WIB',
            status: "unread"
        });

        let pesanSukses = statusBayar === 'sudah' 
            ? `Berkas dan foto profil Anda sedang ditinjau oleh Admin SES. Jika pembayaran valid, kami akan segera mengirimkan akses <b>ID Login</b> dan <b>Password</b> melalui pesan WhatsApp ke nomor <br><strong style="color:var(--ses-blue); font-size:1.1rem;">${wa}</strong>.`
            : `Pendaftaran awal berhasil! Segera lakukan pembayaran tiket tryout ke rekening <b>BRI atas nama Pambudi</b> atau via E-Wallet (Gopay/QRIS/Dana), lalu konfirmasi ke Admin agar <b>ID Login</b> Anda segera dikirimkan via WhatsApp.`;

        document.querySelector('.form-body').innerHTML = `
            <div style="text-align: center; padding: 30px 0 10px;">
                <i class="fas fa-check-circle" style="font-size: 5rem; color: #10b981; margin-bottom: 25px; text-shadow: 0 5px 15px rgba(16,185,129,0.3);"></i>
                <h2 style="color: var(--ses-blue-dark); margin-bottom: 12px; font-weight: 800;">Pendaftaran Berhasil!</h2>
                <p style="color: var(--text-muted); line-height: 1.7; font-weight: 600; font-size: 0.95rem;">${pesanSukses}</p>
                <a href="index.html" class="btn-submit" style="margin-top: 35px; text-decoration: none;"><i class="fas fa-home"></i> Kembali ke Beranda</a>
            </div>
        `;

    } catch (error) {
        console.error(error);
        tampilkanToast("Terjadi kesalahan sistem. Pastikan koneksi internet stabil.", "error");
        btn.disabled = false;
        btn.innerHTML = teksAsli;
    }
}
