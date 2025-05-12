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
  recordButton.addEventListener('click', async () => {
    try {
      await browser.runtime.sendMessage({ command: 'start_recording' });
      updateUI(true);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      statusElement.textContent = 'Erro ao iniciar gravação';
    }
  });

  // Event listener para o botão de parar
  stopButton.addEventListener('click', async () => {
    try {
      await browser.runtime.sendMessage({ command: 'stop_recording' });
      updateUI(false);
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
      statusElement.textContent = 'Erro ao parar gravação';
    }
  });

  // Inicializa a interface
  updateUI(false);
}); 