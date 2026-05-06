// maindatan
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ELEMEN HTML LOGIN ---
    const loginFormDiv = document.getElementById('login-form');
    const memberIdInput = document.getElementById('member-id-input');
    const accessCodeInput = document.getElementById('access-code-input');
    const submitAccessCodeBtn = document.getElementById('submit-access-code');
    const loginErrorP = document.getElementById('login-error');
    const appContentMain = document.getElementById('app-content');
    const credentialsUrl = 'https://schoolsmaya.github.io/manajemen-js-css/resources/member/json/credentials.json'; 

    let MEMBER_CREDENTIALS = {}; 

    fetch(credentialsUrl)
        .then(response => {
            if (!response.ok) throw new Error(`Gagal memuat kredensial: ${response.statusText}`);
            return response.json();
        })
        .then(data => { MEMBER_CREDENTIALS = data; })
        .catch(error => {
            console.error("Error:", error);
            loginErrorP.textContent = "Gagal memuat data kredensial.";
            loginErrorP.style.display = 'block';
        });

    // --- 2. FUNGSI UTAMA APLIKASI ---
    function initializeApp() {
        const yearConfigurations = {
            '2024': { maxSemester: 6, kogWeight: 0.50, nusWeight: 0.50, usePsik: false, calculateAllSubjects: false },
            '2025': { maxSemester: 5, kogWeight: 0.70, nusWeight: 0.30, usePsik: false, calculateAllSubjects: false },
            '2026': { 
                maxSemester: 6, 
                kogWeight: 0.70, 
                nusWeight: 0.30, 
                usePsik: true, 
                calculateAllSubjects: false // TRUE = Hitung per mapel (Mikro), FALSE = Hitung dari rata-rata total (Makro)
            },
        };

        const defaultConfiguration = { maxSemester: 5, kogWeight: 0.60, nusWeight: 0.40, usePsik: false, calculateAllSubjects: false };

        const yearSelect = document.getElementById('year-select');
        const studentSelect = document.getElementById('student-select');
        const subjectSelect = document.getElementById('subject-select');
        const studentDetailsDiv = document.getElementById('student-details');

        let currentStudentsData = [];
        let currentSelectedStudent = null;

        // --- HELPER PEMBULATAN & FORMAT ---
        function formatIndo(num) {
            if (num === 'N/A' || isNaN(num) || num === null) return 'N/A';
            return parseFloat(num).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function roundAccurate(num) {
            return Math.round((num + Number.EPSILON) * 100) / 100;
        }

        // --- FUNGSI PERHITUNGAN ---

        // Hitung Rata-rata satu Mata Pelajaran (Rapor)
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
            return count > 0 ? roundAccurate(totalValue / count) : 'N/A';
        }

        // Hitung Nilai Sekolah per Mata Pelajaran (Rapor + NUS)
        function calculateNilaiSekolahBySubject(avgKog, nus, year) {
            if (avgKog === 'N/A') return 'N/A';
            const config = yearConfigurations[year] || defaultConfiguration;
            if (nus !== 'N/A' && nus !== undefined && nus !== null) {
                return roundAccurate((parseFloat(avgKog) * config.kogWeight) + (parseFloat(nus) * config.nusWeight));
            }
            return roundAccurate(avgKog);
        }

        // Hitung Rata-rata Rapor Seluruh Mapel (Hanya Rapor)
        function calculateKogAvgOverall(studentGrades, year) {
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

            let sumOfAverages = 0, totalSubjects = 0;
            listMapel.forEach(subjectName => {
                const avgMapel = calculateKogAvgBySubject(studentGrades, subjectName, year);
                if (avgMapel !== 'N/A') {
                    sumOfAverages += avgMapel;
                    totalSubjects++;
                }
            });
            return totalSubjects > 0 ? roundAccurate(sumOfAverages / totalSubjects) : 'N/A';
        }

        // Hitung Rata-rata NUS Seluruh Mapel
        function calculateNusOverall(nusGrades) {
            if (!nusGrades || typeof nusGrades !== 'object') return 'N/A';
            let totalNus = 0, count = 0;
            for (const subject in nusGrades) {
                const nilai = parseFloat(nusGrades[subject]);
                if (!isNaN(nilai)) {
                    totalNus += roundAccurate(nilai);
                    count++;
                }
            }
            return count > 0 ? roundAccurate(totalNus / count) : 'N/A';
        }

        // LOGIKA IPK AKHIR (Sesuai Permintaan Bapak)
        function calculateIPKFinal(studentGrades, year) {
            const config = yearConfigurations[year] || defaultConfiguration;
            const nusGrades = studentGrades.nus || {};
            
            if (config.calculateAllSubjects) {
                // LOGIKA TRUE: (NS Mapel Ujian + Rapor Mapel Non-Ujian) / Total Seluruh Mapel
                const allMapelSet = new Set();
                for (let i = 1; i <= config.maxSemester; i++) {
                    if (studentGrades[`s${i}`]) Object.keys(studentGrades[`s${i}`]).forEach(m => allMapelSet.add(m));
                }
                const listMapel = Array.from(allMapelSet);
                
                let sumOfNS = 0, totalMapel = 0;
                listMapel.forEach(subject => {
                    const avgKog = calculateKogAvgBySubject(studentGrades, subject, year);
                    if (avgKog !== 'N/A') {
                        const nusVal = (nusGrades[subject] !== undefined) ? nusGrades[subject] : 'N/A';
                        sumOfNS += calculateNilaiSekolahBySubject(avgKog, nusVal, year);
                        totalMapel++;
                    }
                });
                return totalMapel > 0 ? roundAccurate(sumOfNS / totalMapel) : 'N/A';

            } else {
                // LOGIKA FALSE: (Rata-rata Rapor Mapel Ujian * %) + (Rata-rata NUS * %)
                const avgKogOverall = calculateKogAvgOverall(studentGrades, year); 
                const nusOverall = calculateNusOverall(nusGrades);
                
                if (avgKogOverall === 'N/A' || nusOverall === 'N/A') return 'N/A';
                
                return roundAccurate(
                    (avgKogOverall * config.kogWeight) + (nusOverall * config.nusWeight)
                );
            }
        }

        // --- EVENT LISTENERS ---
        yearSelect.addEventListener('change', async (e) => {
            const val = e.target.value;
            studentSelect.innerHTML = '<option value="">-- Pilih Siswa --</option>';
            subjectSelect.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
            document.getElementById('student-selection').style.display = 'none';
            document.getElementById('subject-selection').style.display = 'none';
            studentDetailsDiv.style.display = 'none';
            if (val) {
                const res = await fetch(`https://schoolsmaya.github.io/manajemen-js-css/resources/page/json/daftar-nilai/students_${val}.json`);
                currentStudentsData = await res.json();
                currentStudentsData.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id; opt.textContent = s.name;
                    studentSelect.appendChild(opt);
                });
                document.getElementById('student-selection').style.display = 'block';
            }
        });

        studentSelect.addEventListener('change', (e) => {
            const sid = e.target.value;
            subjectSelect.innerHTML = '<option value="">-- Pilih Mata Pelajaran --</option>';
            studentDetailsDiv.style.display = 'none';
            if (sid) {
                currentSelectedStudent = currentStudentsData.find(s => s.id === sid);
                const subjects = new Set();
                const config = yearConfigurations[yearSelect.value] || defaultConfiguration;
                for(let i=1; i<=config.maxSemester; i++) {
                    if (currentSelectedStudent.grades[`s${i}`]) Object.keys(currentSelectedStudent.grades[`s${i}`]).forEach(s => subjects.add(s));
                }
                if (currentSelectedStudent.grades.nus) Object.keys(currentSelectedStudent.grades.nus).forEach(s => subjects.add(s));
                Array.from(subjects).sort().forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s; opt.textContent = s;
                    subjectSelect.appendChild(opt);
                });
                document.getElementById('subject-selection').style.display = 'block';
            }
        });

        subjectSelect.addEventListener('change', (e) => {
            if (e.target.value && currentSelectedStudent) {
                displayStudentSubjectGrades(currentSelectedStudent, e.target.value, yearSelect.value);
            }
        });

        // --- 3. TAMPILAN DETAIL LENGKAP ---
        function displayStudentSubjectGrades(student, subjectName, year) {
            const grades = student.grades;
            const config = yearConfigurations[year] || defaultConfiguration;
            const labelTipeNilai = config.usePsik ? "Kog & Psik" : "Kog";
            
            const avgKogBySubject = calculateKogAvgBySubject(grades, subjectName, year);
            const nusBySubject = (grades.nus && grades.nus[subjectName] !== undefined) ? grades.nus[subjectName] : 'N/A';
            const nsBySubject = calculateNilaiSekolahBySubject(avgKogBySubject, nusBySubject, year);

            const avgKogOverall = calculateKogAvgOverall(grades, year);
            const nusOverall = calculateNusOverall(grades.nus);
            const nsOverall = calculateIPKFinal(grades, year);

            let infoStatusMapel = (nusBySubject !== 'N/A') ? `
                <div style="background:#e7f3ff; padding:10px; border-left:5px solid #2196F3; margin:10px 0;">
                    <strong>Status: Mapel Diujiankan</strong><br>
                    Nilai akhir mata pelajaran ini <strong>berkontribusi</strong> terhadap IPK Utama.
                </div>` : `
                <div style="background:#fff3e0; padding:10px; border-left:5px solid #ff9800; margin:10px 0;">
                    <strong>Status: Mapel Non-Ujian</strong><br>
                    Mata pelajaran ini <strong>tidak dihitung</strong> dalam IPK Utama.
                </div>`;

            let tableRows = '';
            for (let i = 1; i <= 6; i++) {
                const data = grades[`s${i}`]?.[subjectName];
                tableRows += `<tr><td>Semester ${i}</td><td>${data ? formatIndo(data.kog) : 'N/A'}</td><td>${data ? formatIndo(data.psik) : 'N/A'}</td></tr>`;
            }

            studentDetailsDiv.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3>Laporan Nilai: ${student.name}</h3>
                    <div class="student-identity">
                        <div class="identity-item"><span>NIS</span><span>:</span><span>${student.nis}</span></div>
                        <div class="identity-item"><span>NISN</span><span>:</span><span>${student.nisn}</span></div>
                        <div class="identity-item"><span>Kelas</span><span>:</span><span>${student.class}</span></div>
                        <div class="identity-item"><span>Peminatan</span><span>:</span><span>${student.peminatan}</span></div>
                        <div class="identity-item"><span>Tahun Lulus</span><span>:</span><span>${year}</span></div>
                    </div>

                    <h4 style="background:#333; color:white; padding:10px; margin-bottom:0;">Mata Pelajaran: ${subjectName}</h4>
                                        <table style="width:100%; border-collapse: collapse; margin-bottom: 20px; text-align:center;" border="1">
                        <thead>
                            <tr style="background:#f2f2f2;"><th rowspan="2">Semester</th><th colspan="2">Nilai Semester</th></tr>
                            <tr style="background:#f2f2f2;"><th>Kognitif</th><th>Psikomotorik</th></tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>

                    <div class="summary-section" style="background:#f9f9f9; padding:15px; border-radius:5px; border:1px solid #ddd;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>Rata-rata ${labelTipeNilai} (${subjectName})</span>
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

                    <div class="calculation-info" style="margin-top:20px; font-size:0.9em; text-align:left;">
                        <h4 style="border-bottom: 2px solid #333; padding-bottom: 5px;">Keterangan & Bobot Penilaian:</h4>
                        
                        <div style="background:#f1f1f1; padding:15px; border-radius:5px; margin-top:10px;">
                            <ul style="margin:0; padding-left:20px;">
                                <li><strong>Bobot Rapor:</strong> ${config.kogWeight * 100}%</li>
                                <li><strong>Bobot Ujian (NUS):</strong> ${config.nusWeight * 100}%</li>
                                <li><strong>Batas Semester:</strong> 1 s.d ${config.maxSemester}</li>
                                <li><strong>Tipe Nilai:</strong> ${config.usePsik ? 'Kognitif & Psikomotorik' : 'Kognitif Saja'}</li>
                            </ul>
                        </div>

                        <div style="background:#e8f5e9; padding:15px; border-left:5px solid #4caf50; margin-top:10px;">
                            ${config.calculateAllSubjects 
                                ? `<strong>Metode Mikro:</strong> IPK dihitung dari rata-rata Nilai Sekolah (NS) seluruh mata pelajaran yang ada di rapor (Sem 1-${config.maxSemester}). Mapel tanpa ujian dihitung 100% rapor.`
                                : `<strong>Metode Makro:</strong> IPK dihitung dari bobot gabungan antara Rata-rata Rapor (Mapel Ujian) dan Rata-rata Nilai Ujian Sekolah (NUS).`}
                        </div>

                        <hr style="margin:20px 0;">
                        
                        <h4 style="color:#2c3e50;">Ringkasan IPK Akhir</h4>
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>Rata-rata Rapor (${config.calculateAllSubjects ? 'Semua Mapel' : 'Mapel Ujian'})</span>
                            <strong>${formatIndo(avgKogOverall)}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>Rata-rata NUS</span>
                            <strong>${formatIndo(nusOverall)}</strong>
                        </div>
                        
                        <div style="display:flex; justify-content:space-between; margin-top:10px; padding:15px; background:#ffeb3b; border: 2px solid #fbc02d; border-radius:5px; font-size:1.2em;">
                            <span><strong>IPK AKHIR (TRANSKRIP)</strong></span>
                            <strong>${formatIndo(nsOverall)}</strong>
                        </div>
                        
                        <p style="font-size:0.8em; color:red; margin-top:10px; font-style:italic;">
                            *Nilai ini merupakan hasil pembulatan dua angka di belakang koma sesuai standar ijazah.
                        </p>
                    </div>
                </div>
            `; 
            studentDetailsDiv.style.display = 'block';
        }
    }

    // --- 4. LOGIKA LOGIN ---
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
