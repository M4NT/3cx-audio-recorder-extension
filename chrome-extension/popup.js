document.addEventListener('DOMContentLoaded', function() {
  const recordButton = document.getElementById('recordButton');
  const stopButton = document.getElementById('stopButton');
  const statusElement = document.getElementById('status');

  // Função para atualizar a interface
  function updateUI(isRecording) {
    recordButton.style.display = isRecording ? 'none' : 'block';
    stopButton.style.display = isRecording ? 'block' : 'none';
    statusElement.textContent = isRecording ? 'Gravando...' : 'Pronto';
  }

  // Event listener para o botão de gravar
  recordButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'start_recording' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Erro ao iniciar gravação:', chrome.runtime.lastError);
        statusElement.textContent = 'Erro ao iniciar gravação';
        return;
      }
      updateUI(true);
    });
  });

  // Event listener para o botão de parar
  stopButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'stop_recording' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Erro ao parar gravação:', chrome.runtime.lastError);
        statusElement.textContent = 'Erro ao parar gravação';
        return;
      }
      updateUI(false);
    });
  });

  // Inicializa a interface
  updateUI(false);
}); 