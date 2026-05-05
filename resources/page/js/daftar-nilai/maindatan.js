document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SETUP KREDENSIAL ---
    const loginFormDiv = document.getElementById('login-form');
    const memberIdInput = document.getElementById('member-id-input');
    const accessCodeInput = document.getElementById('access-code-input');
    const submitAccessCodeBtn = document.getElementById('submit-access-code');
    const loginErrorP = document.getElementById('login-error');
    const appContentMain = document.getElementById('app-content');
    const credentialsUrl = 'https://sekolah.github.io/json/credentials.json'; 

    let MEMBER_CREDENTIALS = {};

    fetch(credentialsUrl)
        .then(response => {
            if (!response.ok) throw new Error(`Gagal memuat kredensial: ${response.statusText}`);
            return response.json();
        })
        .then(data => { MEMBER_CREDENTIALS = data; })
        .catch(error => {
            console.error("Error loading credentials:", error);
            loginErrorP.textContent = "Gagal memuat data kredensial.";
            loginErrorP.style.display = 'block';
            submitAccessCodeBtn.disabled = true;
        });

    // --- 2. FUNGSI UTAMA APLIKASI ---
    function initializeApp() {
        
        // --- OBJEK KONFIGURASI TAHUNAN ---
        // Anda bisa mengatur calculateAllSubjects di sini untuk tiap tahun
        const yearConfigurations = {
            '2024': {
                maxSemester: 6,
                kogWeight: 0.50,
                nusWeight: 0.50,
                usePsik: false,
                calculateAllSubjects: false
            },
            '2025': {
                maxSemester: 5,
                kogWeight: 0.70,
                nusWeight: 0.30,
                usePsik: false,
                calculateAllSubjects: false
            },
            '2026': {
                maxSemester: 6,
                kogWeight: 0.70,
                nusWeight: 0.30,
                usePsik: true,
                calculateAllSubjects: false // Ubah ke true jika ingin hitung semua mapel rapor ke IPK
            },
        };

        const defaultConfiguration = {
            maxSemester: 5,
            kogWeight: 0.60,
            nusWeight: 0.40,
            usePsik: false,
            calculateAllSubjects: false
        };

        const yearSelect = document.getElementById('year-select');
        const studentSelect = document.getElementById('student-select');
        const subjectSelect = document.getElementById('subject-select');
        const studentDetailsDiv = document.getElementById('student-details');
        const studentSelectionDiv = document.getElementById('student-selection');
        const subjectSelectionDiv = document.getElementById('subject-selection');

        let currentStudentsData = [];
        let currentSelectedStudent = null;

        // --- HELPER FORMAT INDONESIA (2 Desimal Tetap) ---
        function formatIndo(num) {
            if (num === 'N/A' || isNaN(num)) return 'N/A';
            return parseFloat(num).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        // --- HELPER PEMBULATAN AKURAT (Standard Math/Excel) ---
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
                    const val = config.usePsik ? (data.kog + data.psik) / 2 : data.kog;
                    totalValue += val;
                    count++; 
                }
            }
            return count > 0 ? roundAcurate(totalValue / count) : 'N/A';
        }

        function calculateNilaiSekolahBySubject(avgKog, nus, year) {
            if (avgKog === 'N/A') return 'N/A';
            const config = yearConfigurations[year] || defaultConfiguration;
            if (nus !== 'N/A') {
                const raw = (avgKog * config.kogWeight) + (parseFloat(nus) * config.nusWeight);
                return roundAcurate(raw);
            }
            return roundAcurate(avgKog); // 100% Rapor jika non-ujian
        }

        // IPK UTAMA (Mengikuti Config calculateAllSubjects)
        function calculateIPK(studentGrades, year) {
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
                    const ns = calculateNilaiSekolahBySubject(avgKog, nusVal, year);
                    sumOfNS += ns;
                    totalMapel++;
                }
            });

            return totalMapel > 0 ? roundAcurate(sumOfNS / totalMapel) : 'N/A';
        }

        // --- HANDLER TAMPILAN ---
        function displayStudentSubjectGrades(student, subjectName, year) {
            const config = yearConfigurations[year] || defaultConfiguration;
            const grades = student.grades;
            
            const avgKog = calculateKogAvgBySubject(grades, subjectName, year);
            const nusVal = (grades.nus && grades.nus[subjectName] !== undefined) ? grades.nus[subjectName] : 'N/A';
            const nsVal = calculateNilaiSekolahBySubject(avgKog, nusVal, year);
            const ipkFinal = calculateIPK(grades, year);

            let tableRows = '';
            for (let i = 1; i <= 6; i++) {
                const data = grades[`s${i}`]?.[subjectName];
                tableRows += `<tr>
                    <td>Semester ${i}</td>
                    <td>${data ? formatIndo(data.kog) : '-'}</td>
                    <td>${data ? formatIndo(data.psik) : '-'}</td>
                </tr>`;
            }

            studentDetailsDiv.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3>Laporan Nilai: ${student.name}</h3>
                    <p>NIS/NISN: ${student.nis} / ${student.nisn} | Kelas: ${student.class}</p>

                    <h4 style="background:#333; color:white; padding:10px;">Mata Pelajaran: ${subjectName}</h4>
                    <table style="width:100%; border-collapse: collapse; text-align:center;" border="1">
                        <thead>
                            <tr style="background:#f2f2f2;"><th rowspan="2">Semester</th><th colspan="2">Nilai</th></tr>
                            <tr style="background:#f2f2f2;"><th>Kognitif</th><th>Psikomotorik</th></tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>

                    <div style="background:#f9f9f9; padding:15px; margin-top:20px; border-radius:5px;">
                        <div style="display:flex; justify-content:space-between;">
                            <span>Rata-rata Rapor (${config.usePsik ? 'Kog+Psik' : 'Kog'})</span>
                            <strong>${formatIndo(avgKog)}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span>Nilai Ujian Sekolah (NUS)</span>
                            <strong>${formatIndo(nusVal)}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; color:#d32f2f; font-size:1.1em; border-top:1px solid #ccc; padding-top:5px;">
                            <span><strong>Nilai Sekolah Akhir</strong></span>
                            <strong>${formatIndo(nsVal)}</strong>
                        </div>
                    </div>

                    <div style="margin-top:20px; padding:15px; background:#ffeb3b; border: 2px solid #fbc02d; border-radius:5px;">
                        <div style="display:flex; justify-content:space-between; font-size:1.2em;">
                            <span><strong>IPK AKHIR SISTEM</strong></span>
                            <strong>${formatIndo(ipkFinal)}</strong>
                        </div>
                        <small>*IPK dihitung berdasarkan ${config.calculateAllSubjects ? 'Semua Mata Pelajaran' : 'Mata Pelajaran Ujian'}</small>
                    </div>
                </div>
            `;
            studentDetailsDiv.style.display = 'block';
        }

        // --- EVENT LISTENERS (Disederhanakan) ---
        yearSelect.addEventListener('change', async (e) => {
            const y = e.target.value;
            if(!y) return;
            const resp = await fetch(`https://sekolah.github.io/json/daftar-nilai/students_${y}.json`);
            currentStudentsData = await resp.json();
            studentSelect.innerHTML = '<option value="">-- Pilih Siswa --</option>';
            currentStudentsData.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id; opt.textContent = s.name;
                studentSelect.appendChild(opt);
            });
            studentSelectionDiv.style.display = 'block';
        });

        studentSelect.addEventListener('change', (e) => {
            const id = e.target.value;
            currentSelectedStudent = currentStudentsData.find(s => s.id === id);
            if(!currentSelectedStudent) return;
            
            const subjects = new Set();
            const config = yearConfigurations[yearSelect.value] || defaultConfiguration;
            for(let i=1; i<=config.maxSemester; i++) {
                if(currentSelectedStudent.grades[`s${i}`]) Object.keys(currentSelectedStudent.grades[`s${i}`]).forEach(m => subjects.add(m));
            }
            subjectSelect.innerHTML = '<option value="">-- Pilih Mapel --</option>';
            Array.from(subjects).sort().forEach(m => {
                const opt = document.createElement('option');
                opt.value = m; opt.textContent = m;
                subjectSelect.appendChild(opt);
            });
            subjectSelectionDiv.style.display = 'block';
        });

        subjectSelect.addEventListener('change', (e) => {
            if(e.target.value && currentSelectedStudent) {
                displayStudentSubjectGrades(currentSelectedStudent, e.target.value, yearSelect.value);
            }
        });
    }

    // --- 3. LOGIN LOGIC ---
    submitAccessCodeBtn.addEventListener('click', () => {
        const id = memberIdInput.value.trim();
        const code = accessCodeInput.value.trim();
        if (MEMBER_CREDENTIALS[id] === code) {
            loginFormDiv.style.display = 'none';
            appContentMain.style.display = 'block';
            initializeApp();
        } else {
            loginErrorP.style.display = 'block';
        }
    });
});
        function getNusBySubject(nusGrades, subjectName) {
            if (nusGrades && typeof nusGrades === 'object' && nusGrades[subjectName] !== undefined) {
                return parseFloat(nusGrades[subjectName]).toFixed(2);
            }
            return 'N/A';
        }

        // 2. Nilai Sekolah per mapel (70/30 atau 100% jika tidak diujiankan)
        function calculateNilaiSekolahBySubject(avgKogBySubject, nusBySubject, year) {
            if (avgKogBySubject === 'N/A') return 'N/A';
            const config = yearConfigurations[year] || defaultConfiguration;
            const avg = parseFloat(avgKogBySubject);

            if (nusBySubject !== 'N/A' && nusBySubject !== undefined) {
                const nus = parseFloat(nusBySubject);
                return ((avg * config.kogWeight) + (nus * config.nusWeight)).toFixed(2);
            } else {
                return avg.toFixed(2); // Fallback ke 100% rapor jika tidak ujian
            }
        }
        
        // 3. IPK Rapor (HANYA menghitung mapel yang ada di daftar NUS)
        function calculateKogAvgOverall(studentGrades, year) {
            const config = yearConfigurations[year] || defaultConfiguration;
            const nusGrades = studentGrades.nus || {};
            const subjectsInNus = Object.keys(nusGrades);
           
            let sumOfAverages = 0;
            let totalSubjects = 0;

            subjectsInNus.forEach(subjectName => {
                let totalValueMapel = 0;
                let countSemesterMapel = 0;

                for (let i = 1; i <= config.maxSemester; i++) {
                    const semesterKey = `s${i}`;
                    if (studentGrades[semesterKey] && studentGrades[semesterKey][subjectName]) {
                        const data = studentGrades[semesterKey][subjectName];
                        // Hitung Kog/Psik
                        const val = config.usePsik ? (data.kog + data.psik) / 2 : data.kog;
                        totalValueMapel += val;
                        countSemesterMapel++;
                    }
                }

                if (countSemesterMapel > 0) {
                    // PENTING: Kita bulatkan rata-rata PER MAPEL dulu ke 2 desimal (seperti di kolom Excel)
                    const avgMapel = parseFloat((totalValueMapel / countSemesterMapel).toFixed(2));
                    sumOfAverages += avgMapel;
                    totalSubjects++;
                }
            });

            // Hasil akhir pembagian total rata-rata mapel
            return totalSubjects > 0 ? (sumOfAverages / totalSubjects).toFixed(2) : 'N/A';
        }

        function calculateNusOverall(nusGrades) {
            if (!nusGrades || typeof nusGrades !== 'object') return 'N/A';
            let totalNus = 0;
            let count = 0;
            for (const subject in nusGrades) {
                const nilai = nusGrades[subject];
                if (nilai !== undefined && nilai !== null && !isNaN(nilai) && nilai !== "") {
                    // Bulatkan per item NUS jika di Excel Anda juga dibulatkan
                    totalNus += parseFloat(parseFloat(nilai).toFixed(2));
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

        // --- EVENT LISTENERS (Year, Student, Subject) ---

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
                    const BASE_JSON_URL = 'https://schoolsmaya.github.io/manajemen-js-css/resources/page/json/daftar-nilai/';
                    const response = await fetch(`${BASE_JSON_URL}students_${selectedYear}.json`);
                    if (!response.ok) throw new Error(`Status: ${response.status}`);
                    currentStudentsData = await response.json();
                    if (currentStudentsData.length > 0) {
                        currentStudentsData.forEach(student => {
                            const option = document.createElement('option');
                            option.value = student.id; option.textContent = student.name;
                            studentSelect.appendChild(option);
                        });
                        studentSelectionDiv.style.display = 'block';
                    }
                } catch (error) { console.error(error); alert("Gagal memuat data siswa."); }
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

        // --- FUNGSI TAMPILAN DETAIL (FINAL LOGIC) ---
        function displayStudentSubjectGrades(student, subjectName, year) {
            const grades = student.grades;
            const config = yearConfigurations[year] || defaultConfiguration;
            const labelTipeNilai = config.usePsik ? "Kog & Psik" : "Kog";
            
            const avgKogBySubject = calculateKogAvgBySubject(grades, subjectName, year);
            const nusBySubject = getNusBySubject(grades.nus, subjectName);
            const nilaiSekolahBySubject = calculateNilaiSekolahBySubject(avgKogBySubject, nusBySubject, year);

            // Teks Rentang Semester
            const semesterRangeText = `semester 1 sampai semester ${config.maxSemester}`;

            // Logika Keterangan Dinamis (Warnai Biru untuk Mapel Ujian, Oranye untuk Non-Ujian)
            let infoStatusMapel;
            if (nusBySubject !== 'N/A') {
                infoStatusMapel = `
                    <div style="background:#e7f3ff; padding:10px; border-left:5px solid #2196F3; margin:10px 0;">
                        <strong>Status: Mapel Diujiankan</strong><br>
                        Nilai akhir mata pelajaran ini <strong>berkontribusi</strong> terhadap IPK Utama.<br>
                        Rumus: (Rata-rata ${labelTipeNilai} &times; ${config.kogWeight}) + (NUS &times; ${config.nusWeight})
                    </div>
                `;
            } else {
                infoStatusMapel = `
                    <div style="background:#fff3e0; padding:10px; border-left:5px solid #ff9800; margin:10px 0;">
                        <strong>Status: Mapel Non-Ujian</strong><br>
                        Mata pelajaran ini <strong>tidak dihitung</strong> dalam IPK Utama.<br>
                        Rumus: Murni Rata-rata Rapor (100%)
                    </div>
                `;
            }

            // Hitung Variabel IPK (Hanya Mapel yang ada di NUS)
            const avgKogOverall = calculateKogAvgOverall(grades, year);
            const nusOverall = calculateNusOverall(grades.nus);
            const nilaiSekolahOverall = calculateNilaiSekolahOverall(avgKogOverall, nusOverall, year);

            let tableRows = '';
            for (let i = 1; i <= 6; i++) {
                const semKey = `s${i}`;
                const data = grades[semKey]?.[subjectName];
                const kDisp = data ? parseFloat(data.kog).toFixed(2).replace('.', ',') : 'N/A';
                const pDisp = data ? parseFloat(data.psik).toFixed(2).replace('.', ',') : 'N/A';
                tableRows += `<tr><td>Semester ${i}</td><td>${kDisp}</td><td>${pDisp}</td></tr>`;
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

                    <h4 style="background:#333; color:white; padding:10px;">Mata Pelajaran: ${subjectName}</h4>
                    <table style="width:100%; border-collapse: collapse; margin-bottom: 20px; text-align:center;" border="1">
                        <thead>
                            <tr style="background:#f2f2f2;"><th rowspan="2">Semester</th><th colspan="2">Nilai Semester</th></tr>
                            <tr style="background:#f2f2f2;"><th>Kognitif</th><th>Psikomotorik</th></tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>

                    <div class="summary-section" style="background:#f9f9f9; padding:15px; border-radius:5px;">
                        <div class="summary-item" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>Rata-rata ${labelTipeNilai} (${subjectName})</span>
                            <strong>${avgKogBySubject.replace('.', ',')}</strong>
                        </div>
                        <div class="summary-item" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>Nilai Ujian Sekolah (NUS)</span>
                            <strong>${nusBySubject.replace('.', ',')}</strong>
                        </div>
                        <div class="summary-item" style="display:flex; justify-content:space-between; border-top:1px solid #ccc; padding-top:5px; font-size:1.1em; color:#d32f2f;">
                            <span><strong>Nilai Sekolah (${subjectName})</strong></span>
                            <strong>${nilaiSekolahBySubject.replace('.', ',')}</strong>
                        </div>
                    </div>

                    <div class="calculation-info" style="margin-top:20px; font-size:0.9em;">
                        <h4>Keterangan Sistem:</h4>
                        ${infoStatusMapel}
                        
                        <hr style="margin:20px 0;">
                        
                        <h4 style="color:#2c3e50;">Ringkasan IPK Akhir (Seluruh Mata Pelajaran Diujiankan)</h4>
                        <p style="font-style:italic; color:#666;">*Hanya menghitung mata pelajaran yang terdaftar dalam Ujian Sekolah (NUS).</p>
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>Rata-rata Rapor (Mapel Ujian)</span>
                            <span>${avgKogOverall.replace('.', ',')}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>Rata-rata NUS (Mapel Ujian)</span>
                            <span>${nusOverall.replace('.', ',')}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-top:10px; padding:15px; background:#ffeb3b; color:#000000; border: 2px solid #fbc02d; border-radius:5px; font-size:1.2em;">
                            <span><strong>IPK AKHIR</strong></span>
                            <span><strong>${nilaiSekolahOverall.replace('.', ',')}</strong></span>
                        </div>
                    </div>
                </div>
            `;
            studentDetailsDiv.style.display = 'block';
        }
    } // --- AKHIR DARI initializeApp() ---


        // --- 2. LOGIKA PENANGANAN LOGIN ---

    // Awalnya, sembunyikan aplikasi utama dan tampilkan formulir login
    appContentMain.style.display = 'none';
    loginFormDiv.style.display = 'block';
    loginErrorP.style.display = 'none'; // Sembunyikan pesan error awal

    // Tambahkan event listener untuk tombol 'Masuk'
    submitAccessCodeBtn.addEventListener('click', () => {
        const enteredMemberId = memberIdInput.value.trim(); // Ambil nomor anggota dan hapus spasi
        const enteredAccessCode = accessCodeInput.value.trim(); // Ambil sandi dan hapus spasi

        // Cek apakah nomor anggota dan sandi cocok dengan yang ada di daftar
        if (MEMBER_CREDENTIALS[enteredMemberId] === enteredAccessCode) {
            // Jika cocok:
            loginFormDiv.style.display = 'none'; // Sembunyikan formulir login
            appContentMain.style.display = 'block'; // Tampilkan aplikasi utama
            loginErrorP.style.display = 'none'; // Sembunyikan pesan error
            initializeApp(); // Panggil fungsi untuk menjalankan aplikasi
        } else {
            // Jika tidak cocok:
            loginErrorP.textContent = "Nomor anggota atau kode akses salah. Silakan coba lagi.";
            loginErrorP.style.display = 'block'; // Tampilkan pesan error
        }
    });
});

