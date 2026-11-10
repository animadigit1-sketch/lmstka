// ==========================================
// FILE: ses-ui.js
// FUNGSI: Mengganti default alert() & confirm() browser
// ==========================================

// 1. FUNGSI KONFIRMASI (Pengganti confirm)
window.sesConfirm = function(title, message, iconClass = "fas fa-question-circle", color = "var(--ses-gold)") {
    return new Promise((resolve) => {
        const backdrop = document.createElement("div");
        backdrop.className = "ses-modal-backdrop";
        
        const modal = document.createElement("div");
        modal.className = "ses-modal-box";
        modal.style.borderTopColor = color; // Dinamis sesuai warna icon
        
        modal.innerHTML = `
            <i class="${iconClass}" style="font-size: 3.5rem; color: ${color}; margin-bottom: 15px;"></i>
            <h3>${title}</h3>
            <p>${message}</p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button class="btn btn-outline" id="btnBatal" style="flex: 1;">Batal</button>
                <button class="btn btn-primary" id="btnOke" style="flex: 1; background: ${color}; border-color: ${color}; box-shadow: 0 5px 15px ${color}40;">Oke, Lanjutkan</button>
            </div>
        `;
        
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
        
        // Memicu animasi muncul
        setTimeout(() => backdrop.classList.add("show"), 10);

        const close = (result) => {
            backdrop.classList.remove("show");
            setTimeout(() => backdrop.remove(), 300); // Hapus elemen dari HTML setelah animasi selesai
            resolve(result);
        };

        modal.querySelector("#btnBatal").onclick = () => close(false);
        modal.querySelector("#btnOke").onclick = () => close(true);
    });
}

// 2. FUNGSI PERINGATAN (Pengganti alert)
window.sesAlert = function(title, message, iconClass = "fas fa-info-circle", color = "var(--ses-blue)") {
    return new Promise((resolve) => {
        const backdrop = document.createElement("div");
        backdrop.className = "ses-modal-backdrop";
        
        const modal = document.createElement("div");
        modal.className = "ses-modal-box";
        modal.style.borderTopColor = color;
        
        modal.innerHTML = `
            <i class="${iconClass}" style="font-size: 3.5rem; color: ${color}; margin-bottom: 15px;"></i>
            <h3>${title}</h3>
            <p>${message}</p>
            <div style="display: flex; justify-content: center;">
                <button class="btn btn-primary" id="btnOke" style="width: 100%; background: ${color}; border-color: ${color}; box-shadow: 0 5px 15px ${color}40;">Mengerti</button>
            </div>
        `;
        
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
        
        setTimeout(() => backdrop.classList.add("show"), 10);

        const close = () => {
            backdrop.classList.remove("show");
            setTimeout(() => backdrop.remove(), 300);
            resolve(true);
        };

        modal.querySelector("#btnOke").onclick = () => close();
    });
}
// 3. FUNGSI TOAST (Notifikasi Melayang)
window.tampilkanToast = function(pesan, tipe = "success") {
    let toast = document.getElementById("toast");
    
    // Jika div toast belum ada di HTML, buat otomatis
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }
    
    // Set pesan dan warna
    toast.textContent = pesan;
    toast.style.background = (tipe === "error") ? "#ef4444" : "#10b981";
    
    // Munculkan toast
    toast.classList.add("show");
    
    // Hilangkan setelah 3 detik
    setTimeout(() => { 
        toast.classList.remove("show"); 
    }, 3000);
};