// Listener para mensagens do popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validação da mensagem
  if (!message || !message.command) {
    console.error('Mensagem inválida recebida:', message);
    sendResponse({ error: 'Mensagem inválida' });
    return true;
  }

  // Busca a aba ativa
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error('Erro ao buscar abas:', chrome.runtime.lastError);
      sendResponse({ error: 'Erro ao buscar abas ativas' });
      return;
    }

    if (tabs.length === 0) {
      console.error('Nenhuma aba ativa encontrada');
      sendResponse({ error: 'Nenhuma aba ativa encontrada' });
      return;
    }

    const activeTab = tabs[0];

    // Verifica se a aba atual é uma página do 3CX
    if (!activeTab.url || !activeTab.url.match(/https:\/\/.*\.3cx\..*/)) {
      console.error('Esta extensão só funciona em páginas do 3CX');
      sendResponse({ error: 'Esta extensão só funciona em páginas do 3CX' });
      return;
    }

    // Envia a mensagem para o content script
    chrome.tabs.sendMessage(activeTab.id, message, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Erro ao enviar mensagem:', chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }

      // Validação da resposta
      if (!response) {
        console.error('Resposta inválida do content script');
        sendResponse({ error: 'Resposta inválida do content script' });
        return;
      }

      sendResponse(response);
    });
  });

  // Retorna true para indicar que a resposta será enviada de forma assíncrona
  return true;
}); 