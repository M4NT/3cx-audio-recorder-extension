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
function createRecordingIndicator() {}

// Função para atualizar o indicador
function updateRecordingIndicator() {}

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

// Função para criar e injetar o botão de gravação logo após o botão de template
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

// Atalho de teclado na aba do 3CX: Alt+Shift+R para iniciar/parar gravação
function registrarAtalhoTecladoGravacao() {
  if (window.__threecxHotkeyRegistered) return;
  window.__threecxHotkeyRegistered = true;

  document.addEventListener('keydown', (event) => {
    // Ignora se o usuário estiver digitando em campos de texto/editáveis
    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    const isAltShiftR =
      event.altKey &&
      event.shiftKey &&
      (event.key === 'r' || event.key === 'R');

    if (!isAltShiftR) return;

    event.preventDefault();
    const recordBtn = document.querySelector('#audioRecordButton');
    if (!recordBtn || recordBtn.disabled) return;

    try {
      recordBtn.click();
    } catch (e) {
      console.error('[3CX Audio Extension] Erro ao acionar atalho de gravação:', e);
    }
  });
}

registrarAtalhoTecladoGravacao();

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
  floatingAudioContainer.style.borderRadius = '20px';
  floatingAudioContainer.style.padding = '12px 24px';
  floatingAudioContainer.style.display = 'flex';
  floatingAudioContainer.style.alignItems = 'center';
  floatingAudioContainer.style.zIndex = '99999';
  floatingAudioContainer.style.gap = '12px';
  floatingAudioContainer.style.minWidth = '280px';
  floatingAudioContainer.style.maxWidth = '90vw';

  // Garante estilos consistentes para os botões da janela flutuante
  if (!document.getElementById('threecx-audio-floating-style')) {
    const style = document.createElement('style');
    style.id = 'threecx-audio-floating-style';
    style.textContent = `
      .threecx-audio-container {
        animation: threecx-audio-slide-in 160ms ease-out;
      }
      @keyframes threecx-audio-slide-in {
        from { transform: translate(-50%, 10px); opacity: 0; }
        to   { transform: translate(-50%, 0);    opacity: 1; }
      }
      .threecx-audio-btn {
        border: none;
        background: #e5ebf5;
        border-radius: 999px;
        width: 32px;  /* mais compacto */
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        color: #111827;
        transition: background-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
      }
      .threecx-audio-btn:hover {
        background: #d7e3f8;
        box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.25);
      }
      .threecx-audio-btn:active {
        transform: scale(0.95);
        box-shadow: none;
      }
      .threecx-audio-btn svg {
        width: 18px;
        height: 18px;
        fill: currentColor;
      }
      .threecx-audio-btn--primary {
        color: #ffffff;
        background: #16a34a; /* verde para indicar enviar */
      }
      .threecx-audio-btn--primary:hover {
        background: #15803d;
      }
      .threecx-audio-btn--danger {
        color: #d32f2f;
        background: #fee2e2;
      }
      .threecx-audio-btn--danger:hover {
        background: #fecaca;
      }
      .threecx-audio-btn--ghost {
        background: transparent;
        color: #555;
      }
      .threecx-audio-btn--ghost:hover {
        background: rgba(0,0,0,0.06);
      }
      /* Barra de progresso da pré-visualização, fina como na barra de gravação */
      .threecx-audio-preview-range {
        -webkit-appearance: none;
        appearance: none;
        width: 110px;
        height: 4px;
        border-radius: 999px;
        background: #e5e7eb;
        outline: none;
        padding: 0;
        margin: 0 8px;
      }
      .threecx-audio-preview-range::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: #2563eb;
        border: 2px solid #f9fafb;
        box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.5);
        cursor: pointer;
        margin-top: -4px;
      }
      .threecx-audio-preview-range::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: #2563eb;
        border: 2px solid #f9fafb;
        box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.5);
        cursor: pointer;
      }
      .threecx-audio-preview-range::-moz-range-track {
        height: 4px;
        border-radius: 999px;
        background: #e5e7eb;
      }
      /* Pulso suave no botão de parar enquanto grava */
      .threecx-audio-btn--danger.is-recording {
        animation: threecx-audio-pulse 1s infinite;
      }
      @keyframes threecx-audio-pulse {
        0%   { transform: scale(1);   }
        50%  { transform: scale(1.06);}
        100% { transform: scale(1);   }
      }
      /* Foco visível para acessibilidade */
      .threecx-audio-btn:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.45);
      }
    `;
    document.head.appendChild(style);
  }

  // Classe base para animação de entrada
  floatingAudioContainer.classList.add('threecx-audio-container');

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
    gravacaoTimerSpan.style.fontSize = '18px';
    gravacaoTimerSpan.textContent = formatarDuracao(gravacaoTempo);
    floatingAudioContainer.appendChild(gravacaoTimerSpan);
    // Botão pausar/despausar
    pauseResumeButton = document.createElement('button');
    pauseResumeButton.type = 'button';
    pauseResumeButton.className = 'threecx-audio-btn';
    if (isPaused) {
      pauseResumeButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
      pauseResumeButton.title = 'Retomar';
    } else {
      pauseResumeButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>';
      pauseResumeButton.title = 'Pausar';
    }
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
    stopButton.type = 'button';
    stopButton.className = 'threecx-audio-btn threecx-audio-btn--danger is-recording';
    stopButton.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12"/></svg>';
    stopButton.title = 'Parar';
    stopButton.style.marginLeft = '8px';
    stopButton.onclick = () => { stopRecording(); };
    floatingAudioContainer.appendChild(stopButton);

    // Botão cancelar
    cancelarButton = document.createElement('button');
    cancelarButton.type = 'button';
    cancelarButton.className = 'threecx-audio-btn threecx-audio-btn--ghost';
    cancelarButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/></svg>';
    cancelarButton.title = 'Cancelar';
    cancelarButton.style.marginLeft = '8px';
    cancelarButton.onclick = () => {
      stopRecording(true);
    };
    floatingAudioContainer.appendChild(cancelarButton);
    floatingState = 'recording';
  } else if (tipo === 'preview' && audioBlob && audioFile) {
    // Layout de preview alinhado ao layout de gravação (mesmo container, sem "cartão" interno)
    const micIcon = document.createElement('span');
    micIcon.innerHTML = `<svg width="20" height="20" fill="#2196F3" viewBox="0 0 24 24"><path d="M12 15c1.66 0 3-1.34 3-3V7c0-1.66-1.34-3-3-3s-3 1.34-3 3v5c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.93V21h2v-2.07c3.39-.5 6-3.4 6-6.93h-2z"/></svg>`;
    micIcon.style.flex = 'none';
    floatingAudioContainer.appendChild(micIcon);

    // Player e barra de progresso
    const playerBox = document.createElement('div');
    playerBox.style.display = 'flex';
    playerBox.style.alignItems = 'center';
    playerBox.style.gap = '10px';
    playerBox.style.flex = '1';

    const audio = document.createElement('audio');
    audio.src = URL.createObjectURL(audioBlob);
    audio.preload = 'metadata';
    audio.style.display = 'none';

    const playPauseBtn = document.createElement('button');
    playPauseBtn.type = 'button';
    playPauseBtn.className = 'threecx-audio-btn threecx-audio-btn--ghost';
    playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    playPauseBtn.title = 'Tocar/Pausar';
    playPauseBtn.onclick = () => {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    };
    audio.addEventListener('play', () => {
      playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>';
    });
    audio.addEventListener('pause', () => {
      playPauseBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    });

    const progressBar = document.createElement('input');
    progressBar.type = 'range';
    progressBar.min = 0;
    progressBar.max = 1;
    progressBar.step = 0.01;
    progressBar.value = 0;
    progressBar.className = 'threecx-audio-preview-range';
    progressBar.oninput = () => {
      audio.currentTime = progressBar.value * audio.duration;
    };
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) progressBar.value = audio.currentTime / audio.duration;
    });
    audio.addEventListener('loadedmetadata', () => {
      progressBar.value = 0;
    });

    const tempoDecorrido = document.createElement('span');
    tempoDecorrido.textContent = '0:00';
    tempoDecorrido.style.fontWeight = '500';
    tempoDecorrido.style.fontSize = '14px';
    tempoDecorrido.style.color = '#222';
    tempoDecorrido.style.marginLeft = '4px';
    audio.addEventListener('timeupdate', () => {
      tempoDecorrido.textContent = formatarDuracao(audio.currentTime);
    });

    const tempoTotal = document.createElement('span');
    tempoTotal.textContent = '0:00';
    tempoTotal.style.fontWeight = '500';
    tempoTotal.style.fontSize = '14px';
    tempoTotal.style.color = '#222';
    tempoTotal.style.marginLeft = '6px';
    audio.addEventListener('loadedmetadata', () => {
      tempoTotal.textContent = formatarDuracao(audio.duration);
    });

    const volumeIcon = document.createElement('span');
    volumeIcon.innerHTML = '<svg width="18" height="18" fill="#888" viewBox="0 0 24 24"><path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.74 2.5-2.26 2.5-4.02z"/></svg>';
    volumeIcon.style.marginLeft = '8px';

    playerBox.appendChild(playPauseBtn);
    playerBox.appendChild(audio);
    playerBox.appendChild(progressBar);
    playerBox.appendChild(tempoDecorrido);
    playerBox.appendChild(tempoTotal);
    playerBox.appendChild(volumeIcon);

    floatingAudioContainer.appendChild(playerBox);

    // Botões de ação à direita (Enviar / Cancelar)
    const actionsBox = document.createElement('div');
    actionsBox.style.display = 'flex';
    actionsBox.style.alignItems = 'center';
    actionsBox.style.gap = '8px';
    actionsBox.style.marginLeft = '16px';

    sendAudioButton = document.createElement('button');
    sendAudioButton.type = 'button';
    sendAudioButton.className = 'threecx-audio-btn threecx-audio-btn--primary';
    sendAudioButton.title = 'Enviar';
    sendAudioButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>';
    sendAudioButton.onclick = () => {
      anexarAudioNaConversa(audioFile);
      removerJanelaFlutuante();
      restaurarBotoesChat();
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

    closeAudioPreviewButton = document.createElement('button');
    closeAudioPreviewButton.type = 'button';
    closeAudioPreviewButton.className = 'threecx-audio-btn threecx-audio-btn--ghost';
    closeAudioPreviewButton.title = 'Cancelar';
    closeAudioPreviewButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z"/></svg>';
    closeAudioPreviewButton.onclick = () => {
      removerJanelaFlutuante();
      restaurarBotoesChat();
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
    floatingAudioContainer.appendChild(actionsBox);

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

// Refatorar startRecording e stopRecording para usar a janela flutuante
async function startRecording() {
  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(audioStream);
    audioChunks = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };
    mediaRecorder.onstop = (e) => {
      audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      audioFile = new File([audioBlob], `audio_message_${timestamp}.webm`, {
        type: 'audio/webm',
        lastModified: Date.now()
      });
      audioStream.getTracks().forEach(track => track.stop());
      pararTimerGravacao();
      beep();
      atualizarJanelaFlutuante('preview', audioBlob, audioFile);
    };
    mediaRecorder.onpause = () => {
      if (pauseResumeButton) {
        pauseResumeButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
        pauseResumeButton.title = 'Retomar';
      }
    };
    mediaRecorder.onresume = () => {
      if (pauseResumeButton) {
        pauseResumeButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>';
        pauseResumeButton.title = 'Pausar';
      }
    };
    mediaRecorder.start();
    removerJanelaFlutuante();
    gravacaoTempo = 0;
    iniciarTimerGravacao(true);
    atualizarJanelaFlutuante('recording');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function stopRecording(cancelar = false) {
  try {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      // Mesmo sem gravação ativa, garante que a UI e o botão voltem ao normal
      removerJanelaFlutuante();
      const recordBtn = document.querySelector('#audioRecordButton');
      if (recordBtn) {
        recordBtn.disabled = false;
        recordBtn.classList.remove('recording');
        recordBtn.title = 'Gravar áudio';
      }
      isRecording = false;
      isPaused = false;
      tempoPausado = 0;
      pausaTimestamp = null;
      return { success: false, error: 'Nenhuma gravação em andamento' };
    }
    if (cancelar) {
      mediaRecorder.onstop = null;
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
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
      const recordBtn = document.querySelector('#audioRecordButton');
      if (recordBtn) {
        recordBtn.disabled = false;
        recordBtn.classList.remove('recording');
        recordBtn.title = 'Gravar áudio';
      }
      return { success: true };
    }
    mediaRecorder.stop();
    return { success: true };
  } catch (error) {
    removerJanelaFlutuante();
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

    // Tenta obter o nome do usuário remetente a partir do próprio balão de mensagem
    let nomeUsuario = 'Contato';
    const wrapperMensagem = fm.closest('.message-wrapper, .chat-message, .message');
    const remetente = wrapperMensagem?.querySelector('.sender, .user, .author, .name');
    if (remetente && remetente.textContent.trim().length > 0) {
      nomeUsuario = remetente.textContent.trim();
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
    playPauseBtn.innerHTML = '<svg width="18" height="18" fill="#222" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    playPauseBtn.title = 'Tocar/Pausar';
    playPauseBtn.className = 'btn btn-plain';
    playPauseBtn.onclick = () => {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    };
    audio.addEventListener('play', () => {
      playPauseBtn.innerHTML = '<svg width="18" height="18" fill="#222" viewBox="0 0 24 24"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>';
    });
    audio.addEventListener('pause', () => {
      playPauseBtn.innerHTML = '<svg width="18" height="18" fill="#222" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    });
    playerBox.appendChild(playPauseBtn);
    playerBox.appendChild(audio);

    // Barra de progresso (um pouco mais curta para acomodar o controle de velocidade)
    const progressBar = document.createElement('input');
    progressBar.type = 'range';
    progressBar.min = 0;
    progressBar.max = 1;
    progressBar.step = 0.01;
    progressBar.value = 0;
    progressBar.style.width = '70px';
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

    // Controle de velocidade: 1x / 1.5x / 2x (integração visual com o player)
    const speedOptions = [1, 1.5, 2];
    let speedIndex = 0;
    const speedButton = document.createElement('button');
    speedButton.type = 'button';
    speedButton.className = 'audio-speed-toggle';
    speedButton.textContent = '1x';
    speedButton.title = 'Velocidade de reprodução';
    speedButton.style.marginLeft = '4px';
    speedButton.onclick = () => {
      speedIndex = (speedIndex + 1) % speedOptions.length;
      const rate = speedOptions[speedIndex];
      audio.playbackRate = rate;
      speedButton.textContent = `${rate}x`;
    };
    playerBox.appendChild(speedButton);
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

// Listener para mensagens do background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Mensagem recebida:', message);
  
  // Processa o comando recebido
  switch (message.command) {
    case 'start_recording':
      startRecording()
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ 
          success: false, 
          error: 'Erro ao iniciar gravação: ' + error.message 
        }));
      break;
      
    case 'stop_recording':
      stopRecording()
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ 
          success: false, 
          error: 'Erro ao parar gravação: ' + error.message 
        }));
      break;
      
    default:
      sendResponse({ 
        success: false, 
        error: 'Comando desconhecido: ' + message.command 
      });
  }
  
  // Retorna true para indicar que a resposta será assíncrona
  return true;
});

// Reposiciona o botão nativo de anexar arquivo sem duplicar ícones
function reposicionarBotaoAnexarNativo() {
  const recordButton = document.querySelector('#audioRecordButton');
  if (!recordButton) return;

  const chatControls = document.querySelector('#chat-form-controls');
  if (!chatControls) return;

  // Procura explicitamente por botões de anexar já existentes
  const candidates = Array.from(chatControls.querySelectorAll('button'));
  const attachButtons = candidates.filter((btn) => {
    const title = (btn.getAttribute('title') || btn.getAttribute('aria-label') || '').toLowerCase();
    const hasPaperclipAttr =
      btn.hasAttribute('app-paperclip-light-icon') ||
      btn.hasAttribute('app-paperclip-icon');
    const html = btn.innerHTML || '';

    return (
      hasPaperclipAttr ||
      title.includes('anexar') ||
      title.includes('attach') ||
      html.includes('paperclip')
    );
  });

  if (!attachButtons.length) return;

  // Se por algum motivo existirem vários botões de anexar, mantém apenas o primeiro
  const [attachButton, ...duplicates] = attachButtons;
  duplicates.forEach((btn) => btn.remove());

  // Se o botão já estiver logo após o de gravação, não faz nada
  if (recordButton.nextElementSibling === attachButton) return;

  // Move o botão (não o ícone interno) para logo após o botão de gravar
  recordButton.parentNode.insertBefore(attachButton, recordButton.nextSibling);
}

// Reposiciona periodicamente, mas com intervalo maior para evitar "piscadas" visuais
setInterval(reposicionarBotaoAnexarNativo, 3000);

// CSS global para garantir alinhamento horizontal dos botões do chat
(function garantirFlexBarraChat() {
  const style = document.createElement('style');
  style.textContent = `
    #chat-form-controls {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      flex-wrap: nowrap !important;
      gap: 4px;
    }
    #chat-form-controls > * {
      vertical-align: middle !important;
      margin: 0 2px !important;
    }
  `;
  document.head.appendChild(style);
})();

// Estilos específicos para o player de áudio dentro da conversa
(function estiloCustomAudioPlayer() {
  if (document.getElementById('threecx-custom-audio-player-style')) return;
  const style = document.createElement('style');
  style.id = 'threecx-custom-audio-player-style';
  style.textContent = `
    .custom-audio-player button.btn.btn-plain {
      background: #e5ebf5;
      border-radius: 999px !important;
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
      min-height: 32px !important;
      aspect-ratio: 1 / 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: none;
      cursor: pointer;
      transition: background-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
    }
    .custom-audio-player button.btn.btn-plain:hover {
      background: #d7e3f8;
      box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.25);
    }
    .custom-audio-player button.btn.btn-plain:active {
      transform: scale(0.95);
      box-shadow: none;
    }
    .custom-audio-player button.btn.btn-plain svg {
      width: 18px;
      height: 18px;
      fill: #222222;
    }
    .custom-audio-player .audio-speed-toggle {
      border-radius: 999px;
      width: 28px;
      height: 28px;
      min-width: 28px;
      min-height: 28px;
      border: none;
      padding: 0;
      font-size: 11px;
      font-weight: 500;
      background: #e5ebf5;
      color: #111827;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
    }
    .custom-audio-player .audio-speed-toggle:hover {
      background: #d7e3f8;
    }
    .custom-audio-player .audio-speed-toggle:active {
      transform: scale(0.96);
    }
  `;
  document.head.appendChild(style);
})(); 