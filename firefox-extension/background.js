// Listener para mensagens do popup
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  try {
    // Busca a aba ativa
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    
    if (tabs.length === 0) {
      throw new Error('Nenhuma aba ativa encontrada');
    }

    const activeTab = tabs[0];

    // Verifica se a aba atual é uma página do 3CX
    if (!activeTab.url.match(/https:\/\/.*\.3cx\..*/)) {
      throw new Error('Esta extensão só funciona em páginas do 3CX');
    }

    // Envia a mensagem para o content script
    const response = await browser.tabs.sendMessage(activeTab.id, message);
    
    // Retorna a resposta para o popup
    return response;
  } catch (error) {
    console.error('Erro no background script:', error);
    throw error; // Propaga o erro para o popup
  }
}); 