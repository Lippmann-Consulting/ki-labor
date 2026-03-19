/* ============================================
   KI-LABOR — Interactive Learning Environment
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initContextBucket();
    initTokenizer();
    initChatMemory();
    initAPIToggles();
});

/* ============================================
   TAB NAVIGATION
   ============================================ */
function initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;

            // Allow locked tabs to be opened (for dozent flexibility)
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            tab.classList.remove('locked');
            document.getElementById('tab-' + targetId).classList.add('active');

            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

/* ============================================
   TAB 1: CONTEXT BUCKET
   ============================================ */
function initContextBucket() {
    const modelBtns = document.querySelectorAll('.model-btn');
    const sliders = {
        system: document.getElementById('sliderSystem'),
        knowledge: document.getElementById('sliderKnowledge'),
        history: document.getElementById('sliderHistory'),
        user: document.getElementById('sliderUser'),
    };
    const vals = {
        system: document.getElementById('valSystem'),
        knowledge: document.getElementById('valKnowledge'),
        history: document.getElementById('valHistory'),
        user: document.getElementById('valUser'),
    };

    let maxTokens = 128000;
    let modelColor = '#3b82f6';

    // Model selection
    modelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modelBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            maxTokens = parseInt(btn.dataset.tokens);
            modelColor = btn.dataset.color;
            document.getElementById('bucketCapacity').textContent = formatNumber(maxTokens) + ' Tokens';

            // Adjust slider max values based on model
            sliders.knowledge.max = Math.min(maxTokens * 0.8, 500000);
            sliders.history.max = Math.min(maxTokens * 0.8, 500000);

            updateBucket();
        });
    });

    // Slider events
    Object.keys(sliders).forEach(key => {
        sliders[key].addEventListener('input', () => {
            vals[key].textContent = formatNumber(parseInt(sliders[key].value)) + ' Tokens';
            updateBucket();
        });
    });

    // Reset button
    document.getElementById('btnResetBucket').addEventListener('click', () => {
        sliders.system.value = 500;
        sliders.knowledge.value = 0;
        sliders.history.value = 0;
        sliders.user.value = 100;
        Object.keys(vals).forEach(key => {
            vals[key].textContent = formatNumber(parseInt(sliders[key].value)) + ' Tokens';
        });
        updateBucket();
    });

    function updateBucket() {
        const systemTokens = parseInt(sliders.system.value);
        const knowledgeTokens = parseInt(sliders.knowledge.value);
        const historyTokens = parseInt(sliders.history.value);
        const userTokens = parseInt(sliders.user.value);
        const total = systemTokens + knowledgeTokens + historyTokens + userTokens;
        const percent = Math.min((total / maxTokens) * 100, 100);
        const isOverflow = total > maxTokens;

        const bucket = document.querySelector('.bucket');
        const bucketHeight = 330; // usable height in px

        // Update segments
        const segSystem = document.getElementById('segSystem');
        const segKnowledge = document.getElementById('segKnowledge');
        const segUser = document.getElementById('segUser');
        const segResponse = document.getElementById('segResponse');

        const pxPerToken = bucketHeight / maxTokens;

        segSystem.style.height = Math.min(systemTokens * pxPerToken, bucketHeight * 0.3) + 'px';
        segKnowledge.style.height = Math.min(knowledgeTokens * pxPerToken, bucketHeight * 0.5) + 'px';
        segResponse.style.height = Math.min(historyTokens * pxPerToken, bucketHeight * 0.5) + 'px';
        segUser.style.height = Math.min(userTokens * pxPerToken, bucketHeight * 0.3) + 'px';

        // Show/hide labels
        segSystem.querySelector('span').style.display = systemTokens > maxTokens * 0.02 ? 'block' : 'none';
        segKnowledge.querySelector('span').style.display = knowledgeTokens > maxTokens * 0.03 ? 'block' : 'none';
        segResponse.querySelector('span').style.display = historyTokens > maxTokens * 0.03 ? 'block' : 'none';
        segUser.querySelector('span').style.display = userTokens > maxTokens * 0.02 ? 'block' : 'none';

        // Overflow state
        bucket.classList.toggle('overflow', isOverflow);

        // Stats
        document.getElementById('statUsed').textContent = formatNumber(total);
        document.getElementById('statFree').textContent = formatNumber(Math.max(0, maxTokens - total));
        document.getElementById('statPercent').textContent = Math.round(percent) + '%';
        document.getElementById('statPercent').style.color = isOverflow ? '#ef4444' : '#3b82f6';
    }

    updateBucket();
}

/* ============================================
   TOKEN EXPLAINER
   ============================================ */
function initTokenizer() {
    const input = document.getElementById('tokenInput');
    const chipsContainer = document.getElementById('tokenChips');
    const tokenCountEl = document.getElementById('tokenCount');
    const wordCountEl = document.getElementById('wordCount');

    // Simplified tokenization (approximation for visualization)
    const TOKEN_COLORS = [
        '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7',
        '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
    ];

    function simpleTokenize(text) {
        if (!text.trim()) return [];

        const tokens = [];
        let remaining = text;

        // Split into rough tokens (word parts, punctuation, spaces)
        const regex = /([A-Za-zÄÖÜäöüß]{1,4}|[0-9]+|[.,!?;:\-"'(){}[\]]|\s+|.)/g;
        let match;
        while ((match = regex.exec(remaining)) !== null) {
            tokens.push(match[0]);
        }
        return tokens;
    }

    function updateTokens() {
        const text = input.value;
        const tokens = simpleTokenize(text);
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);

        chipsContainer.innerHTML = '';
        tokens.forEach((token, i) => {
            const chip = document.createElement('span');
            chip.className = 'token-chip';
            chip.style.backgroundColor = TOKEN_COLORS[i % TOKEN_COLORS.length] + '30';
            chip.style.border = '1px solid ' + TOKEN_COLORS[i % TOKEN_COLORS.length] + '60';
            chip.textContent = token === ' ' ? '⎵' : token;
            chipsContainer.appendChild(chip);
        });

        tokenCountEl.textContent = tokens.length;
        wordCountEl.textContent = words.length;
    }

    input.addEventListener('input', updateTokens);
    updateTokens();
}

/* ============================================
   TAB 3: CHAT MEMORY SIMULATION
   ============================================ */
function initChatMemory() {
    const chatMessages = document.getElementById('chatMessages');
    const contextFill = document.getElementById('chatContextFill');
    const contextLabel = document.getElementById('chatContextLabel');
    const explanation = document.getElementById('memoryExplanation');
    const btnAdd = document.getElementById('btnAddMessage');
    const btnAuto = document.getElementById('btnAutoPlay');
    const btnReset = document.getElementById('btnResetChat');

    const CONTEXT_SIZE = 20; // messages that "fit"
    let messageIndex = 0;
    let autoInterval = null;

    const conversation = [
        { role: 'user', text: 'Hallo! Ich heiße Max und komme aus Dresden.' },
        { role: 'assistant', text: 'Hallo Max aus Dresden! Wie kann ich dir helfen?' },
        { role: 'user', text: 'Ich suche eine neue Stelle als Projektmanager.' },
        { role: 'assistant', text: 'Gerne helfe ich dir bei der Jobsuche als Projektmanager! Hast du schon einen Lebenslauf?' },
        { role: 'user', text: 'Ja, ich habe 5 Jahre Erfahrung bei Siemens.' },
        { role: 'assistant', text: '5 Jahre bei Siemens ist eine starke Basis! Möchtest du in der gleichen Branche bleiben?' },
        { role: 'user', text: 'Ich interessiere mich auch für die IT-Branche.' },
        { role: 'assistant', text: 'IT + Projektmanagement ist eine gefragte Kombination. Kennst du agile Methoden wie Scrum?' },
        { role: 'user', text: 'Ja, ich bin zertifizierter Scrum Master.' },
        { role: 'assistant', text: 'Perfekt! Als Scrum Master mit Siemens-Erfahrung hast du sehr gute Chancen.' },
        { role: 'user', text: 'Kannst du mir ein Anschreiben schreiben?' },
        { role: 'assistant', text: 'Klar! Für welche Stelle soll ich das Anschreiben verfassen?' },
        { role: 'user', text: 'Für eine IT-Projektmanager-Stelle bei SAP in Walldorf.' },
        { role: 'assistant', text: 'SAP in Walldorf — sehr gut! Ich schreibe ein Anschreiben das deine Siemens-Erfahrung und Scrum-Zertifizierung hervorhebt.' },
        { role: 'user', text: 'Bitte betone auch meine Teamführung.' },
        { role: 'assistant', text: 'Wird gemacht! Ich füge deine Teamführungskompetenz prominent ein.' },
        { role: 'user', text: 'Wie ist eigentlich das Wetter in Walldorf?' },
        { role: 'assistant', text: 'Ich habe leider keinen Zugriff auf aktuelle Wetterdaten. Aber zurück zu deinem Anschreiben...' },
        { role: 'user', text: 'Woher komme ich nochmal?' },
        { role: 'assistant', text: 'Du kommst aus Dresden, Max! Das hast du mir am Anfang gesagt.' },
        // After this, context starts getting full
        { role: 'user', text: 'Was war mein letzter Arbeitgeber?' },
        { role: 'assistant', text: 'Du hast 5 Jahre bei Siemens gearbeitet.' },
        { role: 'user', text: 'Und welche Zertifizierung habe ich?' },
        { role: 'assistant', text: 'Du bist zertifizierter Scrum Master.' },
        { role: 'user', text: 'Schreib mir noch eine Variante des Anschreibens.' },
        { role: 'assistant', text: 'Gerne! Hier ist eine alternative Version für die SAP-Stelle...' },
        { role: 'user', text: 'Wie heiße ich eigentlich?' },
        { role: 'assistant', text: 'Hmm... ich bin mir nicht mehr sicher. Könntest du mir deinen Namen nochmal sagen?' },
        { role: 'user', text: 'Woher komme ich?' },
        { role: 'assistant', text: 'Das kann ich leider nicht mehr nachvollziehen. Unser Gespräch ist schon recht lang — die älteren Nachrichten sind nicht mehr in meinem Kontext.' },
    ];

    function addMessage() {
        if (messageIndex >= conversation.length) {
            explanation.innerHTML = '<strong style="color: #ef4444">Ende der Demo!</strong> Die KI hat den Anfang des Gesprächs vergessen — Name, Herkunft, alles weg.';
            return;
        }

        const msg = conversation[messageIndex];
        const div = document.createElement('div');
        div.className = 'chat-msg ' + msg.role;
        div.textContent = msg.text;
        chatMessages.appendChild(div);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        messageIndex++;

        // Update context bar
        const fillPercent = Math.min((messageIndex / CONTEXT_SIZE) * 100, 100);
        contextFill.style.width = fillPercent + '%';

        if (fillPercent >= 100) {
            contextFill.style.background = 'linear-gradient(90deg, #3b82f6, #ef4444)';
        }

        contextLabel.textContent = `Kontextfenster: ${Math.round(fillPercent)}% belegt`;

        // Fade old messages when context is "full"
        if (messageIndex > CONTEXT_SIZE) {
            const fadeTo = messageIndex - CONTEXT_SIZE;
            const allMsgs = chatMessages.querySelectorAll('.chat-msg');
            for (let i = 0; i < fadeTo && i < allMsgs.length; i++) {
                allMsgs[i].classList.add('faded');
            }
        }

        // Explanations at key moments
        if (messageIndex === 10) {
            explanation.innerHTML = '📊 Der Kontext füllt sich... die KI erinnert sich noch an alles.';
        } else if (messageIndex === 18) {
            explanation.innerHTML = '⚠️ Das Kontextfenster wird voll. Gleich gehen die ersten Nachrichten verloren...';
        } else if (messageIndex === 22) {
            explanation.innerHTML = '🔴 <strong>Älteste Nachrichten werden vergessen!</strong> Die KI verliert den Anfang des Gesprächs.';
        } else if (messageIndex === 28) {
            explanation.innerHTML = '💥 <strong>Die KI weiß nicht mehr wie der User heißt!</strong> Der Name war in einer der ersten Nachrichten — jetzt aus dem Kontext gefallen.';
        }
    }

    btnAdd.addEventListener('click', addMessage);

    btnAuto.addEventListener('click', () => {
        if (autoInterval) {
            clearInterval(autoInterval);
            autoInterval = null;
            btnAuto.textContent = '▶️ Auto-Play';
        } else {
            autoInterval = setInterval(() => {
                if (messageIndex >= conversation.length) {
                    clearInterval(autoInterval);
                    autoInterval = null;
                    btnAuto.textContent = '▶️ Auto-Play';
                    return;
                }
                addMessage();
            }, 1500);
            btnAuto.textContent = '⏸ Stopp';
        }
    });

    btnReset.addEventListener('click', () => {
        if (autoInterval) {
            clearInterval(autoInterval);
            autoInterval = null;
            btnAuto.textContent = '▶️ Auto-Play';
        }
        chatMessages.innerHTML = '';
        messageIndex = 0;
        contextFill.style.width = '0%';
        contextFill.style.background = 'linear-gradient(90deg, #3b82f6, #a855f7)';
        contextLabel.textContent = 'Kontextfenster: 0% belegt';
        explanation.innerHTML = '<p>Klicke auf "Nächste Nachricht senden" und beobachte was passiert, wenn der Kontext voll wird...</p>';
    });
}

/* ============================================
   TAB 4: API TOGGLES
   ============================================ */
function initAPIToggles() {
    const toggles = document.querySelectorAll('.api-toggle');
    const capabilities = document.querySelectorAll('.capability');

    toggles.forEach(toggle => {
        toggle.addEventListener('change', () => {
            const api = toggle.dataset.api;
            const capability = document.querySelector(`.capability[data-api="${api}"]`);
            if (capability) {
                capability.classList.toggle('active', toggle.checked);
            }
        });
    });
}

/* ============================================
   UTILITY
   ============================================ */
function formatNumber(n) {
    return n.toLocaleString('de-DE');
}
