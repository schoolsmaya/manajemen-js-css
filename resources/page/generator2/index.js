console.log("Aplikasi Generator Sertifikat Dimuat");

// --- Inisialisasi pdf-lib ---
const { PDFDocument, rgb, degrees, TextAlignment } = PDFLib; 


// --- KONFIGURASI PENTING ---
const SPREADSHEET_ID = '136f-IvdJ5xZfOLRhtlahmOrPdvg73DtX2Eznjx80DXo'; 
const SHEET_GID = '0'; 
const SPREADSHEET_JSON_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;

const CERTIFICATE_TEMPLATE_URL = "Certificate.pdf"; 
const CUSTOM_FONT_URL = "Sanchez-Regular.ttf"; 

// --- POSISI TEKS DI DALAM PDF ---
const NAME_X_POS = 421; 
const NAME_Y_POS = 270; 
const NAME_FONT_SIZE = 58; 
const NAME_COLOR = rgb(0.2, 0.84, 0.67); 

const CERT_NUM_X_POS = 421; 
const CERT_NUM_Y_POS = 50;  
const CERT_NUM_FONT_SIZE = 14; 
const CERT_NUM_COLOR = rgb(0, 0, 0); 


// --- FUNGSI PEMFORMATAN TANGGAL BARU ---
function formatTanggalIndonesia(tanggalString) {
    // Asumsi tanggalString adalah dalam format "YYYY-MM-DD" dari spreadsheet
    const [tahun, bulan, hari] = tanggalString.split('-').map(Number);

    // Membuat objek Date. Perhatikan: bulan di JavaScript 0-indeks, jadi kurangi 1.
    // Jika format dari spreadsheet adalah "YYYY-MM-DD", new Date(tanggalString) akan menanganinya dengan baik
    // tanpa perlu mengurangi bulan, karena ini ISO 8601-like string.
    const tanggalObj = new Date(tanggalString); 

    const namaBulan = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const tgl = tanggalObj.getDate();
    const bln = namaBulan[tanggalObj.getMonth()]; // getMonth() akan memberikan bulan 0-indeks
    const thn = tanggalObj.getFullYear();

    return `${tgl} ${bln} ${thn}`;
}


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

        firstPage.drawText(name, {
            x: NAME_X_POS,
            y: NAME_Y_POS,
            size: NAME_FONT_SIZE,
            font: SanChezFont,
            color: NAME_COLOR,
            align: TextAlignment.Center, 
        });

        firstPage.drawText(`No. ${certificateNumber}`, { 
            x: CERT_NUM_X_POS,
            y: CERT_NUM_Y_POS,
            size: CERT_NUM_FONT_SIZE,
            font: SanChezFont, 
            color: CERT_NUM_COLOR,
            align: TextAlignment.Center, 
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
            // Ambil tanggal mentah dari spreadsheet
            const tanggalAcaraMentah = entry.c[1] && entry.c[1].v !== null ? String(entry.c[1].v) : ''; 
            // Format tanggal menggunakan fungsi baru
            const tanggalAcara = formatTanggalIndonesia(tanggalAcaraMentah); 
            
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
