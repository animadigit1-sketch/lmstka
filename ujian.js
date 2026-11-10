// ==========================================
// FILE: ujian.js
// FUNGSI: Logika CBT, Timer, Penilaian Soal, dan ANTI-REFRESH
// ==========================================

let questions = []; 
let current = 0;
let submitted = false;
let examStarted = false;
let dataSiswaLogin = null;
let isSubmitting = false; 

// Variabel untuk Anti-Refresh
let sessionStateKey = "";
let endTime = 0; 

let responses = [];
let flags = [];
const letters = ["A","B","C","D"];
const $ = id => document.getElementById(id);

function isAnswered(i) {
    if (!questions[i]) return false;
    const q = questions[i];
    const r = responses[i];
    if (q.type === "tf") return Array.isArray(r) && r.length === q.statements.length && r.every(v => v !== null); 
    if (q.type === "multi") return Array.isArray(r) && r.length > 0; 
    return r !== null && r !== undefined; 
}

// ------------------------------------------
// FUNGSI PENYIMPANAN STATE (ANTI REFRESH)
// ------------------------------------------
function simpanStateUjian() {
    const state = {
        questions: questions,
        responses: responses,
        flags: flags,
        current: current,
        endTime: endTime
    };
    sessionStorage.setItem(sessionStateKey, JSON.stringify(state));
}

// ==========================================
// 1. INISIALISASI & AMBIL SESI DARI BROWSER
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const sesiSiswa = localStorage.getItem("ses_siswa_login");
    const paketAktif = localStorage.getItem("ses_ujian_aktif_paket");
    const mapelAktif = localStorage.getItem("ses_ujian_aktif_mapel");

    if (!sesiSiswa || !paketAktif || !mapelAktif) {
        sesAlert("Akses Ditolak", "Silakan masuk melalui Dashboard Siswa terlebih dahulu.", "fas fa-ban", "#ef4444")
        .then(() => { window.location.href = "siswa.html"; });
        return;
    }

    dataSiswaLogin = JSON.parse(sesiSiswa);
    sessionStateKey = `cbt_state_${paketAktif}_${mapelAktif}`; // Kunci memori ujian unik
    
    const displayNamaTop = $("displayNamaTop");
    const displayBarcodeTop = $("displayBarcodeTop");
    
    if (displayNamaTop) displayNamaTop.textContent = dataSiswaLogin.nama.toUpperCase();
    if (displayBarcodeTop) displayBarcodeTop.textContent = dataSiswaLogin.username;

    db.collection("pendaftaran_tryout").where("noWa", "==", dataSiswaLogin.wa).get().then(snap => {
        let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(dataSiswaLogin.nama)}&background=0058c6&color=fff&bold=true`;
        if(!snap.empty) {
            const pendaftaran = snap.docs[0].data();
            if(pendaftaran.fotoProfilUrl) avatarUrl = pendaftaran.fotoProfilUrl;
        }
        
        const topbarContainer = document.querySelector('.anbk-peserta-top');
        if(topbarContainer) {
            const oldIcon = topbarContainer.querySelector('i');
            if (oldIcon) oldIcon.remove();
            
            const img = document.createElement('img');
            img.src = avatarUrl;
            img.style.width = '30px'; img.style.height = '30px';
            img.style.borderRadius = '50%'; img.style.objectFit = 'cover';
            img.style.border = '2px solid white';
            topbarContainer.appendChild(img);
        }
    }).catch(err => console.log("Gagal memuat foto profil:", err));

    const infoMapel = $("infoMapelPaket");
    if (infoMapel) infoMapel.textContent = `${mapelAktif} - ${paketAktif}`;

    muatSoalDariFirebase(paketAktif, mapelAktif);
});

// ==========================================
// 2. TARIK SOAL (ATAU PULIHKAN DARI MEMORI)
// ==========================================
async function muatSoalDariFirebase(paket, mapel) {
    try {
        const savedState = sessionStorage.getItem(sessionStateKey);

        if (savedState) {
            // JIKA ADA MEMORI TERSIMPAN (Habis Kena Refresh)
            const state = JSON.parse(savedState);
            questions = state.questions;
            responses = state.responses;
            flags = state.flags;
            current = state.current;
            endTime = state.endTime;
            
            examStarted = true;
            
            // Hitung sisa waktu berdasarkan waktu target absolut
            const sisaWaktuDetik = Math.floor((endTime - Date.now()) / 1000);
            
            if (sisaWaktuDetik <= 0) {
                await sesAlert("Waktu Habis", "Waktu ujian Anda sudah habis.", "fas fa-stopwatch", "#ef4444");
                finishExam();
                return;
            }
            
            mulaiTimer(sisaWaktuDetik);
            jalankanAntiCheat(); 
            
            try { 
                let p = document.documentElement.requestFullscreen();
                if (p !== undefined) p.catch(e => console.log("Fullscreen dicegah"));
            } catch(e) {}
            
            render();
            tampilkanToast("Sesi dipulihkan. Melanjutkan ujian...", "success");

        } else {
            // JIKA UJIAN BARU PERTAMA KALI DIBUKA
            // Tambahkan .orderBy("nomor") agar semua data ditarik secara urut dan lengkap
            const snapshot = await db.collection("bank_soal")
                                     .where("paket", "==", paket)
                                     .where("mapel", "==", mapel)
                                     .orderBy("nomor", "asc")
                                     .get({ source: 'server' }); // Memaksa ambil dari server, bukan cache lokal

            if (snapshot.empty) {
                await sesAlert("Bank Soal Kosong", `Soal untuk ${mapel} pada ${paket} belum dibuat oleh Admin.`, "fas fa-folder-open", "#f59e0b");
                window.location.href = "siswa.html";
                return;
            }

            questions = [];
            snapshot.forEach(doc => { questions.push({ id: doc.id, ...doc.data() }); });
            
            questions.sort((a, b) => a.nomor - b.nomor); // Mengurutkan secara paten berdasarkan nomor soal

            responses = questions.map(q => q.type === "tf" ? new Array(q.statements.length).fill(null) : (q.type === "multi" ? [] : null));
            flags = new Array(questions.length).fill(false);
            
            // Tentukan target waktu selesai (90 menit dari sekarang)
            endTime = Date.now() + (90 * 60 * 1000); 
            
            simpanStateUjian(); // Simpan kondisi awal ke memori

            examStarted = true;
            mulaiTimer(90 * 60); 
            jalankanAntiCheat(); 
            
            try { 
                let p = document.documentElement.requestFullscreen();
                if (p !== undefined) p.catch(e => console.log("Fullscreen dicegah"));
            } catch(e) {}

            render();
        }

    } catch (error) {
        console.error("Gagal memuat soal:", error);
        sesAlert("Koneksi Gagal", "Gagal terhubung ke server soal. Periksa koneksi internet Anda.", "fas fa-wifi", "#ef4444");
    }
}

let cheatCount = 0;
const MAX_CHEAT = 3;

function jalankanAntiCheat() {
    // Hanya menggunakan visibilitychange agar tidak terjadi duplikasi pemicu (double trigger)
    document.addEventListener("visibilitychange", () => {
        if (document.hidden && examStarted && !submitted) {
            tindakKecurangan();
        }
    });
}

async function tindakKecurangan() {
    cheatCount++;

    if (cheatCount >= MAX_CHEAT) {
        await sesAlert(
            "PENGAMBILAN JAWABAN OTOMATIS", 
            `Sistem mendeteksi aktivitas mencurigakan dan perpindahan layar sebanyak <b>${cheatCount} kali</b>.<br><br>Sesuai protokol keamanan ujian, sesi Anda dihentikan secara permanen dan seluruh jawaban dikumpulkan secara otomatis ke server.`, 
            "fas fa-shield-alt", 
            "#dc2626" // Merah Eksklusif
        );
        finishExam();
    } else {
        await sesAlert(
            "PERINGATAN KEAMANAN UJIAN", 
            `Anda terdeteksi meninggalkan halaman ujian (berpindah tab/aplikasi). Tindakan ini dilarang keras.<br><br><span style="color: #d97706; font-weight: 800;">Peringatan ke-${cheatCount} dari ${MAX_CHEAT}. Ujian akan otomatis dikumpulkan jika mencapai batas maksimal.</span>`, 
            "fas fa-exclamation-triangle", 
            "#d97706" // Kuning Emas Elegan
        );
    }
}

let timerInterval;

function mulaiTimer(detikAwal) {
    timerInterval = setInterval(async () => {
        // Kalkulasi waktu absolut agar tidak meleset saat lag
        let waktuTersisa = Math.floor((endTime - Date.now()) / 1000);
        
        if(waktuTersisa <= 0) {
            clearInterval(timerInterval);
            await sesAlert("Waktu Habis", "Waktu pengerjaan telah habis! Jawaban Anda dikumpulkan secara otomatis.", "fas fa-stopwatch", "#ef4444");
            finishExam();
            return;
        }
        
        const m = Math.floor(waktuTersisa / 60);
        const s = waktuTersisa % 60;
        $("countdownTimer").textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        if(waktuTersisa < 300) $("countdownTimer").style.color = "red";
    }, 1000);
}

// ==========================================
// RENDER UI SOAL (KIRI KANAN)
// ==========================================
function render() {
    if (questions.length === 0) return;
    const q = questions[current];
    
    const qNum = $("qNumber");
    if (qNum) qNum.textContent = `Soal nomor ${current + 1}`;
    
    const infoTitle = document.getElementById("infoModalTitle");
    const infoText = document.getElementById("infoModalText");
    if (infoTitle && infoText) {
        if (q.type === "pg") {
            infoTitle.textContent = "Informasi: Pilihan Ganda (PG)";
            infoText.innerHTML = "Pilih salah satu jawaban yang dianggap <b>paling benar</b> dengan mengklik bulatan pada opsi jawaban yang tersedia.";
        } else if (q.type === "multi") {
            infoTitle.textContent = "Informasi: Pilihan Ganda Kompleks (PGK)";
            infoText.innerHTML = "Soal ini memiliki <b>lebih dari satu jawaban benar</b>. Anda dapat memilih beberapa jawaban sekaligus dengan mencentang kotak yang tersedia.";
        } else if (q.type === "tf") {
            infoTitle.textContent = "Informasi: Soal Tabel Kesesuaian";
            infoText.innerHTML = "Tentukan kesesuaian setiap pernyataan pada tabel dengan mengklik bulatan pada kolom jawaban yang tersedia (misal: <b>Benar/Salah</b> atau <b>Sesuai/Tidak Sesuai</b>).";
        }
    }
    
    const qText = $("questionText");
    if (qText) qText.innerHTML = (q.text || "").replace(/\n/g, "<br>");
    
    const imgEl = $("questionImage");
    if (imgEl) {
        if (q.image) { imgEl.src = q.image; imgEl.style.display = "block"; } 
        else { imgEl.style.display = "none"; }
    }

    const progText = $("progressText");
    if(progText) progText.textContent = `Terjawab: ${questions.filter((_, i) => isAnswered(i)).length} / ${questions.length}`;
    
    const progBar = $("progressBar");
    if(progBar) progBar.style.width = ((current + 1) / questions.length * 100) + "%";
    
    const pill = $("pillTipeSoal");
    if(pill) pill.innerHTML = `<i class="fas fa-check-circle"></i> ${q.type}`;

    const btnPrev = $("prevBtn");
    if (btnPrev) btnPrev.style.visibility = current === 0 ? "hidden" : "visible"; 
    
    const btnNext = $("nextBtn");
    const btnFinish = $("finishBtn");
    if (btnNext && btnFinish) {
        if (current === questions.length - 1) {
            btnNext.style.display = "none";
            btnFinish.style.display = "inline-flex";
        } else {
            btnNext.style.display = "inline-flex";
            btnFinish.style.display = "none";
        }
    }
    
    const btnFlag = $("flagBtn");
    if (btnFlag) {
        const chk = document.getElementById("chkRagu");
        if (flags[current]) {
            btnFlag.classList.add("active");
            if(chk) chk.checked = true;
        } else {
            btnFlag.classList.remove("active");
            if(chk) chk.checked = false;
        }
    }
    
    const area = $("answerArea"); 
    if (!area) return;
    area.innerHTML = "";
    
    if (q.type === "pg" || q.type === "multi") {
    const wrap = document.createElement("div"); 
    wrap.className = "anbk-opsi-list"; 

    if (q.type === "multi") {
        wrap.innerHTML = `<div style="font-size: 0.85rem; color: #b45309; background: #fffbeb; padding: 10px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f59e0b;"><i class="fas fa-info-circle"></i> Berilah tanda centang (✔) pada jawaban yang tepat. Jawaban dapat lebih dari satu.</div>`;
    }

    const maxOpsi = q.type === "multi" ? Math.min(q.options.length, 3) : q.options.length;

    for (let j = 0; j < maxOpsi; j++) {
        const opt = q.options[j];
        if (!opt || opt.trim() === "") continue;

        const label = document.createElement("label"); 
        label.className = "anbk-opsi-item";
        label.style.display = "flex";
        label.style.alignItems = "flex-start"; // 👇 Diubah agar menempel di atas (sejajar teks)
        label.style.gap = "12px";
        label.style.marginBottom = "15px";
        label.style.cursor = "pointer";

        const input = document.createElement("input"); 
        input.type = q.type === "pg" ? "radio" : "checkbox"; 
        input.name = "answer_" + current; 
        input.style.width = "20px";
        input.style.height = "20px";
        input.style.marginTop = "2px"; // 👇 Didorong sedikit agar lingkarannya pas dengan baris pertama teks
        input.style.accentColor = "var(--ses-blue)";

        if (q.type === "pg") {
            input.checked = responses[current] === j;
        } else {
            if (Array.isArray(responses[current])) input.checked = responses[current].includes(j);
        }

        input.addEventListener("change", () => {
            if (q.type === "pg") {
                responses[current] = j;
            } else {
                if (!Array.isArray(responses[current])) responses[current] = [];
                if (input.checked) {
                    if (!responses[current].includes(j)) responses[current].push(j);
                } else {
                    responses[current] = responses[current].filter(x => x !== j);
                }
            }
            simpanStateUjian(); 
            renderGrid(); 
        });

        const txt = document.createElement("span"); 
        txt.className = "anbk-opsi-text"; 
        txt.style.fontSize = "1rem";
        txt.style.color = "#333";
        txt.innerHTML = (opt || "").replace(/\n/g, "<br>"); 
        
        // 👇 KODE AJAIB UNTUK MENAMPILKAN GAMBAR OPSI PG & MCMA 👇
        if (q.optionsImg && q.optionsImg[j] && q.optionsImg[j] !== "") {
            txt.innerHTML += `<br><img src="${q.optionsImg[j]}" style="max-width: 100%; max-height: 280px; border-radius: 8px; margin-top: 10px; border: 1px solid #cbd5e1; box-shadow: 0 4px 10px rgba(0,0,0,0.1); display: block;">`;
        }

        if (q.type === "pg") {
            const letter = document.createElement("span"); 
            letter.style.fontWeight = "bold"; 
            letter.style.marginRight = "10px"; 
            letter.style.fontSize = "1.05rem";
            letter.textContent = letters[j] + ".";
            label.append(input, letter, txt);
        } else {
            label.append(input, txt);
        }

        wrap.append(label);
    }
    area.append(wrap);
}
    else if (q.type === "tf") {
        const table = document.createElement("table"); 
        table.className = "tf-table";
        
        let headerBenar = "Benar"; let headerSalah = "Salah";
        if (q.tfType === "tepat-tidak") { headerBenar = "Tepat"; headerSalah = "Tidak Tepat"; } 
        else if (q.tfType === "sesuai-tidak") { headerBenar = "Sesuai"; headerSalah = "Tidak Sesuai"; }

        table.innerHTML = `<thead><tr><th>Pernyataan</th><th style='width: 90px; text-align: center;'>${headerBenar}</th><th style='width: 90px; text-align: center;'>${headerSalah}</th></tr></thead>`;
        const tbody = document.createElement("tbody");
        
        if (!Array.isArray(responses[current])) responses[current] = new Array(q.statements.length).fill(null);

        q.statements.forEach((s, j) => {
            const tr = document.createElement("tr");
            const tdText = document.createElement("td"); 
            tdText.innerHTML = (s || "").replace(/\n/g, "<br>"); // 👈 Sulap enter jadi <br>
            tdText.style.lineHeight = "1.5";
            
            // 👇 RENDER GAMBAR PADA TABEL BENAR/SALAH JIKA ADA 👇
            if (q.statementsImg && q.statementsImg[j] && q.statementsImg[j] !== "") {
                tdText.innerHTML += `<br><img src="${q.statementsImg[j]}" style="max-height: 110px; border-radius: 8px; margin-top: 8px; border: 1px solid #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.05); display: block;">`;
            }
            
            tr.append(tdText);
            
            [true, false].forEach(val => {
                const cell = document.createElement("td"); 
                cell.className = "choice"; cell.style.textAlign = "center";
                
                const input = document.createElement("input"); 
                input.type = "radio"; input.name = `tf_${current}_${j}`; input.checked = responses[current][j] === val;
                
                input.addEventListener("change", () => { 
                    responses[current][j] = val; 
                    simpanStateUjian(); // 👈 Update memori
                    renderGrid(); 
                });
                cell.addEventListener("click", (e) => {
                    if(e.target.tagName !== "INPUT") { 
                        input.checked = true; responses[current][j] = val; 
                        simpanStateUjian(); // 👈 Update memori
                        renderGrid(); 
                    }
                });

                cell.append(input); tr.append(cell);
            });
            tbody.append(tr);
        });
        table.append(tbody);
        area.append(table);
    }
    
    renderGrid();
    if (window.MathJax) { MathJax.typesetPromise(); }
}

function renderGrid(){
    const grid = $("questionGrid"); 
    if(!grid) return; 
    grid.innerHTML = "";
    
    questions.forEach((q, i) => {
        const b = document.createElement("div"); 
        b.className = "anbk-no-box"; b.textContent = i + 1;
        
        if (isAnswered(i)) b.classList.add("answered");
        if (flags[i]) b.classList.add("flagged");
        if (i === current) b.style.boxShadow = "0 0 0 3px #93c5fd"; 
        
        b.addEventListener("click", () => { 
            current = i; 
            simpanStateUjian(); // 👈 Update memori
            render(); 
            window.scrollTo(0,0); 
            tutupDaftarSoal(); 
        });
        grid.append(b);
    });
    
    const terjawab = questions.filter((_, i) => isAnswered(i)).length;
    const info = $("answeredInfo");
    if(info) info.textContent = `${terjawab} dari ${questions.length} terjawab.`;
}

// ==========================================
// PENGATURAN TOMBOL NAVIGASI & MODAL
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    if ($("prevBtn")) {
        $("prevBtn").addEventListener("click", () => { if(current > 0){ current--; simpanStateUjian(); render(); window.scrollTo(0,0); } });
    }
    if ($("nextBtn")) {
        $("nextBtn").addEventListener("click", () => { if(current < questions.length - 1){ current++; simpanStateUjian(); render(); window.scrollTo(0,0); } });
    }
    if ($("flagBtn")) {
        $("flagBtn").addEventListener("click", () => { flags[current] = !flags[current]; simpanStateUjian(); render(); });
    }

    if ($("finishBtn")) $("finishBtn").addEventListener("click", askFinish);
    if ($("finishSideBtn")) $("finishSideBtn").addEventListener("click", askFinish);
    if ($("cancelFinish")) $("cancelFinish").addEventListener("click", () => $("confirmModal").classList.remove("show"));
    if ($("confirmFinish")) {
        $("confirmFinish").addEventListener("click", () => { 
            $("confirmModal").classList.remove("show"); 
            finishExam(); 
        });
    }
});

function askFinish(){
    const blank = questions.filter((_, i) => !isAnswered(i)).length;
    $("confirmText").textContent = blank > 0 
        ? `Masih ada ${blank} soal yang belum selesai dijawab. Yakin ingin mengumpulkan?` 
        : "Semua soal sudah dijawab. Apakah Anda yakin ingin menyelesaikan ujian?";
    $("confirmModal").classList.add("show");
}

function finishExam(){
    if(isSubmitting) return; 
    isSubmitting = true; 

    if(typeof timerInterval !== 'undefined') clearInterval(timerInterval); 
    submitted = true;
    
    // HAPUS MEMORI CACHE AGAR TIDAK BISA MELANJUTKAN UJIAN LAGI
    sessionStorage.removeItem(sessionStateKey);
    
    let points = 0; let fullPoints = 0;
    let jawabanSiswaMap = {};

    questions.forEach((q, i) => {
        const r = responses[i];
        jawabanSiswaMap[q.nomor] = r;

        if (q.type === "pg") {
            // PERBAIKAN: Hitung poin untuk soal Pilihan Ganda (PG)
            fullPoints++;
            if (r === q.answer) points++;
        }
        else if (q.type === "multi") {
            fullPoints++;
            if (Array.isArray(r)) {
                const a = [...r].sort((x, y) => x - y); 
                const b = [...q.answer].sort((x, y) => x - y);
                if (a.length === b.length && a.every((v, j) => v === b[j])) points++;
            }
        } 
        else if (q.type === "tf") {
            fullPoints += q.statements.length; 
            if (Array.isArray(r)) { 
                q.answer.forEach((v, j) => { if (r[j] === v) points++; }); 
            }
        }
    });
 
    const score = fullPoints > 0 ? Math.round((points / fullPoints) * 100) : 0;
    const passed = score >= 75; 
 
    const scoreValEl = $("scoreValue");
    const statusValEl = $("statusValue");
    const pesanEl = $("pesanHasilUjian");

    if (scoreValEl) scoreValEl.textContent = score;
    if (statusValEl) {
        statusValEl.textContent = passed ? "LULUS" : "BELUM LULUS";
        statusValEl.style.background = passed ? "#dcfce7" : "#fee2e2";
        statusValEl.style.color = passed ? "#166534" : "#b91c1c";
    }
    
    if (pesanEl) {
        if (score === 100) pesanEl.innerHTML = "🏆 <b>Luar Biasa! Nilai Anda Sempurna!</b> Penguasaan materi Anda sangat mantap!";
        else if (score >= 85) pesanEl.innerHTML = "🌟 <b>Hebat Sekali!</b> Hasil ujian Anda sangat memuaskan. Sedikit lagi menuju sempurna!";
        else if (score >= 75) pesanEl.innerHTML = "✅ <b>Kerja Bagus!</b> Anda berhasil melampaui batas standar kelulusan.";
        else pesanEl.innerHTML = "💪 <b>Tetap Semangat!</b> Nilai Anda masih di bawah target kelulusan. Jadikan ini evaluasi.";
    }
 
    // 👇 PROSES SIMPAN KE FIREBASE YANG TELAH DISEMPURNAKAN 👇
    if (dataSiswaLogin && dataSiswaLogin.id) {
        let mapel = localStorage.getItem("ses_ujian_aktif_mapel"); 
        let paket = localStorage.getItem("ses_ujian_aktif_paket"); 
        
        // Ambil data segar langsung dari Firebase agar tidak ada tumpang tindih state lokal
        db.collection("users_tryout").doc(dataSiswaLogin.id).get().then(doc => {
            if (!doc.exists) return;
            let d = doc.data();
            let updateData = {};
            
            /// 1. Simpan skor terbaik/terbaru agar tidak tertimpa angka 0 jika ujian tidak sengaja tertutup
            let skorSebelumnya = Number(d[`skor_${mapel}`]) || 0;
            updateData[`skor_${mapel}`] = score > 0 ? score : skorSebelumnya;
            updateData[`jawaban_${mapel}`] = jawabanSiswaMap;
            
            // 2. Tarik riwayat nilai lama (Sistem Lama)
            let riwayatLama = d[`riwayat_skor_${mapel}`] || [];
            riwayatLama.push(score); 
            updateData[`riwayat_skor_${mapel}`] = riwayatLama;
            
            // 3. FITUR BARU: SIMPAN RIWAYAT LENGKAP BANYAK PAKET
            let riwayatLengkap = d.riwayat_lengkap || [];
            riwayatLengkap.push({
                paket: paket,
                mapel: mapel,
                skor: score,
                jawaban: jawabanSiswaMap,
                waktu: new Date().getTime() // Sebagai timestamp unik per pengerjaan
            });
            updateData.riwayat_lengkap = riwayatLengkap;
            
            // 4. Catat Paket ke daftar selesai
            let paketSelesai = d.paketSelesai || [];
            if (!paketSelesai.includes(paket)) {
                paketSelesai.push(paket);
            }
            updateData.paketSelesai = paketSelesai;
            updateData.paketAktif = ""; 
            
            updateData.waktuSelesai = firebase.firestore.FieldValue.serverTimestamp();

            // LAKUKAN UPDATE KE FIREBASE
            db.collection("users_tryout").doc(dataSiswaLogin.id).update(updateData)
            .then(() => {
                // Hapus memori pengerjaan di browser
                localStorage.removeItem("ses_ujian_aktif_paket");
                localStorage.removeItem("ses_ujian_aktif_mapel");
                isSubmitting = false; 
            })
            .catch(err => {
                console.error("Gagal menyimpan nilai:", err);
                isSubmitting = false; 
            });
        }).catch(err => {
            console.error("Gagal mengambil data untuk update:", err);
            isSubmitting = false;
        });
    }
 
    if ($("examLayout")) $("examLayout").style.display = "none"; 
    if ($("result")) $("result").classList.add("show"); 
    window.scrollTo({top:0, behavior:"smooth"});
}

function bukaPembahasanLengkap() {
    const wadah = $("isiPembahasanLengkap");
    if (!wadah) return;
    
    wadah.innerHTML = "";
    let questionsSorted = [...questions].sort((a,b) => a.nomor - b.nomor);
    
    // 🎯 PERBAIKAN UTAMA: Tarik jawaban langsung dari sesi ujian yang barusan dikerjakan
    // bukan dari localStorage yang sudah dikosongkan saat submit
    let jawabanSiswaMap = {};
    questions.forEach((q, i) => {
        jawabanSiswaMap[q.nomor] = responses[i];
    });

    questionsSorted.forEach((q, i) => {
        const r = jawabanSiswaMap[q.nomor]; 
        let isBenar = false;
        let teksJawabanSiswa = "<i>Kosong / Tidak Dijawab</i>";
        let teksKunciJawaban = "";

        if (q.type === "pg") {
            isBenar = r === q.answer;
            let imgSiswa = (q.optionsImg && r !== null && q.optionsImg[r]) ? `<br><img src="${q.optionsImg[r]}" style="max-height:80px; margin-top:8px; border-radius:6px; border: 1px solid #cbd5e1;">` : "";
            let imgKunci = (q.optionsImg && q.optionsImg[q.answer]) ? `<br><img src="${q.optionsImg[q.answer]}" style="max-height:80px; margin-top:8px; border-radius:6px; border: 1px solid #cbd5e1;">` : "";
            
            if (r !== null && r !== undefined) teksJawabanSiswa = `<b>${letters[r]}.</b> ${(q.options[r] || "").replace(/\n/g, "<br>")} ${imgSiswa}`;
            teksKunciJawaban = `<b>${letters[q.answer]}.</b> ${(q.options[q.answer] || "").replace(/\n/g, "<br>")} ${imgKunci}`;
        } 
        else if (q.type === "multi") {
            const a = Array.isArray(r) ? [...r].sort() : []; 
            const b = [...q.answer].slice(0, 3).sort((x, y) => x - y);

            isBenar = a.length === b.length && a.every((v, j) => v === b[j]);
            if (a.length > 0) {
                teksJawabanSiswa = a.map(idx => {
                    let img = (q.optionsImg && q.optionsImg[idx]) ? `<br><img src="${q.optionsImg[idx]}" style="max-height:60px; margin-top:5px; border-radius:4px; border: 1px solid #cbd5e1;">` : "";
                    return `<b>Pilihan ke-${idx + 1}</b>${img}`;
                }).join("<br>");
            }
            teksKunciJawaban = b.map(idx => {
                let img = (q.optionsImg && q.optionsImg[idx]) ? `<br><img src="${q.optionsImg[idx]}" style="max-height:60px; margin-top:5px; border-radius:4px; border: 1px solid #cbd5e1;">` : "";
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
                
                let imgTf = (q.statementsImg && q.statementsImg[idx]) ? `<br><img src="${q.statementsImg[idx]}" style="max-height:60px; margin-top:5px; border-radius:4px; border: 1px solid #cbd5e1;">` : "";
                
                let bgKunci = q.answer[idx] ? "#d1fae5" : "#fee2e2";
                let colorKunci = q.answer[idx] ? "#059669" : "#dc2626";
                let badgeKunci = `<span style="background-color: ${bgKunci}; color: ${colorKunci}; padding: 4px 12px; border-radius: 15px; font-size: 0.75rem; font-weight: bold; letter-spacing: 0.5px;">${jwbKunci.toUpperCase()}</span>`;

                let bgSiswa = "#f1f5f9"; let colorSiswa = "#475569";
                if (jwbSiswa === labelBenar) { bgSiswa = "#d1fae5"; colorSiswa = "#059669"; }
                else if (jwbSiswa === labelSalah) { bgSiswa = "#fee2e2"; colorSiswa = "#dc2626"; }
                let badgeSiswa = `<span style="background-color: ${bgSiswa}; color: ${colorSiswa}; padding: 4px 12px; border-radius: 15px; font-size: 0.75rem; font-weight: bold; letter-spacing: 0.5px;">${jwbSiswa.toUpperCase()}</span>`;

                let barisStyle = "border-bottom: 1px solid #f1f5f9;";
                let selStyle = "padding: 12px 10px; vertical-align: middle;";

                tempSiswa.push(`
                    <tr style="${barisStyle}">
                        <td style="${selStyle} width: 40px; text-align: center;">${idx + 1}</td>
                        <td style="${selStyle}">${stmt} ${imgTf}</td>
                        <td style="${selStyle} text-align: center; width: 120px;">${badgeSiswa}</td>
                    </tr>
                `);

                tempKunci.push(`
                    <tr style="${barisStyle}">
                        <td style="${selStyle} width: 40px; text-align: center;">${idx + 1}</td>
                        <td style="${selStyle}">${stmt} ${imgTf}</td>
                        <td style="${selStyle} text-align: center; width: 120px;">${badgeKunci}</td>
                    </tr>
                `);
                
                if (jwbSiswa !== jwbKunci) cekSemuaBenar = false;
            });
            isBenar = cekSemuaBenar;

            let tableHeader = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.95rem; color: #333;">
                    <thead>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <th style="padding: 10px; text-align: center; color: #475569; font-weight: bold;">No.</th>
                            <th style="padding: 10px; text-align: left; color: #475569; font-weight: bold;">Pernyataan</th>
                            <th style="padding: 10px; text-align: center; color: #475569; font-weight: bold;">Jawaban</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            let tableFooter = `</tbody></table>`;

            teksJawabanSiswa = `
                <div style="font-weight: bold; color: #475569; font-size: 1rem;"><i class="fas fa-clipboard-list"></i> Rekapitulasi Jawaban Anda</div>
                ${tableHeader}${tempSiswa.join("")}${tableFooter}
            `;
            
            teksKunciJawaban = `
                <div style="font-weight: bold; color: #333; font-size: 1rem;">🏆 Rekapitulasi Kunci Jawaban</div>
                ${tableHeader}${tempKunci.join("")}${tableFooter}
            `;
        }

        let badgeStatus = isBenar 
            ? `<span style="background: #10b981; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 800; box-shadow: 0 4px 10px rgba(16,185,129,0.3);"><i class="fas fa-check-circle"></i> BENAR</span>`
            : `<span style="background: #ef4444; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 800; box-shadow: 0 4px 10px rgba(239,68,68,0.3);"><i class="fas fa-times-circle"></i> SALAH</span>`;
        
        if(r === null || r === undefined || (Array.isArray(r) && r.length === 0) || (Array.isArray(r) && r.every(v=> v===null))) {
            badgeStatus = `<span style="background: #94a3b8; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 800;"><i class="fas fa-minus-circle"></i> KOSONG</span>`;
        }

        let htmlCard = `
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px dashed #e2e8f0; padding-bottom: 15px;">
                    <strong style="color: #0058c6; font-size: 1.15rem;"><i class="fas fa-file-alt"></i> Soal No. ${q.nomor}</strong>
                    ${badgeStatus}
                </div>
                
                <div style="color: #333; margin-bottom: 15px; font-size: 1rem; line-height: 1.6;">${(q.text || "").replace(/\n/g, "<br>")}</div>
                ${q.image ? `<img src="${q.image}" style="max-width: 100%; border-radius: 8px; margin-bottom: 20px; border: 1px solid #cbd5e1;">` : ""}
                
                <div style="background: #f8fafc; padding: 12px 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 5px;">
                    <span style="font-size: 0.85rem; color: #64748b; font-weight: 700;">Jawaban Siswa:</span>
                    <div style="color: #333; font-size: 0.95rem; margin-top: 5px;">${teksJawabanSiswa}</div>
                </div>

                <button onclick="let div = this.nextElementSibling; if(div.style.display==='none'){div.style.display='block'; this.innerHTML='<i class=\\'fas fa-chevron-up\\'></i> Tutup Kunci & Pembahasan'; this.style.background='#64748b';}else{div.style.display='none'; this.innerHTML='<i class=\\'fas fa-search-plus\\'></i> Lihat Kunci & Pembahasan Lengkap'; this.style.background='linear-gradient(135deg, var(--ses-blue) 0%, #1d4ed8 100%)';}" style="width: 100%; background: linear-gradient(135deg, var(--ses-blue) 0%, #1d4ed8 100%); border: none; padding: 14px 20px; border-radius: 12px; color: white; font-weight: 800; cursor: pointer; transition: all 0.3s ease; margin-top: 15px; font-size: 0.95rem; box-shadow: 0 4px 15px rgba(0, 88, 198, 0.25); display: flex; align-items: center; justify-content: center; gap: 8px;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 88, 198, 0.35)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 15px rgba(0, 88, 198, 0.25)';">
                    <i class="fas fa-search-plus"></i> Lihat Kunci & Pembahasan Lengkap
                </button>
                
                <div style="display: none; margin-top: 15px; animation: fadeIn 0.3s ease;">
                    <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; border-top: 1px solid #fef3c7; border-right: 1px solid #fef3c7; border-bottom: 1px solid #fef3c7; margin-bottom: 15px;">
                        <p style="margin: 0 0 8px; font-size: 0.85rem; color: #b45309; font-weight: 700;">KUNCI JAWABAN BENAR:</p>
                        <div style="margin: 0; color: #333; font-size: 0.95rem;">${teksKunciJawaban}</div>
                    </div>
                    
                    <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; border: 1px dashed #86efac;">
                        <p style="margin: 0 0 15px; font-size: 0.95rem; color: #166534; font-weight: 800; border-bottom: 1px solid #bbf7d0; padding-bottom: 10px;">
                            <i class="fas fa-lightbulb" style="color: #f59e0b; margin-right: 5px;"></i> PENJELASAN / PEMBAHASAN:
                        </p>
                        <div style="margin: 0; color: #1e293b; font-size: 1rem; line-height: 1.9; white-space: pre-line; letter-spacing: 0.2px;">${q.pembahasan || '<i style="color:#94a3b8;">Admin belum memasukkan teks penjelasan khusus untuk soal ini.</i>'}</div>
                    </div>
                </div>

            </div>
        `;
        wadah.innerHTML += htmlCard;
    });
    
    const modal = document.getElementById("modalPembahasan");
    if (modal) modal.classList.add("show");
    if (window.MathJax) { MathJax.typesetPromise(); }
}
// ==========================================
// FUNGSI ADMIN: FORMAT RATA TENGAH (CENTER)
// ==========================================
function formatCenterAdmin(idElemen) {
    const textarea = document.getElementById(idElemen);
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const teksYangDiblok = textarea.value.substring(start, end);
    
    const tagBuka = `<div style="text-align: center;">`;
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
// FUNGSI ADMIN: REKAPITULASI NILAI SISWA (LEADERBOARD PAKET)
// ==========================================
function muatRekapNilai() {
    const paketDipilih = document.getElementById('filterPaketRekap').value;
    const tbody = document.getElementById('tabelRekapNilai');
    const judul = document.getElementById('judulLaporanPaket');
    
    if (!paketDipilih || !tbody) return;
    
    judul.textContent = `PAKET: ${paketDipilih.toUpperCase()}`;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--ses-blue);"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i> Mengkalkulasi data seluruh peserta...</td></tr>';
    
    db.collection("users_tryout").get().then(snap => {
        let rekapPeserta = [];
        
        snap.forEach(doc => {
            const d = doc.data();
            let riwayat = d.riwayat_lengkap || [];
            let skorMapelTerkait = {};
            
            // Saring riwayat milik siswa ini HANYA untuk paket yang dipilih admin
            riwayat.forEach(item => {
                if (item.paket === paketDipilih && item.skor !== undefined && item.skor !== null) {
                    // Karena riwayat diurutkan berdasarkan waktu, ia otomatis menimpa jika ada percobaan berulang (ambil yang terbaru)
                    skorMapelTerkait[item.mapel] = Number(item.skor) || 0;
                }
            });
            
            let arrSkor = Object.values(skorMapelTerkait);
            
            // Jika siswa memiliki nilai di paket ini, masukkan ke daftar peringkat
            if (arrSkor.length > 0) {
                let total = arrSkor.reduce((a, b) => a + b, 0);
                let rataRata = Math.round(total / arrSkor.length);
                
                rekapPeserta.push({
                    nama: d.nama,
                    sekolah: d.sekolah || 'Peserta Mandiri',
                    rataRata: rataRata
                });
            }
        });
        
        // Urutkan Array (Peringkat tertinggi berada di atas)
        rekapPeserta.sort((a, b) => b.rataRata - a.rataRata);
        
        tbody.innerHTML = '';
        
        if (rekapPeserta.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted); font-weight: 600;"><i class="fas fa-folder-open" style="font-size: 2rem; color: #cbd5e1; display: block; margin-bottom: 10px;"></i> Belum ada peserta yang menyelesaikan dan mengumpulkan ujian pada paket ini.</td></tr>';
            return;
        }
        
        // Fungsi kecil pengubah angka jadi predikat (A/B/C/D)
        const getPredikat = (nilai) => {
            if (nilai >= 90) return "Sangat Baik (A)";
            if (nilai >= 80) return "Baik (B+)";
            if (nilai >= 75) return "Baik (B)";
            if (nilai >= 60) return "Cukup (C)";
            return "Kurang (D)";
        };
        
        // Render baris tabel
        rekapPeserta.forEach((p, idx) => {
            let rank = idx + 1;
            let medaliVisual = rank;
            
            if (rank === 1) medaliVisual = '<i class="fas fa-medal" style="color: #fbbf24; font-size: 1.3rem;"></i>';
            if (rank === 2) medaliVisual = '<i class="fas fa-medal" style="color: #94a3b8; font-size: 1.2rem;"></i>';
            if (rank === 3) medaliVisual = '<i class="fas fa-medal" style="color: #b45309; font-size: 1.1rem;"></i>';
            
            let badgePredikat = p.rataRata >= 75 
                ? `<span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.75rem; border: 1px solid #bbf7d0;">${getPredikat(p.rataRata)}</span>`
                : `<span style="background: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.75rem; border: 1px solid #fecaca;">${getPredikat(p.rataRata)}</span>`;
                
            tbody.innerHTML += `
                <tr style="transition: 0.3s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                    <td style="text-align: center; font-weight: 900; color: var(--ses-blue-dark); font-size: 1.1rem;">${medaliVisual}</td>
                    <td style="font-weight: 800; color: var(--ses-blue); text-transform: uppercase;">${p.nama}</td>
                    <td style="color: #475569; font-weight: 600;">${p.sekolah}</td>
                    <td style="text-align: center; font-weight: 900; font-size: 1.25rem; color: #10b981;">${p.rataRata}</td>
                    <td style="text-align: center;">${badgePredikat}</td>
                </tr>
            `;
        });
        
    }).catch(err => {
        console.error("Gagal menarik data rekap:", err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 30px; font-weight: bold;"><i class="fas fa-exclamation-triangle"></i> Gagal memuat data dari database.</td></tr>';
    });
}