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

// Initialize Firebase
function initFirebase() {
    try {
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            firebaseInitialized = true;
            console.log('✅ Firebase Ready');
        } else {
            console.warn('⚠️ Firebase SDK missing');
        }
    } catch (e) {
        console.error('❌ Firebase Error:', e);
    }
}

initFirebase();

// App State
let quizData = null;
let currentUsername = '';

// Navigation Helpers
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Data Handling
async function loadQuestions() {
    try {
        const res = await fetch('questions.json');
        quizData = await res.json();
        document.getElementById('topicBadge').textContent = `Topic: ${quizData.topic}`;
    } catch (e) {
        console.error('Failed to load questions:', e);
    }
}

// Leaderboard Display Logic
async function showLeaderboard() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<p style="font-size: 14px; color: #666;">Loading scores...</p>';
    
    showScreen('leaderboardScreen');

    if (firebaseInitialized && database) {
        try {
            const topicKey = quizData.topic.replace(/\s+/g, '_');
            const snap = await database.ref(`leaderboards/${topicKey}`)
                                     .orderByChild('score')
                                     .limitToLast(20) // Show top 20 for mobile
                                     .once('value');
            
            list.innerHTML = '';
            const rawData = [];
            snap.forEach(c => { rawData.push(c.val()); });
            
            // Reverse so highest score is first
            const data = rawData.reverse();

            if (data.length === 0) {
                list.innerHTML = '<p style="font-size: 14px; color: #666;">No scores yet!</p>';
                return;
            }

            data.forEach((entry, i) => {
                const rank = i + 1;
                let rankIcon = `#${rank}`;
                
                // Set icons for Top 3
                if(rank === 1) rankIcon = '🥇';
                else if(rank === 2) rankIcon = '🥈';
                else if(rank === 3) rankIcon = '🥉';

                const div = document.createElement('div');
                div.className = `leaderboard-entry ${rank <= 3 ? 'top-' + rank : ''}`;
                div.innerHTML = `
                    <div class="entry-left" style="display: flex; align-items: center; gap: 10px;">
                        <span class="entry-rank">${rankIcon}</span>
                        <span class="entry-name" style="font-size: 14px;">${entry.username}</span>
                    </div>
                    <span class="entry-score">${entry.score}</span>
                `;
                list.appendChild(div);
            });
        } catch (e) {
            list.innerHTML = '<p style="font-size: 14px; color: red;">Error loading leaderboard.</p>';
            console.error(e);
        }
    }
}

// Button Interactions
document.getElementById('startGameBtn').addEventListener('click', () => showScreen('usernameScreen'));
document.getElementById('viewLeaderboardBtn').addEventListener('click', showLeaderboard);
document.getElementById('closeLeaderboardBtn').addEventListener('click', () => showScreen('welcomeScreen'));
document.getElementById('backToWelcomeBtn').addEventListener('click', () => showScreen('welcomeScreen'));

document.getElementById('continueBtn').addEventListener('click', () => {
    currentUsername = document.getElementById('usernameInput').value.trim();
    if (currentUsername) {
        alert('Ready to play! Quiz logic is the next step.');
        // Next step: Insert actual quiz starting logic here
    } else {
        alert('Please enter your name');
    }
});

// Start initialization
loadQuestions();
