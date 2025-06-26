console.log("Aplikasi Generator Sertifikat Dimuat");

// --- KONFIGURASI PENTING ---
// GANTI DENGAN ID SPREADSHEET GOOGLE ANDA
const SPREADSHEET_ID = '136f-IvdJ5xZfOLRhtlahmOrPdvg73DtX2Eznjx80DXo'; 

// GANTI DENGAN GID (SHEET ID) DARI LEMBAR KERJA ANDA
const SHEET_GID = '0'; 

// URL LENGKAP untuk mengambil data JSON dari Google Sheet Anda
const SPREADSHEET_JSON_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;

// URL ke template PDF dan Font Anda (pastikan bisa diakses publik!)
const CERTIFICATE_TEMPLATE_URL = "Sertifikat-Kombel.pdf"; // Pastikan nama file ini benar
const CUSTOM_FONT_URL = "Sanchez-Regular.ttf"; // Pastikan nama file ini benar

// --- POSISI TEKS NAMA DI DALAM PDF ---
// Ini adalah koordinat X (horizontal dari kiri) dan Y (vertikal dari bawah) dalam point (pt)
// Anda perlu MENYESUAIKAN NILAI INI agar nama terletak di posisi yang tepat pada template PDF Anda.
// Nilai-nilai ini sama dengan yang Anda gunakan, tapi saya tambahkan komentar panduan.
const NAME_X_POS = 300; // Koordinat X untuk nama
const NAME_Y_POS = 270; // Koordinat Y untuk nama
const NAME_FONT_SIZE = 58; // Ukuran font untuk nama
const NAME_COLOR = rgb(0.2, 0.84, 0.67); // Warna RGB untuk nama

// --- Inisialisasi pdf-lib ---
const { PDFDocument, rgb, degrees } = PDFLib;

// --- Fungsi untuk menghasilkan PDF ---
const generatePDF = async (name) => {
    try {
        // Muat template PDF
        const existingPdfBytes = await fetch(CERTIFICATE_TEMPLATE_URL).then((res) =>
            res.arrayBuffer()
        );

        // Muat font kustom
        const fontBytes = await fetch(CUSTOM_FONT_URL).then((res) =>
            res.arrayBuffer()
        );

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        pdfDoc.registerFontkit(fontkit); // Daftarkan fontkit

        const SanChezFont = await pdfDoc.embedFont(fontBytes); // Embed font
        const pages = pdfDoc.getPages();
        const firstPage = pages[0]; // Ambil halaman pertama

        // Gambar teks nama pada halaman
        firstPage.drawText(name, {
            x: NAME_X_POS,
            y: NAME_Y_POS,
            size: NAME_FONT_SIZE,
            font: SanChezFont,
            color: NAME_COLOR,
            // Anda bisa tambahkan align: 'center' jika Anda ingin teks terpusat pada X_POS
            // Tapi karena Anda sudah punya X=300, kemungkinan itu sudah diatur secara manual.
            // Jika ingin, tambahkan ini dan sesuaikan X_POS: align: 'center',
        });

        // Simpan PDF dan unduh
        const pdfBytes = await pdfDoc.save();
        saveAs(new Blob([pdfBytes], { type: "application/pdf" }), `Sertifikat_${name.replace(/\s/g, '_')}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert(`Gagal membuat sertifikat untuk ${name}. Pastikan file template PDF dan font sudah diupload dan URL-nya benar.`);
    }
};

// --- Fungsi untuk memuat data dari Spreadsheet dan menampilkan tombol unduh ---
async function loadCertificateData() {
    const container = document.getElementById("certificate-list-container");
    container.innerHTML = "<p>Memuat data peserta dari spreadsheet...</p>";

    try {
        const response = await fetch(SPREADSHEET_JSON_URL);
        const textData = await response.text();

        // Ekstrak JSON dari respons gviz/tq
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
            // Asumsi urutan kolom di Google Sheet:
            // Kolom A (indeks 0): Nama Lengkap
            // Kolom B (indeks 1): Tanggal Acara (untuk internal/display)
            // Kolom C (indeks 2): Nama Acara (untuk internal/display)
            const namaLengkap = entry.c[0] ? entry.c[0].v : '';
            const tanggalAcara = entry.c[1] ? entry.c[1].v : '';
            const namaAcara = entry.c[2] ? entry.c[2].v : '';

            // Tampilkan nama dan tombol unduh
            const itemHtml = `
                <div class="certificate-item">
                    <h3>${namaLengkap}</h3>
                    <p>Acara: ${namaAcara} | Tanggal: ${tanggalAcara}</p>
                    <button onclick="generatePDF('${namaLengkap.replace(/'/g, "\\'")}')">Unduh Sertifikat untuk ${namaLengkap}</button>
                    <hr>
                </div>
            `;
            container.innerHTML += itemHtml;
        });

    } catch (error) {
        console.error("Error fetching or parsing data from Google Sheet:", error);
        container.innerHTML = "<p>Terjadi kesalahan saat memuat data dari spreadsheet. Pastikan URL Spreadsheet dan GID sudah benar, dan spreadsheet sudah dipublikasikan ke web.</p>";
    }
}

// Panggil fungsi utama untuk memuat data saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", loadCertificateData);