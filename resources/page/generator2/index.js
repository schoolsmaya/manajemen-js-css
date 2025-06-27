console.log("Aplikasi Generator Sertifikat Dimuat");

// --- Inisialisasi pdf-lib (HARUS DI BAGIAN ATAS SCRIPT!) ---
// Tambahkan TextAlignment di sini untuk menggunakannya nanti
const { PDFDocument, rgb, degrees, TextAlignment } = PDFLib; 


// --- KONFIGURASI PENTING ---
// GANTI DENGAN ID SPREADSHEET GOOGLE ANDA
const SPREADSHEET_ID = '136f-IvdJ5xZfOLRhtlahmOrPdvg73DtX2Eznjx80DXo'; 

// GANTI DENGAN GID (SHEET ID) DARI LEMBAR KERJA ANDA
const SHEET_GID = '0'; 

// URL LENGKAP untuk mengambil data JSON dari Google Sheet Anda
const SPREADSHEET_JSON_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;

// URL ke template PDF dan Font Anda (pastikan bisa diakses publik!)
const CERTIFICATE_TEMPLATE_URL = "Certificate.pdf"; 
const CUSTOM_FONT_URL = "Sanchez-Regular.ttf"; 

// --- POSISI TEKS DI DALAM PDF ---
// Ini adalah koordinat X (horizontal dari kiri) dan Y (vertikal dari bawah) dalam point (pt)
// CATATAN PENTING: Karena kita menggunakan TextAlignment.Center,
// nilai X_POS ini akan menjadi TITIK TENGAH horizontal teks Anda.
// Anda perlu MENYESUAIKAN NILAI INI agar teks terletak di posisi yang tepat pada template PDF Anda.
// (Misal: untuk halaman landscape 842pt lebar, titik tengah adalah sekitar 421pt)
const NAME_X_POS = 421; // <--- SESUAIKAN: Contoh titik tengah horizontal untuk nama
const NAME_Y_POS = 270; // <--- SESUAIKAN: Koordinat Y untuk nama
const NAME_FONT_SIZE = 58; 
const NAME_COLOR = rgb(0.2, 0.84, 0.67); 

const CERT_NUM_X_POS = 421; // <--- SESUAIKAN: Contoh titik tengah horizontal untuk nomor sertifikat
const CERT_NUM_Y_POS = 50;  // <--- SESUAIKAN: Koordinat Y untuk nomor sertifikat
const CERT_NUM_FONT_SIZE = 14; 
const CERT_NUM_COLOR = rgb(0, 0, 0); 


// --- Fungsi untuk menghasilkan PDF ---
const generatePDF = async (name, certificateNumber) => {
    try {
        const existingPdfBytes = await fetch(CERTIFICATE_TEMPLATE_URL).then((res) => {
            if (!res.ok) {
                throw new Error(`Gagal memuat template PDF: ${res.status} ${res.statusText}. Pastikan nama file dan path benar.`);
            }
            return res.arrayBuffer();
        });

        const fontBytes = await fetch(CUSTOM_FONT_URL).then((res) => {
            if (!res.ok) {
                throw new Error(`Gagal memuat font: ${res.status} ${res.statusText}. Pastikan nama file dan path benar.`);
            }
            return res.arrayBuffer();
        });

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        pdfDoc.registerFontkit(fontkit); 

        const SanChezFont = await pdfDoc.embedFont(fontBytes); 
        const pages = pdfDoc.getPages();
        const firstPage = pages[0]; 

        // Gambar teks NAMA pada halaman - DISETEL UNTUK TENGAH
        firstPage.drawText(name, {
            x: NAME_X_POS,
            y: NAME_Y_POS,
            size: NAME_FONT_SIZE,
            font: SanChezFont,
            color: NAME_COLOR,
            align: TextAlignment.Center, // *** BARIS INI MENJADIKAN TEKS TENGAH ***
        });

        // Gambar teks NOMOR SERTIFIKAT PADA HALAMAN - DISETEL UNTUK TENGAH
        firstPage.drawText(`Nomor: ${certificateNumber}`, { 
            x: CERT_NUM_X_POS,
            y: CERT_NUM_Y_POS,
            size: CERT_NUM_FONT_SIZE,
            font: SanChezFont, 
            color: CERT_NUM_COLOR,
            align: TextAlignment.Center, // *** BARIS INI MENJADIKAN TEKS TENGAH ***
        });

        const pdfBytes = await pdfDoc.save();
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
            throw new Error(`Gagal memuat data spreadsheet: ${response.status} ${response.statusText}. Pastikan spreadsheet sudah dipublikasikan ke web.`);
        }
        const textData = await response.text();

        const jsonStart = textData.indexOf("(") + 1;
        const jsonEnd = textData.lastIndexOf(")");
        const jsonString = textData.substring(jsonStart, jsonEnd);
        const jsonData = JSON.parse(jsonString);

        if (!jsonData.table || !jsonData.table.rows || jsonData.table.rows.length === 0) {
            container.innerHTML = "<p>Tidak ada data peserta yang ditemukan di spreadsheet.</p>";
            return;
        }

        const entries = jsonData.table.rows;
        container.innerHTML = ""; 

        entries.forEach((entry, index) => {
            const namaLengkap = entry.c[0] && entry.c[0].v !== null ? String(entry.c[0].v) : ''; 
            const tanggalAcara = entry.c[1] && entry.c[1].v !== null ? String(entry.c[1].v) : ''; 
            const namaAcara = entry.c[2] && entry.c[2].v !== null ? String(entry.c[2].v) : '';    
            const nomorSertifikat = entry.c[3] && entry.c[3].v !== null ? String(entry.c[3].v) : ''; 

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
        alert(`Terjadi kesalahan saat memuat data dari spreadsheet. Periksa konsol browser untuk detail. (${error.message})`);
        container.innerHTML = `<p>Terjadi kesalahan saat memuat sertifikat. Mohon periksa konsol browser (tekan F12) untuk detail lebih lanjut.</p>`;
    }
}

document.addEventListener("DOMContentLoaded", loadCertificateData);
