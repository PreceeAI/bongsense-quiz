// DOM Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const usernameScreen = document.getElementById('usernameScreen');
const leaderboardScreen = document.getElementById('leaderboardScreen');
const roundScreen = document.getElementById('roundScreen');
const quizScreen = document.getElementById('quizScreen');
const resultsScreen = document.getElementById('resultsScreen');
const startGameBtn = document.getElementById('startGameBtn');
const continueBtn = document.getElementById('continueBtn');
const backToWelcomeBtn = document.getElementById('backToWelcomeBtn');
const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
const viewLeaderboardResultsBtn = document.getElementById('viewLeaderboardResultsBtn');
const closeLeaderboardBtn = document.getElementById('closeLeaderboardBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const shareScoreBtn = document.getElementById('shareScoreBtn');
const usernameInput = document.getElementById('usernameInput');

// Quiz State
let quizData = null;
let selectedQuestions = [];
let currentRound = 0;
let currentQuestion = 0;
let score = 0;
let correctAnswers = 0;
let totalQuestions = 0;
let quizStartTime = 0;
let timerInterval = null;
let timeLeft = 20;
let answerSelected = false;
let currentUsername = '';

// Load questions from JSON
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        quizData = await response.json();
        console.log('Questions loaded:', quizData);
        
        // Display topic on welcome screen
        const topicBadge = document.getElementById('topicBadge');
        topicBadge.textContent = `Topic Today: ${quizData.topic}`;
        
        // Randomly select questions
        selectRandomQuestions();
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Error loading quiz questions. Please refresh the page.');
    }
}

// Randomly select 10 questions from each round
function selectRandomQuestions() {
    selectedQuestions = [];
    
    quizData.rounds.forEach(roundData => {
        const questions = roundData.questions;
        const selectCount = roundData.selectCount || 10;
        
        // Shuffle questions using Fisher-Yates algorithm
        const shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Select first 10 from shuffled array
        const selected = shuffled.slice(0, selectCount);
        
        selectedQuestions.push({
            round: roundData.round,
            difficulty: roundData.difficulty,
            questions: selected
        });
    });
    
    console.log('Selected questions for this game:', selectedQuestions);
}

// Start Game
function startGame() {
    quizStartTime = Date.now();
    currentRound = 0;
    currentQuestion = 0;
    score = 0;
    correctAnswers = 0;
    totalQuestions = 0;
    
    switchScreen(usernameScreen, roundScreen);
    showRoundTransition();
}

// Switch screens
function switchScreen(fromScreen, toScreen) {
    fromScreen.classList.remove('active');
    setTimeout(() => {
        toScreen.classList.add('active');
    }, 300);
}

// Show round transition
function showRoundTransition() {
    const roundData = selectedQuestions[currentRound];
    document.getElementById('roundNumber').textContent = `ROUND ${currentRound + 1}`;
    document.getElementById('roundDifficulty').textContent = roundData.difficulty.toUpperCase();
    
    setTimeout(() => {
        switchScreen(roundScreen, quizScreen);
        loadQuestion();
    }, 2000);
}

// Load question
function loadQuestion() {
    if (currentRound >= selectedQuestions.length) {
        showResults();
        return;
    }
    
    const roundData = selectedQuestions[currentRound];
    const question = roundData.questions[currentQuestion];
    
    // Update UI
    document.getElementById('currentRound').textContent = `Round ${currentRound + 1} - ${roundData.difficulty}`;
    document.getElementById('questionCounter').textContent = `${currentQuestion + 1}/10`;
    document.getElementById('scoreDisplay').textContent = score;
    document.getElementById('questionHeader').textContent = `Question ${currentQuestion + 1}`;
    document.getElementById('questionText').textContent = question.question;
    
    // Hide fact
    document.getElementById('factDisplay').classList.add('hidden');
    
    // Create options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'option';
        optionEl.innerHTML = `<span>${option}</span>`;
        optionEl.addEventListener('click', () => selectAnswer(index));
        optionsContainer.appendChild(optionEl);
    });
    
    // Start timer
    answerSelected = false;
    timeLeft = 20;
    startTimer();
}

// Start timer
function startTimer() {
    const timerBar = document.getElementById('timerBar');
    timerBar.style.width = '100%';
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        const percentage = (timeLeft / 20) * 100;
        timerBar.style.width = `${percentage}%`;
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (!answerSelected) {
                handleTimeout();
            }
        }
    }, 100);
}

// Select answer
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
    
    const isCorrect = selectedIndex === question.correct;
    
    setTimeout(() => {
        if (isCorrect) {
            options[selectedIndex].classList.add('correct');
            score += question.points;
            correctAnswers++;
            document.getElementById('scoreDisplay').textContent = score;
        } else {
            options[selectedIndex].classList.add('wrong');
            options[question.correct].classList.add('correct');
        }
        
        // Show fact
        showFact(question.fact);
        
        // Move to next question
        setTimeout(() => {
            nextQuestion();
        }, 3000);
    }, 500);
}

// Handle timeout
function handleTimeout() {
    answerSelected = true;
    
    const roundData = selectedQuestions[currentRound];
    const question = roundData.questions[currentQuestion];
    const options = document.querySelectorAll('.option');
    
    // Show correct answer
    options.forEach(opt => opt.classList.add('disabled'));
    options[question.correct].classList.add('correct');
    
    // Show fact
    showFact(question.fact);
    
    setTimeout(() => {
        nextQuestion();
    }, 3000);
}

// Show fact
function showFact(factText) {
    const factDisplay = document.getElementById('factDisplay');
    const factTextEl = document.getElementById('factText');
    factTextEl.textContent = factText;
    factDisplay.classList.remove('hidden');
}

// Next question
function nextQuestion() {
    totalQuestions++;
    currentQuestion++;
    
    if (currentQuestion >= selectedQuestions[currentRound].questions.length) {
        currentQuestion = 0;
        currentRound++;
        
        if (currentRound < selectedQuestions.length) {
            switchScreen(quizScreen, roundScreen);
            showRoundTransition();
        } else {
            showResults();
        }
    } else {
        loadQuestion();
    }
}

// Show results
function showResults() {
    clearInterval(timerInterval);
    
    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
    const accuracyPercent = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Save score to leaderboard
    const leaderboard = saveScoreToLeaderboard(currentUsername, score, quizData.topic);
    const userRank = getUserRank(currentUsername, Date.now(), leaderboard);
    
    // Update results display
    document.getElementById('finalScore').textContent = score;
    document.getElementById('correctAnswersDisplay').textContent = `${correctAnswers}/20`;
    document.getElementById('accuracyDisplay').textContent = accuracyPercent + '%';
    
    // Format time
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    document.getElementById('totalTimeDisplay').textContent = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    
    // Show leaderboard position
    const leaderboardPosition = document.getElementById('leaderboardPosition');
    leaderboardPosition.classList.remove('hidden');
    document.getElementById('userRank').textContent = `#${userRank}`;
    document.getElementById('totalPlayers').textContent = `of ${leaderboard.length} ${leaderboard.length === 1 ? 'player' : 'players'}`;
    
    // Get performance message
    const messageData = getPerformanceMessage(score);
    const messageEl = document.getElementById('performanceMessage');
    messageEl.textContent = messageData.message;
    messageEl.style.backgroundColor = messageData.bgColor;
    messageEl.style.borderColor = messageData.borderColor;
    messageEl.style.color = messageData.color;
    
    switchScreen(quizScreen, resultsScreen);
}

// Get performance message based on score
function getPerformanceMessage(score) {
    if (score >= 0 && score <= 50) {
        return {
            message: "Are you sure you call yourself Bengali?",
            color: "#721c24",
            bgColor: "#f8d7da",
            borderColor: "#f5c6cb"
        };
    } else if (score >= 60 && score <= 100) {
        return {
            message: "Baba Ma will be very disappointed",
            color: "#856404",
            bgColor: "#fff3cd",
            borderColor: "#ffc107"
        };
    } else if (score >= 110 && score <= 150) {
        return {
            message: "Areee, Darun!",
            color: "#0c5460",
            bgColor: "#d1ecf1",
            borderColor: "#17a2b8"
        };
    } else if (score >= 160 && score <= 200) {
        return {
            message: "You are Bhogoban!",
            color: "#155724",
            bgColor: "#d4edda",
            borderColor: "#28a745"
        };
    }
    return {
        message: "Good effort!",
        color: "#0c5460",
        bgColor: "#d1ecf1",
        borderColor: "#17a2b8"
    };
}

// Share score
async function shareScore() {
    const resultsContainer = document.querySelector('.results-container');
    const buttons = document.querySelector('.action-buttons');
    
    // Hide buttons temporarily
    buttons.style.display = 'none';
    
    // Wait a moment for button to disappear
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
        const canvas = await html2canvas(resultsContainer, {
            backgroundColor: '#ffffff',
            scale: 3,
            logging: false,
            useCORS: true,
            allowTaint: true
        });
        
        buttons.style.display = 'flex';
        
        canvas.toBlob(async (blob) => {
            // Check if Web Share API is supported
            if (navigator.share && navigator.canShare) {
                const file = new File([blob], 'bongsense-quiz-score.png', { type: 'image/png' });
                
                if (navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'My Bongsense Quiz Score',
                            text: `I scored ${score}/200 on The Bongsense Quiz!`
                        });
                    } catch (err) {
                        if (err.name !== 'AbortError') {
                            downloadImage(blob);
                        }
                    }
                } else {
                    downloadImage(blob);
                }
            } else {
                downloadImage(blob);
            }
        }, 'image/png', 1.0);
    } catch (error) {
        console.error('Error capturing screenshot:', error);
        buttons.style.display = 'flex';
        alert('Could not capture screenshot. Please try again.');
    }
}

// Download image
function downloadImage(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bongsense-quiz-score-${score}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Reset quiz
function resetQuiz() {
    currentRound = 0;
    currentQuestion = 0;
    score = 0;
    correctAnswers = 0;
    totalQuestions = 0;
    
    // Re-select random questions for new game
    selectRandomQuestions();
    
    // Keep username, just go back to username screen
    switchScreen(resultsScreen, usernameScreen);
    usernameInput.value = currentUsername;
}

// Event listeners
startGameBtn.addEventListener('click', () => {
    switchScreen(welcomeScreen, usernameScreen);
});

continueBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username === '') {
        document.getElementById('usernameError').classList.remove('hidden');
        return;
    }
    currentUsername = username;
    document.getElementById('usernameError').classList.add('hidden');
    startGame();
});

backToWelcomeBtn.addEventListener('click', () => {
    switchScreen(usernameScreen, welcomeScreen);
    usernameInput.value = '';
});

viewLeaderboardBtn.addEventListener('click', showLeaderboard);
viewLeaderboardResultsBtn.addEventListener('click', showLeaderboard);
closeLeaderboardBtn.addEventListener('click', () => {
    switchScreen(leaderboardScreen, welcomeScreen);
});

playAgainBtn.addEventListener('click', resetQuiz);
shareScoreBtn.addEventListener('click', shareScore);

// Leaderboard Management
function saveScoreToLeaderboard(username, score, topic) {
    // Get existing leaderboard for this topic
    const leaderboardKey = `leaderboard_${topic.replace(/\s+/g, '_')}`;
    let leaderboard = JSON.parse(localStorage.getItem(leaderboardKey) || '[]');
    
    // Add new score
    const entry = {
        username: username,
        score: score,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    leaderboard.push(entry);
    
    // Sort by score (descending), then by timestamp (ascending for ties)
    leaderboard.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.timestamp - b.timestamp;
    });
    
    // Keep only top 100
    leaderboard = leaderboard.slice(0, 100);
    
    // Save back to localStorage
    localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
    
    return leaderboard;
}

function getLeaderboard(topic) {
    const leaderboardKey = `leaderboard_${topic.replace(/\s+/g, '_')}`;
    return JSON.parse(localStorage.getItem(leaderboardKey) || '[]');
}

function getUserRank(username, timestamp, leaderboard) {
    const index = leaderboard.findIndex(entry => 
        entry.username === username && Math.abs(entry.timestamp - timestamp) < 5000
    );
    return index >= 0 ? index + 1 : leaderboard.length;
}

function showLeaderboard() {
    const topic = quizData.topic;
    const leaderboard = getLeaderboard(topic);
    
    document.getElementById('leaderboardTopic').textContent = `Topic: ${topic}`;
    
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';
    
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<div class="leaderboard-empty">No scores yet. Be the first to play!</div>';
    } else {
        leaderboard.forEach((entry, index) => {
            const rank = index + 1;
            const entryEl = document.createElement('div');
            entryEl.className = 'leaderboard-entry';
            
            // Highlight current user's most recent score
            if (currentUsername && entry.username === currentUsername && 
                Math.abs(Date.now() - entry.timestamp) < 60000) {
                entryEl.classList.add('current-user');
            }
            
            // Highlight top 3
            if (rank <= 3) {
                entryEl.classList.add('top-3');
            }
            
            let rankClass = '';
            let rankDisplay = `#${rank}`;
            if (rank === 1) {
                rankClass = 'top-1';
                rankDisplay = '🥇';
            } else if (rank === 2) {
                rankClass = 'top-2';
                rankDisplay = '🥈';
            } else if (rank === 3) {
                rankClass = 'top-3';
                rankDisplay = '🥉';
            }
            
            entryEl.innerHTML = `
                <div class="entry-left">
                    <div class="entry-rank ${rankClass}">${rankDisplay}</div>
                    <div class="entry-name">${entry.username}</div>
                </div>
                <div class="entry-score">${entry.score}</div>
            `;
            
            leaderboardList.appendChild(entryEl);
        });
    }
    
    const fromScreen = resultsScreen.classList.contains('active') ? resultsScreen : welcomeScreen;
    switchScreen(fromScreen, leaderboardScreen);
}

// Initialize
loadQuestions();
