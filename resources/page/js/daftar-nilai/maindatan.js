// maindatan
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. AMBIL ELEMEN HTML ---
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
            if (!response.ok) throw new Error(`Gagal: ${response.statusText}`);
            return response.json();
        })
        .then(data => { MEMBER_CREDENTIALS = data; })
        .catch(error => {
            console.error("Error:", error);
            loginErrorP.textContent = "Gagal memuat data kredensial.";
            loginErrorP.style.display = 'block';
        });

    // --- FUNGSI UNTUK MENAMPILKAN APLIKASI UTAMA ---
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

        // --- HELPER FORMAT & PEMBULATAN ---
        function formatIndo(num) {
            if (num === 'N/A' || isNaN(num)) return 'N/A';
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

        // FUNGSI IPK AKHIR (Bisa diatur All Subjects / Hanya NUS)
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
                } catch (error) { alert("Gagal memuat data."); }
            }
        });

        studentSelect.addEventListener('change', (event) => {
            const studentId = event.target.value;
            if (studentId) {
                currentSelectedStudent = currentStudentsData.find(s => s.id === studentId);
                const subjects = new Set();
                const config = yearConfigurations[yearSelect.value] || defaultConfiguration;
                for(let i=1; i<=config.maxSemester; i++) {
                    if (currentSelectedStudent.grades[`s${i}`]) Object.keys(currentSelectedStudent.grades[`s${i}`]).forEach(s => subjects.add(s));
                }
                subjectSelect.innerHTML = '<option value="">-- Pilih Mapel --</option>';
                Array.from(subjects).sort().forEach(s => {
                    const option = document.createElement('option');
                    option.value = s; option.textContent = s;
                    subjectSelect.appendChild(option);
                });
                subjectSelectionDiv.style.display = 'block';
            }
        });

        subjectSelect.addEventListener('change', (e) => {
            if (e.target.value && currentSelectedStudent) {
                displayStudentSubjectGrades(currentSelectedStudent, e.target.value, yearSelect.value);
            }
        });

        function displayStudentSubjectGrades(student, subjectName, year) {
            const config = yearConfigurations[year] || defaultConfiguration;
            const grades = student.grades;
            const avgKog = calculateKogAvgBySubject(grades, subjectName, year);
            const nusVal = (grades.nus && grades.nus[subjectName] !== undefined) ? grades.nus[subjectName] : 'N/A';
            const nsVal = calculateNilaiSekolahBySubject(avgKog, nusVal, year);
            const ipkFinal = calculateIPKOverall(grades, year);

            let tableRows = '';
            for (let i = 1; i <= 6; i++) {
                const data = grades[`s${i}`]?.[subjectName];
                tableRows += `<tr><td>Semester ${i}</td><td>${data ? formatIndo(data.kog) : '-'}</td><td>${data ? formatIndo(data.psik) : '-'}</td></tr>`;
            }

            studentDetailsDiv.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3>Laporan: ${student.name}</h3>
                    <h4 style="background:#333; color:white; padding:10px;">Mapel: ${subjectName}</h4>
                    <table style="width:100%; border-collapse: collapse; text-align:center;" border="1">
                        <thead><tr style="background:#f2f2f2;"><th>Semester</th><th>Kog</th><th>Psik</th></tr></thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                    <div style="background:#f9f9f9; padding:15px; margin-top:20px;">
                        <p>Rata Rapor: <strong>${formatIndo(avgKog)}</strong></p>
                        <p>NUS: <strong>${formatIndo(nusVal)}</strong></p>
                        <p style="color:#d32f2f;"><strong>Nilai Sekolah: ${formatIndo(nsVal)}</strong></p>
                    </div>
                    <div style="margin-top:20px; padding:15px; background:#ffeb3b; border-radius:5px; font-size:1.1em; text-align:center;">
                        <strong>IPK AKHIR: ${formatIndo(ipkFinal)}</strong><br>
                        <small style="font-size:0.7em;">*Berdasarkan ${config.calculateAllSubjects ? 'Semua Mapel' : 'Mapel Ujian'}</small>
                    </div>
                </div>`;
            studentDetailsDiv.style.display = 'block';
        }
    }

    // --- LOGIKA LOGIN (Sama Persis dengan Versi Bapak) ---
    appContentMain.style.display = 'none';
    loginFormDiv.style.display = 'block';

    submitAccessCodeBtn.addEventListener('click', () => {
        const enteredMemberId = memberIdInput.value.trim();
        const enteredAccessCode = accessCodeInput.value.trim();

        if (MEMBER_CREDENTIALS[enteredMemberId] === enteredAccessCode) {
            loginFormDiv.style.display = 'none';
            appContentMain.style.display = 'block';
            initializeApp();
        } else {
            loginErrorP.textContent = "Nomor anggota atau kode akses salah.";
            loginErrorP.style.display = 'block';
        }
    });
});
