const firebaseConfig = {
    apiKey: "AIzaSyBykDF5TNKQHejUJTp-ue7s5CKfpJp1HV0",
    authDomain: "mestre-471a0.firebaseapp.com",
    databaseURL: "https://mestre-471a0-default-rtdb.firebaseio.com",
    projectId: "mestre-471a0",
    storageBucket: "mestre-471a0.firebasestorage.app",
    messagingSenderId: "142996111628",
    appId: "1:142996111628:web:c3785e54588632f468c929"
};

let db = null;
let currentUser = "";
let currentRoom = "Geral";
let chatRef = null;

try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
} catch (e) {}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start(); osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === 'card') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.start(); osc.stop(audioCtx.currentTime + 0.12);
    }
}

document.addEventListener('click', (e) => {
    if (e.target.closest('.clickable, button, .card')) playSound('click');
});

const CARD_DATABASE = [
    { id: 'litlegot', name: 'Litlegot', type: 'campeao', cost: 5, atk: 4, hp: 6, icon: '🧙‍♂️', desc: 'Ao entrar: Adiciona feitiço Mercador à mão.' },
    { id: 'abrax', name: 'Abrax', type: 'campeao', cost: 4, atk: 5, hp: 4, icon: '🃏', desc: 'Vampirismo: Restaura vida ao atacar.' },
    { id: 'psique', name: 'Psique', type: 'campeao', cost: 6, atk: 6, hp: 7, icon: '👻', desc: 'Passiva: Ganha +1/+1 sempre que uma carta morre.' },
    
    { id: 'odio', name: 'Ódio', type: 'feitico', cost: 3, icon: '🔥', desc: 'Causa 4 de dano a um alvo inimigo.' },
    { id: 'empatia', name: 'Empatia', type: 'feitico', cost: 2, icon: '💧', desc: 'Cura 5 de HP do seu Campeão ou aliado.' },
    { id: 'felicidade', name: 'Felicidade', type: 'feitico', cost: 3, icon: '✨', desc: 'Congela uma carta inimiga por 1 turno.' },
    { id: 'genesis', name: 'Gênesis', type: 'feitico', cost: 6, icon: '🎨', desc: 'Transforma suas cartas de feitiço na Paleta Mágica.' },
    
    { id: 'mascaras', name: 'Máscara dos Tolos', type: 'feitico', cost: 2, icon: '🎭', desc: 'Copia o último feitiço jogado.' },
    { id: 'honestamente', name: 'Honestamente?', type: 'feitico', cost: 2, icon: '💨', desc: 'Permite que uma carta se reposicione/esquive.' },
    { id: 'sobrecarga', name: 'Sobrecarga', type: 'feitico', cost: 4, icon: '⚡', desc: 'Causa 3 de dano em área na mesa inimiga.' },
    { id: 'nolimite', name: 'No Limite', type: 'feitico', cost: 5, icon: '🎰', desc: 'Concede Ataque Duplo a uma carta neste turno.' },

    { id: 'horadecomer', name: 'Hora de Comer', type: 'feitico', cost: 3, icon: '🥩', desc: 'Causa 3 de dano e cura seu Campeão em 3.' },
    { id: 'veualem', name: 'Véu do Além', type: 'feitico', cost: 2, icon: '🌫️', desc: 'Concede Furtividade a uma carta por 1 turno.' },
    { id: 'borboletas', name: 'Borboletas Espirituais', type: 'feitico', cost: 4, icon: '🦋', desc: 'Copia 1 carta da mão do oponente.' },
    { id: 'areavidamorte', name: 'Área Vida e Morte', type: 'feitico', cost: 7, icon: '💀', desc: 'Drena 2 de vida de todas as cartas inimigas.' }
];

const PALETTE_SPELLS = {
    laranja: [
        { id: 'euforia', name: 'Euforia', type: 'genesis', cost: 2, icon: '🎉', desc: 'Concede +3 de Ataque a um aliado.' },
        { id: 'aconchego', name: 'Aconchego', type: 'genesis', cost: 3, icon: '☀️', desc: 'Regenera 3 de HP a todas as suas cartas.' },
        { id: 'otimismo', name: 'Otimismo', type: 'genesis', cost: 2, icon: '🚀', desc: 'Permite atacar no mesmo turno em que é jogado.' }
    ],
    verde: [
        { id: 'nojo', name: 'Nojo', type: 'genesis', cost: 2, icon: '🤢', desc: 'Reduz o ataque de uma carta inimiga para 0 este turno.' },
        { id: 'serenidade', name: 'Serenidade', type: 'genesis', cost: 3, icon: '🌿', desc: 'Reduz o dano sofrido por aliados em 2.' },
        { id: 'inveja', name: 'Inveja', type: 'genesis', cost: 3, icon: '🌵', desc: 'Puxa e destrói 1 efeito positivo inimigo.' }
    ],
    roxo: [
        { id: 'melancolia', name: 'Melancolia', type: 'genesis', cost: 3, icon: '🌧️', desc: 'Aplica Lentidão e reduz 2 de Mana do rival.' },
        { id: 'paranoia', name: 'Paranoia', type: 'genesis', cost: 4, icon: '👁️', desc: 'O rival joga de cartas reveladas por 2 turnos.' },
        { id: 'fascinio', name: 'Fascínio', type: 'genesis', cost: 5, icon: '🌀', desc: 'Toma o controle de uma carta inimiga fraca.' }
    ]
};

let gameState = {
    turn: 1,
    isPlayerTurn: true,
    player: { hp: 30, maxHp: 30, mana: 1, maxMana: 1, hand: [], board: [], deck: [] },
    opp: { hp: 30, maxHp: 30, mana: 1, maxMana: 1, hand: [], board: [], deck: [] },
    selectedCardIndex: null,
    lastPlayedSpell: null
};

function fazerLogin() {
    const user = document.getElementById('username').value.trim();
    if (!user) { alert("Informe o Nome de Invocador!"); return; }
    currentUser = user;

    document.getElementById('user-display-tag').innerText = currentUser;
    document.getElementById('player-name').innerText = currentUser;

    document.getElementById('login-screen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-client').style.display = 'flex';
        
        const bgm = document.getElementById('bgm-player');
        bgm.volume = 0.2;
        bgm.play().catch(() => {});

        iniciarJogoCard();
        renderColecao('todos');
        iniciarChat(currentRoom);
    }, 500);
}

function toggleBGM() {
    const bgm = document.getElementById('bgm-player');
    const btn = document.getElementById('bgm-toggle-btn');
    if (bgm.paused) { bgm.play(); btn.innerText = '⏸'; }
    else { bgm.pause(); btn.innerText = '▶'; }
}

function mudarAba(aba, btn) {
    document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`view-${aba}`).classList.add('active');
}

function iniciarJogoCard() {
    gameState.player.deck = criarBaralho();
    gameState.opp.deck = criarBaralho();
    
    gameState.player.hand = [];
    gameState.opp.hand = [];
    gameState.player.board = [];
    gameState.opp.board = [];

    for (let i = 0; i < 3; i++) {
        comprarCarta('player');
        comprarCarta('opp');
    }

    atualizarUI();
}

function criarBaralho() {
    let deck = [];
    for (let i = 0; i < 15; i++) {
        const randomCard = CARD_DATABASE[Math.floor(Math.random() * CARD_DATABASE.length)];
        deck.push({ ...randomCard, instanceId: Math.random().toString(36).substr(2, 9), currentHp: randomCard.hp, currentAtk: randomCard.atk, canAttack: false });
    }
    return deck;
}

function comprarCarta(target) {
    const p = gameState[target];
    if (p.deck.length > 0 && p.hand.length < 7) {
        p.hand.push(p.deck.pop());
        playSound('card');
    }
}

function atualizarUI() {
    document.getElementById('player-hp-fill').style.width = `${(gameState.player.hp / gameState.player.maxHp) * 100}%`;
    document.getElementById('player-hp-text').innerText = `${gameState.player.hp} / ${gameState.player.maxHp} HP`;
    document.getElementById('opp-hp-fill').style.width = `${(gameState.opp.hp / gameState.opp.maxHp) * 100}%`;
    document.getElementById('opp-hp-text').innerText = `${gameState.opp.hp} / ${gameState.opp.maxHp} HP`;

    renderGemasMana('player-mana-gems', gameState.player.mana, gameState.player.maxMana);
    document.getElementById('player-mana-text').innerText = `${gameState.player.mana} / ${gameState.player.maxMana} Mana`;
    
    renderGemasMana('opp-mana-gems', gameState.opp.mana, gameState.opp.maxMana);
    document.getElementById('opp-mana-text').innerText = `${gameState.opp.mana} / ${gameState.opp.maxMana} Mana`;

    renderMaoPlayer();
    renderMaoOpponent();
    renderMesa();
}

function renderGemasMana(containerId, mana, maxMana) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for (let i = 0; i < maxMana; i++) {
        const gem = document.createElement('div');
        gem.className = `mana-gem ${i < mana ? 'active' : ''}`;
        container.appendChild(gem);
    }
}

function renderMaoPlayer() {
    const hand = document.getElementById('player-hand');
    hand.innerHTML = '';
    gameState.player.hand.forEach((card, index) => {
        const el = criarElementoCarta(card);
        if (index === gameState.selectedCardIndex) el.classList.add('selected');
        el.onclick = () => selecionarCartaMao(index);
        hand.appendChild(el);
    });
}

function renderMaoOpponent() {
    const hand = document.getElementById('opp-hand');
    hand.innerHTML = '';
    gameState.opp.hand.forEach(() => {
        const el = document.createElement('div');
        el.className = 'card card-back';
        hand.appendChild(el);
    });
}

function renderMesa() {
    const pBoard = document.getElementById('player-board');
    const oBoard = document.getElementById('opp-board');
    pBoard.innerHTML = '';
    oBoard.innerHTML = '';

    gameState.player.board.forEach((card, idx) => {
        const el = criarElementoCarta(card);
        if (card.canAttack && gameState.isPlayerTurn) el.style.borderColor = 'var(--gold)';
        el.onclick = () => atacarComCarta(idx);
        pBoard.appendChild(el);
    });

    gameState.opp.board.forEach((card, idx) => {
        const el = criarElementoCarta(card);
        el.onclick = () => selecionarAlvoInimigo('minion', idx);
        oBoard.appendChild(el);
    });

    document.getElementById('opp-portrait').onclick = () => selecionarAlvoInimigo('hero', null);
}

function criarElementoCarta(card) {
    const el = document.createElement('div');
    el.className = 'card clickable';
    el.innerHTML = `
        <div class="card-mana">${card.cost}</div>
        <div class="card-title">${card.name}</div>
        <div class="card-art">${card.icon}</div>
        <div class="card-desc">${card.desc}</div>
        ${card.type !== 'feitico' ? `
            <div class="card-stats">
                <div class="stat-gem stat-atk">${card.currentAtk}</div>
                <div class="stat-gem stat-hp">${card.currentHp}</div>
            </div>
        ` : ''}
    `;
    return el;
}

function selecionarCartaMao(index) {
    if (!gameState.isPlayerTurn) return;
    const card = gameState.player.hand[index];
    
    if (card.cost > gameState.player.mana) {
        logAcao("Mana insuficiente para jogar esta carta!");
        return;
    }

    if (card.type === 'campeao' || card.type === 'minion') {
        if (gameState.player.board.length >= 5) {
            logAcao("Sua mesa está cheia!");
            return;
        }
        gameState.player.mana -= card.cost;
        gameState.player.hand.splice(index, 1);
        card.canAttack = false;
        gameState.player.board.push(card);

        if (card.id === 'psique') triggerPsiquePassive();
        logAcao(`Você invocou ${card.name}!`);
    } else if (card.type === 'feitico' || card.type === 'genesis') {
        executarFeitico(card, index);
    }

    atualizarUI();
}

function executarFeitico(card, index) {
    if (card.id === 'genesis') {
        document.getElementById('genesis-modal').classList.add('active');
        gameState.selectedCardIndex = index;
        return;
    }

    gameState.player.mana -= card.cost;
    gameState.player.hand.splice(index, 1);
    gameState.lastPlayedSpell = card;

    if (card.id === 'odio') {
        gameState.opp.hp -= 4;
        logAcao("Ódio causou 4 de dano ao Invocador rival!");
    } else if (card.id === 'empatia') {
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + 5);
        logAcao("Empatia restaurou 5 de vida ao seu Invocador!");
    } else if (card.id === 'horadecomer') {
        gameState.opp.hp -= 3;
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + 3);
        logAcao("Hora de Comer drenou 3 de vida!");
    } else if (card.id === 'euforia') {
        if (gameState.player.board.length > 0) gameState.player.board[0].currentAtk += 3;
        logAcao("Euforia concedeu +3 de ataque ao seu aliado!");
    }

    verificarMortes();
}

function confirmarGenesis(cor) {
    document.getElementById('genesis-modal').classList.remove('active');
    const index = gameState.selectedCardIndex;
    const card = gameState.player.hand[index];

    gameState.player.mana -= card.cost;
    gameState.player.hand.splice(index, 1);

    const novfeitiços = PALETTE_SPELLS[cor];
    novfeitiços.forEach(s => {
        if (gameState.player.hand.length < 7) {
            gameState.player.hand.push({ ...s, instanceId: Math.random().toString(36).substr(2, 9) });
        }
    });

    logAcao(`Gênesis ativado! Paleta ${cor.toUpperCase()} adicionada à sua mão.`);
    atualizarUI();
}

function atacarComCarta(attackerIdx) {
    if (!gameState.isPlayerTurn) return;
    const attacker = gameState.player.board[attackerIdx];
    if (!attacker.canAttack) {
        logAcao("Esta carta não pode atacar neste turno.");
        return;
    }

    gameState.selectedCardIndex = attackerIdx;
    logAcao(`Selecione o alvo para o ataque de ${attacker.name}.`);
}

function selecionarAlvoInimigo(targetType, targetIdx) {
    if (gameState.selectedCardIndex === null) return;
    const attacker = gameState.player.board[gameState.selectedCardIndex];

    if (targetType === 'hero') {
        gameState.opp.hp -= attacker.currentAtk;
        attacker.canAttack = false;
        logAcao(`${attacker.name} atacou o Invocador rival causando ${attacker.currentAtk} de dano!`);
        
        if (attacker.id === 'abrax') {
            gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + attacker.currentAtk);
            logAcao("Vampirismo do Abrax curou seu Invocador!");
        }
    } else if (targetType === 'minion') {
        const defender = gameState.opp.board[targetIdx];
        defender.currentHp -= attacker.currentAtk;
        attacker.currentHp -= defender.currentAtk;
        attacker.canAttack = false;
        logAcao(`${attacker.name} batalhou contra ${defender.name}!`);
    }

    gameState.selectedCardIndex = null;
    verificarMortes();
    atualizarUI();
}

function verificarMortes() {
    const checarEremover = (board) => {
        return board.filter(card => {
            if (card.currentHp <= 0) {
                logAcao(`${card.name} foi destruído!`);
                triggerPsiquePassive();
                return false;
            }
            return true;
        });
    };

    gameState.player.board = checarEremover(gameState.player.board);
    gameState.opp.board = checarEremover(gameState.opp.board);

    if (gameState.opp.hp <= 0) {
        alert("VITÓRIA HEXTECH! Você derrotou o oponente!");
        iniciarJogoCard();
    } else if (gameState.player.hp <= 0) {
        alert("DERROTA! Seu Invocador foi sobrepujado.");
        iniciarJogoCard();
    }
}

function triggerPsiquePassive() {
    const psiqueCards = gameState.player.board.filter(c => c.id === 'psique');
    psiqueCards.forEach(c => {
        c.currentAtk += 1;
        c.currentHp += 1;
        logAcao("O Prazer dos Mortos: Psique absorveu essência (+1/+1)!");
    });
}

function finalizarTurno() {
    if (!gameState.isPlayerTurn) return;
    
    gameState.isPlayerTurn = false;
    logAcao("Turno do Invocador Rival...");
    document.getElementById('end-turn-btn').innerText = "Turno Rival...";

    setTimeout(() => {
        turnoIA();
    }, 1200);
}

function turnoIA() {
    gameState.opp.maxMana = Math.min(10, gameState.opp.maxMana + 1);
    gameState.opp.mana = gameState.opp.maxMana;
    comprarCarta('opp');

    const playableIndices = gameState.opp.hand
        .map((c, i) => c.cost <= gameState.opp.mana ? i : -1)
        .filter(i => i !== -1);

    if (playableIndices.length > 0 && gameState.opp.board.length < 5) {
        const cardToPlayIdx = playableIndices[0];
        const card = gameState.opp.hand[cardToPlayIdx];

        if (card.type !== 'feitico') {
            gameState.opp.mana -= card.cost;
            gameState.opp.hand.splice(cardToPlayIdx, 1);
            card.canAttack = false;
            gameState.opp.board.push(card);
            logAcao(`Rival invocou ${card.name}!`);
        }
    }

    gameState.opp.board.forEach(card => {
        if (gameState.player.board.length > 0) {
            const target = gameState.player.board[0];
            target.currentHp -= card.currentAtk;
            card.currentHp -= target.currentAtk;
            logAcao(`${card.name} rival atacou seu ${target.name}!`);
        } else {
            gameState.player.hp -= card.currentAtk;
            logAcao(`${card.name} rival atacou seu Invocador diretamente causando ${card.currentAtk} de dano!`);
        }
    });

    verificarMortes();

    setTimeout(() => {
        gameState.turn++;
        gameState.player.maxMana = Math.min(10, gameState.player.maxMana + 1);
        gameState.player.mana = gameState.player.maxMana;
        comprarCarta('player');

        gameState.player.board.forEach(c => c.canAttack = true);

        gameState.isPlayerTurn = true;
        document.getElementById('end-turn-btn').innerText = "Finalizar Turno";
        logAcao(`Seu Turno ${gameState.turn}! Mana restaurada.`);
        atualizarUI();
    }, 1000);
}

function logAcao(msg) {
    const log = document.getElementById('game-log');
    log.innerText = msg;
}

function renderColecao(filtro) {
    const grid = document.getElementById('cards-collection-grid');
    grid.innerHTML = '';

    let list = CARD_DATABASE;
    if (filtro !== 'todos') {
        list = CARD_DATABASE.filter(c => c.type === filtro);
    }

    list.forEach(card => {
        const el = criarElementoCarta(card);
        grid.appendChild(el);
    });
}

function filtrarColecao(tipo, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderColecao(tipo);
}

function mudarSala(nomeSala, btn) {
    document.querySelectorAll('.room-select-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRoom = nomeSala;
    document.getElementById('chat-title-display').innerText = `SALA: ${nomeSala}`;
    iniciarChat(currentRoom);
}

function iniciarChat(sala) {
    const feed = document.getElementById('chat-feed-box');
    feed.innerHTML = '<div class="chat-msg sys">Conectando ao canal Hextech...</div>';

    if (!db) {
        feed.innerHTML = '<div class="chat-msg sys">[Modo Local] Servidor indisponível.</div>';
        return;
    }

    if (chatRef) chatRef.off();

    const salaID = sala.replace(/\s+/g, '_').toLowerCase();
    chatRef = db.ref('tcg_chats/' + salaID);

    chatRef.limitToLast(30).on('child_added', snapshot => {
        const data = snapshot.val();
        if (data) exibirMensagem(data.user, data.text);
    });
}

function enviarMensagem() {
    const input = document.getElementById('chat-input-field');
    const text = input.value.trim();
    if (!text) return;

    if (db && chatRef) {
        chatRef.push({ user: currentUser, text: text });
    } else {
        exibirMensagem(currentUser, text);
    }
    input.value = '';
}

function exibirMensagem(user, text) {
    const feed = document.getElementById('chat-feed-box');
    if (feed.children.length === 1 && feed.children[0].classList.contains('sys')) {
        feed.innerHTML = '';
    }

    const msg = document.createElement('div');
    msg.className = 'chat-msg';
    msg.innerHTML = `
        <span class="chat-msg-user">${user}:</span>
        <span class="chat-msg-text">${sanitize(text)}</span>
    `;
    feed.appendChild(msg);
    feed.scrollTop = feed.scrollHeight;
}

function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
