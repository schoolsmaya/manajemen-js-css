// Fungsi untuk memuat data JSON
async function loadOrgData() {
    try {
        const response = await fetch('struktur_organisasi.json'); // Pastikan nama file JSON sesuai
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Gagal memuat data struktur organisasi:", error);
        return []; // Kembalikan array kosong jika gagal
    }
}

// Fungsi untuk inisialisasi dan menggambar bagan
async function initOrgChart() {
    const orgData = await loadOrgData();

    if (orgData.length === 0) {
        document.getElementById("tree").innerHTML = "<p>Tidak ada data struktur organisasi untuk ditampilkan.</p>";
        return;
    }

    let chart = new OrgChart(document.getElementById("tree"), {
        mouseScroll: OrgChart.action.zoom, // Mengaktifkan zoom dengan scroll mouse
        orientation: OrgChart.orientation.top, // Arah bagan: dari atas ke bawah

        // Definisi template node kustom
        template: "custom", // Menggunakan template kustom yang kita buat sendiri

        // Konfigurasi node template kustom
        nodeTemplate: function(node) {
            // node.data berisi data dari setiap objek di JSON (id, nama, jabatan, dll)
            return `
                <div class="custom-node">
                    <img src="${node.data.foto_url || 'images/default_profile.jpg'}" alt="${node.data.nama || ''}" />
                    <div class="text-content">
                        <div class="name">${node.data.nama || ''}</div>
                        <div class="title">${node.data.jabatan || ''}</div>
                    </div>
                </div>
            `;
        },
        
        // Data yang akan digunakan oleh chart
        nodes: orgData
    });

    chart.draw(); // Menggambar bagan
}

// Panggil fungsi inisialisasi saat DOM sudah siap
document.addEventListener('DOMContentLoaded', initOrgChart);
