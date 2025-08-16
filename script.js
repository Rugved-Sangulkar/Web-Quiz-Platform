document.addEventListener('DOMContentLoaded', () => {
    // State management
    const state = {
        currentScreen: 'home',
        quizzes: [],
        currentQuiz: null,
        currentQuestion: 0,
        userAnswers: [],
        reviewMode: false,
        deleteTarget: null,
        deleteMode: null,
        timer: null,
        timeLeft: 0,
        startTime: 0
    };

    // DOM elements
    const screens = {
        home: document.getElementById('home-screen'),
        create: document.getElementById('create-screen'),
        library: document.getElementById('library-screen'),
        takeQuiz: document.getElementById('take-quiz-screen'),
        results: document.getElementById('results-screen')
    };

    const deleteModal = document.getElementById('delete-modal');
    const deleteQuizBtn = document.getElementById('delete-quiz-btn');
    const quizTitle = document.getElementById('quiz-title');
    const quizDesc = document.getElementById('quiz-description');
    const quizTimer = document.getElementById('quiz-timer');
    const timerContainer = document.getElementById('timer-container');
    const timerDisplay = document.getElementById('quiz-timer-display');

    // Helper functions
    const formatTime = seconds => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Initialize the app
    const init = () => {
        const savedQuizzes = localStorage.getItem('quizzes');
        state.quizzes = savedQuizzes ? JSON.parse(savedQuizzes) : [];
        localStorage.setItem('quizzes', JSON.stringify(state.quizzes));
        setupEventListeners();
        showScreen('home');
    };

    // Navigation
    const showScreen = screenId => {
        Object.values(screens).forEach(screen => screen.classList.add('hidden'));
        screens[screenId].classList.remove('hidden');
        state.currentScreen = screenId;

        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }

        if (screenId === 'create') {
            if (!state.currentQuiz) {
                state.currentQuiz = { id: 'quiz' + Date.now(), title: '', description: '', timeLimit: 0, questions: [] };
                deleteQuizBtn.classList.add('hidden');
                quizTimer.value = 0;
                addQuestion();
            } else {
                deleteQuizBtn.classList.remove('hidden');
                quizTitle.value = state.currentQuiz.title;
                quizDesc.value = state.currentQuiz.description;
                quizTimer.value = state.currentQuiz.timeLimit || 0;
                renderQuestions();
            }
        }

        if (screenId === 'library') populateQuizLibrary();
        if (screenId === 'takeQuiz' && state.currentQuiz) startQuiz();
        if (screenId === 'results') showResults();
    };

    // Create Quiz functions
    const addQuestion = () => {
        if (!state.currentQuiz) return;
        state.currentQuiz.questions.push({ text: '', options: ['', '', '', ''], correctAnswer: 0 });
        renderQuestions();
    };

    const renderQuestions = () => {
        const container = document.getElementById('questions-container');
        container.innerHTML = '';

        state.currentQuiz.questions.forEach((question, qIndex) => {
            const questionEl = document.createElement('div');
            questionEl.className = 'card bg-white p-5 mb-5 rounded-xl';

            let optionsHTML = '';
            question.options.forEach((option, oIndex) => {
                optionsHTML += `
              <div class="flex items-center mb-3">
                <input type="radio" id="q${qIndex}-option${oIndex}" name="q${qIndex}-correct" value="${oIndex}" 
                  class="correct-option h-4 w-4 text-blue-600" data-question="${qIndex}" data-option="${oIndex}" 
                  ${question.correctAnswer === oIndex ? 'checked' : ''}>
                <div class="flex-grow ml-3">
                  <input type="text" class="option-text w-full px-3 py-2 border border-gray-300 rounded-lg" 
                    data-question="${qIndex}" data-option="${oIndex}" value="${option}" placeholder="Option ${oIndex + 1}">
                </div>
              </div>
            `;
            });

            questionEl.innerHTML = `
            <div class="flex justify-between items-start mb-4">
              <input type="text" class="question-text w-full px-3 py-2 border border-gray-300 rounded-lg" 
                data-question="${qIndex}" value="${question.text}" placeholder="Question ${qIndex + 1}">
              <button class="remove-question-btn ml-3 text-red-500 hover:text-red-700 p-1" data-question="${qIndex}">×</button>
            </div>
            <div class="mb-3">
              <label class="block text-sm font-medium text-gray-700 mb-2">Options (select the correct answer)</label>
              <div class="space-y-2">${optionsHTML}</div>
            </div>
          `;

            container.appendChild(questionEl);

            // Add event listeners
            questionEl.querySelector('.question-text').addEventListener('input', function () {
                state.currentQuiz.questions[this.dataset.question].text = this.value;
            });

            questionEl.querySelectorAll('.option-text').forEach(input => {
                input.addEventListener('input', function () {
                    state.currentQuiz.questions[this.dataset.question].options[this.dataset.option] = this.value;
                });
            });

            questionEl.querySelectorAll('.correct-option').forEach(input => {
                input.addEventListener('change', function () {
                    state.currentQuiz.questions[this.dataset.question].correctAnswer = parseInt(this.dataset.option);
                });
            });

            questionEl.querySelector('.remove-question-btn').addEventListener('click', function () {
                if (state.currentQuiz.questions.length > 1) {
                    state.currentQuiz.questions.splice(parseInt(this.dataset.question), 1);
                    renderQuestions();
                } else {
                    alert('You need at least one question in your quiz.');
                }
            });
        });
    };

    const saveQuiz = () => {
        const title = quizTitle.value.trim();
        if (!title) {
            alert('Please enter a quiz title');
            return;
        }

        // Validate questions
        let isValid = true;
        state.currentQuiz.questions.forEach((question, index) => {
            if (!question.text.trim()) {
                alert(`Question ${index + 1} needs a question text.`);
                isValid = false;
                return;
            }

            question.options.forEach((option, optIndex) => {
                if (!option.trim()) {
                    alert(`Question ${index + 1}, Option ${optIndex + 1} cannot be empty.`);
                    isValid = false;
                    return;
                }
            });
        });

        if (!isValid) return;

        state.currentQuiz.title = title;
        state.currentQuiz.description = quizDesc.value;
        state.currentQuiz.timeLimit = parseInt(quizTimer.value);

        const existingIndex = state.quizzes.findIndex(q => q.id === state.currentQuiz.id);
        if (existingIndex >= 0) {
            state.quizzes[existingIndex] = state.currentQuiz;
        } else {
            state.quizzes.push(state.currentQuiz);
        }

        localStorage.setItem('quizzes', JSON.stringify(state.quizzes));
        state.currentQuiz = null;
        alert('Quiz saved!');
        showScreen('library');
    };

    // Quiz Library functions
    const populateQuizLibrary = () => {
        const quizzesList = document.getElementById('quizzes-list');
        const noQuizzes = document.getElementById('no-quizzes');
        const deleteAllBtn = document.getElementById('delete-all-quizzes-btn');

        quizzesList.innerHTML = '';

        if (state.quizzes.length === 0) {
            quizzesList.classList.add('hidden');
            noQuizzes.classList.remove('hidden');
            deleteAllBtn.classList.add('hidden');
        } else {
            quizzesList.classList.remove('hidden');
            noQuizzes.classList.add('hidden');
            deleteAllBtn.classList.remove('hidden');

            state.quizzes.forEach(quiz => {
                const card = document.createElement('div');
                card.className = 'card bg-white p-5 rounded-xl';

                const timerInfo = quiz.timeLimit ? `<span class="ml-2 text-sm text-blue-600">⏱️ ${formatTime(quiz.timeLimit)}</span>` : '';

                card.innerHTML = `
              <h3 class="text-lg font-semibold mb-2">${quiz.title}</h3>
              <p class="text-gray-600 mb-3 h-10 overflow-hidden">${quiz.description || 'No description'}</p>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">${quiz.questions.length} questions${timerInfo}</span>
                <div class="flex space-x-1">
                  <button class="edit-quiz-btn p-2 text-blue-600 hover:text-blue-800" data-quiz-id="${quiz.id}">✏️</button>
                  <button class="take-quiz-btn p-2 text-blue-600 hover:text-blue-800" data-quiz-id="${quiz.id}">▶️</button>
                  <button class="delete-quiz-btn p-2 text-red-600 hover:text-red-800" data-quiz-id="${quiz.id}">🗑️</button>
                </div>
              </div>
            `;
                quizzesList.appendChild(card);

                card.querySelector('.edit-quiz-btn').addEventListener('click', () => editQuiz(quiz.id));
                card.querySelector('.take-quiz-btn').addEventListener('click', () => startQuizById(quiz.id));
                card.querySelector('.delete-quiz-btn').addEventListener('click', () => showDeleteModal('single', quiz.id));
            });
        }
    };

    const editQuiz = quizId => {
        const quiz = state.quizzes.find(q => q.id === quizId);
        if (quiz) {
            state.currentQuiz = JSON.parse(JSON.stringify(quiz));
            showScreen('create');
        }
    };

    const showDeleteModal = (mode, quizId = null) => {
        state.deleteMode = mode;
        state.deleteTarget = quizId;

        const modalTitle = document.getElementById('delete-modal-title');
        const modalMessage = document.getElementById('delete-modal-message');

        if (mode === 'single') {
            const quiz = state.quizzes.find(q => q.id === quizId);
            modalTitle.textContent = `Delete "${quiz.title}"`;
            modalMessage.textContent = 'Are you sure you want to delete this quiz? This action cannot be undone.';
        } else if (mode === 'current') {
            modalTitle.textContent = `Delete "${state.currentQuiz.title}"`;
            modalMessage.textContent = 'Are you sure you want to delete this quiz? This action cannot be undone.';
        } else {
            modalTitle.textContent = 'Delete All Quizzes';
            modalMessage.textContent = 'Are you sure you want to delete ALL quizzes? This action cannot be undone.';
        }

        deleteModal.classList.remove('hidden');
    };

    const confirmDelete = () => {
        if (state.deleteMode === 'single') {
            state.quizzes = state.quizzes.filter(q => q.id !== state.deleteTarget);
        } else if (state.deleteMode === 'current') {
            state.quizzes = state.quizzes.filter(q => q.id !== state.currentQuiz.id);
            state.currentQuiz = null;
            showScreen('library');
        } else {
            state.quizzes = [];
        }

        localStorage.setItem('quizzes', JSON.stringify(state.quizzes));
        deleteModal.classList.add('hidden');
        if (state.currentScreen === 'library') populateQuizLibrary();
    };

    // Take Quiz functions
    const startQuizById = quizId => {
        const quiz = state.quizzes.find(q => q.id === quizId);
        if (quiz) {
            state.currentQuiz = JSON.parse(JSON.stringify(quiz));
            state.currentQuestion = 0;
            state.userAnswers = new Array(state.currentQuiz.questions.length).fill(null);
            state.reviewMode = false;
            state.startTime = Date.now();
            showScreen('takeQuiz');
        }
    };

    const startQuiz = () => {
        document.getElementById('quiz-title-display').textContent = state.currentQuiz.title;

        // Setup timer if needed
        if (state.currentQuiz.timeLimit > 0 && !state.reviewMode) {
            timerContainer.classList.remove('hidden');
            state.timeLeft = state.currentQuiz.timeLimit;
            updateTimerDisplay();

            state.timer = setInterval(() => {
                state.timeLeft--;
                updateTimerDisplay();

                if (state.timeLeft <= 0) {
                    clearInterval(state.timer);
                    alert('Time\'s up!');
                    showScreen('results');
                }
            }, 1000);
        } else {
            timerContainer.classList.add('hidden');
        }

        showQuestion(0);
    };

    const updateTimerDisplay = () => {
        timerDisplay.textContent = formatTime(state.timeLeft);

        // Add warning classes
        timerDisplay.className = 'timer text-lg font-bold';
        if (state.timeLeft <= 30 && state.timeLeft > 10) {
            timerDisplay.classList.add('timer-warning');
        } else if (state.timeLeft <= 10) {
            timerDisplay.classList.add('timer-danger');
        }
    };

    const showQuestion = questionIndex => {
        if (!state.currentQuiz || !state.currentQuiz.questions[questionIndex]) return;

        const question = state.currentQuiz.questions[questionIndex];

        document.getElementById('question-counter').textContent = `Question ${questionIndex + 1} of ${state.currentQuiz.questions.length}`;
        document.getElementById('quiz-progress').style.width = `${((questionIndex + 1) / state.currentQuiz.questions.length) * 100}%`;
        document.getElementById('question-text').textContent = question.text;

        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';

        question.options.forEach((option, optionIndex) => {
            const optionEl = document.createElement('div');

            let optionClass = 'option p-3 border rounded-lg cursor-pointer';

            if (state.reviewMode) {
                if (optionIndex === question.correctAnswer) {
                    optionClass += ' correct';
                } else if (state.userAnswers[questionIndex] === optionIndex) {
                    optionClass += ' incorrect';
                }
            } else if (state.userAnswers[questionIndex] === optionIndex) {
                optionClass += ' selected';
            }

            optionEl.className = optionClass;

            // Add letter marker (A, B, C, D)
            const letter = String.fromCharCode(65 + optionIndex);
            optionEl.innerHTML = `<span class="font-medium mr-2">${letter}.</span> ${option}`;

            if (!state.reviewMode) {
                optionEl.addEventListener('click', () => {
                    state.userAnswers[questionIndex] = optionIndex;
                    document.querySelectorAll('#options-container .option').forEach((opt, idx) => {
                        opt.classList.toggle('selected', idx === optionIndex);
                    });
                });
            }

            optionsContainer.appendChild(optionEl);
        });

        const prevBtn = document.getElementById('prev-question-btn');
        const nextBtn = document.getElementById('next-question-btn');

        prevBtn.disabled = questionIndex === 0;
        prevBtn.style.opacity = questionIndex === 0 ? '0.5' : '1';

        nextBtn.textContent = questionIndex === state.currentQuiz.questions.length - 1 ?
            (state.reviewMode ? 'Back to Results' : 'Finish Quiz') : 'Next';

        state.currentQuestion = questionIndex;
    };

    const showResults = () => {
        // Clear any active timer
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }

        let correctAnswers = 0;
        state.userAnswers.forEach((answer, index) => {
            if (answer === state.currentQuiz.questions[index].correctAnswer) correctAnswers++;
        });

        const totalQuestions = state.currentQuiz.questions.length;
        const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);

        document.getElementById('result-quiz-title').textContent = state.currentQuiz.title;
        document.getElementById('score-percentage').textContent = `${scorePercentage}%`;
        document.getElementById('score-fraction').textContent = `${correctAnswers}/${totalQuestions}`;

        let scoreMessage = scorePercentage >= 80 ? 'Excellent!' :
            scorePercentage >= 60 ? 'Good job!' :
                scorePercentage >= 40 ? 'Not bad!' : 'Keep practicing!';
        document.getElementById('score-message').textContent = scoreMessage;

        // Show time taken if timer was used
        const timeTakenEl = document.getElementById('time-taken');
        if (state.currentQuiz.timeLimit > 0) {
            const timeTaken = state.currentQuiz.timeLimit - state.timeLeft;
            timeTakenEl.textContent = `Time taken: ${formatTime(timeTaken)}`;
            timeTakenEl.classList.remove('hidden');
        } else {
            timeTakenEl.classList.add('hidden');
        }
    };

    // Set up event listeners
    const setupEventListeners = () => {
        document.getElementById('home-btn').addEventListener('click', () => showScreen('home'));
        document.getElementById('create-btn').addEventListener('click', () => {
            state.currentQuiz = null;
            showScreen('create');
        });
        document.getElementById('library-btn').addEventListener('click', () => showScreen('library'));
        document.getElementById('create-quiz-btn').addEventListener('click', () => {
            state.currentQuiz = null;
            showScreen('create');
        });
        document.getElementById('take-quiz-btn').addEventListener('click', () => showScreen('library'));
        document.getElementById('add-question-btn').addEventListener('click', addQuestion);
        document.getElementById('save-quiz-btn').addEventListener('click', saveQuiz);
        document.getElementById('delete-quiz-btn').addEventListener('click', () => showDeleteModal('current'));
        document.getElementById('create-first-quiz-btn').addEventListener('click', () => {
            state.currentQuiz = null;
            showScreen('create');
        });
        document.getElementById('delete-all-quizzes-btn').addEventListener('click', () => showDeleteModal('all'));
        document.getElementById('back-to-library-btn').addEventListener('click', () => {
            if (confirm('Exit quiz? Progress will be lost.')) showScreen('library');
        });
        document.getElementById('next-question-btn').addEventListener('click', () => {
            if (state.currentQuestion < state.currentQuiz.questions.length - 1) {
                showQuestion(state.currentQuestion + 1);
            } else {
                showScreen('results');
            }
        });
        document.getElementById('prev-question-btn').addEventListener('click', () => {
            if (state.currentQuestion > 0) showQuestion(state.currentQuestion - 1);
        });
        document.getElementById('back-to-home-btn').addEventListener('click', () => showScreen('home'));
        document.getElementById('review-answers-btn').addEventListener('click', () => {
            state.reviewMode = true;
            showScreen('takeQuiz');
            showQuestion(0);
        });
        document.getElementById('cancel-delete-btn').addEventListener('click', () => deleteModal.classList.add('hidden'));
        document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
    };

    init();
});