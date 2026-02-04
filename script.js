// Quiz State
let currentRound = 0;
let currentQuestion = 0;
let score = 0;
let correctAnswers = 0;
let totalQuestions = 0;
let lives = 5;
let timerInterval;
let timeLeft = 10;
let quizStartTime;
let answerSelected = false;

// DOM Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const roundScreen = document.getElementById('roundScreen');
const quizScreen = document.getElementById('quizScreen');
const resultsScreen = document.getElementById('resultsScreen');
const startGameBtn = document.getElementById('startGameBtn');
const roundNumber = document.getElementById('roundNumber');
const roundDifficulty = document.getElementById('roundDifficulty');
const scoreDisplay = document.getElementById('scoreDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const roundProgress = document.getElementById('roundProgress');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const factDisplay = document.getElementById('factDisplay');
const finalScore = document.getElementById('finalScore');
const correctAnswersEl = document.getElementById('correctAnswers');
const accuracy = document.getElementById('accuracy');
const totalTime = document.getElementById('totalTime');
const playAgainBtn = document.getElementById('playAgainBtn');

// Load questions from JSON
let quizData = [];
let selectedQuestions = []; // Store the randomly selected questions for this game session

// Fetch questions
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        quizData = await response.json();
        console.log('Questions loaded:', quizData);
        
        // Randomly select 5 questions from each round
        selectRandomQuestions();
    } catch (error) {
        console.error('Error loading questions:', error);
        // Use sample data if JSON fails to load
        useSampleData();
    }
}

// Randomly select 5 questions from each round (no repeats within a game)
function selectRandomQuestions() {
    selectedQuestions = [];
    
    quizData.forEach(roundData => {
        // Create a copy of the questions array
        const availableQuestions = [...roundData.questions];
        
        // Shuffle using Fisher-Yates algorithm
        for (let i = availableQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
        }
        
        // Select first 5 questions from shuffled array
        const selectedForRound = availableQuestions.slice(0, 5);
        
        selectedQuestions.push({
            round: roundData.round,
            difficulty: roundData.difficulty,
            questions: selectedForRound
        });
    });
    
    console.log('Selected questions for this game:', selectedQuestions);
}

// Sample data fallback
function useSampleData() {
    quizData = [
        {
            round: 1,
            difficulty: "Easy",
            questions: [
                {
                    question: "What is the capital of France?",
                    options: ["London", "Berlin", "Paris", "Madrid"],
                    correct: 2,
                    points: 10,
                    fact: "Paris is known as the 'City of Light' because it was one of the first European cities to use gas street lighting on a large scale."
                },
                {
                    question: "Which planet is known as the Red Planet?",
                    options: ["Venus", "Mars", "Jupiter", "Saturn"],
                    correct: 1,
                    points: 10,
                    fact: "Mars appears red because iron minerals in the Martian soil oxidize, or rust, causing the soil and atmosphere to look red."
                },
                {
                    question: "How many continents are there?",
                    options: ["5", "6", "7", "8"],
                    correct: 2,
                    points: 10,
                    fact: "The seven continents are Asia, Africa, North America, South America, Antarctica, Europe, and Australia."
                },
                {
                    question: "What is the largest ocean on Earth?",
                    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
                    correct: 3,
                    points: 10,
                    fact: "The Pacific Ocean covers more than 30% of the Earth's surface and is larger than all of Earth's land area combined."
                },
                {
                    question: "Who painted the Mona Lisa?",
                    options: ["Vincent van Gogh", "Leonardo da Vinci", "Pablo Picasso", "Michelangelo"],
                    correct: 1,
                    points: 10,
                    fact: "Leonardo da Vinci painted the Mona Lisa between 1503 and 1519, and it now hangs in the Louvre Museum in Paris."
                }
            ]
        },
        {
            round: 2,
            difficulty: "Medium",
            questions: [
                {
                    question: "What is the smallest country in the world?",
                    options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
                    correct: 1,
                    points: 10,
                    fact: "Vatican City is only 0.44 square kilometers (0.17 square miles) and is located entirely within Rome, Italy."
                },
                {
                    question: "Which element has the chemical symbol 'Au'?",
                    options: ["Silver", "Gold", "Aluminum", "Argon"],
                    correct: 1,
                    points: 10,
                    fact: "The symbol Au comes from the Latin word 'aurum', meaning 'shining dawn' or 'glow of sunrise'."
                },
                {
                    question: "In what year did World War II end?",
                    options: ["1943", "1944", "1945", "1946"],
                    correct: 2,
                    points: 10,
                    fact: "World War II officially ended on September 2, 1945, when Japan formally surrendered aboard the USS Missouri."
                },
                {
                    question: "What is the fastest land animal?",
                    options: ["Lion", "Cheetah", "Leopard", "Gazelle"],
                    correct: 1,
                    points: 10,
                    fact: "Cheetahs can reach speeds of up to 120 km/h (75 mph) in short bursts covering distances up to 460 meters."
                },
                {
                    question: "How many bones are in the adult human body?",
                    options: ["186", "206", "226", "246"],
                    correct: 1,
                    points: 10,
                    fact: "Babies are born with about 270 bones, but as they grow, some bones fuse together to result in 206 bones in adults."
                }
            ]
        },
        {
            round: 3,
            difficulty: "Medium-Hard",
            questions: [
                {
                    question: "What is the longest river in the world?",
                    options: ["Amazon River", "Nile River", "Yangtze River", "Mississippi River"],
                    correct: 1,
                    points: 10,
                    fact: "The Nile River is approximately 6,650 kilometers (4,130 miles) long and flows through 11 countries in Africa."
                },
                {
                    question: "Who wrote 'Romeo and Juliet'?",
                    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
                    correct: 1,
                    points: 10,
                    fact: "Shakespeare wrote Romeo and Juliet early in his career, between 1594 and 1595, and it remains one of his most performed plays."
                },
                {
                    question: "What is the hardest natural substance on Earth?",
                    options: ["Gold", "Iron", "Diamond", "Platinum"],
                    correct: 2,
                    points: 10,
                    fact: "Diamonds are made of carbon atoms arranged in an extremely strong crystal lattice structure, making them the hardest known natural material."
                },
                {
                    question: "Which country is home to the kangaroo?",
                    options: ["New Zealand", "South Africa", "Australia", "Brazil"],
                    correct: 2,
                    points: 10,
                    fact: "Kangaroos are marsupials endemic to Australia, and they can jump up to 3 times their own height and cover 25 feet in a single leap."
                },
                {
                    question: "What is the capital of Japan?",
                    options: ["Osaka", "Kyoto", "Tokyo", "Hiroshima"],
                    correct: 2,
                    points: 10,
                    fact: "Tokyo is the world's most populous metropolitan area, with over 37 million people living in the greater Tokyo area."
                }
            ]
        },
        {
            round: 4,
            difficulty: "Hard",
            questions: [
                {
                    question: "What is the speed of light in vacuum?",
                    options: ["299,792 km/s", "300,000 km/s", "299,792,458 m/s", "Both A and C"],
                    correct: 3,
                    points: 10,
                    fact: "The speed of light in vacuum is exactly 299,792,458 meters per second, which is approximately 300,000 kilometers per second."
                },
                {
                    question: "Who developed the theory of general relativity?",
                    options: ["Isaac Newton", "Albert Einstein", "Stephen Hawking", "Niels Bohr"],
                    correct: 1,
                    points: 10,
                    fact: "Einstein published his theory of general relativity in 1915, revolutionizing our understanding of gravity, space, and time."
                },
                {
                    question: "What is the most spoken language in the world by native speakers?",
                    options: ["English", "Spanish", "Mandarin Chinese", "Hindi"],
                    correct: 2,
                    points: 10,
                    fact: "Mandarin Chinese has over 900 million native speakers, making it the most spoken language by native speakers worldwide."
                },
                {
                    question: "Which organ in the human body produces insulin?",
                    options: ["Liver", "Kidney", "Pancreas", "Heart"],
                    correct: 2,
                    points: 10,
                    fact: "The pancreas produces insulin in specialized cells called beta cells located in the islets of Langerhans."
                },
                {
                    question: "What is the largest planet in our solar system?",
                    options: ["Saturn", "Jupiter", "Neptune", "Uranus"],
                    correct: 1,
                    points: 10,
                    fact: "Jupiter is so large that more than 1,300 Earths could fit inside it. It's also the fastest spinning planet, completing one rotation every 10 hours."
                }
            ]
        },
        {
            round: 5,
            difficulty: "Very Hard",
            questions: [
                {
                    question: "What is the rarest blood type in humans?",
                    options: ["AB-", "O-", "Rh-null", "B-"],
                    correct: 2,
                    points: 10,
                    fact: "Rh-null blood is so rare that only about 50 people in the world have it. It's called 'golden blood' because it can be donated to anyone with rare blood types."
                },
                {
                    question: "Which philosopher wrote 'The Republic'?",
                    options: ["Aristotle", "Socrates", "Plato", "Epicurus"],
                    correct: 2,
                    points: 10,
                    fact: "Plato wrote The Republic around 375 BC. It's one of the most influential works in philosophy and political theory ever written."
                },
                {
                    question: "What is the smallest unit of life?",
                    options: ["Atom", "Molecule", "Cell", "Organism"],
                    correct: 2,
                    points: 10,
                    fact: "The cell is the basic structural and functional unit of all living organisms. Some organisms consist of a single cell, while others are multicellular."
                },
                {
                    question: "Who was the first person to walk on the moon?",
                    options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "Michael Collins"],
                    correct: 1,
                    points: 10,
                    fact: "Neil Armstrong stepped onto the lunar surface on July 20, 1969, saying 'That's one small step for man, one giant leap for mankind.'"
                },
                {
                    question: "What is the name of the longest mountain range in the world?",
                    options: ["Himalayas", "Rockies", "Andes", "Mid-Atlantic Ridge"],
                    correct: 3,
                    points: 10,
                    fact: "The Mid-Atlantic Ridge is an underwater mountain range that stretches for about 16,000 kilometers, making it the longest mountain range on Earth."
                }
            ]
        }
    ];
}

// Initialize
async function init() {
    await loadQuestions();
    
    // Start game button
    startGameBtn.addEventListener('click', startGame);
    
    // Play again button
    playAgainBtn.addEventListener('click', resetQuiz);
}

// Start Game
function startGame() {
    quizStartTime = Date.now();
    switchScreen(welcomeScreen, roundScreen);
    showRoundTransition();
}

// Switch Screen
function switchScreen(fromScreen, toScreen) {
    fromScreen.classList.remove('active');
    setTimeout(() => {
        toScreen.classList.add('active');
    }, 300);
}

// Show Round Transition
function showRoundTransition() {
    const roundData = selectedQuestions[currentRound];
    roundNumber.textContent = `ROUND ${currentRound + 1}`;
    roundDifficulty.textContent = roundData.difficulty.toUpperCase();
    
    // Show round screen for 2 seconds, then start questions
    setTimeout(() => {
        switchScreen(roundScreen, quizScreen);
        loadQuestion();
    }, 2000);
}

// Load Question
function loadQuestion() {
    if (currentRound >= selectedQuestions.length || lives <= 0) {
        showResults();
        return;
    }
    
    const roundData = selectedQuestions[currentRound];
    const question = roundData.questions[currentQuestion];
    
    // Update UI
    scoreDisplay.textContent = score;
    updateLivesDisplay();
    roundProgress.textContent = `R${currentRound + 1} Q${currentQuestion + 1}/5`;
    questionText.textContent = question.question;
    
    // Hide fact display
    factDisplay.classList.add('hidden');
    
    // Create options
    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'option';
        optionEl.textContent = option;
        optionEl.addEventListener('click', () => selectAnswer(index));
        optionsContainer.appendChild(optionEl);
    });
    
    // Start timer
    answerSelected = false;
    startTimer();
}

// Update Lives Display
function updateLivesDisplay() {
    const hearts = ['❤️', '❤️', '❤️', '❤️', '❤️'];
    for (let i = 0; i < (5 - lives); i++) {
        hearts[4 - i] = '🖤';
    }
    livesDisplay.textContent = hearts.join('');
}

// Start Timer
function startTimer() {
    timeLeft = 10;
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (!answerSelected) {
                handleTimeout();
            }
        }
    }, 100);
}

// Select Answer
function selectAnswer(selectedIndex) {
    if (answerSelected) return;
    
    answerSelected = true;
    clearInterval(timerInterval);
    
    const roundData = selectedQuestions[currentRound];
    const question = roundData.questions[currentQuestion];
    const options = document.querySelectorAll('.option');
    
    // Disable all options
    options.forEach(opt => opt.classList.add('disabled'));
    
    // Mark selected
    options[selectedIndex].classList.add('selected');
    
    // Check if correct
    const isCorrect = selectedIndex === question.correct;
    
    setTimeout(() => {
        if (isCorrect) {
            options[selectedIndex].classList.add('correct');
            score += question.points;
            correctAnswers++;
            scoreDisplay.textContent = score;
        } else {
            options[selectedIndex].classList.add('wrong');
            options[question.correct].classList.add('correct');
            lives--;
        }
        
        // Show fact
        showFact(question.fact);
        
        // Check if game over
        if (lives <= 0) {
            setTimeout(() => {
                showResults();
            }, 3000);
        } else {
            // Move to next question after delay
            setTimeout(() => {
                nextQuestion();
            }, 3000);
        }
    }, 500);
}

// Handle Timeout
function handleTimeout() {
    answerSelected = true;
    lives--;
    
    const roundData = selectedQuestions[currentRound];
    const question = roundData.questions[currentQuestion];
    const options = document.querySelectorAll('.option');
    
    // Disable all options and show correct answer
    options.forEach(opt => opt.classList.add('disabled'));
    options[question.correct].classList.add('correct');
    
    // Show fact
    showFact(question.fact);
    
    // Check if game over
    if (lives <= 0) {
        setTimeout(() => {
            showResults();
        }, 3000);
    } else {
        // Move to next question
        setTimeout(() => {
            nextQuestion();
        }, 3000);
    }
}

// Show Fact
function showFact(factText) {
    const factTextEl = factDisplay.querySelector('.fact-text');
    factTextEl.textContent = factText;
    factDisplay.classList.remove('hidden');
}

// Next Question
function nextQuestion() {
    totalQuestions++;
    currentQuestion++;
    
    if (currentQuestion >= selectedQuestions[currentRound].questions.length) {
        currentQuestion = 0;
        currentRound++;
        
        // Check if there are more rounds
        if (currentRound < selectedQuestions.length && lives > 0) {
            // Show round transition before next round
            switchScreen(quizScreen, roundScreen);
            showRoundTransition();
        } else {
            loadQuestion();
        }
    } else {
        loadQuestion();
    }
}

// Show Results
function showResults() {
    clearInterval(timerInterval);
    
    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
    const accuracyPercent = Math.round((correctAnswers / totalQuestions) * 100);
    
    finalScore.textContent = score;
    correctAnswersEl.textContent = correctAnswers;
    accuracy.textContent = accuracyPercent + '%';
    totalTime.textContent = timeTaken + 's';
    
    switchScreen(quizScreen, resultsScreen);
}

// Reset Quiz
function resetQuiz() {
    currentRound = 0;
    currentQuestion = 0;
    score = 0;
    correctAnswers = 0;
    totalQuestions = 0;
    lives = 5;
    
    // Re-select random questions for new game
    selectRandomQuestions();
    
    switchScreen(resultsScreen, welcomeScreen);
}

// Initialize on load
init();
