(() => {
  const endpointUrl = 'https://luxaecosystem.alwaysdata.net/api/agent/chat';
  const fab = document.getElementById('luxa-agent-fab');
  const modal = document.getElementById('luxa-agent-modal');
  const closeButton = document.getElementById('luxa-modal-close');
  const sendButton = document.getElementById('luxa-agent-send');
  const input = document.getElementById('luxa-agent-input');
  const messages = document.getElementById('luxa-chat-messages');
  const typingIndicator = document.getElementById('luxa-typing-indicator');

  if (!fab || !modal || !closeButton || !sendButton || !input || !messages || !typingIndicator) return;

  let conversationHistory = [];
  let isSending = false;

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  function formatMarkdown(value) {
    return escapeHtml(value)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  function appendMessage(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}-bubble`;
    bubble.innerHTML = formatMarkdown(text);
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function setOpen(isOpen) {
    modal.classList.toggle('active', isOpen);
    modal.setAttribute('aria-hidden', String(!isOpen));
    if (isOpen) {
      setTimeout(() => input.focus(), 150);
    }
  }

  async function handleSend() {
    const userText = input.value.trim();
    if (!userText || isSending) return;

    isSending = true;
    sendButton.disabled = true;
    appendMessage(userText, 'user');
    input.value = '';
    typingIndicator.hidden = false;

    try {
      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
          // Se hai mantenuto isAuthorized obbligatorio nel backend, decommenta la riga sotto:
          // 'x-agent-secret': 'choose-a-long-random-agent-secret-here'
        },
        body: JSON.stringify({ prompt: userText, history: conversationHistory })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success || typeof data.reply !== 'string') {
        throw new Error(data.error || `Server status ${response.status}`);
      }

      appendMessage(data.reply, 'agent');
      
      conversationHistory.push({ role: 'user', content: userText });
      conversationHistory.push({ role: 'assistant', content: data.reply });

      // Mantiene la cronologia locale snella (ultimi 10 scambi)
      if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
      }
    } catch (error) {
      console.error('[LUXA AI Chat Error]', error);
      appendMessage('Unable to reach the AI node right now. Please try again shortly.', 'agent');
    } finally {
      isSending = false;
      sendButton.disabled = false;
      typingIndicator.hidden = true;
      messages.scrollTop = messages.scrollHeight;
    }
  }

  fab.addEventListener('click', () => setOpen(!modal.classList.contains('active')));
  closeButton.addEventListener('click', () => setOpen(false));
  sendButton.addEventListener('click', handleSend);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
    if (event.key === 'Escape') setOpen(false);
  });
})();