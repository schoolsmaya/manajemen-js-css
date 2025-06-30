console.log("Aplikasi Generator Kartu Sertifikasi Guru Dimuat");

const { PDFDocument, rgb, degrees, TextAlignment, StandardFonts } = PDFLib;

// --- KONFIGURASI SPREADSHEET DAN TEMPLATE ---
const SPREADSHEET_ID_SG = '1t0XNngsKi7z5oKSm3z_NJ30chNNLNAuIbKND5edsEXU'; 
const SHEET_GID_SG = '0'; 
const SPREADSHEET_JSON_URL_SG = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID_SG}/gviz/tq?tqx=out:json&gid=${SHEET_GID_SG}`;

const SERTIFIKASI_TEMPLATE_URL = "../../template/kartu/guru/kartu_sertifikasi_guru_template.pdf"; 

// --- KONFIGURASI FONT (Pastikan file font ada di folder yang sama atau sesuaikan path) ---
const CUSTOM_FONT_URL_SG = "../../font/Sanchez/Sanchez-Regular.ttf";   
const CUSTOM_FONT_BOLD_URL_SG = "../../font/Sanchez/Sanchez-Bold.ttf";     
const CUSTOM_FONT_ITALIC_URL_SG = "../../font/Sanchez/Sanchez-Italic.ttf"; 

// --- POSISI TEKS DI DALAM PDF KARTU SERTIFIKASI GURU ---
// SESUAIKAN POSISI X DAN Y INI AGAR SESUAI DENGAN TEMPLATE PDF ANDA
const NUPTK_X_POS_SG = 100; 
const NUPTK_Y_POS_SG = 350; 
const NUPTK_FONT_SIZE_SG = 12;

const NAMA_X_POS_SG = 100;
const NAMA_Y_POS_SG = 330;
const NAMA_FONT_SIZE_SG = 18; 
const NAMA_COLOR_SG = rgb(0, 0, 0); 

const NO_PESERTA_X_POS_SG = 100;
const NO_PESERTA_Y_POS_SG = 310;
const NO_PESERTA_FONT_SIZE_SG = 12;

const TAHUN_SERTIFIKASI_X_POS_SG = 100;
const TAHUN_SERTIFIKASI_Y_POS_SG = 290;
const TAHUN_SERTIFIKASI_FONT_SIZE_SG = 12;

const BIDANG_STUDI_X_POS_SG = 100;
const BIDANG_STUDI_Y_POS_SG = 270;
const BIDANG_STUDI_FONT_SIZE_SG = 12;

const NRG_X_POS_SG = 100;
const NRG_Y_POS_SG = 250;
const NRG_FONT_SIZE_SG = 12;

// --- KONFIGURASI POSISI DAN UKURAN FOTO GURU ---
const PHOTO_X_POS_SG = 400; // <--- SESUAIKAN POSISI X FOTO
const PHOTO_Y_POS_SG = 300; // <--- SESUAIKAN POSISI Y FOTO
const PHOTO_WIDTH_SG = 80;  // <--- SESUAIKAN LEBAR FOTO
const PHOTO_HEIGHT_SG = 100; // <--- SESUAIKAN TINGGI FOTO


// Variabel global untuk data dan pagination
let allSertifikasiData = []; 
let filteredSertifikasiData = []; 
let currentPage = 1;
let rowsPerPage = 10; 

// Elemen DOM
const statusMessageDiv = document.getElementById("genSG-status-message"); 
const tableContainerDiv = document.getElementById("genSG-table-container"); 
const searchInput = document.getElementById("genSG-search-input"); 
const rowsPerPageSelect = document.getElementById("genSG-rows-per-page-select"); 
const prevPageBtn = document.getElementById("genSG-prev-page-btn"); 
const nextPageBtn = document.getElementById("genSG-next-page-btn"); 
const pageInfoSpan = document.getElementById("genSG-page-info"); 


// --- FUNGSI GENERATE PDF SERTIFIKASI ---
const generateSertifikasiPDF = async (data) => {
    try {
        statusMessageDiv.textContent = `Membuat sertifikat untuk ${data['Nama']}...`;

        // Muat template PDF
        const existingPdfBytes = await fetch(SERTIFIKASI_TEMPLATE_URL).then((res) => {
            if (!res.ok) throw new Error(`Gagal memuat template PDF: ${res.status} ${res.statusText}`);
            return res.arrayBuffer();
        });
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        pdfDoc.registerFontkit(fontkit); 

        // Embed Font
        let customFont, customFontBold, customFontItalic;

        try { // Reguler
            const fontBytes = await fetch(CUSTOM_FONT_URL_SG).then(res => { if (!res.ok) throw new Error(`Status ${res.status}`); return res.arrayBuffer(); });
            customFont = await pdfDoc.embedFont(fontBytes);
        } catch (error) { console.error("Gagal memuat font reguler:", error); alert("Kesalahan: Gagal memuat font reguler. Pastikan URL font benar."); return; }

        try { // Bold
            const fontBoldBytes = await fetch(CUSTOM_FONT_BOLD_URL_SG).then(res => { if (!res.ok) throw new Error(`Status ${res.status}`); return res.arrayBuffer(); });
            customFontBold = await pdfDoc.embedFont(fontBoldBytes);
        } catch (error) { console.warn("Gagal memuat font bold, menggunakan reguler:", error); customFontBold = customFont; }

        try { // Italic
            const fontItalicBytes = await fetch(CUSTOM_FONT_ITALIC_URL_SG).then(res => { if (!res.ok) throw new Error(`Status ${res.status}`); return res.arrayBuffer(); });
            customFontItalic = await pdfDoc.embedFont(fontItalicBytes);
        } catch (error) { console.warn("Gagal memuat font italic, menggunakan reguler:", error); customFontItalic = customFont; }

        const pages = pdfDoc.getPages();
        const firstPage = pages[0]; 

        // --- MENGGAMBAR TEKS DATA GURU KE PDF ---
        firstPage.drawText(`NUPTK: ${data['NUPTK']}`, {
            x: NUPTK_X_POS_SG,
            y: NUPTK_Y_POS_SG,
            size: NUPTK_FONT_SIZE_SG,
            font: customFont, 
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`${data['Nama']}`, { 
            x: NAMA_X_POS_SG,
            y: NAMA_Y_POS_SG,
            size: NAMA_FONT_SIZE_SG,
            font: customFontBold, 
            color: NAMA_COLOR_SG,
        });

        firstPage.drawText(`No. Peserta: ${data['No. Peserta']}`, {
            x: NO_PESERTA_X_POS_SG,
            y: NO_PESERTA_Y_POS_SG,
            size: NO_PESERTA_FONT_SIZE_SG,
            font: customFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`Tahun Sertifikasi: ${data['Tahun Sertifikasi']}`, {
            x: TAHUN_SERTIFIKASI_X_POS_SG,
            y: TAHUN_SERTIFIKASI_Y_POS_SG,
            size: TAHUN_SERTIFIKASI_FONT_SIZE_SG,
            font: customFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`Bidang Studi: ${data['Bidang Studi']}`, {
            x: BIDANG_STUDI_X_POS_SG,
            y: BIDANG_STUDI_Y_POS_SG,
            size: BIDANG_STUDI_FONT_SIZE_SG,
            font: customFont,
            color: rgb(0, 0, 0),
        });

        firstPage.drawText(`NRG: ${data['NRG']}`, {
            x: NRG_X_POS_SG,
            y: NRG_Y_POS_SG,
            size: NRG_FONT_SIZE_SG,
            font: customFont,
            color: rgb(0, 0, 0),
        });

        // --- BARU: Handle Pas Photo Guru ---
        if (data['URL_Foto']) { // Pastikan nama kolom di spreadsheet adalah 'URL_Foto'
            try {
                const photoResponse = await fetch(data['URL_Foto']);
                if (!photoResponse.ok) throw new Error(`Gagal memuat foto dari URL: ${data['URL_Foto']} status: ${photoResponse.status}`);
                const photoBytes = await photoResponse.arrayBuffer();
                let photoImage;

                // Deteksi tipe gambar berdasarkan ekstensi URL
                const imageUrl = data['URL_Foto'].toLowerCase();
                if (imageUrl.endsWith('.png')) {
                    photoImage = await pdfDoc.embedPng(photoBytes);
                } else if (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg')) {
                    photoImage = await pdfDoc.embedJpg(photoBytes);
                } else {
                    console.warn(`Format foto tidak didukung untuk URL: ${data['URL_Foto']}. Hanya PNG/JPG.`);
                }

                if (photoImage) {
                    firstPage.drawImage(photoImage, {
                        x: PHOTO_X_POS_SG,
                        y: PHOTO_Y_POS_SG,
                        width: PHOTO_WIDTH_SG,
                        height: PHOTO_HEIGHT_SG,
                    });
                }
            } catch (photoError) {
                console.error("Error embedding photo:", photoError);
                statusMessageDiv.textContent = `Gagal memuat/menanamkan foto untuk ${data['Nama']}. (${photoError.message})`;
            }
        }


        const pdfBytes = await pdfDoc.save();
        saveAs(new Blob([pdfBytes], { type: "application/pdf" }), `Sertifikat_Guru_${String(data['Nama']).replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}_${String(data['NUPTK']).replace(/\s/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}.pdf`);
        statusMessageDiv.textContent = `Sertifikat untuk ${data['Nama']} berhasil dibuat.`;

    } catch (error) {
        console.error("Error generating Sertifikasi PDF:", error);
        statusMessageDiv.textContent = `Gagal membuat sertifikat untuk ${data['Nama']}. (${error.message})`;
        alert(`Gagal membuat sertifikat untuk ${data['Nama']}. Periksa konsol browser untuk detail lebih lanjut. (${error.message})`);
    }
};

// --- FUNGSI MENGAMBIL DATA DARI GOOGLE SHEET ---
async function loadSertifikasiData() {
    statusMessageDiv.textContent = "Memuat data guru dari Google Sheet...";
    try {
        const response = await fetch(SPREADSHEET_JSON_URL_SG);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const json = JSON.parse(jsonString);

        allSertifikasiData = json.table.rows.map(row => {
            const rowData = {};
            json.table.cols.forEach((col, index) => {
                const cell = row.c[index];
                if (cell && cell.v !== null) {
                    rowData[col.label] = cell.v;
                } else {
                    rowData[col.label] = ''; 
                }
            });
            // Pastikan URL_Foto diambil dan diubah ke string
            if (rowData['URL_Foto']) { // <--- Pastikan nama kolom di spreadsheet adalah 'URL_Foto'
                rowData['URL_Foto'] = String(rowData['URL_Foto']); 
            }
            return rowData;
        });

        filteredSertifikasiData = [...allSertifikasiData]; 
        renderTable();
        statusMessageDiv.textContent = `Data berhasil dimuat. Total guru: ${allSertifikasiData.length}`;
    } catch (error) {
        console.error("Error loading sertifikasi data:", error);
        statusMessageDiv.textContent = `Gagal memuat data guru. (${error.message})`;
        alert(`Gagal memuat data guru. Pastikan Google Sheet Anda publik dan URL-nya benar. (${error.message})`);
    }
}

// --- FUNGSI MERENDER TABEL HTML ---
function renderTable() {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = filteredSertifikasiData.slice(start, end);

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>NUPTK</th>
                    <th>Nama</th>
                    <th>No. Peserta</th>
                    <th>Tahun Sertifikasi</th>
                    <th>Bidang Studi</th>
                    <th>NRG</th>
                    <th>Pas Photo</th> <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (paginatedData.length === 0) {
        tableHTML += `<tr><td colspan="8" style="text-align: center;">Tidak ada data ditemukan.</td></tr>`; } else {
        paginatedData.forEach(guru => {
            tableHTML += `
                <tr>
                    <td>${guru['NUPTK'] || ''}</td>
                    <td>${guru['Nama'] || ''}</td>
                    <td>${guru['No. Peserta'] || ''}</td>
                    <td>${guru['Tahun Sertifikasi'] || ''}</td>
                    <td>${guru['Bidang Studi'] || ''}</td>
                    <td>${guru['NRG'] || ''}</td>
                    <td>
                        ${guru['URL_Foto'] ? 
                            `<a href="${guru['URL_Foto']}" target="_blank">Lihat Foto</a>` : 
                            'Tidak Ada'
                        }
                    </td> <td><button class="generate-btn" data-nuptk="${guru['NUPTK']}">Generate Sertifikat</button></td>
                </tr>
            `;
        });
    }

    tableHTML += `
            </tbody>
        </table>
    `;
    tableContainerDiv.innerHTML = tableHTML;

    // Perbarui info halaman
    const totalPages = Math.ceil(filteredSertifikasiData.length / rowsPerPage);
    pageInfoSpan.textContent = `Halaman ${currentPage} dari ${totalPages || 1} (${filteredSertifikasiData.length} data)`;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

    // Tambahkan event listener ke tombol "Generate Sertifikat"
    document.querySelectorAll('.generate-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const nuptiToGenerate = event.target.dataset.nuptk;
            const guruData = allSertifikasiData.find(g => String(g['NUPTK']) === String(nuptiToGenerate));
            if (guruData) {
                generateSertifikasiPDF(guruData);
            } else {
                alert("Data guru tidak ditemukan untuk generating PDF.");
            }
        });
    });
}

// --- FUNGSI FILTER/PENCARIAN ---
function applyFilter() {
    const searchTerm = searchInput.value.toLowerCase();
    filteredSertifikasiData = allSertifikasiData.filter(guru => {
        return (guru['NUPTK'] && String(guru['NUPTK']).toLowerCase().includes(searchTerm)) ||
               (guru['Nama'] && String(guru['Nama']).toLowerCase().includes(searchTerm)) ||
               (guru['No. Peserta'] && String(guru['No. Peserta']).toLowerCase().includes(searchTerm));
    });
    currentPage = 1; 
    renderTable();
}

// --- EVENT LISTENERS ---
document.addEventListener("DOMContentLoaded", () => {
    loadSertifikasiData();

    searchInput.addEventListener('keyup', applyFilter);
    rowsPerPageSelect.addEventListener('change', (event) => {
        rowsPerPage = parseInt(event.target.value);
        currentPage = 1;
        renderTable();
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredSertifikasiData.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
});
