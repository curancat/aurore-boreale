/* 
    ARQUIVO: backend/firebase-config.js
    FUNÇÃO: Centralizar a conexão do seu jogo com os servidores do Google Firebase.
    COMO USAR: Você vai importar este arquivo no cabeçalho (<head>) do index.html, lobby.html e select.html.
*/

// 1. Importando os módulos principais do Firebase via CDN (Internet)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// 2. Suas credenciais do Firebase (Você consegue isso criando um projeto grátis no site do Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyBykDF5TNKQHejUJTp-ue7s5CKfpJp1HV0",
  authDomain: "mestre-471a0.firebaseapp.com",
  databaseURL: "https://mestre-471a0-default-rtdb.firebaseio.com",
  projectId: "mestre-471a0",
  storageBucket: "mestre-471a0.firebasestorage.app",
  messagingSenderId: "142996111628",
  appId: "1:142996111628:web:c3785e54588632f468c929",
  measurementId: "G-XWSF04WNVW"
};

// 3. Inicializando o Servidor
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Responsável pelo Login / Senha
const db = getDatabase(app); // Responsável pelo Chat, Lobby e Seleção em Tempo Real

console.log("Servidor Firebase Inicializado com Sucesso!");

// =======================================================================
// EXEMPLOS DE FUNÇÕES PRONTAS QUE VOCÊ PODERÁ USAR NOS OUTROS ARQUIVOS
// =======================================================================

// Função para enviar mensagem no chat do Lobby em tempo real
export function enviarMensagemFirebase(salaId, jogador, mensagem) {
    const chatRef = ref(db, 'salas/' + salaId + '/chat/' + Date.now());
    set(chatRef, {
        nome: jogador,
        texto: mensagem
    });
}

// Função para travar a escolha de campeão na Seleção
export function lockarCampeaoFirebase(salaId, jogadorId, campeaoEscolhido) {
    const jogadorRef = ref(db, 'salas/' + salaId + '/jogadores/' + jogadorId);
    update(jogadorRef, {
        campeao: campeaoEscolhido,
        status: "pronto"
    });
}

// Função para a Tela de Carregamento saber se TODOS estão a 100%
export function escutarStatusJogadores(salaId, callback) {
    const salaRef = ref(db, 'salas/' + salaId + '/jogadores');
    onValue(salaRef, (snapshot) => {
        const dados = snapshot.val();
        callback(dados); // Retorna pro loading.html quem já carregou
    });
}

// Exporta as variáveis principais para outras telas poderem usar
export { auth, db };
