// Firebase Configuration
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
            console.log('✅ Firebase Ready');
        }
    } catch (e) { console.error('Firebase Error', e); }
}

initFirebase();

// State
let quizData = null;
let currentUsername = '';

// UI Elements
const welcomeScreen = document.getElementById('welcomeScreen');
const usernameScreen = document.getElementById('usernameScreen');
const leaderboardScreen = document.getElementById('leaderboardScreen');
const quizScreen = document.getElementById('quizScreen');

// Navigation
function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

// Data Handling
async function loadQuestions() {
    const res = await fetch('questions.json');
    quizData = await res.json();
    document.getElementById('topicBadge').textContent = `Topic: ${quizData.topic}`;
}

async function showLeaderboard() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = 'Loading...';
    
    if (firebaseInitialized) {
        const topicKey = quizData.topic.replace(/\s+/g, '_');
        const snap = await database.ref(`leaderboards/${topicKey}`).orderByChild('score').limitToLast(10).once('value');
        
        list.innerHTML = '';
        const data = [];
        snap.forEach(c => data.push(c.val()));
        data.reverse().forEach((entry, i) => {
            const rank = i + 1;
            let rankIcon = `#${rank}`;
            if(rank === 1) rankIcon = '🥇';
            if(rank === 2) rankIcon = '🥈';
            if(rank === 3) rankIcon = '🥉';

            const div = document.createElement('div');
            div.className = 'leaderboard-entry';
            div.innerHTML = `
                <span class="entry-rank">${rankIcon}</span>
                <span class="entry-name">${entry.username}</span>
                <span class="entry-score">${entry.score}</span>
            `;
            list.appendChild(div);
        });
    }
    showScreen(leaderboardScreen);
}

// Event Listeners
document.getElementById('startGameBtn').addEventListener('click', () => showScreen(usernameScreen));
document.getElementById('viewLeaderboardBtn').addEventListener('click', showLeaderboard);
document.getElementById('closeLeaderboardBtn').addEventListener('click', () => showScreen(welcomeScreen));
document.getElementById('backToWelcomeBtn').addEventListener('click', () => showScreen(welcomeScreen));

document.getElementById('continueBtn').addEventListener('click', () => {
    currentUsername = document.getElementById('usernameInput').value.trim();
    if (currentUsername) showScreen(quizScreen);
    else alert('Please enter your name');
});

loadQuestions();
