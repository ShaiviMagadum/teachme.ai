// State management with LocalStorage sync
let classrooms = JSON.parse(localStorage.getItem('teachme_classes')) || [
    { id: 1, name: "Maya", subject: "AP Calculus: Derivatives & Rates of Change", xp: 50 },
    { id: 2, name: "Leo", subject: "AP Physics: Newton's Laws of Motion", xp: 20 }
];
let currentClass = null;
let totalXP = parseInt(localStorage.getItem('teachme_xp')) || 70;
let chatHistory = [];

function updateUI() {
    document.getElementById('xp-display').innerText = totalXP;
    const grid = document.getElementById('classrooms-grid');
    grid.innerHTML = '';

    if (classrooms.length === 0) {
        grid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">No classrooms yet. Click "Load AP Curriculum" or create one above!</p>`;
        return;
    }

    classrooms.forEach(c => {
        const card = document.createElement('div');
        card.className = 'classroom-card';
        card.onclick = () => openSession(c.id);
        card.innerHTML = `
            <div style="display: flex; gap: 0.75rem; align-items: center;">
                <div class="avatar">${c.name[0]}</div>
                <div>
                    <h3 style="font-size: 1rem;">Teach ${c.name}</h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">${c.subject}</p>
                </div>
            </div>
            <div style="font-size: 0.8rem; color: var(--accent); margin-top: auto;">⚡ ${c.xp} XP Earned</div>
        `;
        grid.appendChild(card);
    });

    localStorage.setItem('teachme_classes', JSON.stringify(classrooms));
    localStorage.setItem('teachme_xp', totalXP);
}

function openClassModal() {
    document.getElementById('create-modal').showModal();
}

function saveClassroom(e) {
    e.preventDefault();
    const name = document.getElementById('student-name').value;
    const subject = document.getElementById('ap-topic').value;
    
    classrooms.push({ id: Date.now(), name, subject, xp: 0 });
    document.getElementById('create-form').reset();
    document.getElementById('create-modal').close();
    updateUI();
}

function loadDefaultAPClasses() {
    classrooms = [
        { id: 101, name: "Maya", subject: "AP Calculus: Derivatives & Rates of Change", xp: 40 },
        { id: 102, name: "Liam", subject: "AP Physics: Newton's Laws of Motion", xp: 20 },
        { id: 103, name: "Chloe", subject: "AP Chemistry: Stoichiometry & Equilibrium", xp: 15 },
        { id: 104, name: "Sam", subject: "AP Computer Science: Recursion & Object-Oriented Programming", xp: 60 }
    ];
    updateUI();
}

function openSession(id) {
    currentClass = classrooms.find(c => c.id === id);
    if (!currentClass) return;

    document.getElementById('session-avatar').innerText = currentClass.name[0];
    document.getElementById('session-title').innerText = `Teach ${currentClass.name}`;
    document.getElementById('session-subject').innerText = currentClass.subject.toUpperCase();
    
    chatHistory = [
        { role: 'ai', text: `Hi Professor! I'm ready to learn about ${currentClass.subject}. How would you explain this topic to me simply?` }
    ];
    renderChat();
    document.getElementById('session-modal').showModal();
}

function closeSession() {
    document.getElementById('session-modal').close();
    currentClass = null;
}

function renderChat() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    chatHistory.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.role}`;
        div.innerText = msg.text;
        container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
}

function sendExplanation(e) {
    e.preventDefault();
    const inputEl = document.getElementById('user-input');
    const text = inputEl.value.trim();
    if (!text || !currentClass) return;

    chatHistory.push({ role: 'user', text });
    inputEl.value = '';
    renderChat();

    // AI Student Questioning & Grading Logic simulation
    setTimeout(() => {
        let aiReply = "";
        
        if (chatHistory.length < 5) {
            aiReply = `Wait, can you clarify that part about ${currentClass.subject.split(':')[1] || 'the core concept'}? Why does that happen in real terms? Give me an example!`;
        } else {
            aiReply = `That actually makes a lot more sense now! I think I get it. You've earned +25 XP for clear teaching! 🎉`;
            currentClass.xp += 25;
            totalXP += 25;
            updateUI();
        }
        chatHistory.push({ role: 'ai', text: aiReply });
        renderChat();
    }, 1000);
}

// Initialize on load
updateUI();
