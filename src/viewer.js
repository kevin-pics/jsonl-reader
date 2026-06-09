(() => {
  const loader = document.getElementById('loader');
  const viewer = document.getElementById('viewer');
  const fileInput = document.getElementById('fileInput');
  const dropzone = document.querySelector('.jsonlr-dropzone');
  const status = document.getElementById('status');
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const pasteInput = document.getElementById('pasteInput');
  const pasteButton = document.getElementById('pasteButton');

  function setStatus(message) {
    status.textContent = message || '';
  }

  function showViewer(text, title, source = '') {
    loader.hidden = true;
    viewer.hidden = false;
    window.JsonlReader.render({ container: viewer, text, title, source });
  }

  async function openFile(file) {
    if (!file) return;
    setStatus(`Reading ${file.name}…`);
    const text = await file.text();
    showViewer(text, file.name, `${file.name} (${file.size.toLocaleString()} bytes)`);
  }

  async function openUrl(url) {
    setStatus(`Fetching ${url}…`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    const text = await response.text();
    const title = new URL(url).pathname.split('/').pop() || 'Remote JSONL';
    showViewer(text, title, url);
  }

  fileInput.addEventListener('change', () => openFile(fileInput.files[0]).catch((error) => setStatus(error.message)));

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (event) => {
    openFile(event.dataTransfer.files[0]).catch((error) => setStatus(error.message));
  });

  urlForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;
    openUrl(url).catch((error) => setStatus(`Unable to open URL: ${error.message}`));
  });

  pasteButton.addEventListener('click', () => {
    const text = pasteInput.value;
    if (!text.trim()) {
      setStatus('Paste JSONL text first.');
      return;
    }
    showViewer(text, 'Pasted JSONL');
  });

  function initialUrlFromLocation() {
    const params = new URLSearchParams(location.search);
    const encodedUrl = params.get('encodedUrl');
    if (encodedUrl) return encodedUrl;

    const rawUrlMarker = '?url=';
    const rawUrlIndex = location.href.indexOf(rawUrlMarker);
    if (rawUrlIndex !== -1) return location.href.slice(rawUrlIndex + rawUrlMarker.length);

    return params.get('url');
  }

  const initialUrl = initialUrlFromLocation();
  if (initialUrl) {
    urlInput.value = initialUrl;
    openUrl(initialUrl).catch((error) => setStatus(`Unable to open URL: ${error.message}`));
  } else {
    loader.hidden = false;
  }
})();
