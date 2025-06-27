console.log("Aplikasi Generator Kartu Pelajar Dimuat");

// --- Inisialisasi pdf-lib ---
const { PDFDocument, rgb, degrees, TextAlignment, StandardFonts } = PDFLib;


// --- KONFIGURASI PENTING UNTUK KARTU PELAJAR ---
// GANTI DENGAN ID SPREADSHEET GOOGLE KARTU PELAJAR ANDA
const SPREADSHEET_ID_KP = '1WmLgw4ewLYSmggAXp6y8Fe7pVbjz_oq-WeLj47l_s0Y'; 
// GANTI DENGAN GID (SHEET ID) DARI LEMBAR KERJA KARTU PELAJAR ANDA
const SHEET_GID_KP = '0'; 
const SPREADSHEET_JSON_URL_KP = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID_KP}/gviz/tq?tqx=out:json&gid=${SHEET_GID_KP}`;

// URL ke template PDF Kartu Pelajar dan Font Anda
const ID_CARD_TEMPLATE_URL = "kartu_pelajar_template.pdf"; // <--- GANTI DENGAN NAMA FILE TEMPLATE KARTU PELAJAR ANDA
const CUSTOM_FONT_URL_KP = "Sanchez-Regular.ttf"; // <--- BISA SAMA DENGAN SERTIFIKAT ATAU FONT LAIN


// --- POSISI TEKS DAN GAMBAR DI DALAM PDF KARTU PELAJAR ---
// Anda perlu MENYESUAIKAN NILAI-NILAI INI dengan tata letak template kartu pelajar Anda.
// Gunakan alat ukur di editor PDF atau metode trial-and-error yang sudah Anda pelajari.
// Ingat: X_POS ini adalah titik awal teks dari kiri.

// Contoh posisi (INI HANYA CONTOH, HARUS DISESUAIKAN!)
const NAME_X_POS_KP = 100; // Posisi X untuk Nama (dari kiri)
const NAME_Y_POS_KP = 300; // Posisi Y untuk Nama
const NAME_FONT_SIZE_KP = 20;
const NAME_COLOR_KP = rgb(0, 0, 0); // Hitam

const TL_X_POS_KP = 100; // Tempat Lahir
const TL_Y_POS_KP = 280;
const TL_FONT_SIZE_KP = 12;

const TGL_LAHIR_X_POS_KP = 100; // Tanggal Lahir
const TGL_LAHIR_Y_POS_KP = 260;
const TGL_LAHIR_FONT_SIZE_KP = 12;

const NIS_X_POS_KP = 100;
const NIS_Y_POS_KP = 240;
const NIS_FONT_SIZE_KP = 12;

const NISN_X_POS_KP = 100;
const NISN_Y_POS_KP = 220;
const NISN_FONT_SIZE_KP = 12;

const ALAMAT_X_POS_KP = 100;
const ALAMAT_Y_POS_KP = 200;
const ALAMAT_FONT_SIZE_KP = 12; 

const NOHP_X_POS_KP = 100;
const NOHP_Y_POS_KP = 180;
const NOHP_FONT_SIZE_KP = 12;

const EMAIL_X_POS_KP = 100;
const EMAIL_Y_POS_KP = 160;
const EMAIL_FONT_SIZE_KP = 12;

const PHOTO_X_POS_KP = 50;  // Posisi X untuk Pas Photo
const PHOTO_Y_POS_KP = 350;  // Posisi Y untuk Pas Photo
const PHOTO_WIDTH_KP = 80;   // Lebar Pas Photo
const PHOTO_HEIGHT_KP = 100; // Tinggi Pas Photo


// --- Variabel Global untuk Data dan Paginasi/Filter ---
let allIDCardData = []; 
let filteredIDCardData = []; 

let currentPage = 1;
let rowsPerPage = 10; 

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


// --- Fungsi untuk menghasilkan PDF Kartu Pelajar ---
const generateIDCardPDF = async (data) => {
    try {
        const existingPdfBytes = await fetch(ID_CARD_TEMPLATE_URL).then((res) => {
            if (!res.ok) {
                throw new Error(`Gagal memuat template PDF kartu pelajar: ${res.status} ${res.statusText}. Pastikan nama file dan path benar.`);
            }
            return res.arrayBuffer();
        });

        const fontBytes = await fetch(CUSTOM_FONT_URL_KP).then((res) => {
            if (!res.ok) {
                throw new Error(`Gagal memuat font: ${res.status} ${res.statusText}. Pastikan nama file dan path benar.`);
            }
            return res.arrayBuffer();
        });

        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        pdfDoc.registerFontkit(fontkit); 
        const customFont = await pdfDoc.embedFont(fontBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0]; 

        // Teks: Nama
        firstPage.drawText(data.namaLengkap, {
            x: NAME_X_POS_KP,
            y: NAME_Y_POS_KP,
            size: NAME_FONT_SIZE_KP,
            font: customFont,
            color: NAME_COLOR_KP,
            // align: TextAlignment.Center, // *** BARIS INI DIHAPUS UNTUK LEFT-ALIGNED ***
        });

        // Teks: Tempat Lahir
        firstPage.drawText(`Tempat Lahir: ${data.tempatLahir}`, {
            x: TL_X_POS_KP,
            y: TL_Y_POS_KP,
            size: TL_FONT_SIZE_KP,
            font: customFont,
            color: rgb(0,0,0),
        });

        // Teks: Tanggal Lahir (sudah diformat)
        firstPage.drawText(`Tanggal Lahir: ${data.tanggalLahirFormatted}`, {
            x: TGL_LAHIR_X_POS_KP,
            y: TGL_LAHIR_Y_POS_KP,
            size: TGL_LAHIR_FONT_SIZE_KP,
            font: customFont,
            color: rgb(0,0,0),
        });
        
        // Teks: NIS
        firstPage.drawText(`NIS: ${data.nis}`, {
            x: NIS_X_POS_KP,
            y: NIS_Y_POS_KP,
            size: NIS_FONT_SIZE_KP,
            font: customFont,
            color: rgb(0,0,0),
        });

        // Teks: NISN
        firstPage.drawText(`NISN: ${data.nisn}`, {
            x: NISN_X_POS_KP,
            y: NISN_Y_POS_KP,
            size: NISN_FONT_SIZE_KP,
            font: customFont,
            color: rgb(0,0,0),
        });

        // Teks: Alamat
        firstPage.drawText(`Alamat: ${data.alamat}`, {
            x: ALAMAT_X_POS_KP,
            y: ALAMAT_Y_POS_KP,
            size: ALAMAT_FONT_SIZE_KP,
            font: customFont,
            color: rgb(0,0,0),
        });

        // Teks: No HP
        firstPage.drawText(`No HP: ${data.noHp}`, {
            x: NOHP_X_POS_KP,
            y: NOHP_Y_POS_KP,
            size: NOHP_FONT_SIZE_KP,
            font: customFont,
            color: rgb(0,0,0),
        });

        // Teks: Email
        firstPage.drawText(`Email: ${data.email}`, {
            x: EMAIL_X_POS_KP,
            y: EMAIL_Y_POS_KP,
            size: EMAIL_FONT_SIZE_KP,
            font: customFont,
            color: rgb(0,0,0),
        });

        // --- Handle Pas Photo ---
        if (data.pasPhotoUrl) {
            try {
                const photoResponse = await fetch(data.pasPhotoUrl);
                if (!photoResponse.ok) {
                    throw new Error(`Gagal memuat pas photo: ${photoResponse.status} ${photoResponse.statusText}`);
                }
                const photoBytes = await photoResponse.arrayBuffer();
                let photoImage;

                const contentType = photoResponse.headers.get('Content-Type');
                if (contentType && contentType.includes('image/jpeg')) {
                    photoImage = await pdfDoc.embedJpg(photoBytes);
                } else if (contentType && contentType.includes('image/png')) {
                    photoImage = await pdfDoc.embedPng(photoBytes);
                } else {
                    const urlLower = data.pasPhotoUrl.toLowerCase();
                    if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) {
                        photoImage = await pdfDoc.embedJpg(photoBytes);
                    } else if (urlLower.endsWith('.png')) {
                        photoImage = await pdfDoc.embedPng(photoBytes);
                    } else {
                        console.warn('Tipe gambar tidak dikenali, mencoba embed sebagai PNG (default).');
                        photoImage = await pdfDoc.embedPng(photoBytes);
                    }
                }

                firstPage.drawImage(photoImage, {
                    x: PHOTO_X_POS_KP,
                    y: PHOTO_Y_POS_KP,
                    width: PHOTO_WIDTH_KP,
                    height: PHOTO_HEIGHT_KP,
                });
            } catch (imgError) {
                console.error("Error embedding photo:", imgError);
                alert(`Gagal menyertakan pas photo untuk ${data.namaLengkap}. Pastikan URL foto publik dan formatnya benar. (${imgError.message})`);
            }
        }


        const pdfBytes = await pdfDoc.save();
        saveAs(new Blob([pdfBytes], { type: "application/pdf" }), `Kartu_Pelajar_${data.namaLengkap.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_${data.nis.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}.pdf`);

    } catch (error) {
        console.error("Error generating ID Card PDF:", error);
        alert(`Gagal membuat kartu pelajar untuk ${data.namaLengkap}. Periksa konsol browser untuk detail lebih lanjut. (${error.message})`);
    }
};


// --- Fungsi untuk merender tabel kartu pelajar ---
function renderTable() {
    tableContainerDiv.innerHTML = ''; 

    if (filteredIDCardData.length === 0) {
        statusMessageDiv.textContent = "Tidak ada data kartu pelajar yang ditemukan.";
        tableContainerDiv.innerHTML = ""; 
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
        pageInfoSpan.textContent = "Halaman 0 dari 0";
        return;
    }

    statusMessageDiv.textContent = "";

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Header Tabel
    thead.innerHTML = `
        <tr>
            <th>No.</th>
            <th>Nama</th>
            <th>NIS</th>
            <th>NISN</th>
            <th>Aksi</th>
        </tr>
    `;
    table.appendChild(thead);

    const totalPages = Math.ceil(filteredIDCardData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = (rowsPerPage === 'All') ? filteredIDCardData.length : Math.min(startIndex + rowsPerPage, filteredIDCardData.length);

    const dataToDisplay = (rowsPerPage === 'All') ? filteredIDCardData : filteredIDCardData.slice(startIndex, endIndex);

    // Isi Baris Tabel
    dataToDisplay.forEach((data, index) => {
        const globalIndex = startIndex + index + 1; 
        const row = document.createElement('tr');
        const dataJsonString = encodeURIComponent(JSON.stringify(data));
        row.innerHTML = `
            <td>${globalIndex}</td>
            <td>${data.namaLengkap}</td>
            <td>${data.nis}</td>
            <td>${data.nisn}</td>
            <td>
                <button onclick="generateIDCardPDF(JSON.parse(decodeURIComponent('${dataJsonString}')))">Unduh Kartu</button>
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
    
    filteredIDCardData = allIDCardData.filter(data => {
        return data.namaLengkap.toLowerCase().includes(searchTerm) ||
               data.nis.toLowerCase().includes(searchTerm) ||
               data.nisn.toLowerCase().includes(searchTerm);
    });
    currentPage = 1; 
    renderTable();
}

// --- Fungsi untuk memuat data dari Spreadsheet Kartu Pelajar ---
async function loadIDCardData() {
    statusMessageDiv.textContent = "Memuat data kartu pelajar dari spreadsheet...";
    tableContainerDiv.innerHTML = '';
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;

    try {
        const response = await fetch(SPREADSHEET_JSON_URL_KP);
        if (!response.ok) {
            throw new Error(`Gagal memuat data spreadsheet kartu pelajar: ${response.status} ${response.statusText}. Pastikan spreadsheet sudah dipublikasikan ke web.`);
        }
        const textData = await response.text();

        const jsonStart = textData.indexOf("(") + 1;
        const jsonEnd = textData.lastIndexOf(")");
        const jsonString = textData.substring(jsonStart, jsonEnd);
        const jsonData = JSON.parse(jsonString);

        if (!jsonData.table || !jsonData.table.rows || jsonData.table.rows.length === 0) {
            statusMessageDiv.textContent = "Tidak ada data peserta yang ditemukan di spreadsheet kartu pelajar.";
            return;
        }

        allIDCardData = jsonData.table.rows.map(entry => {
            const namaLengkap = entry.c[0] && entry.c[0].v !== null ? String(entry.c[0].v) : ''; 
            const tempatLahir = entry.c[1] && entry.c[1].v !== null ? String(entry.c[1].v) : ''; 
            const tanggalLahirMentah = entry.c[2] ? (entry.c[2].v || entry.c[2].f) : null; 
            const tanggalLahirFormatted = formatTanggalIndonesia(tanggalLahirMentah); 
            const nis = entry.c[3] && entry.c[3].v !== null ? String(entry.c[3].v) : '';    
            const nisn = entry.c[4] && entry.c[4].v !== null ? String(entry.c[4].v) : '';    
            const alamat = entry.c[5] && entry.c[5].v !== null ? String(entry.c[5].v) : '';    
            const noHp = entry.c[6] && entry.c[6].v !== null ? String(entry.c[6].v) : '';    
            const email = entry.c[7] && entry.c[7].v !== null ? String(entry.c[7].v) : '';    
            const pasPhotoUrl = entry.c[8] && entry.c[8].v !== null ? String(entry.c[8].v) : ''; 

            return {
                namaLengkap,
                tempatLahir,
                tanggalLahirRaw: tanggalLahirMentah,
                tanggalLahirFormatted,
                nis,
                nisn,
                alamat,
                noHp,
                email,
                pasPhotoUrl
            };
        });
        
        filteredIDCardData = [...allIDCardData]; 

        renderTable(); 

    } catch (error) {
        console.error("Error fetching or parsing data from Google Sheet:", error);
        statusMessageDiv.innerHTML = `<p>Terjadi kesalahan saat memuat data kartu pelajar. Periksa konsol browser untuk detail: ${error.message}</p>`;
    }
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
    loadIDCardData();

    searchInput.addEventListener("keyup", applyFilter); 

    rowsPerPageSelect.addEventListener("change", () => {
        rowsPerPage = (rowsPerPageSelect.value === 'All') ? 'All' : Number(rowsPerPageSelect.value);
        currentPage = 1; 
        renderTable();
    });

    prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    nextPageBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(filteredIDCardData.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
});