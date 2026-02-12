// ============================================
// FIREBASE CONFIGURATION
// ============================================
// Replace this with YOUR Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDoYiNMQ5DVLnCaySYw0zqLFcawUnysO64",
  authDomain: "bongsense-quiz.firebaseapp.com",
  databaseURL: "https://bongsense-quiz-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bongsense-quiz",
  storageBucket: "bongsense-quiz.firebasestorage.app",
  messagingSenderId: "908406939869",
  appId: "1:908406939869:web:195720a315bcfa351e3b34",
  measurementId: "G-PFXWENP2MS"
};

// Initialize Firebase (will be loaded from CDN in HTML)
let database = null;

function initFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        console.log('✅ Firebase initialized');
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        alert('Could not connect to leaderboard. Scores will be saved locally only.');
    }
}

// ============================================
// LEADERBOARD FUNCTIONS - FIREBASE VERSION
// ============================================

async function saveScoreToLeaderboard(username, score, topic) {
    const timestamp = Date.now();
    
    if (!database) {
        console.warn('Firebase not initialized, saving locally');
        return saveScoreLocally(username, score, topic);
    }
    
    try {
        // Save to Firebase
        const topicKey = topic.replace(/\s+/g, '_');
        const leaderboardRef = database.ref(`leaderboards/${topicKey}`);
        
        await leaderboardRef.push({
            username: username,
            score: score,
            timestamp: timestamp,
            date: new Date().toISOString()
        });
        
        console.log('✅ Score saved to Firebase');
        
        // Also save locally as backup
        saveScoreLocally(username, score, topic);
        
        return true;
    } catch (error) {
        console.error('❌ Error saving to Firebase:', error);
        // Fallback to local storage
        saveScoreLocally(username, score, topic);
        return false;
    }
}

function saveScoreLocally(username, score, topic) {
    const leaderboardKey = `leaderboard_${topic.replace(/\s+/g, '_')}`;
    let leaderboard = JSON.parse(localStorage.getItem(leaderboardKey) || '[]');
    
    const entry = {
        username: username,
        score: score,
        date: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    leaderboard.push(entry);
    leaderboard.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.timestamp - b.timestamp;
    });
    
    leaderboard = leaderboard.slice(0, 100);
    localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
    
    return leaderboard;
}

async function getLeaderboard(topic) {
    if (!database) {
        return getLeaderboardLocally(topic);
    }
    
    try {
        const topicKey = topic.replace(/\s+/g, '_');
        const leaderboardRef = database.ref(`leaderboards/${topicKey}`);
        
        // Get data sorted by score (descending)
        const snapshot = await leaderboardRef
            .orderByChild('score')
            .limitToLast(100)
            .once('value');
        
        if (!snapshot.exists()) {
            return [];
        }
        
        // Convert to array and reverse (highest score first)
        const leaderboard = [];
        snapshot.forEach((child) => {
            leaderboard.push({
                id: child.key,
                ...child.val()
            });
        });
        
        // Sort by score desc, then timestamp asc
        leaderboard.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.timestamp - b.timestamp;
        });
        
        console.log(`✅ Loaded ${leaderboard.length} scores from Firebase`);
        return leaderboard;
        
    } catch (error) {
        console.error('❌ Error loading from Firebase:', error);
        return getLeaderboardLocally(topic);
    }
}

function getLeaderboardLocally(topic) {
    const leaderboardKey = `leaderboard_${topic.replace(/\s+/g, '_')}`;
    return JSON.parse(localStorage.getItem(leaderboardKey) || '[]');
}

function getUserRank(username, timestamp, leaderboard) {
    // Find most recent entry for this user
    const userEntries = leaderboard.filter(e => e.username === username);
    if (userEntries.length === 0) return leaderboard.length;
    
    // Get the most recent one (by timestamp)
    const latestEntry = userEntries.reduce((latest, current) => {
        return current.timestamp > latest.timestamp ? current : latest;
    });
    
    const index = leaderboard.findIndex(entry => 
        entry.username === latestEntry.username && 
        entry.timestamp === latestEntry.timestamp
    );
    
    return index + 1;
}

async function showLeaderboard() {
    const topic = quizData.topic;
    const leaderboard = await getLeaderboard(topic);
    
    document.getElementById('leaderboardTopic').textContent = `Topic: ${topic}`;
    
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '<div class="leaderboard-empty">Loading...</div>';
    
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<div class="leaderboard-empty">No scores yet. Be the first to play!</div>';
    } else {
        leaderboardList.innerHTML = '';
        
        leaderboard.slice(0, 100).forEach((entry, index) => {
            const rank = index + 1;
            const entryEl = document.createElement('div');
            entryEl.className = 'leaderboard-entry';
            
            // Highlight current user's most recent score
            if (currentUsername && entry.username === currentUsername && 
                Math.abs(Date.now() - entry.timestamp) < 300000) { // 5 minutes
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

// ============================================
// REST OF YOUR EXISTING QUIZ CODE
// ============================================
// (Keep all your existing code below - DOM elements, quiz state, etc.)
// Just make sure to call initFirebase() when page loads

// Initialize Firebase when page loads
window.addEventListener('DOMContentLoaded', () => {
    initFirebase();
});
