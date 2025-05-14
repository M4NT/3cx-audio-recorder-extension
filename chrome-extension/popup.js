document.addEventListener('DOMContentLoaded', function() {
  const statusElement = document.getElementById('status');
  const checkButton = document.getElementById('checkButton');
  const requestPermButton = document.getElementById('requestPermission');
  const reloadButton = document.getElementById('reloadButton');
  
  // Verifica o status atual da extensão
  function checkStatus() {
    statusElement.textContent = 'Verificando...';
    
    // Tenta encontrar uma aba do 3CX ativa
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentTab = tabs[0];
      
      if (!currentTab) {
        statusElement.textContent = 'Erro: Não foi possível acessar a aba atual';
        return;
      }
      
      // Verifica se estamos em um site 3CX
      const url = currentTab.url || '';
      const is3CXSite = url.includes('3cx.') || url.includes('my3cx.com');
      
      if (!is3CXSite) {
        statusElement.textContent = 'Acesse um site 3CX para usar a extensão';
        requestPermButton.disabled = true;
        return;
      }
      
      // Verifica permissões do microfone
      navigator.permissions.query({ name: 'microphone' })
        .then(function(permissionStatus) {
          requestPermButton.disabled = false;
          
          if (permissionStatus.state === 'granted') {
            statusElement.textContent = 'Permissão concedida. Pronto para gravar!';
            requestPermButton.disabled = true;
          } else if (permissionStatus.state === 'denied') {
            statusElement.textContent = 'Permissão negada. Verifique as configurações do navegador.';
          } else {
            statusElement.textContent = 'Permissão não solicitada. Clique no botão abaixo.';
          }
        })
        .catch(function(error) {
          console.error('Erro ao verificar permissões:', error);
          statusElement.textContent = 'Erro ao verificar permissões do microfone';
        });
    });
  }
  
  // Função para solicitar permissão do microfone
  function requestPermission() {
    statusElement.textContent = 'Solicitando permissão...';
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function(stream) {
        // Sucesso - permissão concedida
        statusElement.textContent = 'Permissão concedida. Pronto para gravar!';
        requestPermButton.disabled = true;
        
        // É importante parar o stream para liberar o microfone
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(function(error) {
        console.error('Erro ao solicitar permissão:', error);
        
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          statusElement.textContent = 'Permissão negada. Verifique as configurações do navegador.';
        } else if (error.name === 'NotFoundError') {
          statusElement.textContent = 'Nenhum microfone encontrado. Conecte um microfone.';
        } else {
          statusElement.textContent = `Erro: ${error.message}`;
        }
      });
  }
  
  // Função para recarregar a página atual
  function reloadCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
        statusElement.textContent = 'Página recarregada. Verificando status...';
        
        // Verifica o status após um breve atraso
        setTimeout(checkStatus, 1000);
      }
    });
  }
  
  // Adiciona eventos aos botões
  checkButton.addEventListener('click', checkStatus);
  requestPermButton.addEventListener('click', requestPermission);
  reloadButton.addEventListener('click', reloadCurrentTab);
  
  // Verifica status ao abrir o popup
  checkStatus();
}); 