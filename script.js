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

// --- 1. Initialize Firebase ---
function initFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            firebaseInitialized = true;
            console.log('✅ Global Firebase Connected');
        } else {
            console.warn('⚠️ Firebase SDK not found, using Local Mode');
        }
    } catch (e) {
        console.error('❌ Firebase Error:', e);
    }
}

initFirebase();

// --- 2. App State ---
let quizData = null;
let currentUsername = '';

// --- 3. Navigation Helpers ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// --- 4. Data Handling ---
async function loadQuestions() {
    try {
        const res = await fetch('questions.json');
        quizData = await res.json();
        document.getElementById('topicBadge').textContent = `Topic: ${quizData.topic}`;
    } catch (e) {
        console.error('Failed to load questions:', e);
    }
}

// --- 5. Global Leaderboard Logic ---
async function showLeaderboard() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<p style="font-size: 14px; color: #666;">Syncing with Global Leaderboard...</p>';
    
    showScreen('leaderboardScreen');

    let leaderboardData = [];
    const topicKey = quizData.topic.replace(/\s+/g, '_');

    // Attempt to get Global Data
    if (firebaseInitialized && database) {
        try {
            const snap = await database.ref(`leaderboards/${topicKey}`)
                                     .orderByChild('score')
                                     .limitToLast(30) // Get top 30
                                     .once('value');
            
            if (snap.exists()) {
                const rawData = [];
                snap.forEach(c => { rawData.push(c.val()); });
                // Firebase returns ascending, we need descending for leaderboard
                leaderboardData = rawData.reverse();
                console.log("📡 Global Data Fetched");
            }
        } catch (e) {
            console.error("Firebase sync failed, falling back to local:", e);
        }
    }

    // Fallback to Local Storage if Global is empty or failed
    if (leaderboardData.length === 0) {
        const local = localStorage.getItem(`leaderboard_${topicKey}`);
        leaderboardData = local ? JSON.parse(local) : [];
        console.log("📝 Using Local Data");
    }

    // --- 6. Render the List ---
    list.innerHTML = '';
    
    if (leaderboardData.length === 0) {
        list.innerHTML = '<p style="font-size: 14px; color: #666;">No scores yet! Be the first.</p>';
        return;
    }

    leaderboardData.forEach((entry, i) => {
        const rank = i + 1;
        let rankIcon = `#${rank}`;
        
        // Visual enhancements for top 3
        if(rank === 1) rankIcon = '🥇';
        else if(rank === 2) rankIcon = '🥈';
        else if(rank === 3) rankIcon = '🥉';

        const div = document.createElement('div');
        // Add specific class for top 3 styling from CSS
        div.className = `leaderboard-entry ${rank <= 3 ? 'top-' + rank : ''}`;
        div.innerHTML = `
            <div class="entry-left" style="display: flex; align-items: center; gap: 10px;">
                <span class="entry-rank" style="min-width: 30px;">${rankIcon}</span>
                <span class="entry-name" style="font-size: 14px;">${entry.username}</span>
            </div>
            <span class="entry-score" style="font-weight: 800; color: #764ba2;">${entry.score}</span>
        `;
        list.appendChild(div);
    });
}

// --- 7. Event Listeners ---
document.getElementById('startGameBtn').addEventListener('click', () => showScreen('usernameScreen'));
document.getElementById('viewLeaderboardBtn').addEventListener('click', showLeaderboard);
document.getElementById('closeLeaderboardBtn').addEventListener('click', () => showScreen('welcomeScreen'));
document.getElementById('backToWelcomeBtn').addEventListener('click', () => showScreen('welcomeScreen'));

document.getElementById('continueBtn').addEventListener('click', () => {
    currentUsername = document.getElementById('usernameInput').value.trim();
    if (currentUsername) {
        // Placeholder for game start
        alert(`Hello ${currentUsername}! Ready to start the quiz?`);
    } else {
        alert('Please enter your name');
    }
});

// Start initialization
loadQuestions();
