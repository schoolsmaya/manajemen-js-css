console.log("Aplikasi Generator Sertifikat Dimuat");

// --- Inisialisasi pdf-lib ---
const { PDFDocument, rgb, degrees, TextAlignment } = PDFLib; 


// --- KONFIGURASI PENTING ---
const SPREADSHEET_ID = '136f-IvdJ5xZfOLRhtlahmOrPdvg73DtX2Eznjx80DXo'; 
const SHEET_GID = '0'; 
const SPREADSHEET_JSON_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;

const CERTIFICATE_TEMPLATE_URL = "https://drive.google.com/file/d/17y75bpn6uZiYe93TrMOUwgDUE719YhbY/view?usp=drive_link"; 
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


// --- Variabel Global untuk Data dan Paginasi/Filter ---
let allCertificateData = []; // Menyimpan semua data dari spreadsheet
let filteredCertificateData = []; // Data setelah difilter (pencarian)

let currentPage = 1;
let rowsPerPage = 10; // Default: 10 baris per halaman

// --- Elemen HTML ---
const statusMessageDiv = document.getElementById("status-message");
const tableContainerDiv = document.getElementById("table-container");
const searchInput = document.getElementById("search-input");
const rowsPerPageSelect = document.getElementById("rows-per-page-select");
const prevPageBtn = document.getElementById("prev-page-btn");
const nextPageBtn = document.getElementById("next-page-btn");
const pageInfoSpan = document.getElementById("page-info");


// --- FUNGSI PEMFORMATAN TANGGAL ---
function formatTanggalIndonesia(tanggalData) {
    if (!tanggalData) return ''; 

    let tanggalObj;

    if (typeof tanggalData === 'string' && tanggalData.startsWith('Date(')) {
        const parts = tanggalData.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (parts && parts.length === 4) {
            tanggalObj = new Date(Number(parts[1]), Number(parts[2]), Number(parts[3]));
        } else {
            console.warn("Format tanggal 'Date(...)' tidak dikenal:", tanggalData);
            return tanggalData;
        }
    } else {
        tanggalObj = new Date(tanggalData);
    }

    if (isNaN(tanggalObj.getTime())) {
        console.warn("Tanggal tidak valid setelah parsing:", tanggalData);
        return tanggalData; 
    }

    const namaBulan = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const tgl = tanggalObj.getDate();
    const bln = namaBulan[tanggalObj.getMonth()];
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


// --- Fungsi untuk merender tabel ---
function renderTable() {
    tableContainerDiv.innerHTML = ''; // Bersihkan kontainer tabel

    if (filteredCertificateData.length === 0) {
        statusMessageDiv.textContent = "Tidak ada data yang ditemukan.";
        tableContainerDiv.innerHTML = ""; // Pastikan tabel kosong
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
        pageInfoSpan.textContent = "Halaman 0 dari 0";
        return;
    }

    statusMessageDiv.textContent = ""; // Kosongkan pesan status jika ada data

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Header Tabel
    thead.innerHTML = `
        <tr>
            <th>No.</th>
            <th>Nama Lengkap</th>
            <th>Nama Acara</th>
            <th>Tanggal Acara</th>
            <th>Nomor Sertifikat</th>
            <th>Aksi</th>
        </tr>
    `;
    table.appendChild(thead);

    // Hitung halaman
    const totalPages = Math.ceil(filteredCertificateData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = (rowsPerPage === 'All') ? filteredCertificateData.length : Math.min(startIndex + rowsPerPage, filteredCertificateData.length);

    const dataToDisplay = (rowsPerPage === 'All') ? filteredCertificateData : filteredCertificateData.slice(startIndex, endIndex);

    // Isi Baris Tabel
    dataToDisplay.forEach((data, index) => {
        const globalIndex = startIndex + index + 1; // Nomor urut global
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${globalIndex}</td>
            <td>${data.namaLengkap}</td>
            <td>${data.namaAcara}</td>
            <td>${data.tanggalAcaraFormatted}</td>
            <td>${data.nomorSertifikat}</td>
            <td>
                <button onclick="generatePDF('${data.namaLengkap.replace(/'/g, "\\'")}', '${data.nomorSertifikat.replace(/'/g, "\\'")}')">Unduh</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableContainerDiv.appendChild(table);

    // Update Paginasi Info
    pageInfoSpan.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || rowsPerPage === 'All';
    
    // Sembunyikan pagination jika hanya ada 1 halaman atau "All" dipilih
    if (totalPages <= 1 || rowsPerPage === 'All') {
        prevPageBtn.style.display = 'none';
        nextPageBtn.style.display = 'none';
        pageInfoSpan.style.display = 'none';
    } else {
        prevPageBtn.style.display = '';
        nextPageBtn.style.display = '';
        pageInfoSpan.style.display = '';
    }
}

// --- Fungsi untuk menerapkan filter (pencarian) ---
function applyFilter() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    filteredCertificateData = allCertificateData.filter(data => {
        // Cari di kolom nama, acara, dan nomor sertifikat
        return data.namaLengkap.toLowerCase().includes(searchTerm) ||
               data.namaAcara.toLowerCase().includes(searchTerm) ||
               data.nomorSertifikat.toLowerCase().includes(searchTerm) ||
               data.tanggalAcaraFormatted.toLowerCase().includes(searchTerm); // Juga cari di tanggal yang sudah diformat
    });
    currentPage = 1; // Reset ke halaman 1 setiap kali filter berubah
    renderTable();
}

// --- Fungsi untuk memuat data dari Spreadsheet ---
async function loadCertificateData() {
    statusMessageDiv.textContent = "Memuat data peserta dari spreadsheet...";
    tableContainerDiv.innerHTML = ''; // Pastikan tabel kosong saat memuat
    prevPageBtn.disabled = true; // Disable tombol saat memuat
    nextPageBtn.disabled = true;

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
            statusMessageDiv.textContent = "Tidak ada data peserta yang ditemukan di spreadsheet.";
            return;
        }

        allCertificateData = jsonData.table.rows.map(entry => {
            const namaLengkap = entry.c[0] && entry.c[0].v !== null ? String(entry.c[0].v) : ''; 
            const tanggalMentah = entry.c[1] ? (entry.c[1].v || entry.c[1].f) : null; 
            const tanggalAcaraFormatted = formatTanggalIndonesia(tanggalMentah); 
            const namaAcara = entry.c[2] && entry.c[2].v !== null ? String(entry.c[2].v) : '';    
            const nomorSertifikat = entry.c[3] && entry.c[3].v !== null ? String(entry.c[3].v) : ''; 

            return {
                namaLengkap,
                tanggalAcaraRaw: tanggalMentah, // Simpan juga data mentah jika diperlukan
                tanggalAcaraFormatted,
                namaAcara,
                nomorSertifikat
            };
        });
        
        filteredCertificateData = [...allCertificateData]; // Awalnya, data filter sama dengan semua data

        renderTable(); // Render tabel pertama kali setelah data dimuat

    } catch (error) {
        console.error("Error fetching or parsing data from Google Sheet:", error);
        statusMessageDiv.innerHTML = `<p>Terjadi kesalahan saat memuat data dari spreadsheet. Periksa konsol browser untuk detail: ${error.message}</p>`;
    }
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    loadCertificateData();

    searchInput.addEventListener("keyup", applyFilter); // Filter saat ketikan berubah

    rowsPerPageSelect.addEventListener("change", () => {
        rowsPerPage = (rowsPerPageSelect.value === 'All') ? 'All' : Number(rowsPerPageSelect.value);
        currentPage = 1; // Reset ke halaman 1 saat mengubah jumlah baris per halaman
        renderTable();
    });

    prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    nextPageBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredCertificateData.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
});
