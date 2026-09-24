(() => {
  const endpointUrl = 'https://ailuxa.alwaysdata.net/api/agent/chat';
  const fab = document.getElementById('luxa-agent-fab');
  const modal = document.getElementById('luxa-agent-modal');
  const closeButton = document.getElementById('luxa-modal-close');
  const sendButton = document.getElementById('luxa-agent-send');
  const input = document.getElementById('luxa-agent-input');
  const messages = document.getElementById('luxa-chat-messages');
  const typingIndicator = document.getElementById('luxa-typing-indicator');
  const badge = document.getElementById('luxa-agent-badge');
  const prompt = document.getElementById('luxa-agent-prompt');
  const promptClose = document.getElementById('luxa-agent-prompt-close');
  const promptOpen = document.getElementById('luxa-agent-prompt-open');

  if (!fab || !modal || !closeButton || !sendButton || !input || !messages || !typingIndicator) return;

  let conversationHistory = [];
  let isSending = false;
  const unreadKey = 'luxa_agent_unread';
  const promptKey = 'luxa_agent_prompt_seen';
  const clickSound = new Audio('assets/audio/button-click-sound.mp3');
  clickSound.volume = 0.35;

  function playClickSound() {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }

  function setUnread(isUnread) {
    if (badge) badge.hidden = !isUnread;
    localStorage.setItem(unreadKey, String(isUnread));
  }

  function showPrompt() {
    if (prompt && !sessionStorage.getItem(promptKey) && !modal.classList.contains('active')) {
      prompt.hidden = false;
    }
  }

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
    if (!isOpen) {
      // Rimuove il focus dal modale prima di nasconderlo (Fix avviso ARIA)
      if (document.activeElement && modal.contains(document.activeElement)) {
        document.activeElement.blur();
        fab.focus();
      }
    }
    modal.classList.toggle('active', isOpen);
    modal.setAttribute('aria-hidden', String(!isOpen));
    if (isOpen) {
      setUnread(false);
      if (prompt) prompt.hidden = true;
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
        },
        body: JSON.stringify({ prompt: userText, history: conversationHistory })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success || typeof data.reply !== 'string') {
        throw new Error(data.error || `Server status ${response.status}`);
      }

      appendMessage(data.reply, 'agent');
      if (!modal.classList.contains('active')) {
        setUnread(true);
        playClickSound();
      }
      
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

  fab.addEventListener('click', () => {
    playClickSound();
    setOpen(!modal.classList.contains('active'));
  });
  closeButton.addEventListener('click', () => setOpen(false));
  if (promptOpen) promptOpen.addEventListener('click', () => {
    sessionStorage.setItem(promptKey, '1');
    playClickSound();
    setOpen(true);
  });
  if (promptClose) promptClose.addEventListener('click', () => {
    sessionStorage.setItem(promptKey, '1');
    prompt.hidden = true;
  });
  sendButton.addEventListener('click', handleSend);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
    if (event.key === 'Escape') setOpen(false);
  });

  if (localStorage.getItem(unreadKey) === 'true') setUnread(true);
  window.addEventListener('pagehide', () => {
    if (conversationHistory.length) setUnread(true);
  });
  window.setTimeout(showPrompt, 20000);
})();