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
            // Monitor connection state
            database.ref('.info/connected').on('value', (snap) => {
                if (snap.val() === true) {
                    console.log('✅ Firebase Connected');
                } else {
                    console.log('⚠️ Firebase Disconnected');
                }
            });
            firebaseInitialized = true;
        } else {
            console.error('❌ Firebase SDK not loaded');
        }
    } catch (e) { 
        console.error('❌ Firebase Error:', e); 
        firebaseInitialized = false;
    }
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
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        quizData = await res.json();
        document.getElementById('topicBadge').textContent = `Topic: ${quizData.topic}`;
    } catch (e) { 
        console.error('Failed to load questions:', e); 
        document.getElementById('topicBadge').textContent = 'Error loading quiz';
    }
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
    
    const timerEl = document.getElementById('timerDisplay');
    timerEl.textContent = `⏱ ${timeLeft}s`;
    timerEl.style.color = '#764ba2';

    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = `⏱ ${timeLeft}s`;
        
        if (timeLeft <= 5) {
            timerEl.style.color = '#e74c3c';
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleAnswer(-1, -1, 0, "⏰ Time's up!");
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
            
            // 1. Push score and wait for confirmation
            const newRef = await dbRef.push({
                username: currentUsername,
                score: score,
                timestamp: Date.now()
            });
            console.log('✅ Score saved:', newRef.key);

            // 2. Fetch all scores to calculate rank
            const snap = await dbRef.orderByChild('score').once('value');
            const allScores = [];
            snap.forEach(child => allScores.push(child.val().score));
            
            // 3. Sort descending and find rank
            allScores.sort((a, b) => b - a);
            const foundIdx = allScores.indexOf(score);
            rank = foundIdx >= 0 ? foundIdx + 1 : "N/A";
        } catch (e) { 
            console.error("Firebase Sync Error:", e.code, e.message); 
            rank = "⚠️ Save failed";
        }
    }

    // Show results
    const list = document.getElementById('leaderboardList');
    list.innerHTML = `
        <div style="padding: 20px; background: #f0f4ff; border-radius: 15px; margin-bottom: 20px;">
            <h3 style="color: #764ba2; margin-bottom: 10px;">Quiz Complete!</h3>
            <p style="font-size: 24px; font-weight: 800;">Score: ${score}/200</p>
            <p style="font-size: 18px; font-weight: 600; color: #667eea;">Global Rank: #${rank}</p>
        </div>
        <p style="font-size: 14px; color: #666; margin-bottom: 15px;">Top 10 Leaderboard:</p>
    `;
    
    await fetchAndAppendLeaderboard(topicKey, list);
    showScreen('leaderboardScreen');
}

async function fetchAndAppendLeaderboard(topicKey, container) {
    if (!firebaseInitialized) {
        container.innerHTML += '<p style="color: #e74c3c; font-size: 13px; padding: 10px;">⚠️ Could not connect to leaderboard. Check your internet connection.</p>';
        return;
    }

    try {
        const snap = await database.ref(`leaderboards/${topicKey}`).orderByChild('score').limitToLast(10).once('value');
        const data = [];
        snap.forEach(c => data.push(c.val()));
        
        if (data.length === 0) {
            container.innerHTML += '<p style="color: #888; font-size: 13px; padding: 10px;">No scores yet. Be the first!</p>';
            return;
        }

        data.reverse().forEach((entry, i) => {
            const medals = ['🥇', '🥈', '🥉'];
            const prefix = i < 3 ? medals[i] : `#${i + 1}`;
            const div = document.createElement('div');
            div.className = 'leaderboard-entry';
            div.innerHTML = `<span class="entry-name">${prefix} ${entry.username}</span><span class="entry-score">${entry.score}</span>`;
            container.appendChild(div);
        });
    } catch (e) {
        console.error('Leaderboard fetch error:', e);
        container.innerHTML += `<p style="color: #e74c3c; font-size: 13px; padding: 10px;">⚠️ Failed to load leaderboard.<br><small style="word-break:break-all;">${e.message}</small></p>`;
    }
}

async function showLeaderboard() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<p style="color: #888; padding: 20px;">Loading...</p>';
    showScreen('leaderboardScreen');
    
    if (!quizData) {
        list.innerHTML = '<p style="color: #e74c3c; padding: 20px;">Quiz data not loaded yet.</p>';
        return;
    }
    
    const topicKey = quizData.topic.replace(/\s+/g, '_');
    list.innerHTML = ''; // Clear "Loading..." before appending entries
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

// Allow Enter key on username input
document.getElementById('usernameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('continueBtn').click();
    }
});

loadQuestions();
