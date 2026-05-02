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

    // --- FUNGSI UNTUK MENAMPILKAN APLIKASI UTAMA SETELAH LOGIN ---
    function initializeApp() {
        // --- OBJEK KONFIGURASI TAHUNAN ---
        const yearConfigurations = {
            '2024': { maxSemester: 6, kogWeight: 0.50, nusWeight: 0.50, usePsik: false },
            '2025': { maxSemester: 5, kogWeight: 0.70, nusWeight: 0.30, usePsik: false },
            '2026': { maxSemester: 6, kogWeight: 0.70, nusWeight: 0.30, usePsik: true },
        };

        const defaultConfiguration = { maxSemester: 5, kogWeight: 0.60, nusWeight: 0.40, usePsik: false };

        // --- VARIABLE GLOBAL APLIKASI ---
        const yearSelect = document.getElementById('year-select');
        const studentSelectionDiv = document.getElementById('student-selection');
        const studentSelect = document.getElementById('student-select');
        const subjectSelectionDiv = document.getElementById('subject-selection');
        const subjectSelect = document.getElementById('subject-select');
        const studentDetailsDiv = document.getElementById('student-details');

        let currentStudentsData = [];
        let currentSelectedStudent = null;

        // --- FUNGSI PERHITUNGAN ---
        
        function calculateKogAvgBySubject(studentGrades, subjectName, year) {
            const config = yearConfigurations[year] || defaultConfiguration;
            let totalValue = 0;
            let count = 0;
            for (let i = 1; i <= config.maxSemester; i++) {
                const semesterKey = `s${i}`;
                if (studentGrades[semesterKey] && studentGrades[semesterKey][subjectName]) {
                    const data = studentGrades[semesterKey][subjectName];
                    const val = config.usePsik ? (data.kog + data.psik) / 2 : data.kog;
                    totalValue += val;
                    count++;
                }
            }
            return count > 0 ? (totalValue / count).toFixed(2) : 'N/A';
        }

        function getNusBySubject(nusGrades, subjectName) {
            if (nusGrades && typeof nusGrades === 'object' && nusGrades[subjectName] !== undefined) {
                return parseFloat(nusGrades[subjectName]).toFixed(2);
            }
            return 'N/A';
        }

        function calculateNilaiSekolahBySubject(avgKogBySubject, nusBySubject, year) {
            if (avgKogBySubject === 'N/A') return 'N/A';
            const config = yearConfigurations[year] || defaultConfiguration;
            const avg = parseFloat(avgKogBySubject);
            if (nusBySubject !== 'N/A' && nusBySubject !== undefined) {
                const nus = parseFloat(nusBySubject);
                return ((avg * config.kogWeight) + (nus * config.nusWeight)).toFixed(2);
            }
            return avg.toFixed(2); // 100% Rapor jika tidak ada NUS
        }

        function calculateKogAvgOverall(studentGrades, year) {
            const config = yearConfigurations[year] || defaultConfiguration;
            const nusGrades = studentGrades.nus || {};
            const subjectsInNus = Object.keys(nusGrades); // Daftar mapel yang diujiankan saja
            let totalValue = 0;
            let count = 0;

            for (let i = 1; i <= config.maxSemester; i++) {
                const semesterGrades = studentGrades[`s${i}`];
                if (semesterGrades) {
                    for (const subject in semesterGrades) {
                        // FILTER: Hanya hitung jika mapel ini ada di daftar NUS
                        if (subjectsInNus.includes(subject)) {
                            const data = semesterGrades[subject];
                            if (data && data.kog !== undefined) {
                                const val = config.usePsik ? (data.kog + data.psik) / 2 : data.kog;
                                totalValue += val;
                                count++;
                            }
                        }
                    }
                }
            }
            return count > 0 ? (totalValue / count).toFixed(2) : 'N/A';
        }

        function calculateNusOverall(nusGrades) {
            if (!nusGrades || typeof nusGrades !== 'object') return 'N/A';
            let totalNus = 0;
            let count = 0;
            for (const subject in nusGrades) {
                const nilai = nusGrades[subject];
                if (nilai !== undefined && !isNaN(nilai) && nilai !== null && nilai !== "") {
                    totalNus += parseFloat(nilai);
                    count++;
                }
            }
            return count > 0 ? (totalNus / count).toFixed(2) : 'N/A';
        }

        function calculateNilaiSekolahOverall(avgKogOverall, nusOverall, year) {
            if (avgKogOverall === 'N/A' || nusOverall === 'N/A') return 'N/A';
            const config = yearConfigurations[year] || defaultConfiguration;
            const avg = parseFloat(avgKogOverall);
            const nus = parseFloat(nusOverall);
            return ((avg * config.kogWeight) + (nus * config.nusWeight)).toFixed(2);
        }

        // --- EVENT LISTENERS (Year & Student Select) ---
        // ... (Kode yearSelect.addEventListener dan studentSelect.addEventListener tetap sama seperti milik Anda) ...
        yearSelect.addEventListener('change', async (event) => {
            const selectedYear = event.target.value;
            studentSelect.innerHTML = '<option value="">-- Pilih Siswa --</option>';
            subjectSelect.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
            studentSelectionDiv.style.display = 'none';
            subjectSelectionDiv.style.display = 'none';
            studentDetailsDiv.style.display = 'none';
            currentSelectedStudent = null;
            currentStudentsData = [];
            if (selectedYear) {
                try {
                    const BASE_JSON_URL = 'https://sekolah.github.io/json/daftar-nilai/';
                    const response = await fetch(`${BASE_JSON_URL}students_${selectedYear}.json`);
                    if (!response.ok) throw new Error(`Status: ${response.status}`);
                    currentStudentsData = await response.json();
                    if (currentStudentsData.length > 0) {
                        currentStudentsData.forEach(student => {
                            const option = document.createElement('option');
                            option.value = student.id;
                            option.textContent = student.name;
                            studentSelect.appendChild(option);
                        });
                        studentSelectionDiv.style.display = 'block';
                    }
                } catch (error) { alert(`Gagal memuat data: ${error.message}`); }
            }
        });

        studentSelect.addEventListener('change', (event) => {
            const studentId = event.target.value;
            const selectedYear = yearSelect.value;
            subjectSelect.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
            subjectSelectionDiv.style.display = 'none';
            studentDetailsDiv.style.display = 'none';
            if (studentId && selectedYear && currentStudentsData.length > 0) {
                const student = currentStudentsData.find(s => s.id === studentId);
                if (student) {
                    currentSelectedStudent = student;
                    currentSelectedStudent.year = selectedYear;
                    let subjects = new Set();
                    const config = yearConfigurations[selectedYear] || defaultConfiguration;
                    for(let i = 1; i <= config.maxSemester; i++) {
                        if (student.grades[`s${i}`]) {
                            Object.keys(student.grades[`s${i}`]).forEach(s => subjects.add(s));
                        }
                    }
                    if (student.grades.nus) Object.keys(student.grades.nus).forEach(s => subjects.add(s));
                    Array.from(subjects).sort().forEach(s => {
                        const option = document.createElement('option');
                        option.value = s; option.textContent = s;
                        subjectSelect.appendChild(option);
                    });
                    subjectSelectionDiv.style.display = 'block';
                }
            }
        });

        subjectSelect.addEventListener('change', (event) => {
            const selectedSubject = event.target.value;
            if (selectedSubject && currentSelectedStudent) {
                displayStudentSubjectGrades(currentSelectedStudent, selectedSubject, currentSelectedStudent.year);
            }
        });

        // --- FUNGSI TAMPILAN DETAIL (PERBAIKAN KETERANGAN & IPK) ---
        function displayStudentSubjectGrades(student, subjectName, year) {
            const grades = student.grades;
            const config = yearConfigurations[year] || defaultConfiguration;
            const labelTipeNilai = config.usePsik ? "Kog & Psik" : "Kog";
            
            const avgKogBySubject = calculateKogAvgBySubject(grades, subjectName, year);
            const nusBySubject = getNusBySubject(grades.nus, subjectName);
            const nilaiSekolahBySubject = calculateNilaiSekolahBySubject(avgKogBySubject, nusBySubject, year);

            // Logika Keterangan untuk Mapel yang Sedang Dipilih
            let infoStatusMapel;
            if (nusBySubject !== 'N/A') {
                infoStatusMapel = `
                    <p style="color: blue;"><strong>Mapel Diujiankan:</strong> Berkontribusi terhadap IPK Utama.</p>
                    <ul>
                        <li>${(config.kogWeight * 100)}% Rata-rata Rapor (${avgKogBySubject.replace('.', ',')})</li>
                        <li>${(config.nusWeight * 100)}% Nilai Ujian Sekolah (${nusBySubject.replace('.', ',')})</li>
                    </ul>
                    <p>Rumus: (Rata-rata &times; ${config.kogWeight}) + (NUS &times; ${config.nusWeight})</p>
                `;
            } else {
                infoStatusMapel = `
                    <p style="color: orange;"><strong>Mapel Non-Ujian:</strong> Tidak diikutsertakan dalam IPK Utama.</p>
                    <ul>
                        <li>100% diambil dari Rata-rata Rapor (${avgKogBySubject.replace('.', ',')})</li>
                    </ul>
                    <p>Rumus: Murni Rata-rata Rapor</p>
                `;
            }

            // Hitung Overall (Hanya untuk Mapel yang ada di NUS)
            const avgKogOverall = calculateKogAvgOverall(grades, year);
            const nusOverall = calculateNusOverall(grades.nus);
            const nilaiSekolahOverall = calculateNilaiSekolahOverall(avgKogOverall, nusOverall, year);

            let tableRows = '';
            for (let i = 1; i <= 6; i++) {
                const semesterKey = `s${i}`;
                const data = grades[semesterKey]?.[subjectName];
                const kogDisp = data ? parseFloat(data.kog).toFixed(2).replace('.', ',') : 'N/A';
                const psikDisp = data ? parseFloat(data.psik).toFixed(2).replace('.', ',') : 'N/A';
                tableRows += `<tr><td>Semester ${i}</td><td>${kogDisp}</td><td>${psikDisp}</td></tr>`;
            }

            const semesterRangeText = `semester 1 sampai ${config.maxSemester}`;

            studentDetailsDiv.innerHTML = `
                <h3>Nilai Siswa: ${student.name}</h3>
                <div class="student-identity">
                    <div class="identity-item"><span>NISN</span><span>:</span><span>${student.nisn}</span></div>
                    <div class="identity-item"><span>Kelas</span><span>:</span><span>${student.class}</span></div>
                </div>
                <h4>Detail Nilai: ${subjectName}</h4>
                <table border="1" style="width:100%; border-collapse: collapse; text-align: center;">
                    <thead>
                        <tr><th rowspan="2">Semester</th><th colspan="2">Nilai Semester</th></tr>
                        <tr><th>Kog</th><th>Psik</th></tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <div class="summary-grades" style="margin-top: 20px; padding: 10px; background: #eee;">
                    <div class="summary-item"><span>Rata-rata ${labelTipeNilai} (${subjectName})</span><span>:</span><span>${avgKogBySubject.replace('.', ',')}</span></div>
                    <div class="summary-item"><span>Nilai Ujian Sekolah (${subjectName})</span><span>:</span><span>${nusBySubject.replace('.', ',')}</span></div>
                    <div class="summary-item"><span><b>Nilai Sekolah (${subjectName})</b></span><span>:</span><span><b>${nilaiSekolahBySubject.replace('.', ',')}</b></span></div>
                </div>
                <div class="calculation-info" style="margin-top: 20px; border: 1px solid #ccc; padding: 10px;">
                    <h4>Keterangan Nilai Mapel: ${subjectName}</h4>
                    ${infoStatusMapel}
                    <hr>
                    <h4>Ringkasan IPK (Hanya Mapel yang Diujiankan)</h4>
                    <div class="summary-item"><span>Rata-rata Rapor (Mapel Ujian)</span><span>:</span><span>${avgKogOverall.replace('.', ',')}</span></div>
                    <div class="summary-item"><span>Rata-rata NUS (Mapel Ujian)</span><span>:</span><span>${nusOverall.replace('.', ',')}</span></div>
                    <div class="summary-item" style="font-size: 1.2em;"><span><strong>IPK AKHIR</strong></span><span>:</span><span><strong>${nilaiSekolahOverall.replace('.', ',')}</strong></span></div>
                    <p style="font-size: 0.8em; font-style: italic;">*Catatan: Mapel lintas minat/IPS lama yang tidak diujiankan di kelas IPA ditampilkan di tabel tapi tidak memengaruhi IPK Akhir.</p>
                </div>
            `;
            studentDetailsDiv.style.display = 'block';
        }
    } // --- AKHIR DARI initializeApp() ---
