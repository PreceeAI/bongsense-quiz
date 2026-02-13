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
    let timeLeft = 20;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleAnswer(-1, -1, 0, "Time is up!");
        }
    }, 1000);
}

function handleAnswer(selectedIdx, correctIdx, points, fact) {
    clearInterval(timerInterval);
    const buttons = document.querySelectorAll('#optionsContainer button');

    buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (i === correctIdx) btn.style.background = '#d4edda'; 
        if (i === selectedIdx && selectedIdx !== correctIdx) btn.style.background = '#f8d7da';
    });

    if (selectedIdx === correctIdx) {
        score += points;
        document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    }

    document.getElementById('factDisplay').style.display = 'block';
    document.getElementById('factText').textContent = fact || "Next question incoming...";

    setTimeout(() => {
        currentQuestionIdx++;
        if (currentQuestionIdx >= 10) {
            currentQuestionIdx = 0;
            currentRoundIdx++;
        }
        startQuestion();
    }, 3000);
}

// --- 6. Results & Rank Logic ---
async function finishGame() {
    const topicKey = quizData.topic.replace(/\s+/g, '_');
    let rank = "N/A";

    if (firebaseInitialized && currentUsername) {
        try {
            const dbRef = database.ref(`leaderboards/${topicKey}`);
            // 1. Push score
            await dbRef.push({
                username: currentUsername,
                score: score,
                timestamp: Date.now()
            });

            // 2. Fetch all scores to calculate rank
            const snap = await dbRef.orderByChild('score').once('value');
            const allScores = [];
            snap.forEach(child => allScores.push(child.val().score));
            
            // 3. Sort descending and find rank
            allScores.sort((a, b) => b - a);
            rank = allScores.indexOf(score) + 1;
        } catch (e) { console.error("Sync Error:", e); }
    }

    // Redirect to a Results view (using Leaderboard container for simplicity)
    const list = document.getElementById('leaderboardList');
    list.innerHTML = `
        <div style="padding: 20px; background: #f0f4ff; border-radius: 15px; margin-bottom: 20px;">
            <h3 style="color: #764ba2; margin-bottom: 10px;">Quiz Complete!</h3>
            <p style="font-size: 24px; font-weight: 800;">Score: ${score}/200</p>
            <p style="font-size: 18px; font-weight: 600; color: #667eea;">Global Rank: #${rank}</p>
        </div>
        <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Check the full leaderboard below:</p>
    `;
    
    // Show full leaderboard after the summary
    await fetchAndAppendLeaderboard(topicKey, list);
    showScreen('leaderboardScreen');
}

async function fetchAndAppendLeaderboard(topicKey, container) {
    if (firebaseInitialized) {
        const snap = await database.ref(`leaderboards/${topicKey}`).orderByChild('score').limitToLast(10).once('value');
        const data = [];
        snap.forEach(c => data.push(c.val()));
        data.reverse().forEach((entry, i) => {
            const div = document.createElement('div');
            div.className = 'leaderboard-entry';
            div.innerHTML = `<span class="entry-name">${entry.username}</span><span class="entry-score">${entry.score}</span>`;
            container.appendChild(div);
        });
    }
}

async function showLeaderboard() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = 'Loading...';
    showScreen('leaderboardScreen');
    const topicKey = quizData.topic.replace(/\s+/g, '_');
    await fetchAndAppendLeaderboard(topicKey, list);
}

// --- 7. Event Listeners ---
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
