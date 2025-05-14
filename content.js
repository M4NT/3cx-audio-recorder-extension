// Variáveis globais para controle da extensão
let mediaRecorder;
let audioStream;
let audioChunks = [];
let audioBlob = null;
let audioFile = null;
let isRecording = false;
let isPaused = false;
let tempoPausado = 0;
let pausaTimestamp = null;
let gravacaoTempo = 0;
let gravacaoTimer = null;
let gravacaoTimerSpan = null;
let floatingAudioContainer = null;
let floatingState = null; // 'recording' ou 'preview'
let nomeUsuarioReal = ''; // Para armazenar o nome do usuário logado
let chatBarOriginalWidth = null;
let pauseResumeButton = null;
let stopButton = null;
let sendAudioButton = null;
let closeAudioPreviewButton = null;
let cancelarButton = null;

// Novas variáveis globais para estado da gravação
let gravacaoDisponivel = false;
let mensagemStatusGravacao = 'Gravação de áudio não inicializada.';

// Constantes para SVGs dos ícones
const ICON_MIC = '<svg class="record-svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15C13.66 15 15 13.66 15 12V7C15 5.34 13.66 4 12 4C10.34 4 9 5.34 9 7V12C9 13.66 10.34 15 12 15Z"/><path d="M17.3 11C17.3 14.03 14.87 16.3 12 16.3C9.13 16.3 6.7 14.03 6.7 11H5C5 14.53 7.61 17.43 11 17.93V20H13V17.93C16.39 17.43 19 14.53 19 11H17.3Z"/></svg>';
const ICON_STOP_RECORDING = '<svg class="stop-svg" width="20" height="20" viewBox="0 0 24 24" fill="#d32f2f"><rect x="6" y="6" width="12" height="12"/></svg>';
const ICON_ERROR = '<svg class="error-svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';

// Função para emitir um som de "beep" (opcional)
// ... existing code ...
// ... existing code ...
// Inicialização do botão de gravação de áudio
function createAudioRecordButton() {
  const chatControls = document.querySelector('#chat-form-controls');
  if (!chatControls) return;
  if (document.querySelector('#audioRecordButton')) return; // Evita duplicidade

  const recordButton = document.createElement('button');
  recordButton.id = 'audioRecordButton';
  recordButton.className = 'btn btn-sm btn-secondary';
  recordButton.title = 'Gravar áudio';
  recordButton.innerHTML = ICON_MIC;
  recordButton.style.padding = '5px'; // Reduz padding

  // Atualiza o botão com base na disponibilidade
  if (!gravacaoDisponivel) {
    recordButton.innerHTML = ICON_ERROR;
    recordButton.title = mensagemStatusGravacao;
    recordButton.disabled = true;
    recordButton.style.cursor = 'not-allowed';
  }

  recordButton.onclick = async () => {
    if (!gravacaoDisponivel) {
      alert(`Não é possível gravar: ${mensagemStatusGravacao}`);
      return;
    }

    recordButton.disabled = true; // Desabilita durante a ação

    if (isRecording) {
      recordButton.innerHTML = 'Parando...';
      recordButton.title = 'Parando gravação...';
      const result = await stopRecording();
      if (!result.success) {
        alert(`Erro ao parar gravação: ${result.error}`);
        recordButton.innerHTML = ICON_STOP_RECORDING; // Volta para ícone de parar, pois ainda pode estar ativo
        recordButton.title = 'Parar gravação (erro anterior)';
      } else {
        recordButton.innerHTML = ICON_MIC;
        recordButton.title = 'Gravar áudio';
        isRecording = false;
      }
    } else {
      recordButton.innerHTML = 'Iniciando...';
      recordButton.title = 'Iniciando gravação...';
      const result = await startRecording();
      if (result.success) {
        recordButton.innerHTML = ICON_STOP_RECORDING;
        recordButton.title = 'Parar gravação';
        isRecording = true;
      } else {
        alert(`Erro ao iniciar gravação: ${result.error}`);
        recordButton.innerHTML = ICON_MIC;
        recordButton.title = 'Gravar áudio (erro ao iniciar)';
        isRecording = false; // Garante que o estado seja resetado
      }
    }
    recordButton.disabled = false; // Reabilita após a ação
  };

  // Adiciona o botão ao início dos controles
  if (chatControls.firstChild) {
// ... existing code ...
// ... existing code ...
  if (recordButton) {
    recordButton.classList.remove('recording');
    recordButton.title = 'Gravar áudio';
    recordButton.disabled = false;
    // Garante que o ícone correto seja exibido com base na disponibilidade
    if (gravacaoDisponivel) {
        recordButton.innerHTML = ICON_MIC;
    } else {
        recordButton.innerHTML = ICON_ERROR;
        recordButton.title = mensagemStatusGravacao;
        recordButton.disabled = true;
    }
  }
}

// Função para iniciar a gravação
// ... existing code ...
// ... existing code ...
    mediaRecorder.start(100); // Coleta dados a cada 100ms
    removerJanelaFlutuante();
    gravacaoTempo = 0;
    iniciarTimerGravacao(true);
    atualizarJanelaFlutuante('recording');
    isRecording = true; // Atualiza o estado global
    
    return { success: true };
  } catch (error) {
// ... existing code ...
// ... existing code ...
    isPaused = false;
    tempoPausado = 0;
    pausaTimestamp = null;
    removerJanelaFlutuante();
    // Atualiza o botão principal em caso de erro ao iniciar
    const recordBtn = document.querySelector('#audioRecordButton');
    if (recordBtn) {
        recordBtn.innerHTML = gravacaoDisponivel ? ICON_MIC : ICON_ERROR;
        recordBtn.title = gravacaoDisponivel ? 'Gravar áudio' : mensagemStatusGravacao;
        recordBtn.disabled = !gravacaoDisponivel;
    }
    return { success: false, error: error.message };
  }
}

async function stopRecording(cancelar = false) {
  const recordButton = document.querySelector('#audioRecordButton');
  try {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      removerJanelaFlutuante();
      isRecording = false;
      if (recordButton) {
        recordButton.innerHTML = gravacaoDisponivel ? ICON_MIC : ICON_ERROR;
        recordButton.title = gravacaoDisponivel ? 'Gravar áudio' : mensagemStatusGravacao;
        recordButton.disabled = !gravacaoDisponivel;
      }
      return { success: false, error: 'Nenhuma gravação em andamento' };
    }

    if (cancelar) {
      mediaRecorder.onstop = null; // Importante para não chamar o onstop padrão que mostra preview
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
      if (recordButton) {
        recordButton.innerHTML = gravacaoDisponivel ? ICON_MIC : ICON_ERROR;
        recordButton.title = gravacaoDisponivel ? 'Gravar áudio' : mensagemStatusGravacao;
        recordButton.disabled = !gravacaoDisponivel;
      }
      return { success: true };
    }

    // Parada normal (não cancelamento), o onstop padrão será chamado para mostrar o preview
    if (mediaRecorder.state !== 'inactive') {
       mediaRecorder.stop();
    }
    isRecording = false; // Estado é atualizado aqui, onstop cuida do resto.
    // O botão será atualizado pela lógica de preview ou pela remoção da janela flutuante.
    return { success: true };
  } catch (error) {
    console.error('Erro ao parar gravação:', error);
    removerJanelaFlutuante();
    // Limpa recursos em caso de erro
// ... existing code ...
// ... existing code ...
    isPaused = false;
    tempoPausado = 0;
    pausaTimestamp = null;
    // Atualiza o botão principal em caso de erro ao parar
    if (recordButton) {
        recordButton.innerHTML = gravacaoDisponivel ? ICON_MIC : ICON_ERROR;
        recordButton.title = gravacaoDisponivel ? 'Gravar áudio' : mensagemStatusGravacao;
        recordButton.disabled = !gravacaoDisponivel;
    }
    return { success: false, error: error.message };
  }
}

// Função para anexar o áudio na conversa do 3CX
// ... existing code ...
// ... existing code ...
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
    // É importante parar os tracks obtidos aqui para liberar o microfone
    // caso o usuário não inicie uma gravação imediatamente.
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Erro ao solicitar permissão de áudio:', error);
    // Fornece mensagens mais específicas baseadas no tipo de erro
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        mensagemStatusGravacao = 'Nenhum microfone encontrado.';
    } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        mensagemStatusGravacao = 'Permissão de microfone negada. Verifique as configurações do navegador.';
        alert('A permissão para usar o microfone foi negada. A gravação de áudio não funcionará. Por favor, habilite a permissão nas configurações do seu navegador para este site.');
    } else {
        mensagemStatusGravacao = `Erro de acesso ao microfone: ${error.message}`;
    }
    return false;
  }
}

// Inicialização da extensão
async function inicializarExtensao() {
  if (!verificarSuporteGravação()) {
    mensagemStatusGravacao = 'Seu navegador não suporta os recursos necessários para gravação de áudio.';
    console.error(mensagemStatusGravacao);
    gravacaoDisponivel = false;
    // Atualiza o botão se já existir
    const recordButton = document.querySelector('#audioRecordButton');
    if (recordButton) {
        recordButton.innerHTML = ICON_ERROR;
        recordButton.title = mensagemStatusGravacao;
        recordButton.disabled = true;
        recordButton.style.cursor = 'not-allowed';
    }
    return;
  }
  
  const temPermissao = await solicitarPermissaoAudio();
  if (!temPermissao) {
    // mensagemStatusGravacao já foi definida em solicitarPermissaoAudio
    console.error('Permissão de áudio não concedida ou erro ao solicitar.');
    gravacaoDisponivel = false;
    // Atualiza o botão se já existir
    const recordButton = document.querySelector('#audioRecordButton');
    if (recordButton) {
        recordButton.innerHTML = ICON_ERROR;
        recordButton.title = mensagemStatusGravacao;
        recordButton.disabled = true;
        recordButton.style.cursor = 'not-allowed';
    }
    return;
  }
  
  gravacaoDisponivel = true;
  mensagemStatusGravacao = 'Gravação de áudio pronta.';
  console.log('[3CX Audio Extension] Inicializada com sucesso. Gravação disponível.');
  // Se o botão já existe, garante que ele esteja no estado correto
  const recordButton = document.querySelector('#audioRecordButton');
  if (recordButton) {
    recordButton.innerHTML = ICON_MIC;
    recordButton.title = 'Gravar áudio';
    recordButton.disabled = false;
    recordButton.style.cursor = 'pointer';
  }
}

// Inicia a extensão quando o DOM estiver pronto
if (document.readyState === 'loading') {

</code_block_to_apply_changes_from>
</rewritten_file>