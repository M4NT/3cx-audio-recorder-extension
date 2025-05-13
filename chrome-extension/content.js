// Variáveis para armazenar o estado da gravação
let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;
let audioBlob = null;
let audioFile = null;
let recordingIndicator = null;
let recordButton = null;
let isRecording = false;
let audioPlayer = null;
let sendAudioButton = null;
let audioPreviewContainer = null;
let closeAudioPreviewButton = null;

// Variável global para armazenar o nome real do usuário
let nomeUsuarioReal = null;

// Variável para armazenar largura original da barra de botões
let chatBarOriginalWidth = null;

// Variáveis para controle da janela flutuante
let floatingAudioContainer = null;
let floatingState = null; // 'recording' ou 'preview'
let pauseResumeButton = null;
let stopButton = null;

// Variáveis para controle do timer de pausa
let isPaused = false;
let tempoPausado = 0;
let pausaTimestamp = null;

// Função para criar o indicador de gravação
function createRecordingIndicator() {
  const indicator = document.createElement('div');
  indicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 9999;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  `;
  return indicator;
}

// Função para atualizar o indicador
function updateRecordingIndicator() {
  if (!recordingIndicator) {
    recordingIndicator = createRecordingIndicator();
    document.body.appendChild(recordingIndicator);
  }
}

// Remover qualquer elemento remanescente do tipo recordingIndicator ao iniciar gravação
function removeOldRecordingIndicator() {
  const oldIndicator = document.querySelector('div[style*="position: fixed"][style*="bottom: 20px"][style*="right: 20px"]');
  if (oldIndicator) oldIndicator.remove();
}

// Garante que o Material Icons está no head
function ensureMaterialIcons() {
  if (!document.querySelector('link[href*="fonts.googleapis.com/icon"]')) {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
}

// Função para criar e injetar o botão de gravação
function injectRecordButton() {
  const templateButton = document.querySelector('#templateSelector');
  if (!templateButton) {
    return;
  }

  // Verifica se o botão já existe
  if (document.querySelector('#audioRecordButton')) {
    return;
  }

  // Cria o botão de gravação
  recordButton = document.createElement('button');
  recordButton.type = 'button';
  recordButton.id = 'audioRecordButton';
  recordButton.className = 'btn btn-plain';
  recordButton.title = 'Gravar áudio';
  recordButton.innerHTML = `
    <span class="record-svg" style="display:inline-flex;align-items:center;justify-content:center;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" fill="none"/>
        <path d="M12 15C13.66 15 15 13.66 15 12V7C15 5.34 13.66 4 12 4C10.34 4 9 5.34 9 7V12C9 13.66 10.34 15 12 15Z" fill="currentColor"/>
        <path d="M17.3 11C17.3 14.03 14.87 16.3 12 16.3C9.13 16.3 6.7 14.03 6.7 11H5C5 14.53 7.61 17.43 11 17.93V20H13V17.93C16.39 17.43 19 14.53 19 11H17.3Z" fill="currentColor"/>
      </svg>
    </span>
  `;

  // Adiciona estilos
  const style = document.createElement('style');
  style.textContent = `
    #audioRecordButton {
      padding: 5px;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      border-radius: 4px;
      background: transparent;
      border: none;
      cursor: pointer;
    }
    #audioRecordButton:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    #audioRecordButton.recording .record-svg svg {
      color: #f44336;
      animation: pulse 1s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    .floating-audio-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 300px;
    }
    .floating-audio-container.recording {
      background: #fff3f3;
    }
    .floating-audio-container.preview {
      background: #f8fafc;
    }
    .floating-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .floating-controls button {
      padding: 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .floating-controls button:hover {
      background: rgba(0, 0, 0, 0.05);
    }
    .floating-timer {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }
    .floating-preview {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .floating-preview audio {
      width: 100%;
    }
    .floating-preview-buttons {
      display: flex;
      gap: 8px;
    }
    .floating-preview-buttons button {
      flex: 1;
      padding: 8px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    .send-button {
      background: #2196F3;
      color: white;
    }
    .cancel-button {
      background: #f44336;
      color: white;
    }
  `;
  document.head.appendChild(style);

  // Adiciona o event listener
  recordButton.addEventListener('click', async () => {
    if (!isRecording) {
      try {
        const result = await startRecording();
        if (result.success) {
          isRecording = true;
          recordButton.classList.add('recording');
          recordButton.title = 'Parar gravação';
        }
      } catch (error) {
        console.error('Erro ao iniciar gravação:', error);
      }
    } else {
      try {
        const result = await stopRecording();
        if (result.success) {
          isRecording = false;
          recordButton.classList.remove('recording');
          recordButton.title = 'Gravar áudio';
        }
      } catch (error) {
        console.error('Erro ao parar gravação:', error);
      }
    }
  });

  // Insere o botão logo após o botão de template
  if (templateButton.nextSibling) {
    templateButton.parentNode.insertBefore(recordButton, templateButton.nextSibling);
  } else {
    templateButton.parentNode.appendChild(recordButton);
  }
  console.log('[3CX Audio Extension] Botão de gravação injetado');
}

// Função para garantir que o botão de gravação está presente
function ensureRecordButton() {
  const templateButton = document.querySelector('#templateSelector');
  if (!templateButton) return;
  if (!document.querySelector('#audioRecordButton')) {
    injectRecordButton();
  }
}

// Observador de mutação para monitorar mudanças no DOM
const observer = new MutationObserver(() => {
  ensureRecordButton();
});

// Fallback: setInterval para garantir a injeção mesmo se o observer falhar
setInterval(ensureRecordButton, 1500);

// Inicia o observador quando o DOM estiver pronto
function startObserving() {
  const target = document.body;
  if (target) {
    observer.observe(target, { childList: true, subtree: true });
    ensureRecordButton();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserving);
} else {
  startObserving();
}

// Função para tocar um beep ao finalizar gravação
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.1;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 120);
  } catch (e) {}
}

// Timer de gravação
let gravacaoTimer = null;
let gravacaoTempo = 0;
let gravacaoTimerSpan = null;

// Funções para ocultar/restaurar botões da barra de chat
let chatHiddenButtons = [];
function ocultarBotoesChat() {
  // Não altera mais o layout do botão de gravação!
  // Apenas deixa o ícone vermelho via classe .recording (já implementado no CSS)
  const recordButton = document.querySelector('#audioRecordButton');
  if (!recordButton) return;
  // Nenhuma alteração de estilo inline!
}

function restaurarBotoesChat() {
  if (chatBarOriginalWidth) {
    const bar = document.querySelector('#audioRecordButton')?.parentNode;
    if (bar) bar.style.minWidth = '';
  }
  chatHiddenButtons.forEach(btn => { btn.style.display = ''; });
  chatHiddenButtons = [];
  const recordButton = document.querySelector('#audioRecordButton');
  if (recordButton) {
    recordButton.style.flex = '';
    recordButton.style.justifyContent = '';
    recordButton.style.maxWidth = '';
    recordButton.style.background = '';
    recordButton.style.boxShadow = '';
    recordButton.style.borderRadius = '';
    recordButton.style.height = '';
    recordButton.style.fontSize = '';
    recordButton.style.display = '';
    recordButton.style.alignItems = '';
    recordButton.style.position = '';
    // Corrigir estado visual do botão
    recordButton.classList.remove('recording');
    recordButton.title = 'Gravar áudio';
    // Restaurar conteúdo original
    recordButton.innerHTML = `
      <span class="record-svg" style="display:inline-flex;align-items:center;justify-content:center;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" fill="none"/>
          <path d="M12 15C13.66 15 15 13.66 15 12V7C15 5.34 13.66 4 12 4C10.34 4 9 5.34 9 7V12C9 13.66 10.34 15 12 15Z" fill="currentColor"/>
          <path d="M17.3 11C17.3 14.03 14.87 16.3 12 16.3C9.13 16.3 6.7 14.03 6.7 11H5C5 14.53 7.61 17.43 11 17.93V20H13V17.93C16.39 17.43 19 14.53 19 11H17.3Z" fill="currentColor"/>
        </svg>
      </span>
    `;
  }
  chatBarOriginalWidth = null;
}

// Ajustar iniciar/parar timer para ocultar/restaurar botões
function iniciarTimerGravacao(flutuante = false) {
  gravacaoTempo = 0;
  isPaused = false;
  tempoPausado = 0;
  pausaTimestamp = null;
  gravacaoTimer = setInterval(() => {
    if (!isPaused) {
      gravacaoTempo++;
      if (gravacaoTimerSpan) gravacaoTimerSpan.textContent = formatarDuracao(gravacaoTempo);
    }
  }, 1000);
  ocultarBotoesChat();
}

function pararTimerGravacao() {
  if (gravacaoTimer) clearInterval(gravacaoTimer);
  gravacaoTimer = null;
  if (gravacaoTimerSpan && gravacaoTimerSpan.parentNode) gravacaoTimerSpan.parentNode.removeChild(gravacaoTimerSpan);
  gravacaoTimerSpan = null;
  restaurarBotoesChat();
  isPaused = false;
  tempoPausado = 0;
  pausaTimestamp = null;
}

// Função para criar/atualizar a janela flutuante
function atualizarJanelaFlutuante(tipo, audioBlob = null, audioFile = null) {
  if (floatingAudioContainer && floatingAudioContainer.parentNode) floatingAudioContainer.parentNode.removeChild(floatingAudioContainer);
  floatingAudioContainer = document.createElement('div');
  floatingAudioContainer.style.position = 'fixed';
  floatingAudioContainer.style.left = '50%';
  floatingAudioContainer.style.bottom = '80px';
  floatingAudioContainer.style.transform = 'translateX(-50%)';
  floatingAudioContainer.style.background = '#f8fafc';
  floatingAudioContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  floatingAudioContainer.style.borderRadius = '24px';
  floatingAudioContainer.style.padding = '16px 32px';
  floatingAudioContainer.style.display = 'flex';
  floatingAudioContainer.style.alignItems = 'center';
  floatingAudioContainer.style.zIndex = '99999';
  floatingAudioContainer.style.gap = '18px';
  floatingAudioContainer.style.minWidth = '340px';
  floatingAudioContainer.style.maxWidth = '90vw';

  if (tipo === 'recording') {
    const micIcon = document.createElement('span');
    micIcon.innerHTML = `<svg width="24" height="24" fill="#888" viewBox="0 0 24 24"><path d="M12 15c1.66 0 3-1.34 3-3V7c0-1.66-1.34-3-3-3s-3 1.34-3 3v5c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.93V21h2v-2.07c3.39-.5 6-3.4 6-6.93h-2z"/></svg>`;
    floatingAudioContainer.appendChild(micIcon);
    const wave = document.createElement('span');
    wave.innerHTML = `<svg width="32" height="20" viewBox="0 0 32 20"><polyline points="0,10 4,6 8,14 12,8 16,16 20,4 24,18 28,10 32,12" stroke="#2196F3" stroke-width="2" fill="none"><animate attributeName="points" dur="1s" repeatCount="indefinite" values="0,10 4,6 8,14 12,8 16,16 20,4 24,18 28,10 32,12;0,12 4,8 8,16 12,10 16,18 20,6 24,20 28,12 32,14;0,10 4,6 8,14 12,8 16,16 20,4 24,18 28,10 32,12"/></polyline></svg>`;
    floatingAudioContainer.appendChild(wave);
    gravacaoTimerSpan = document.createElement('span');
    gravacaoTimerSpan.className = 'gravacao-timer-inline';
    gravacaoTimerSpan.style.fontWeight = 'bold';
    gravacaoTimerSpan.style.color = '#f44336';
    gravacaoTimerSpan.style.fontSize = '20px';
    gravacaoTimerSpan.textContent = formatarDuracao(gravacaoTempo);
    floatingAudioContainer.appendChild(gravacaoTimerSpan);
    // Botão pausar/despausar
    pauseResumeButton = document.createElement('button');
    if (isPaused) {
      pauseResumeButton.innerHTML = '<span title="Despausar"><svg width="24" height="24" fill="#333" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>';
      pauseResumeButton.title = 'Despausar';
    } else {
      pauseResumeButton.innerHTML = '<span title="Pausar"><svg width="24" height="24" fill="#333" viewBox="0 0 24 24"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg></span>';
      pauseResumeButton.title = 'Pausar';
    }
    pauseResumeButton.className = 'btn btn-plain';
    pauseResumeButton.onclick = () => {
      if (!isPaused && mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        isPaused = true;
        pausaTimestamp = Date.now();
        atualizarJanelaFlutuante('recording');
      } else if (isPaused && mediaRecorder && mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        isPaused = false;
        if (pausaTimestamp) {
          tempoPausado += Math.floor((Date.now() - pausaTimestamp) / 1000);
        }
        pausaTimestamp = null;
        atualizarJanelaFlutuante('recording');
      }
    };
    floatingAudioContainer.appendChild(pauseResumeButton);
    // Botão parar
    stopButton = document.createElement('button');
    stopButton.innerHTML = '<span title="Parar"><svg width="24" height="24" fill="#d32f2f" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg></span>';
    stopButton.className = 'btn btn-plain';
    stopButton.title = 'Parar';
    stopButton.style.marginLeft = '8px';
    stopButton.onclick = () => { stopRecording(); };
    floatingAudioContainer.appendChild(stopButton);
    // Botão cancelar
    cancelarButton = document.createElement('button');
    cancelarButton.innerHTML = '<span title="Cancelar"><svg width="24" height="24" fill="#333" viewBox="0 0 24 24"><path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/></svg></span>';
    cancelarButton.className = 'btn btn-plain';
    cancelarButton.title = 'Cancelar';
    cancelarButton.style.marginLeft = '8px';
    cancelarButton.onclick = () => {
      stopRecording(true);
    };
    floatingAudioContainer.appendChild(cancelarButton);
    floatingState = 'recording';
  } else if (tipo === 'preview' && audioBlob && audioFile) {
    // Novo player customizado moderno
    const previewContainer = document.createElement('div');
    previewContainer.style.display = 'flex';
    previewContainer.style.alignItems = 'center';
    previewContainer.style.background = '#f8fafc';
    previewContainer.style.borderRadius = '18px';
    previewContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
    previewContainer.style.padding = '12px 20px';
    previewContainer.style.gap = '16px';
    previewContainer.style.width = '100%';
    previewContainer.style.maxWidth = '520px';

    // Ícone de microfone
    const micIcon = document.createElement('span');
    micIcon.innerHTML = `<svg width="20" height="20" fill="#2196F3" viewBox="0 0 24 24"><path d="M12 15c1.66 0 3-1.34 3-3V7c0-1.66-1.34-3-3-3s-3 1.34-3 3v5c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.93V21h2v-2.07c3.39-.5 6-3.4 6-6.93h-2z"/></svg>`;
    micIcon.style.flex = 'none';
    previewContainer.appendChild(micIcon);

    // Nome do usuário (apenas primeiro nome)
    let nomeExibir = nomeUsuarioReal || 'Você';
    if (nomeExibir !== 'Você') {
      // Tenta buscar o nome real do participante no DOM
      const participanteDiv = document.querySelector('#showParticipants');
      if (participanteDiv) {
        // Exemplo: "Pressendo, Ana Claudia 1003"
        const texto = participanteDiv.textContent.trim();
        // Pega só a parte depois da vírgula, remove números e pega o primeiro nome
        const partes = texto.split(',');
        if (partes.length > 1) {
          const nomes = partes[1].replace(/\d+/g, '').trim().split(' ');
          if (nomes.length > 0) nomeExibir = nomes[0];
        }
      } else {
        // Fallback: pega só o primeiro nome do nomeUsuario
        nomeExibir = nomeExibir.split(' ')[0];
      }
    }
    const nome = document.createElement('span');
    nome.textContent = nomeExibir;
    nome.style.fontWeight = '500';
    nome.style.fontSize = '14px';
    nome.style.color = '#444';
    nome.style.marginRight = '8px';
    previewContainer.appendChild(nome);

    // Player customizado
    const playerBox = document.createElement('div');
    playerBox.style.display = 'flex';
    playerBox.style.alignItems = 'center';
    playerBox.style.background = 'transparent';
    playerBox.style.borderRadius = '12px';
    playerBox.style.boxShadow = 'none';
    playerBox.style.padding = '6px 14px 6px 10px';
    playerBox.style.gap = '10px';
    playerBox.style.minWidth = '180px';
    playerBox.style.flex = '1';

    // Botão play/pause
    const audio = document.createElement('audio');
    audio.src = URL.createObjectURL(audioBlob);
    audio.preload = 'metadata';
    audio.style.display = 'none';
    let isPlaying = false;
    const playPauseBtn = document.createElement('button');
    playPauseBtn.innerHTML = '<svg width="22" height="22" fill="#222" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    playPauseBtn.title = 'Tocar/Pausar';
    playPauseBtn.className = 'btn btn-plain';
    playPauseBtn.style.borderRadius = '50%';
    playPauseBtn.style.width = '44px';
    playPauseBtn.style.height = '44px';
    playPauseBtn.style.fontSize = '28px';
    playPauseBtn.style.display = 'flex';
    playPauseBtn.style.alignItems = 'center';
    playPauseBtn.style.justifyContent = 'center';
    playPauseBtn.onclick = () => {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    };
    audio.addEventListener('play', () => {
      playPauseBtn.innerHTML = '<svg width="22" height="22" fill="#222" viewBox="0 0 24 24"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>';
    });
    audio.addEventListener('pause', () => {
      playPauseBtn.innerHTML = '<svg width="22" height="22" fill="#222" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    });
    playerBox.appendChild(playPauseBtn);
    playerBox.appendChild(audio);

    // Barra de progresso
    const progressBar = document.createElement('input');
    progressBar.type = 'range';
    progressBar.min = 0;
    progressBar.max = 1;
    progressBar.step = 0.01;
    progressBar.value = 0;
    progressBar.style.width = '80px';
    progressBar.style.margin = '0 8px';
    progressBar.style.accentColor = '#2196F3';
    progressBar.oninput = () => {
      audio.currentTime = progressBar.value * audio.duration;
    };
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) progressBar.value = audio.currentTime / audio.duration;
    });
    audio.addEventListener('loadedmetadata', () => {
      progressBar.value = 0;
    });
    playerBox.appendChild(progressBar);

    // Tempo decorrido
    const tempoDecorrido = document.createElement('span');
    tempoDecorrido.textContent = '0:00';
    tempoDecorrido.style.fontWeight = '500';
    tempoDecorrido.style.fontSize = '15px';
    tempoDecorrido.style.color = '#222';
    tempoDecorrido.style.marginLeft = '4px';
    audio.addEventListener('timeupdate', () => {
      tempoDecorrido.textContent = formatarDuracao(audio.currentTime);
    });
    playerBox.appendChild(tempoDecorrido);

    // Tempo total
    const tempoTotal = document.createElement('span');
    tempoTotal.textContent = '0:00';
    tempoTotal.style.fontWeight = '500';
    tempoTotal.style.fontSize = '15px';
    tempoTotal.style.color = '#222';
    tempoTotal.style.marginLeft = '6px';
    audio.addEventListener('loadedmetadata', () => {
      tempoTotal.textContent = formatarDuracao(audio.duration);
    });
    playerBox.appendChild(tempoTotal);

    // Ícone de volume
    const volumeIcon = document.createElement('span');
    volumeIcon.innerHTML = '<svg width="20" height="20" fill="#888" viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.74 2.5-2.26 2.5-4.02z"/></svg>';
    volumeIcon.style.marginLeft = '8px';
    playerBox.appendChild(volumeIcon);

    previewContainer.appendChild(playerBox);

    // Ajustar botões de ação
    const actionsBox = document.createElement('div');
    actionsBox.style.display = 'flex';
    actionsBox.style.alignItems = 'center';
    actionsBox.style.gap = '6px';
    actionsBox.style.marginLeft = '18px';

    // Botão Enviar
    sendAudioButton = document.createElement('button');
    sendAudioButton.innerHTML = '<span title="Enviar"><svg width="24" height="24" fill="#2196F3" viewBox="0 0 24 24"><path d="M2 21l21-9-21-9v7l15 2-15 2z"/></svg></span>';
    sendAudioButton.className = 'btn btn-plain';
    sendAudioButton.title = 'Enviar';
    sendAudioButton.onclick = () => {
      anexarAudioNaConversa(audioFile);
      removerJanelaFlutuante();
      restaurarBotoesChat();
      // Resetar variáveis de gravação para permitir nova gravação
      mediaRecorder = null;
      audioStream = null;
      audioChunks = [];
      audioBlob = null;
      audioFile = null;
      isRecording = false;
      isPaused = false;
      tempoPausado = 0;
      pausaTimestamp = null;
    };

    // Botão Cancelar
    closeAudioPreviewButton = document.createElement('button');
    closeAudioPreviewButton.innerHTML = '<span title="Cancelar"><svg width="24" height="24" fill="#333" viewBox="0 0 24 24"><path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/></svg></span>';
    closeAudioPreviewButton.className = 'btn btn-plain';
    closeAudioPreviewButton.title = 'Cancelar';
    closeAudioPreviewButton.onclick = () => {
      removerJanelaFlutuante();
      restaurarBotoesChat();
      // Resetar variáveis de gravação para permitir nova gravação
      mediaRecorder = null;
      audioStream = null;
      audioChunks = [];
      audioBlob = null;
      audioFile = null;
      isRecording = false;
      isPaused = false;
      tempoPausado = 0;
      pausaTimestamp = null;
    };

    actionsBox.appendChild(sendAudioButton);
    actionsBox.appendChild(closeAudioPreviewButton);
    previewContainer.appendChild(actionsBox);

    floatingAudioContainer.appendChild(previewContainer);
    floatingState = 'preview';
  }
  document.body.appendChild(floatingAudioContainer);
}

function removerJanelaFlutuante() {
  if (floatingAudioContainer && floatingAudioContainer.parentNode) floatingAudioContainer.parentNode.removeChild(floatingAudioContainer);
  floatingAudioContainer = null;
  floatingState = null;
  gravacaoTimerSpan = null;
  pauseResumeButton = null;
  stopButton = null;
  sendAudioButton = null;
  closeAudioPreviewButton = null;
  isPaused = false;
  tempoPausado = 0;
  pausaTimestamp = null;
  restaurarBotoesChat();
  const recordButton = document.querySelector('#audioRecordButton');
  if (recordButton) {
    recordButton.classList.remove('recording');
    recordButton.title = 'Gravar áudio';
    recordButton.disabled = false;
  }
}

// Função para iniciar a gravação
async function startRecording() {
  try {
    // Solicita permissão de áudio
    audioStream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1
      } 
    });
    
    // Verifica se o navegador suporta o formato
    const mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      throw new Error('Formato de áudio não suportado pelo navegador');
    }
    
    mediaRecorder = new MediaRecorder(audioStream, {
      mimeType: mimeType,
      audioBitsPerSecond: 128000
    });
    
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.onerror = (event) => {
      console.error('Erro na gravação:', event.error);
      stopRecording(true);
    };
    
    mediaRecorder.onstop = () => {
      try {
        audioBlob = new Blob(audioChunks, { type: mimeType });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        audioFile = new File([audioBlob], `audio_message_${timestamp}.webm`, {
          type: mimeType,
          lastModified: Date.now()
        });
        
        audioStream.getTracks().forEach(track => track.stop());
        pararTimerGravacao();
        beep();
        atualizarJanelaFlutuante('preview', audioBlob, audioFile);
      } catch (error) {
        console.error('Erro ao finalizar gravação:', error);
        stopRecording(true);
      }
    };
    
    mediaRecorder.start(100); // Coleta dados a cada 100ms
    removerJanelaFlutuante();
    gravacaoTempo = 0;
    iniciarTimerGravacao(true);
    atualizarJanelaFlutuante('recording');
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao iniciar gravação:', error);
    // Limpa recursos em caso de erro
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    mediaRecorder = null;
    audioStream = null;
    audioChunks = [];
    audioBlob = null;
    audioFile = null;
    isRecording = false;
    isPaused = false;
    tempoPausado = 0;
    pausaTimestamp = null;
    removerJanelaFlutuante();
    return { success: false, error: error.message };
  }
}

async function stopRecording(cancelar = false) {
  try {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      removerJanelaFlutuante();
      return { success: false, error: 'Nenhuma gravação em andamento' };
    }

    if (cancelar) {
      mediaRecorder.onstop = null;
      mediaRecorder.stop();
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      pararTimerGravacao();
      removerJanelaFlutuante();
      // Resetar todas as variáveis de estado para permitir nova gravação
      mediaRecorder = null;
      audioStream = null;
      audioChunks = [];
      audioBlob = null;
      audioFile = null;
      isRecording = false;
      isPaused = false;
      tempoPausado = 0;
      pausaTimestamp = null;
      return { success: true };
    }

    mediaRecorder.stop();
    return { success: true };
  } catch (error) {
    console.error('Erro ao parar gravação:', error);
    removerJanelaFlutuante();
    // Limpa recursos em caso de erro
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    mediaRecorder = null;
    audioStream = null;
    audioChunks = [];
    audioBlob = null;
    audioFile = null;
    isRecording = false;
    isPaused = false;
    tempoPausado = 0;
    pausaTimestamp = null;
    return { success: false, error: error.message };
  }
}

// Função para anexar o áudio na conversa do 3CX
function anexarAudioNaConversa(audioFile) {
  // Procura o input de upload de arquivo dentro do container do chat
  const chatControls = document.querySelector('#chat-form-controls');
  if (!chatControls) return;
  const fileInput = chatControls.querySelector('input[type="file"]');
  if (!fileInput) return;

  // Cria um DataTransfer e adiciona o arquivo de áudio
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(audioFile);
  fileInput.files = dataTransfer.files;

  // Dispara o evento change para simular o envio
  const event = new Event('change', { bubbles: true });
  fileInput.dispatchEvent(event);
  console.log('[3CX Audio Extension] Áudio anexado automaticamente na conversa!');
}

// Função utilitária para formatar duração em mm:ss
function formatarDuracao(segundos) {
  const min = Math.floor(segundos / 60);
  const sec = Math.floor(segundos % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// Função para criar player customizado para áudio (com ícone, onda, tooltip, foco)
function criarPlayerCustomizado(nomeUsuario, urlAudio, nomeArquivo, dataHora) {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.gap = '10px';
  container.style.background = '#f8fafc';
  container.style.borderRadius = '16px';
  container.style.padding = '8px 16px';
  container.style.margin = '4px 0';
  container.style.width = '100%';
  container.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
  container.title = `${nomeArquivo} - ${dataHora || ''}`;

  // Ícone de microfone
  const micIcon = document.createElement('span');
  micIcon.innerHTML = `<svg width="20" height="20" fill="#2196F3" viewBox="0 0 24 24"><path d="M12 15c1.66 0 3-1.34 3-3V7c0-1.66-1.34-3-3-3s-3 1.34-3 3v5c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.93V21h2v-2.07c3.39-.5 6-3.4 6-6.93h-2z"/></svg>`;
  micIcon.style.flex = 'none';
  container.appendChild(micIcon);

  // Onda sonora animada
  const wave = document.createElement('span');
  wave.innerHTML = `<svg id="wave-svg" width="32" height="20" viewBox="0 0 32 20"><polyline points="0,10 4,6 8,14 12,8 16,16 20,4 24,18 28,10 32,12" stroke="#2196F3" stroke-width="2" fill="none"><animate attributeName="points" dur="1s" repeatCount="indefinite" values="0,10 4,6 8,14 12,8 16,16 20,4 24,18 28,10 32,12;0,12 4,8 8,16 12,10 16,18 20,6 24,20 28,12 32,14;0,10 4,6 8,14 12,8 16,16 20,4 24,18 28,10 32,12"/></polyline></svg>`;
  wave.style.display = 'none';
  container.appendChild(wave);

  // Nome do usuário
  const nome = document.createElement('span');
  nome.textContent = nomeUsuario;
  nome.style.fontWeight = '500';
  nome.style.fontSize = '13px';
  nome.style.color = '#555';
  nome.style.marginRight = '6px';
  container.appendChild(nome);

  // Player de áudio
  const audio = document.createElement('audio');
  audio.src = urlAudio;
  audio.controls = true;
  audio.style.verticalAlign = 'middle';
  audio.style.width = '120px';
  audio.style.height = '28px';
  audio.style.background = '#eee';
  audio.style.borderRadius = '8px';
  container.appendChild(audio);

  // Duração
  const duracao = document.createElement('span');
  duracao.textContent = '0:00';
  duracao.style.marginLeft = '6px';
  duracao.style.fontWeight = 'bold';
  duracao.style.color = '#333';
  audio.addEventListener('loadedmetadata', () => {
    duracao.textContent = formatarDuracao(audio.duration);
  });
  container.appendChild(duracao);

  // Horário
  if (dataHora) {
    const time = document.createElement('span');
    time.textContent = dataHora;
    time.style.marginLeft = '6px';
    time.style.fontSize = '11px';
    time.style.color = '#aaa';
    container.appendChild(time);
  }

  // Foco automático ao criar
  setTimeout(() => { audio.focus(); }, 100);

  // Tooltip
  audio.title = `${nomeArquivo} - ${dataHora || ''}`;

  // Animação de onda sonora ao tocar
  audio.addEventListener('play', () => { wave.style.display = 'inline-block'; });
  audio.addEventListener('pause', () => { wave.style.display = 'none'; });
  audio.addEventListener('ended', () => { wave.style.display = 'none'; });

  return container;
}

// Função para substituir anexos de áudio por player customizado
function substituirAnexosPorPlayer() {
  // Seleciona todos os blocos de mensagem do usuário
  const mensagens = document.querySelectorAll('.chat-message.outgoing, .chat-message.me, .message.outgoing, .message.me');
  mensagens.forEach(msg => {
    // Procura por links de arquivos .webm ou .ogg
    const links = msg.querySelectorAll('a[href$=".webm"], a[href$=".ogg"]');
    links.forEach(link => {
      // Evita duplicidade
      if (link.parentNode && link.parentNode.classList.contains('custom-audio-player')) return;
      const urlAudio = link.href;
      const nomeArquivo = link.textContent.trim();
      // Tenta obter o nome do usuário
      let nomeUsuario = 'Você';
      const nomeSpan = msg.querySelector('.sender, .user, .author, .name');
      if (nomeSpan) nomeUsuario = nomeSpan.textContent.trim();
      // Cria o player customizado
      const player = criarPlayerCustomizado(nomeUsuario, urlAudio, nomeArquivo, '');
      player.classList.add('custom-audio-player');
      // Substitui o bloco do link pelo player
      link.parentNode.replaceWith(player);
    });
  });
}

// Função para substituir anexos de áudio <file-message> por player customizado
function substituirFileMessagePorPlayer() {
  // Seleciona todos os file-message
  const fileMessages = document.querySelectorAll('file-message');
  fileMessages.forEach(fm => {
    // Procura pelo nome do arquivo
    const fileNameSpan = fm.querySelector('.message-file-name');
    if (!fileNameSpan) return;
    const nomeArquivo = fileNameSpan.textContent.trim();
    if (!nomeArquivo.match(/\.(webm|ogg|m4a)$/i)) return;

    // Evita duplicidade
    if (fm.querySelector('.custom-audio-player')) return;

    // Procura pelo link de download
    const link = fm.querySelector('a[download], a[href]');
    if (!link) return;
    const urlAudio = link.href;

    // Procura pelo horário
    const horario = fm.parentElement.querySelector('.message-time-info, .message-file-size-info')?.textContent?.trim() || '';

    // Tenta obter o nome do usuário remetente
    let nomeUsuario = 'Você';
    const remetente = fm.closest('.message-wrapper, .chat-message, .message')?.querySelector('.sender, .user, .author, .name');
    if (remetente && remetente.textContent.trim().length > 0) {
      nomeUsuario = remetente.textContent.trim();
    } else if (nomeUsuarioReal) {
      nomeUsuario = nomeUsuarioReal;
    }

    // Player customizado moderno (igual à pré-visualização)
    const previewContainer = document.createElement('div');
    previewContainer.className = 'custom-audio-player';
    previewContainer.style.display = 'flex';
    previewContainer.style.alignItems = 'center';
    previewContainer.style.background = '#f8fafc';
    previewContainer.style.borderRadius = '14px';
    previewContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
    previewContainer.style.padding = '8px 12px';
    previewContainer.style.gap = '10px';
    previewContainer.style.width = '100%';
    previewContainer.style.maxWidth = '380px';

    // Ícone de microfone
    const micIcon = document.createElement('span');
    micIcon.innerHTML = `<svg width="20" height="20" fill="#2196F3" viewBox="0 0 24 24"><path d="M12 15c1.66 0 3-1.34 3-3V7c0-1.66-1.34-3-3-3s-3 1.34-3 3v5c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.93V21h2v-2.07c3.39-.5 6-3.4 6-6.93h-2z"/></svg>`;
    micIcon.style.flex = 'none';
    previewContainer.appendChild(micIcon);

    // Nome do usuário (apenas primeiro nome)
    let nomeExibir = nomeUsuario;
    // Se for mensagem recebida (não 'Você'), buscar nome real do participante
    if (nomeUsuario === 'Você' && fm.closest('.outgoing, .me')) {
      nomeExibir = 'Você';
    } else {
      // Tenta buscar o nome real do participante no DOM
      const participanteDiv = document.querySelector('#showParticipants');
      if (participanteDiv) {
        // Exemplo: "Pressendo, Ana Claudia 1003"
        const texto = participanteDiv.textContent.trim();
        // Pega só a parte depois da vírgula, remove números e pega o primeiro nome
        const partes = texto.split(',');
        if (partes.length > 1) {
          const nomes = partes[1].replace(/\d+/g, '').trim().split(' ');
          if (nomes.length > 0) nomeExibir = nomes[0];
        }
      } else {
        // Fallback: pega só o primeiro nome do nomeUsuario
        nomeExibir = nomeUsuario.split(' ')[0];
      }
    }
    const nome = document.createElement('span');
    nome.textContent = nomeExibir;
    nome.style.fontWeight = '500';
    nome.style.fontSize = '14px';
    nome.style.color = '#444';
    nome.style.marginRight = '8px';
    previewContainer.appendChild(nome);

    // Player customizado
    const playerBox = document.createElement('div');
    playerBox.style.display = 'flex';
    playerBox.style.alignItems = 'center';
    playerBox.style.background = 'transparent';
    playerBox.style.borderRadius = '12px';
    playerBox.style.boxShadow = 'none';
    playerBox.style.padding = '6px 14px 6px 10px';
    playerBox.style.gap = '10px';
    playerBox.style.minWidth = '180px';
    playerBox.style.flex = '1';

    // Botão play/pause
    const audio = document.createElement('audio');
    audio.src = urlAudio;
    audio.preload = 'metadata';
    audio.style.display = 'none';
    const playPauseBtn = document.createElement('button');
    playPauseBtn.innerHTML = '<svg width="22" height="22" fill="#222" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    playPauseBtn.title = 'Tocar/Pausar';
    playPauseBtn.className = 'btn btn-plain';
    playPauseBtn.style.borderRadius = '50%';
    playPauseBtn.style.width = '44px';
    playPauseBtn.style.height = '44px';
    playPauseBtn.style.fontSize = '28px';
    playPauseBtn.style.display = 'flex';
    playPauseBtn.style.alignItems = 'center';
    playPauseBtn.style.justifyContent = 'center';
    playPauseBtn.onclick = () => {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    };
    audio.addEventListener('play', () => {
      playPauseBtn.innerHTML = '<svg width="22" height="22" fill="#222" viewBox="0 0 24 24"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>';
    });
    audio.addEventListener('pause', () => {
      playPauseBtn.innerHTML = '<svg width="22" height="22" fill="#222" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    });
    playerBox.appendChild(playPauseBtn);
    playerBox.appendChild(audio);

    // Barra de progresso
    const progressBar = document.createElement('input');
    progressBar.type = 'range';
    progressBar.min = 0;
    progressBar.max = 1;
    progressBar.step = 0.01;
    progressBar.value = 0;
    progressBar.style.width = '80px';
    progressBar.style.margin = '0 8px';
    progressBar.style.accentColor = '#2196F3';
    progressBar.oninput = () => {
      audio.currentTime = progressBar.value * audio.duration;
    };
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) progressBar.value = audio.currentTime / audio.duration;
    });
    audio.addEventListener('loadedmetadata', () => {
      progressBar.value = 0;
    });
    playerBox.appendChild(progressBar);

    // Tempo decorrido
    const tempoDecorrido = document.createElement('span');
    tempoDecorrido.textContent = '0:00';
    tempoDecorrido.style.fontWeight = '500';
    tempoDecorrido.style.fontSize = '15px';
    tempoDecorrido.style.color = '#222';
    tempoDecorrido.style.marginLeft = '4px';
    audio.addEventListener('timeupdate', () => {
      tempoDecorrido.textContent = formatarDuracao(audio.currentTime);
    });
    playerBox.appendChild(tempoDecorrido);

    // Tempo total
    const tempoTotal = document.createElement('span');
    tempoTotal.textContent = '0:00';
    tempoTotal.style.fontWeight = '500';
    tempoTotal.style.fontSize = '15px';
    tempoTotal.style.color = '#222';
    tempoTotal.style.marginLeft = '6px';
    audio.addEventListener('loadedmetadata', () => {
      tempoTotal.textContent = formatarDuracao(audio.duration);
    });
    playerBox.appendChild(tempoTotal);

    // Ícone de volume
    const volumeIcon = document.createElement('span');
    volumeIcon.innerHTML = '<svg width="20" height="20" fill="#888" viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.74 2.5-2.26 2.5-4.02z"/></svg>';
    volumeIcon.style.marginLeft = '8px';
    playerBox.appendChild(volumeIcon);

    previewContainer.appendChild(playerBox);

    // Substitui o conteúdo do file-message pelo player customizado
    fm.innerHTML = '';
    fm.appendChild(previewContainer);
  });
}

// Atualiza o observer para chamar também a nova função
const observerAudio = new MutationObserver(() => {
  substituirAnexosPorPlayer();
  substituirFileMessagePorPlayer();
});

function startObservingAudio() {
  const target = document.body;
  if (target) {
    observerAudio.observe(target, { childList: true, subtree: true });
    substituirAnexosPorPlayer();
    substituirFileMessagePorPlayer();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObservingAudio);
} else {
  startObservingAudio();
}

// Atualiza o CSS global para melhor responsividade
(function garantirFlexBarraChat() {
  const style = document.createElement('style');
  style.textContent = `
    #chat-form-controls {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      flex-wrap: nowrap !important;
      gap: 4px;
      min-height: 40px;
      padding: 4px 8px;
    }
    #chat-form-controls > * {
      vertical-align: middle !important;
      margin: 0 2px !important;
      flex-shrink: 0;
    }
    #audioRecordButton {
      padding: 5px !important;
      transition: all 0.3s ease !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-width: 32px !important;
      height: 32px !important;
      border-radius: 4px !important;
      background: transparent !important;
      border: none !important;
      cursor: pointer !important;
      flex-shrink: 0 !important;
    }
    #audioRecordButton:hover {
      background-color: rgba(0, 0, 0, 0.05) !important;
    }
    #audioRecordButton.recording .record-svg svg {
      color: #f44336 !important;
      animation: pulse 1s infinite !important;
    }
    .floating-audio-container {
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      background: white !important;
      border-radius: 8px !important;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
      padding: 16px !important;
      z-index: 9999 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
      min-width: 280px !important;
      max-width: 90vw !important;
      margin: 0 auto !important;
    }
    @media (max-width: 480px) {
      .floating-audio-container {
        left: 10px !important;
        right: 10px !important;
        bottom: 10px !important;
        width: calc(100% - 20px) !important;
        min-width: auto !important;
      }
      #chat-form-controls {
        padding: 2px 4px !important;
      }
      #audioRecordButton {
        min-width: 28px !important;
        height: 28px !important;
        padding: 4px !important;
      }
    }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
})();

// Atualiza o listener de mensagens para usar chrome.runtime em vez de browser.runtime
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Mensagem recebida:', message);
  
  // Processa o comando recebido
  switch (message.command) {
    case 'start_recording':
      startRecording()
        .then(response => {
          console.log('Resposta do startRecording:', response);
          sendResponse(response);
        })
        .catch(error => {
          console.error('Erro no startRecording:', error);
          sendResponse({ 
            success: false, 
            error: 'Erro ao iniciar gravação: ' + error.message 
          });
        });
      break;
      
    case 'stop_recording':
      stopRecording()
        .then(response => {
          console.log('Resposta do stopRecording:', response);
          sendResponse(response);
        })
        .catch(error => {
          console.error('Erro no stopRecording:', error);
          sendResponse({ 
            success: false, 
            error: 'Erro ao parar gravação: ' + error.message 
          });
        });
      break;
      
    default:
      console.warn('Comando desconhecido:', message.command);
      sendResponse({ 
        success: false, 
        error: 'Comando desconhecido: ' + message.command 
      });
  }
  
  // Retorna true para indicar que a resposta será assíncrona
  return true;
});

// Função para verificar se o navegador suporta a API de gravação
function verificarSuporteGravação() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('API de gravação não suportada pelo navegador');
    return false;
  }
  
  if (!MediaRecorder) {
    console.error('MediaRecorder não suportado pelo navegador');
    return false;
  }
  
  const mimeType = 'audio/webm;codecs=opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    console.error('Formato de áudio não suportado pelo navegador');
    return false;
  }
  
  return true;
}

// Função para solicitar permissão de áudio
async function solicitarPermissaoAudio() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
        channelCount: 1
      } 
    });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Erro ao solicitar permissão de áudio:', error);
    return false;
  }
}

// Inicialização da extensão
async function inicializarExtensao() {
  if (!verificarSuporteGravação()) {
    console.error('Navegador não suporta gravação de áudio');
    return;
  }
  
  const temPermissao = await solicitarPermissaoAudio();
  if (!temPermissao) {
    console.error('Permissão de áudio negada');
    return;
  }
  
  console.log('[3CX Audio Extension] Inicializada com sucesso');
}

// Inicia a extensão quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarExtensao);
} else {
  inicializarExtensao();
} 