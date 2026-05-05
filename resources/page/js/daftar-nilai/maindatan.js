// maindatan
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. AMBIL ELEMEN HTML UNTUK LOGIN ---
    const loginFormDiv = document.getElementById('login-form');
    const memberIdInput = document.getElementById('member-id-input');
    const accessCodeInput = document.getElementById('access-code-input');
    const submitAccessCodeBtn = document.getElementById('submit-access-code');
    const loginErrorP = document.getElementById('login-error');
    const appContentMain = document.getElementById('app-content');
    const credentialsUrl = 'https://sekolah.github.io/json/credentials.json'; 

    let MEMBER_CREDENTIALS = {}; 

    // Muat Kredensial
    fetch(credentialsUrl)
        .then(response => {
            if (!response.ok) throw new Error(`Gagal memuat: ${response.statusText}`);
            return response.json();
        })
        .then(data => { MEMBER_CREDENTIALS = data; })
        .catch(error => {
            console.error("Error loading credentials:", error);
            loginErrorP.textContent = "Gagal memuat data kredensial.";
            loginErrorP.style.display = 'block';
        });

    // --- 2. FUNGSI UTAMA APLIKASI ---
    function initializeApp() {
        
        // --- OBJEK KONFIGURASI TAHUNAN ---
        const yearConfigurations = {
            '2024': { maxSemester: 6, kogWeight: 0.50, nusWeight: 0.50, usePsik: false, calculateAllSubjects: false },
            '2025': { maxSemester: 5, kogWeight: 0.70, nusWeight: 0.30, usePsik: false, calculateAllSubjects: false },
            '2026': { 
                maxSemester: 6, 
                kogWeight: 0.70, 
                nusWeight: 0.30, 
                usePsik: true, 
                calculateAllSubjects: false // Ubah ke true jika ingin hitung semua mapel rapor ke IPK
            },
        };

        const defaultConfiguration = { maxSemester: 5, kogWeight: 0.60, nusWeight: 0.40, usePsik: false, calculateAllSubjects: false };

        const yearSelect = document.getElementById('year-select');
        const studentSelectionDiv = document.getElementById('student-selection');
        const studentSelect = document.getElementById('student-select');
        const subjectSelectionDiv = document.getElementById('subject-selection');
        const subjectSelect = document.getElementById('subject-select');
        const studentDetailsDiv = document.getElementById('student-details');

        let currentStudentsData = [];
        let currentSelectedStudent = null;

        // --- HELPER FORMAT INDONESIA & PEMBULATAN ---
        function formatIndo(num) {
            if (num === 'N/A' || isNaN(num) || num === undefined) return 'N/A';
            return parseFloat(num).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function roundAcurate(num) {
            return Math.round((num + Number.EPSILON) * 100) / 100;
        }

        // --- FUNGSI PERHITUNGAN ---

        function calculateKogAvgBySubject(studentGrades, subjectName, year) {
            const config = yearConfigurations[year] || defaultConfiguration;
            let totalValue = 0, count = 0;
            for (let i = 1; i <= config.maxSemester; i++) {
                const data = studentGrades[`s${i}`]?.[subjectName];
                if (data) {
                    totalValue += config.usePsik ? (data.kog + data.psik) / 2 : data.kog;
                    count++; 
                }
            }
            return count > 0 ? roundAcurate(totalValue / count) : 'N/A';
        }

        function calculateNilaiSekolahBySubject(avgKog, nus, year) {
            if (avgKog === 'N/A') return 'N/A';
            const config = yearConfigurations[year] || defaultConfiguration;
            if (nus !== 'N/A' && nus !== undefined) {
                return roundAcurate((parseFloat(avgKog) * config.kogWeight) + (parseFloat(nus) * config.nusWeight));
            }
            return roundAcurate(avgKog); 
        }

        function calculateIPKOverall(studentGrades, year) {
            const config = yearConfigurations[year] || defaultConfiguration;
            const nusGrades = studentGrades.nus || {};
            let listMapel;

            if (config.calculateAllSubjects) {
                const allMapelSet = new Set();
                for (let i = 1; i <= config.maxSemester; i++) {
                    if (studentGrades[`s${i}`]) Object.keys(studentGrades[`s${i}`]).forEach(m => allMapelSet.add(m));
                }
                listMapel = Array.from(allMapelSet);
            } else {
                listMapel = Object.keys(nusGrades);
            }

            let sumOfNS = 0, totalMapel = 0;
            listMapel.forEach(subject => {
                const avgKog = calculateKogAvgBySubject(studentGrades, subject, year);
                if (avgKog !== 'N/A') {
                    const nusVal = (nusGrades[subject] !== undefined) ? nusGrades[subject] : 'N/A';
                    sumOfNS += calculateNilaiSekolahBySubject(avgKog, nusVal, year);
                    totalMapel++;
                }
            });
            return totalMapel > 0 ? roundAcurate(sumOfNS / totalMapel) : 'N/A';
        }

        // --- EVENT LISTENERS ---

        yearSelect.addEventListener('change', async (event) => {
            const selectedYear = event.target.value;
            studentSelect.innerHTML = '<option value="">-- Pilih Siswa --</option>';
            subjectSelect.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
            studentSelectionDiv.style.display = 'none';
            subjectSelectionDiv.style.display = 'none';
            studentDetailsDiv.style.display = 'none';

            if (selectedYear) {
                try {
                    const response = await fetch(`https://sekolah.github.io/json/daftar-nilai/students_${selectedYear}.json`);
                    currentStudentsData = await response.json();
                    currentStudentsData.forEach(student => {
                        const option = document.createElement('option');
                        option.value = student.id; option.textContent = student.name;
                        studentSelect.appendChild(option);
                    });
                    studentSelectionDiv.style.display = 'block';
                } catch (error) { console.error(error); alert("Gagal memuat data siswa."); }
            }
        });

        studentSelect.addEventListener('change', (event) => {
            const studentId = event.target.value;
            if (studentId) {
                currentSelectedStudent = currentStudentsData.find(s => s.id === studentId);
                const config = yearConfigurations[yearSelect.value] || defaultConfiguration;
                let subjects = new Set();
                for(let i = 1; i <= config.maxSemester; i++) {
                    if (currentSelectedStudent.grades[`s${i}`]) Object.keys(currentSelectedStudent.grades[`s${i}`]).forEach(s => subjects.add(s));
                }
                if (currentSelectedStudent.grades.nus) Object.keys(currentSelectedStudent.grades.nus).forEach(s => subjects.add(s));
                
                subjectSelect.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
                Array.from(subjects).sort().forEach(s => {
                    const option = document.createElement('option');
                    option.value = s; option.textContent = s;
                    subjectSelect.appendChild(option);
                });
                subjectSelectionDiv.style.display = 'block';
                studentDetailsDiv.style.display = 'none';
            }
        });

        subjectSelect.addEventListener('change', (event) => {
            if (event.target.value && currentSelectedStudent) {
                displayStudentSubjectGrades(currentSelectedStudent, event.target.value, yearSelect.value);
            }
        });

        // --- FUNGSI TAMPILAN DETAIL ---
        function displayStudentSubjectGrades(student, subjectName, year) {
            const grades = student.grades;
            const config = yearConfigurations[year] || defaultConfiguration;
            const labelTipeNilai = config.usePsik ? "Kog & Psik" : "Kog";
            
            const avgKogBySubject = calculateKogAvgBySubject(grades, subjectName, year);
            const nusBySubject = (grades.nus && grades.nus[subjectName] !== undefined) ? grades.nus[subjectName] : 'N/A';
            const nsBySubject = calculateNilaiSekolahBySubject(avgKogBySubject, nusBySubject, year);
            const ipkFinal = calculateIPKOverall(grades, year);

            let infoStatusMapel = (nusBySubject !== 'N/A') ? `
                <div style="background:#e7f3ff; padding:10px; border-left:5px solid #2196F3; margin:10px 0; text-align:left;">
                    <strong>Status: Mapel Diujiankan</strong><br>
                    Nilai ini berkontribusi terhadap IPK Utama.<br>
                    Rumus: (${labelTipeNilai} &times; ${config.kogWeight}) + (NUS &times; ${config.nusWeight})
                </div>` : `
                <div style="background:#fff3e0; padding:10px; border-left:5px solid #ff9800; margin:10px 0; text-align:left;">
                    <strong>Status: Mapel Non-Ujian</strong><br>
                    Mata pelajaran ini tidak dihitung dalam IPK Utama.<br>
                    Rumus: Murni Rata-rata Rapor (100%)
                </div>`;

            let tableRows = '';
            for (let i = 1; i <= 6; i++) {
                const data = grades[`s${i}`]?.[subjectName];
                tableRows += `<tr>
                    <td>Semester ${i}</td>
                    <td>${data ? formatIndo(data.kog) : 'N/A'}</td>
                    <td>${data ? formatIndo(data.psik) : 'N/A'}</td>
                </tr>`;
            }

            studentDetailsDiv.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3>Laporan Nilai: ${student.name}</h3>
                    <div class="student-identity" style="margin-bottom: 20px; text-align:left;">
                        <div style="display:flex;"><span style="width:120px;">NIS / NISN</span><span>: ${student.nis} / ${student.nisn}</span></div>
                        <div style="display:flex;"><span style="width:120px;">Kelas</span><span>: ${student.class}</span></div>
                        <div style="display:flex;"><span style="width:120px;">Peminatan</span><span>: ${student.peminatan}</span></div>
                        <div style="display:flex;"><span style="width:120px;">Tahun Lulus</span><span>: ${year}</span></div>
                    </div>

                    <h4 style="background:#333; color:white; padding:10px; margin-bottom:0;">Mata Pelajaran: ${subjectName}</h4>
                    <table style="width:100%; border-collapse: collapse; margin-bottom: 20px; text-align:center;" border="1">
                        <thead>
                            <tr style="background:#f2f2f2;"><th rowspan="2">Semester</th><th colspan="2">Nilai Semester</th></tr>
                            <tr style="background:#f2f2f2;"><th>Kognitif</th><th>Psikomotorik</th></tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>

                    <div style="background:#f9f9f9; padding:15px; border-radius:5px; border:1px solid #ddd;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>Rata-rata ${labelTipeNilai}</span>
                            <strong>${formatIndo(avgKogBySubject)}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>Nilai Ujian Sekolah (NUS)</span>
                            <strong>${formatIndo(nusBySubject)}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; border-top:1px solid #ccc; padding-top:5px; font-size:1.1em; color:#d32f2f;">
                            <span><strong>Nilai Sekolah (${subjectName})</strong></span>
                            <strong>${formatIndo(nsBySubject)}</strong>
                        </div>
                    </div>

                    <div style="margin-top:20px; font-size:0.9em; text-align:left;">
                        <h4>Keterangan Sistem:</h4>
                        ${infoStatusMapel}
                        <hr style="margin:20px 0;">
                        <h4 style="color:#2c3e50;">Ringkasan IPK Akhir</h4>
                        <p style="font-style:italic; color:#666;">*Berdasarkan: ${config.calculateAllSubjects ? 'Seluruh Mata Pelajaran' : 'Hanya Mapel Ujian'}.</p>
                        <div style="display:flex; justify-content:space-between; margin-top:10px; padding:15px; background:#ffeb3b; border: 2px solid #fbc02d; border-radius:5px; font-size:1.2em;">
                            <span><strong>IPK AKHIR</strong></span>
                            <span><strong>${formatIndo(ipkFinal)}</strong></span>
                        </div>
                    </div>
                </div>`;
            studentDetailsDiv.style.display = 'block';
        }
    }

    // --- 3. LOGIKA LOGIN ---
    appContentMain.style.display = 'none';
    loginFormDiv.style.display = 'block';

    submitAccessCodeBtn.addEventListener('click', () => {
        const id = memberIdInput.value.trim();
        const code = accessCodeInput.value.trim();
        if (MEMBER_CREDENTIALS[id] === code) {
            loginFormDiv.style.display = 'none';
            appContentMain.style.display = 'block';
            initializeApp();
        } else {
            loginErrorP.textContent = "ID atau Kode Akses Salah.";
            loginErrorP.style.display = 'block';
        }
    });
});
