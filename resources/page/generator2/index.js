console.log("Aplikasi Generator Sertifikat Dimuat");

// --- Inisialisasi pdf-lib (HARUS DI BAGIAN ATAS SCRIPT!) ---
// Baris ini mengambil fungsi PDFDocument, rgb, dan degrees dari library PDFLib
// Ini harus dieksekusi sebelum Anda menggunakan rgb() atau PDFDocument.
const { PDFDocument, rgb, degrees } = PDFLib; 


// --- KONFIGURASI PENTING ---
// GANTI DENGAN ID SPREADSHEET GOOGLE ANDA
// Contoh: '1ABCDEFG...XYZ'
const SPREADSHEET_ID = '136f-IvdJ5xZfOLRhtlahmOrPdvg73DtX2Eznjx80DXo'; 

// GANTI DENGAN GID (SHEET ID) DARI LEMBAR KERJA ANDA
// Untuk sheet pertama (biasanya "Sheet1"), GID-nya seringkali '0'.
const SHEET_GID = '0'; 

// URL LENGKAP untuk mengambil data JSON dari Google Sheet Anda
const SPREADSHEET_JSON_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;

// URL ke template PDF dan Font Anda (pastikan bisa diakses publik!)
// Jika file berada di folder yang sama dengan index.html, cukup nama filenya.
const CERTIFICATE_TEMPLATE_URL = "Certificate.pdf"; 
const CUSTOM_FONT_URL = "Sanchez-Regular.ttf"; 

// --- POSISI TEKS DI DALAM PDF ---
// Ini adalah koordinat X (horizontal dari kiri) dan Y (vertikal dari bawah) dalam point (pt)
// Anda perlu MENYESUAIKAN NILAI INI agar teks terletak di posisi yang tepat pada template PDF Anda.
// Gunakan alat ukur di editor PDF Anda untuk mendapatkan koordinat yang akurat.
// Ukuran halaman A4: 595pt (lebar) x 842pt (tinggi) dalam mode portrait
// Jika landscape (seperti sertifikat), maka: 842pt (lebar) x 595pt (tinggi)
// X = dari kiri, Y = dari bawah
const NAME_X_POS = 300; // Koordinat X untuk nama
const NAME_Y_POS = 270; // Koordinat Y untuk nama
const NAME_FONT_SIZE = 58; // Ukuran font untuk nama
const NAME_COLOR = rgb(0.2, 0.84, 0.67); // Warna RGB untuk nama

const CERT_NUM_X_POS = 100; // Koordinat X untuk Nomor Sertifikat
const CERT_NUM_Y_POS = 100; // Koordinat Y untuk Nomor Sertifikat
const CERT_NUM_FONT_SIZE = 12; // Ukuran font untuk Nomor Sertifikat
const CERT_NUM_COLOR = rgb(0, 0, 0); // Warna hitam untuk Nomor Sertifikat

// --- Fungsi untuk menghasilkan PDF ---
// Menerima nama peserta dan nomor sertifikat sebagai argumen
const generatePDF = async (name, certificateNumber) => {
    try {
        // Muat template PDF
        const existingPdfBytes = await fetch(CERTIFICATE_TEMPLATE_URL).then((res) => {
            if (!res.ok) {
                // Memberikan pesan error yang lebih spesifik jika template PDF gagal dimuat
                throw new Error(`Gagal memuat template PDF: ${res.status} ${res.statusText}. Pastikan nama file dan path benar.`);
            }
            return res.arrayBuffer();
        });

        // Muat font kustom
        const fontBytes = await fetch(CUSTOM_FONT_URL).then((res) => {
            if (!res.ok) {
                // Memberikan pesan error yang lebih spesifik jika font gagal dimuat
                throw new Error(`Gagal memuat font: ${res.status} ${res.statusText}. Pastikan nama file dan path benar.`);
            }
            return res.arrayBuffer();
        });

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        pdfDoc.registerFontkit(fontkit); // Daftarkan fontkit

        const SanChezFont = await pdfDoc.embedFont(fontBytes); // Embed font
        const pages = pdfDoc.getPages();
        const firstPage = pages[0]; // Ambil halaman pertama

        // Gambar teks NAMA pada halaman
        firstPage.drawText(name, {
            x: NAME_X_POS,
            y: NAME_Y_POS,
            size: NAME_FONT_SIZE,
            font: SanChezFont,
            color: NAME_COLOR,
            // Jika ingin teks terpusat pada X_POS, tambahkan: align: 'center',
            // Namun, koordinat X Anda (300) mungkin sudah diatur untuk posisi tertentu.
        });

        // Gambar teks NOMOR SERTIFIKAT pada halaman
        firstPage.drawText(`No. ${certificateNumber}`, {
            x: CERT_NUM_X_POS,
            y: CERT_NUM_Y_POS,
            size: CERT_NUM_FONT_SIZE,
            font: SanChezFont, // Bisa pakai font yang sama atau font lain
            color: CERT_NUM_COLOR,
        });

        // Simpan PDF dan unduh
        const pdfBytes = await pdfDoc.save();
        // Nama file akan menyertakan nama peserta dan nomor sertifikat
        // .replace(/[^a-zA-Z0-9_]/g, '') untuk membersihkan karakter ilegal dari nama file
        saveAs(new Blob([pdfBytes], { type: "application/pdf" }), `Sertifikat_${name.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_${certificateNumber.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert(`Gagal membuat sertifikat untuk ${name}. Periksa konsol browser untuk detail lebih lanjut. (${error.message})`);
    }
};

// --- Fungsi untuk memuat data dari Spreadsheet dan menampilkan tombol unduh ---
async function loadCertificateData() {
    const container = document.getElementById("certificate-list-container");
    container.innerHTML = "<p>Memuat data peserta dari spreadsheet...</p>";

    try {
        const response = await fetch(SPREADSHEET_JSON_URL);
        if (!response.ok) {
            // Jika respons tidak OK (misal 403 Forbidden, 404 Not Found)
            throw new Error(`Gagal memuat data spreadsheet: ${response.status} ${response.statusText}. Pastikan spreadsheet sudah dipublikasikan ke web.`);
        }
        const textData = await response.text();

        // Ekstrak JSON dari respons gviz/tq
        // Respons dari Google Sheets API (gviz/tq) dibungkus dalam fungsi JavaScript.
        // Kita perlu mengekstrak string JSON-nya.
        const jsonStart = textData.indexOf("(") + 1;
        const jsonEnd = textData.lastIndexOf(")");
        const jsonString = textData.substring(jsonStart, jsonEnd);
        const jsonData = JSON.parse(jsonString);

        if (!jsonData.table || !jsonData.table.rows || jsonData.table.rows.length === 0) {
            container.innerHTML = "<p>Tidak ada data peserta yang ditemukan di spreadsheet.</p>";
            return;
        }

        const entries = jsonData.table.rows;
        container.innerHTML = ""; // Bersihkan pesan loading

        entries.forEach((entry, index) => {
            // Asumsi urutan kolom di Google Sheet Anda:
            // Kolom A (indeks 0): Nama Lengkap
            // Kolom B (indeks 1): Tanggal Acara
            // Kolom C (indeks 2): Nama Acara
            // Kolom D (indeks 3): Nomor Sertifikat
            
            // Menggunakan String() untuk memastikan nilai adalah string sebelum digunakan,
            // mencegah 'TypeError: .replace is not a function' jika data berupa angka atau null/undefined
            const namaLengkap = entry.c[0] && entry.c[0].v !== null ? String(entry.c[0].v) : ''; 
            const tanggalAcara = entry.c[1] && entry.c[1].v !== null ? String(entry.c[1].v) : ''; 
            const namaAcara = entry.c[2] && entry.c[2].v !== null ? String(entry.c[2].v) : '';    
            const nomorSertifikat = entry.c[3] && entry.c[3].v !== null ? String(entry.c[3].v) : ''; 

            // Tampilkan nama dan tombol unduh di halaman web
            const itemHtml = `
                <div class="certificate-item">
                    <h3>${namaLengkap}</h3>
                    <p>Acara: ${namaAcara} | Tanggal: ${tanggalAcara} | No. ${nomorSertifikat}</p>
                    <button onclick="generatePDF('${namaLengkap.replace(/'/g, "\\'")}', '${nomorSertifikat.replace(/'/g, "\\'")}')">Unduh Sertifikat ${namaLengkap}</button>
                    <hr>
                </div>
            `;
            container.innerHTML += itemHtml;
        });

    } catch (error) {
        console.error("Error fetching or parsing data from Google Sheet:", error);
        // Menampilkan pesan error yang lebih detail di alert
        alert(`Terjadi kesalahan saat memuat data dari spreadsheet. Periksa konsol browser untuk detail. (${error.message})`);
        container.innerHTML = `<p>Terjadi kesalahan saat memuat sertifikat. Mohon periksa konsol browser (tekan F12) untuk detail lebih lanjut.</p>`;
    }
}

// Panggil fungsi utama untuk memuat data saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", loadCertificateData);
