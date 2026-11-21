(() => {
  const button = document.querySelector('#install');
  const dialog = document.querySelector('#install-dialog');
  const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let deferred = null;
  let added = installed();
  function sync() {
    button.querySelector('span').textContent = added ? 'Installed' : 'Install app';
    button.disabled = added;
    button.querySelector('use').setAttribute('href', `/icons.svg#${added ? 'check' : 'download'}`);
  }
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferred = event; });
  window.addEventListener('appinstalled', () => { added = true; deferred = null; sync(); if (dialog.open) dialog.close(); });
  matchMedia('(display-mode: standalone)').addEventListener('change', () => { added = installed(); sync(); });
  function showHelp() {
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const android = /Android/.test(navigator.userAgent);
    const macSafari = /Macintosh/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Edg/.test(navigator.userAgent);
    const tips = ios ? ['Open PawTrack in Safari and tap Share (it may be inside the More menu).', 'Choose Add to Home Screen, enable Open as Web App if shown, then tap Add.'] : android ? ['Open PawTrack in Chrome, then open the browser menu.', 'Choose Install app or Add to Home screen and confirm.'] : macSafari ? ['Open PawTrack in Safari.', 'Choose File → Add to Dock, then confirm with Add.'] : ['Open PawTrack in a browser that supports installing apps, such as Chrome or Edge.', 'Look for the install icon in the address bar, or choose Install PawTrack from the browser menu.'];
    document.querySelector('#install-help').innerHTML = `<p>Keep your care journal one tap away.</p><ol>${tips.map(tip => `<li>${tip}</li>`).join('')}</ol><p class="helper">If the install option is missing, open the site directly outside a preview or in-app browser.</p>`;
    if (!dialog.open) dialog.showModal();
  }
  button.addEventListener('click', async () => {
    if (!deferred) return showHelp();
    const prompt = deferred; deferred = null;
    try { await prompt.prompt(); const choice = await prompt.userChoice; if (choice.outcome === 'accepted') { added = true; sync(); } } catch { showHelp(); }
  });
  document.querySelector('#close-install').onclick = document.querySelector('#install-done').onclick = () => dialog.close();
  dialog.setAttribute('aria-label','Install PawTrack');
  dialog.addEventListener('click', event => { if (event.target === dialog) {const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();} });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  sync();
})();
