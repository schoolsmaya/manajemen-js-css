// app.js
let currentQuestionIndex = 0;
const userAnswers = new Array(questions.length).fill(null); 

    // --- Fungsi Kuis ---

    function displayQuestion() {
        if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
            console.error("Index soal di luar batas.");
            return;
        }

        const questionData = questions[currentQuestionIndex];
        nomorSoalEl.textContent = `Soal Nomor ${currentQuestionIndex + 1} dari ${questions.length}`;
        teksSoalEl.innerHTML = questionData.question;
        opsiJawabanEl.innerHTML = '';

        const optionLetters = ['A', 'B', 'C', 'D', 'E'];
        questionData.options.forEach((option, index) => {
            const optionId = `q${currentQuestionIndex}_opt${index}`;
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('option-item');

            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.name = `question${currentQuestionIndex}`;
            radioInput.id = optionId;
            radioInput.value = optionLetters[index];
            radioInput.checked = (userAnswers[currentQuestionIndex] === optionLetters[index]);

            const label = document.createElement('label');
            label.htmlFor = optionId;
            label.textContent = `${optionLetters[index]}. ${option}`;

            optionDiv.appendChild(radioInput);
            optionDiv.appendChild(label);
            opsiJawabanEl.appendChild(optionDiv);

            radioInput.addEventListener('change', (event) => {
                userAnswers[currentQuestionIndex] = event.target.value;
            });
        });

        updateNavigationButtons();
    }

    function updateNavigationButtons() {
        prevbtns.style.display = (currentQuestionIndex > 0) ? 'block' : 'none';
        nextbtns.style.display = (currentQuestionIndex < questions.length - 1) ? 'block' : 'none';
        submitbtns.style.display = (currentQuestionIndex === questions.length - 1) ? 'block' : 'none';
    }

    function calculateScore() {
        let correctCount = 0;
        let incorrectCount = 0;

        for (let i = 0; i < questions.length; i++) {
            const correctAnswer = questions[i].answer;
            const userAnswer = userAnswers[i];

            if (userAnswer === correctAnswer) {
                correctCount++;
            } else if (userAnswer !== null) {
                incorrectCount++;
            }
        }
        return { correct: correctCount, incorrect: incorrectCount };
    }

    function showResults() {
        const { correct, incorrect } = calculateScore();

        document.getElementById('hasilNama').textContent = namaInput.value || "Anonim";
        document.getElementById('hasilJabatan').textContent = jabatanSelect.value || "Tidak diketahui";
        document.getElementById('skor').textContent = correct;
        document.getElementById('benar').textContent = correct;
        document.getElementById('salah').textContent = incorrect;

        soalContainer.style.display = 'none';
        hasilContainer.style.display = 'block';

        // --- Google Analytics Event: Kuis Selesai ---
        if (typeof gtag === 'function') { // Pastikan gtag tersedia
            gtag('event', 'quiz_completed', {
                'event_category': 'Engagement',
                'event_label': `Quiz Score: ${correct}`,
                'value': correct, // Menyimpan skor sebagai nilai numerik
                'nama_peserta': namaInput.value, // Data tambahan, hanya untuk analisis
                'jabatan_peserta': jabatanSelect.value // Data tambahan
            });
        }
    }

    function resetQuiz() {
        currentQuestionIndex = 0;
        for (let i = 0; i < userAnswers.length; i++) {
            userAnswers[i] = null;
        }
        namaInput.value = '';
        jabatanSelect.value = 'guru';
        kunciAksesInput.value = '';
        accessErrorMsg.textContent = '';

        identitasForm.style.display = 'block';
        soalContainer.style.display = 'none';
        hasilContainer.style.display = 'none';

        // --- Google Analytics Event: Kuis Diulang ---
        if (typeof gtag === 'function') {
            gtag('event', 'quiz_restarted', {
                'event_category': 'Engagement',
                'event_label': 'Kuis Diulang'
            });
        }
    }

    // --- Event Listeners ---

    masukSoalbtns.addEventListener('click', function() {
        const inputNama = namaInput.value.trim();
        const inputKunci = kunciAksesInput.value.trim();

        if (!inputNama || !inputKunci) {
            accessErrorMsg.textContent = "Nama dan Kunci Akses harus diisi!";
            return;
        }

        if (inputKunci === KUNCI_AKSES_BENAR) {
            identitasForm.style.display = 'none';
            soalContainer.style.display = 'block';
            accessErrorMsg.textContent = '';
            displayQuestion();

            // --- Google Analytics Event: Kuis Dimulai ---
            if (typeof gtag === 'function') { // Periksa apakah gtag sudah dimuat
                gtag('event', 'quiz_started', {
                    'event_category': 'Engagement',
                    'event_label': 'Kuis Dimulai',
                    'nama_peserta': inputNama, // Data tambahan
                    'jabatan_peserta': jabatanSelect.value // Data tambahan
                });
            }
        } else {
            accessErrorMsg.textContent = "Kunci akses salah!";
        }
    });

    nextbtns.addEventListener('click', function() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        }
    });

    prevbtns.addEventListener('click', function() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
        }
    });

    submitbtns.addEventListener('click', showResults);
    ulangKuisbtns.addEventListener('click', resetQuiz);

    // Inisialisasi awal
    resetQuiz();
});
