// maindatan

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. AMBIL ELEMEN HTML YANG DIBUTUHKAN UNTUK LOGIN ---
    const loginFormDiv = document.getElementById('login-form');
    const memberIdInput = document.getElementById('member-id-input');
    const accessCodeInput = document.getElementById('access-code-input');
    const submitAccessCodeBtn = document.getElementById('submit-access-code');
    const loginErrorP = document.getElementById('login-error');
    const appContentMain = document.getElementById('app-content');
    const credentialsUrl = 'https://schoolsmaya.github.io/manajemen-js-css/resources/member/json/credentials.json'; 

let MEMBER_CREDENTIALS = {}; // Akan diisi dari JSON

// Ambil kredensial saat halaman dimuat
fetch(credentialsUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Gagal memuat kredensial: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        MEMBER_CREDENTIALS = data;
        // Sekarang, lanjutkan dengan logika login
        // ... (Kode untuk submitAccessCodeBtn.addEventListener() ada di sini) ...
    })
    .catch(error => {
        console.error("Error loading credentials:", error);
        loginErrorP.textContent = "Gagal memuat data kredensial. Silakan coba lagi nanti.";
        loginErrorP.style.display = 'block';
        submitAccessCodeBtn.disabled = true; // Nonaktifkan tombol login
    });

pASANG DISINI

        // --- 2. LOGIKA PENANGANAN LOGIN ---

    // Awalnya, sembunyikan aplikasi utama dan tampilkan formulir login
    appContentMain.style.display = 'none';
    loginFormDiv.style.display = 'block';
    loginErrorP.style.display = 'none'; // Sembunyikan pesan error awal

    // Tambahkan event listener untuk tombol 'Masuk'
    submitAccessCodeBtn.addEventListener('click', () => {
        const enteredMemberId = memberIdInput.value.trim(); // Ambil nomor anggota dan hapus spasi
        const enteredAccessCode = accessCodeInput.value.trim(); // Ambil sandi dan hapus spasi

        // Cek apakah nomor anggota dan sandi cocok dengan yang ada di daftar
        if (MEMBER_CREDENTIALS[enteredMemberId] === enteredAccessCode) {
            // Jika cocok:
            loginFormDiv.style.display = 'none'; // Sembunyikan formulir login
            appContentMain.style.display = 'block'; // Tampilkan aplikasi utama
            loginErrorP.style.display = 'none'; // Sembunyikan pesan error
            initializeApp(); // Panggil fungsi untuk menjalankan aplikasi
        } else {
            // Jika tidak cocok:
            loginErrorP.textContent = "Nomor anggota atau kode akses salah. Silakan coba lagi.";
            loginErrorP.style.display = 'block'; // Tampilkan pesan error
        }
    });
});

