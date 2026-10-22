(() => {
  'use strict';
  const screen = document.getElementById('scan-screen');
  if (!screen) return;
  const result = screen.querySelector('.result');
  const history = screen.querySelectorAll('.history-card');
  if (result) { result.hidden = true; result.style.display = 'none'; }
  history.forEach(el => { el.hidden = true; el.style.display = 'none'; });
  const oldLabel = document.getElementById('live-detection-label');
  if (oldLabel) oldLabel.textContent = 'Camera preview only — capture to analyze';
  // Existing inline script animates a fake live diagnosis. Override with honest label.
  if (oldLabel) new MutationObserver(() => { if (oldLabel.textContent !== 'Camera preview only — capture to analyze') oldLabel.textContent = 'Camera preview only — capture to analyze'; }).observe(oldLabel,{childList:true,characterData:true,subtree:true});
  const input = document.getElementById('photo-input');
  let selectedFile = null;
  input?.addEventListener('change', () => { selectedFile = input.files?.[0] || null; }, true);
  document.getElementById('capture-photo')?.addEventListener('click', () => { selectedFile = null; }, true);
  screen.addEventListener('click', async event => {
    const button = event.target.closest('#analyze-photo');
    if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const image = document.querySelector('#scan-upload img.upload-preview');
    if (!image) return;
    if (screen.querySelector('.segment button.active')?.textContent.includes('Livestock')) {
      alert('Livestock classification is not supported by this plant model. Select Crops.'); return;
    }
    button.disabled = true;
    button.textContent = 'Analyzing photo…';
    try {
      const blob = selectedFile || await (await fetch(image.src)).blob();
      const photo = new File([blob], 'leaf.jpg', {type:blob.type || 'image/jpeg'});
      const form = new FormData(); form.append('photo', photo);
      const response = await fetch('../api/scan.php',{method:'POST',body:form,credentials:'same-origin'});
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Scan failed');
      const s = data.scan;
      const head = result?.querySelector('h2');
      const description = result?.querySelector('p');
      if (head) {
        head.textContent = s.supported ? `${s.crop}: ${s.condition}` : 'Uncertain / unsupported photo';
        const small = document.createElement('small');
        small.textContent = ` ${Math.round(s.confidence * 100)}% model score · Experimental scan`;
        head.appendChild(small);
      }
      if (description) description.textContent = s.supported ? s.notice : `The image could not be classified with sufficient confidence. Retake a well-lit photo of a single leaf. ${s.notice}`;
      result?.querySelector('.actions')?.remove(); // remove hardcoded pesticide recommendations
      if (result) { result.hidden=false; result.style.display=''; }
      button.textContent = 'Analyze again';
    } catch (error) {
      alert(error.message);
      button.textContent = 'Retry analysis';
    } finally { button.disabled = false; }
  }, true);
})();
