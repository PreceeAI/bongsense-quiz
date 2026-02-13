// --- 1. Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDoYiNMQ5DVLnCaySYw0zqLFcawUnysO64",
  authDomain: "bongsense-quiz.firebaseapp.com",
  databaseURL: "https://bongsense-quiz-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bongsense-quiz",
  storageBucket: "bongsense-quiz.firebasestorage.app",
  messagingSenderId: "908406939869",
  appId: "1:908406939869:web:195720a315bcfa351e3b34"
};

let database = null;
let firebaseInitialized = false;

function initFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            firebaseInitialized = true;
            console.log('✅ Global Firebase Connected');
        }
    } catch (e) { console.error('❌ Firebase Error:', e); }
}

initFirebase();

// --- 2. Game State ---
let quizData = null;
let selectedQuestions = [];
let currentRoundIdx = 0;
let currentQuestionIdx = 0;
let score = 0;
let currentUsername = '';
let timerInterval = null;
let timeLeft = 20;

// --- 3. UI Helpers ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// --- 4. Loading & Setup ---
async function loadQuestions() {
    try {
        const res = await fetch('questions.json');
        quizData = await res.json();
        document.getElementById('topicBadge').textContent = `Topic: ${quizData.topic}`;
    } catch (e) { console.error('Failed to load questions:', e); }
}

function prepareGame() {
    score = 0;
    currentRoundIdx = 0;
    currentQuestionIdx = 0;
    selectedQuestions = quizData.rounds.map(round => ({
        ...round,
        // Shuffle and take 10 questions per round
        questions: [...round.questions].sort(() => 0.5 - Math.random()).slice(0, 10)
    }));
    startQuestion();
}

// --- 5. Core Quiz Logic ---
function startQuestion() {
    if (currentRoundIdx >= selectedQuestions.length) {
        finishGame();
        return;
    }

    const round = selectedQuestions[currentRoundIdx];
    const question = round.questions[currentQuestionIdx];
    
    // Update UI
    document.getElementById('questionCounter').textContent = `${(currentRoundIdx * 10) + currentQuestionIdx + 1}/20`;
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('factDisplay').style.display = 'none';

    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';

    question.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'pixel-btn btn-secondary';
        btn.textContent = opt;
        btn.onclick = () => handleAnswer(i, question.correct, question.points, question.fact);
        container.appendChild(btn);
    });

    startTimer();
}

function startTimer() {
    timeLeft = 20;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleAnswer(-1); // Timeout
        }
    }, 1000);
}

function handleAnswer(selectedIdx, correctIdx, points, fact) {
    clearInterval(timerInterval);
    const container = document.getElementById('optionsContainer');
    const buttons = container.querySelectorAll('button');

    // Show correct/incorrect colors
    buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (i === correctIdx) btn.style.background = '#d4edda'; // Correct
        if (i === selectedIdx && selectedIdx !== correctIdx) btn.style.background = '#f8d7da'; // Wrong
    });

    if (selectedIdx === correctIdx) {
        score += points;
        document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    }

    // Show fact and move forward
    if (fact) {
        document.getElementById('factDisplay').style.display = 'block';
        document.getElementById('factText').textContent = fact;
    }

    setTimeout(() => {
        currentQuestionIdx++;
        if (currentQuestionIdx >= 10) {
            currentQuestionIdx = 0;
            currentRoundIdx++;
        }
        startQuestion();
    }, 3000);
}

// --- 6. Results & Firebase Save ---
async function finishGame() {
    showScreen('welcomeScreen'); // Redirect to home after finish
    alert(`Game Over! Your Final Score: ${score}`);
    
    if (firebaseInitialized && currentUsername) {
        const topicKey = quizData.topic.replace(/\s+/g, '_');
        await database.ref(`leaderboards/${topicKey}`).push({
            username: currentUsername,
            score: score,
            timestamp: Date.now()
        });
    }
}

// --- 7. Global Leaderboard Retrieval ---
async function showLeaderboard() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<p style="font-size: 14px;">Syncing...</p>';
    showScreen('leaderboardScreen');

    if (firebaseInitialized) {
        const topicKey = quizData.topic.replace(/\s+/g, '_');
        const snap = await database.ref(`leaderboards/${topicKey}`).orderByChild('score').limitToLast(20).once('value');
        
        list.innerHTML = '';
        const data = [];
        snap.forEach(c => data.push(c.val()));
        data.reverse().forEach((entry, i) => {
            const div = document.createElement('div');
            div.className = 'leaderboard-entry';
            div.innerHTML = `<span class="entry-name">${entry.username}</span><span class="entry-score">${entry.score}</span>`;
            list.appendChild(div);
        });
    }
}

// --- 8. Event Listeners ---
document.getElementById('startGameBtn').addEventListener('click', () => showScreen('usernameScreen'));
document.getElementById('viewLeaderboardBtn').addEventListener('click', showLeaderboard);
document.getElementById('closeLeaderboardBtn').addEventListener('click', () => showScreen('welcomeScreen'));
document.getElementById('backToWelcomeBtn').addEventListener('click', () => showScreen('welcomeScreen'));

document.getElementById('continueBtn').addEventListener('click', () => {
    currentUsername = document.getElementById('usernameInput').value.trim();
    if (currentUsername) {
        showScreen('quizScreen');
        prepareGame();
    } else {
        alert('Please enter your name');
    }
});

loadQuestions();
