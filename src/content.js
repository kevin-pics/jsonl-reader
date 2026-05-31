(() => {
  if (window.__jsonlReaderMounted || !window.JsonlReader) return;

  function isJsonlUrl(url) {
    try {
      const parsed = new URL(url);
      return /\.(jsonl|ndjson)$/i.test(parsed.pathname);
    } catch {
      return false;
    }
  }

  function pageText() {
    if (!document.body) return '';

    const pre = document.body.querySelector('pre');
    if (pre && document.body.children.length <= 1) return pre.textContent || '';

    return document.body.textContent || '';
  }

  if (!isJsonlUrl(location.href)) {
    document.documentElement.classList.add('jsonlr-extension-visible');
    return;
  }

  const pendingStyle = document.createElement('style');
  pendingStyle.textContent = 'html.jsonlr-extension-pending body{visibility:hidden!important}';
  document.documentElement.append(pendingStyle);
  document.documentElement.classList.add('jsonlr-extension-pending');

  function mount() {
    if (window.__jsonlReaderMounted || !document.body) return;

    window.__jsonlReaderMounted = true;
    document.documentElement.classList.add('jsonlr-extension-mounted');
    document.title = `JSONL Reader - ${document.title || location.pathname.split('/').pop()}`;

    try {
      window.JsonlReader.render({
        container: document.body,
        text: pageText(),
        title: decodeURIComponent(location.pathname.split('/').pop() || 'JSONL file'),
        source: location.href
      });
    } finally {
      document.documentElement.classList.remove('jsonlr-extension-pending');
      pendingStyle.remove();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
