// State & LocalStorage
let classrooms = JSON.parse(localStorage.getItem('teachme_classes')) || [
    { id: 1, name: "Maya", subject: "AP Calculus BC: Series & Convergence", xp: 50, isAP: true },
    { id: 2, name: "Leo", subject: "AP Physics C: Electromagnetic Induction", xp: 35, isAP: true }
];
let currentClass = null;
let totalXP = parseInt(localStorage.getItem('teachme_xp')) || 85;
let chatHistory = [];

// API Settings configuration
let apiConfig = JSON.parse(localStorage.getItem('teachme_api_config')) || {
    provider: 'groq',
    apiKey: ''
};

// Official AP Curriculum Knowledge Bases mapped automatically by keywords
const apCurriculumMap = {
    calculus: "Official AP Calculus Curriculum: Focus on limits, derivatives, integrals, Riemann sums, Fundamental Theorem of Calculus, Taylor/Maclaurin series, and rate of change applications.",
    physics: "Official AP Physics Curriculum: Focus on Newton's laws, kinematics, energy conservation, momentum, rotational motion, electromagnetism, and Maxwell's equations.",
    chemistry: "Official AP Chemistry Curriculum: Focus on atomic structure, intermolecular forces, chemical stoichiometry, thermodynamics, chemical equilibrium, kinetics, and acid-base titrations.",
    biology: "Official AP Biology Curriculum: Focus on cellular respiration, photosynthesis, gene expression, heredity, evolution, molecular genetics, and ecological systems.",
    history: "Official AP US History (APUSH) Curriculum: Focus on colonization, American Revolution, Constitution, Civil War, Industrial Revolution, New Deal, and Cold War diplomacy.",
    computer: "Official AP Computer Science Curriculum: Focus on Java syntax, object-oriented programming, arrays, 2D arrays, recursion, sorting/searching algorithms, and inheritance."
};

function getAPPromptContext(subject) {
    const lower = subject.toLowerCase();
    for (const [key, prompt] of Object.entries(apCurriculumMap)) {
        if (lower.includes(key)) {
            return `[AP CURRICULUM GUIDELINES]: ${prompt}`;
        }
    }
    return `[CURRICULUM GUIDELINES]: High school / College level introductory course in ${subject}.`;
}

function updateUI() {
    document.getElementById('xp-display').innerText = totalXP;
    const grid = document.getElementById('classrooms-grid');
    grid.innerHTML = '';

    document.getElementById('classroom-count').innerText = `${classrooms.length} active classes`;

    if (classrooms.length === 0) {
        grid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">No classrooms yet. Click "Create Classroom" or load the AP Curriculum pack!</p>`;
        return;
    }

    classrooms.forEach(c => {
        const card = document.createElement('div');
        card.className = 'classroom-card';
        card.onclick = () => openSession(c.id);
        card.innerHTML = `
            <div class="card-top">
                <div class="avatar">${c.name[0]}</div>
                <div class="classroom-info">
                    <h3>Teach ${c.name}</h3>
                    <p>${c.subject}</p>
                </div>
            </div>
            <div class="card-footer">
                <span class="ap-tag">AP Standard</span>
                <span class="xp-tag">⚡ +${c.xp} XP</span>
            </div>
        `;
        grid.appendChild(card);
    });

    localStorage.setItem('teachme_classes', JSON.stringify(classrooms));
    localStorage.setItem('teachme_xp', totalXP);
}

function openClassModal() {
    document.getElementById('create-modal').showModal();
}

function openSettingsModal() {
    document.getElementById('api-provider').value = apiConfig.provider;
    document.getElementById('api-key-input').value = apiConfig.apiKey;
    toggleApiFields();
    document.getElementById('settings-modal').showModal();
}

function toggleApiFields() {
    const provider = document.getElementById('api-provider').value;
    const label = document.getElementById('api-key-label');
    const input = document.getElementById('api-key-input');
    if (provider === 'groq') {
        label.innerText = "Groq API Key (gsk_...)";
        input.placeholder = "gsk_... (Get free at console.groq.com)";
    } else {
        label.innerText = "OpenAI API Key (sk-...)";
        input.placeholder = "sk-... (Get from platform.openai.com)";
    }
}

function saveSettings() {
    apiConfig.provider = document.getElementById('api-provider').value;
    apiConfig.apiKey = document.getElementById('api-key-input').value.trim();
    localStorage.setItem('teachme_api_config', JSON.stringify(apiConfig));
    document.getElementById('settings-modal').close();
    alert("API settings saved successfully!");
}

function saveClassroom(e) {
    e.preventDefault();
    const name = document.getElementById('student-name').value.trim();
    const subject = document.getElementById('custom-subject').value.trim();
    
    classrooms.push({ id: Date.now(), name, subject, xp: 0, isAP: true });
    document.getElementById('create-form').reset();
    document.getElementById('create-modal').close();
    updateUI();
}

function loadDefaultAPClasses() {
    classrooms = [
        { id: 101, name: "Maya", subject: "AP Calculus BC: Derivatives & Limits", xp: 40 },
        { id: 102, name: "Liam", subject: "AP Physics 1: Newton's Laws of Motion", xp: 25 },
        { id: 103, name: "Chloe", subject: "AP Chemistry: Stoichiometry & Equilibrium", xp: 15 },
        { id: 104, name: "Sam", subject: "AP Computer Science A: Recursion & OOP", xp: 60 }
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
        { role: 'ai', text: `Hi Professor! I'm ${currentClass.name}, and I'm ready to learn about ${currentClass.subject}. How would you explain the core concepts of this topic to me simply?` }
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

async function sendExplanation(e) {
    e.preventDefault();
    const inputEl = document.getElementById('user-input');
    const text = inputEl.value.trim();
    if (!text || !currentClass) return;

    chatHistory.push({ role: 'user', text });
    inputEl.value = '';
    renderChat();

    // Show typing placeholder
    const loadingId = chatHistory.length;
    chatHistory.push({ role: 'ai', text: `${currentClass.name} is thinking and reviewing your explanation...` });
    renderChat();

    try {
        const reply = await callRealLLM(currentClass.subject, currentClass.name, chatHistory.slice(0, -1));
        chatHistory[loadingId] = { role: 'ai', text: reply };
        
        // Reward XP if explanation is thorough
        if (reply.toLowerCase().includes("master") || reply.toLowerCase().includes("makes sense") || chatHistory.length >= 6) {
            currentClass.xp += 20;
            totalXP += 20;
            updateUI();
        }
    } catch (err) {
        chatHistory[loadingId] = { 
            role: 'ai', 
            text: `⚠️ API Error: ${err.message}. Please check your API key in settings (⚙️) or ensure your Groq/OpenAI key is valid.` 
        };
    }
    renderChat();
}

// Real LLM API Connector (Groq / OpenAI)
async function callRealLLM(subject, studentName, history) {
    const apiKey = apiConfig.apiKey;
    if (!apiKey) {
        throw new Error("No API key configured. Click the gear icon (⚙️) at the top right to add your free Groq API key.");
    }

    const curriculumContext = getAPPromptContext(subject);
    const systemPrompt = `You are ${studentName}, an eager high school or college student trying to learn ${subject}.
${curriculumContext}
Your teacher (the user) is explaining the topic to you using the Feynman technique. 
Rules:
1. Act genuinely curious, ask insightful follow-up questions, or point out minor confusion in their logic to make them explain deeper.
2. Do not immediately say "good job" unless their explanation is exceptionally thorough and accurate.
3. Keep your response conversational, concise (2-4 sentences), and focused purely on understanding the material.`;

    const messages = [
        { role: "system", content: systemPrompt },
        ...history.map(m => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.text
        }))
    ];

    let endpoint = "";
    let modelName = "";

    if (apiConfig.provider === 'groq') {
        endpoint = "https://api.groq.com/openai/v1/chat/completions";
        modelName = "llama-3.3-70b-versatile";
    } else {
        endpoint = "https://api.openai.com/v1/chat/completions";
        modelName = "gpt-4o-mini";
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: modelName,
            messages: messages,
            temperature: 0.7,
            max_tokens: 300
        })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Initialize
updateUI();
