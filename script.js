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
            console.log('✅ Firebase initialized');
        }
    } catch (error) {
        console.error('❌ Firebase init failed:', error);
    }
}

initFirebase();

// DOM Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const usernameScreen = document.getElementById('usernameScreen');
const leaderboardScreen = document.getElementById('leaderboardScreen');
const quizScreen = document.getElementById('quizScreen');
const resultsScreen = document.getElementById('resultsScreen');
const usernameInput = document.getElementById('usernameInput');

// Quiz State
let quizData = null;
let selectedQuestions = [];
let currentRound = 0;
let currentQuestion = 0;
let score = 0;
let currentUsername = '';

// Load Questions
async function loadQuestions() {
    const response = await fetch('questions.json');
    quizData = await response.json();
    document.getElementById('topicBadge').textContent = `Topic Today: ${quizData.topic}`;
    selectRandomQuestions();
}

function selectRandomQuestions() {
    selectedQuestions = quizData.rounds.map(r => ({
        ...r,
        questions: r.questions.sort(() => 0.5 - Math.random()).slice(0, 10)
    }));
}

// Global Sync
async function saveScoreToLeaderboard(username, score, topic) {
    const entry = {
        username: String(username),
        score: Number(score),
        timestamp: Date.now()
    };
    
    if (firebaseInitialized && database) {
        try {
            const topicKey = topic.replace(/\s+/g, '_');
            await database.ref(`leaderboards/${topicKey}`).push(entry);
        } catch (e) { console.error("Firebase sync error", e); }
    }
    localStorage.setItem(`last_score`, JSON.stringify(entry));
}

async function getLeaderboard(topic) {
    if (firebaseInitialized && database) {
        const topicKey = topic.replace(/\s+/g, '_');
        const snapshot = await database.ref(`leaderboards/${topicKey}`).orderByChild('score').limitToLast(100).once('value');
        if (snapshot.exists()) {
            const data = [];
            snapshot.forEach(child => { data.push(child.val()); });
            return data.sort((a, b) => b.score - a.score);
        }
    }
    return [];
}

// FIX: Leaderboard Display with #2 and #3
async function showLeaderboard() {
    const leaderboard = await getLeaderboard(quizData.topic);
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';

    leaderboard.forEach((entry, index) => {
        const rank = index + 1;
        const entryEl = document.createElement('div');
        entryEl.className = `leaderboard-entry top-${rank}`;
        
        let rankDisplay = `#${rank}`;
        if (rank === 1) rankDisplay = '🥇';
        else if (rank === 2) rankDisplay = '🥈'; // Explicitly showing #2
        else if (rank === 3) rankDisplay = '🥉'; // Explicitly showing #3

        entryEl.innerHTML = `
            <div style="display: flex; align-items: center;">
                <div class="entry-rank">${rankDisplay}</div>
                <div class="entry-name">${entry.username}</div>
            </div>
            <div class="entry-score">${entry.score}</div>
        `;
        list.appendChild(entryEl);
    });
    
    welcomeScreen.classList.remove('active');
    resultsScreen.classList.remove('active');
    leaderboardScreen.classList.add('active');
}

// Event Listeners
document.getElementById('startGameBtn').addEventListener('click', () => {
    welcomeScreen.classList.remove('active');
    usernameScreen.classList.add('active');
});

document.getElementById('continueBtn').addEventListener('click', () => {
    currentUsername = usernameInput.value.trim();
    if (currentUsername) {
        usernameScreen.classList.remove('active');
        quizScreen.classList.add('active');
        // Add start game logic here
    }
});

document.getElementById('viewLeaderboardBtn').addEventListener('click', showLeaderboard);
document.getElementById('closeLeaderboardBtn').addEventListener('click', () => {
    leaderboardScreen.classList.remove('active');
    welcomeScreen.classList.add('active');
});

loadQuestions();
