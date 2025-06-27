console.log("Aplikasi Generator Sertifikat Dimuat");

// --- Inisialisasi pdf-lib (PINDAHKAN KE ATAS SINI!) ---
// Pastikan ini ada di bagian paling atas script Anda, sebelum variabel lain yang menggunakannya
const { PDFDocument, rgb, degrees } = PDFLib; 


// --- KONFIGURASI PENTING ---
const SPREADSHEET_ID = '136f-IvdJ5xZfOLRhtlahmOrPdvg73DtX2Eznjx80DXo'; 
const SHEET_GID = '0'; 
const SPREADSHEET_JSON_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;

const CERTIFICATE_TEMPLATE_URL = "Certificate.pdf"; 
const CUSTOM_FONT_URL = "Sanchez-Regular.ttf"; 

// --- POSISI TEKS DI DALAM PDF ---
// Sekarang rgb() sudah didefinisikan karena baris di atasnya sudah dijalankan
const NAME_X_POS = 300; 
const NAME_Y_POS = 270; 
const NAME_FONT_SIZE = 58; 
const NAME_COLOR = rgb(0.2, 0.84, 0.67); // Ini tidak akan error lagi

const CERT_NUM_X_POS = 100; 
const CERT_NUM_Y_POS = 100; 
const CERT_NUM_FONT_SIZE = 12; 
const CERT_NUM_COLOR = rgb(0, 0, 0); // Ini juga tidak akan error lagi

// --- Fungsi untuk menghasilkan PDF ---
const generatePDF = async (name, certificateNumber) => {
    // ... (sisa kode generatePDF tidak berubah) ...
    try {
        // Muat template PDF
        const existingPdfBytes = await fetch(CERTIFICATE_TEMPLATE_URL).then((res) => {
            if (!res.ok) {
                throw new Error(`Gagal memuat template PDF: ${res.status} ${res.statusText}`);
            }
            return res.arrayBuffer();
        });

        // Muat font kustom
        const fontBytes = await fetch(CUSTOM_FONT_URL).then((res) => {
            if (!res.ok) {
                throw new Error(`Gagal memuat font: ${res.status} ${res.statusText}`);
            }
            return res.arrayBuffer();
        });

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        pdfDoc.registerFontkit(fontkit); 

        const SanChezFont = await pdfDoc.embedFont(fontBytes); 
        const pages = pdfDoc.getPages();
        const firstPage = pages[0]; 

        firstPage.drawText(name, {
            x: NAME_X_POS,
            y: NAME_Y_POS,
            size: NAME_FONT_SIZE,
            font: SanChezFont,
            color: NAME_COLOR,
        });

        firstPage.drawText(`No. ${certificateNumber}`, {
            x: CERT_NUM_X_POS,
            y: CERT_NUM_Y_POS,
            size: CERT_NUM_FONT_SIZE,
            font: SanChezFont, 
            color: CERT_NUM_COLOR,
        });

        const pdfBytes = await pdfDoc.save();
        saveAs(new Blob([pdfBytes], { type: "application/pdf" }), `Sertifikat_${name.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_${certificateNumber.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        alert(`Gagal membuat sertifikat untuk ${name}. Pastikan file template PDF dan font sudah diupload dan URL-nya benar, serta tidak ada masalah CORS.`);
    }
};

// --- Fungsi untuk memuat data dari Spreadsheet dan menampilkan tombol unduh ---
async function loadCertificateData() {
    const container = document.getElementById("certificate-list-container");
    container.innerHTML = "<p>Memuat data peserta dari spreadsheet...</p>";

    try {
        const response = await fetch(SPREADSHEET_JSON_URL);
        if (!response.ok) {
            throw new Error(`Gagal memuat data spreadsheet: ${response.status} ${res.statusText}`);
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
            const namaLengkap = entry.c[0] && entry.c[0].v !== null ? entry.c[0].v : ''; 
            const tanggalAcara = entry.c[1] && entry.c[1].v !== null ? entry.c[1].v : ''; 
            const namaAcara = entry.c[2] && entry.c[2].v !== null ? entry.c[2].v : '';    
            const nomorSertifikat = entry.c[3] && entry.c[3].v !== null ? entry.c[3].v : ''; 

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
        alert('Terjadi kesalahan saat memuat data dari spreadsheet. Pastikan URL Spreadsheet dan GID sudah benar, dan spreadsheet sudah dipublikasikan ke web.');
        container.innerHTML = `<p>Terjadi kesalahan saat memuat sertifikat. Periksa konsol browser untuk detail: ${error.message}</p>`;
    }
}

document.addEventListener("DOMContentLoaded", loadCertificateData);
