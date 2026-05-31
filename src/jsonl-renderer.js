(() => {
  const MAX_PREVIEW_LENGTH = 180;

  function parseLine(raw) {
    if (raw.trim() === '') {
      return { ok: false, empty: true, value: null, error: 'Empty line' };
    }

    try {
      return { ok: true, empty: false, value: JSON.parse(raw), error: null };
    } catch (error) {
      return { ok: false, empty: false, value: null, error: error.message };
    }
  }

  function valueType(value) {
    if (Array.isArray(value)) return `array(${value.length})`;
    if (value === null) return 'null';
    if (typeof value === 'object') return `object(${Object.keys(value).length})`;
    return typeof value;
  }

  function compactText(value, raw = '') {
    let preview = JSON.stringify(value);
    if (preview === undefined) preview = raw;
    return String(preview).replace(/\s+/g, ' ').trim();
  }

  function compactValue(value, raw = '') {
    const preview = compactText(value, raw);
    return preview.length > MAX_PREVIEW_LENGTH ? `${preview.slice(0, MAX_PREVIEW_LENGTH)}…` : preview;
  }

  function compactFieldValue(value) {
    return compactText(value);
  }

  function renderPreview(parsed, raw) {
    const preview = el('span', 'jsonlr-preview');

    if (!parsed.ok) {
      preview.textContent = parsed.empty ? '(empty line)' : raw.slice(0, MAX_PREVIEW_LENGTH);
      return preview;
    }

    if (parsed.value && typeof parsed.value === 'object' && !Array.isArray(parsed.value)) {
      preview.classList.add('jsonlr-field-preview');
      const entries = Object.entries(parsed.value);

      if (!entries.length) {
        preview.textContent = '{}';
        return preview;
      }

      entries.slice(0, 10).forEach(([key, value]) => {
        const field = el('span', 'jsonlr-field');
        field.append(el('span', 'jsonlr-field-key', key));
        field.append(el('span', 'jsonlr-field-separator', ':'));
        field.append(el('span', 'jsonlr-field-value', compactFieldValue(value)));
        preview.append(field);
      });

      if (entries.length > 10) preview.append(el('span', 'jsonlr-field-more', `+${entries.length - 10}`));
      return preview;
    }

    preview.textContent = compactValue(parsed.value, raw);
    return preview;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderRow(line, index) {
    const parsed = parseLine(line);
    const details = el('details', `jsonlr-row ${parsed.ok ? 'is-valid' : 'is-invalid'}${parsed.empty ? ' is-empty' : ''}`);
    details.dataset.raw = line.toLowerCase();

    const summary = el('summary', 'jsonlr-summary');
    summary.append(el('span', 'jsonlr-line-number', String(index + 1)));
    summary.append(el('span', `jsonlr-badge ${parsed.ok ? 'ok' : 'error'}`, parsed.ok ? valueType(parsed.value) : (parsed.empty ? 'empty' : 'invalid')));
    summary.append(renderPreview(parsed, line));
    details.append(summary);

    details.addEventListener('toggle', () => {
      if (!details.open || details.dataset.rendered === 'true') return;
      details.dataset.rendered = 'true';

      const body = el('div', 'jsonlr-row-body');
      if (!parsed.ok) {
        body.append(el('div', 'jsonlr-error-message', parsed.error));
      }

      const pre = el('pre', 'jsonlr-code');
      pre.textContent = parsed.ok ? JSON.stringify(parsed.value, null, 2) : line;
      body.append(pre);
      details.append(body);
    });

    return details;
  }

  function splitLines(text) {
    const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n');
    if (lines.length && lines[lines.length - 1] === '') lines.pop();
    return lines;
  }

  function render(options) {
    const { container, text, title = 'JSONL Reader', source = '' } = options;
    const lines = splitLines(text);
    const parsed = lines.map(parseLine);
    const validCount = parsed.filter((line) => line.ok).length;
    const invalidCount = parsed.length - validCount;

    container.textContent = '';
    container.classList.add('jsonlr-root');

    const app = el('main', 'jsonlr-app');
    const topbar = el('div', 'jsonlr-topbar');
    const header = el('header', 'jsonlr-header');
    const titleBlock = el('div', 'jsonlr-title-block');
    titleBlock.append(el('h1', null, title));
    if (source) titleBlock.append(el('div', 'jsonlr-source', source));
    header.append(titleBlock);

    const stats = el('div', 'jsonlr-stats');
    stats.append(el('span', 'jsonlr-stat', `${lines.length} lines`));
    stats.append(el('span', 'jsonlr-stat ok', `${validCount} valid`));
    if (invalidCount) stats.append(el('span', 'jsonlr-stat error', `${invalidCount} invalid`));
    header.append(stats);
    topbar.append(header);

    const toolbar = el('section', 'jsonlr-toolbar');
    const search = el('input', 'jsonlr-search');
    search.type = 'search';
    search.placeholder = 'Search raw JSONL text…';
    toolbar.append(search);

    const expandAll = el('button', 'jsonlr-button', 'Expand all');
    const collapseAll = el('button', 'jsonlr-button', 'Collapse all');
    toolbar.append(expandAll, collapseAll);
    topbar.append(toolbar);
    app.append(topbar);

    const list = el('section', 'jsonlr-list');
    if (!lines.length) {
      list.append(el('p', 'jsonlr-empty-state', 'No lines to display.'));
    } else {
      lines.forEach((line, index) => list.append(renderRow(line, index)));
    }
    app.append(list);

    const footer = el('footer', 'jsonlr-footer', 'Each JSONL line is collapsed by default. Click a row to inspect formatted JSON.');
    app.append(footer);
    container.append(app);

    const updateTopbarHeight = () => {
      app.style.setProperty('--jsonlr-topbar-height', `${Math.ceil(topbar.getBoundingClientRect().height) + 16}px`);
    };
    requestAnimationFrame(updateTopbarHeight);
    window.addEventListener('resize', updateTopbarHeight);
    if ('ResizeObserver' in window) new ResizeObserver(updateTopbarHeight).observe(topbar);

    const rows = Array.from(list.querySelectorAll('.jsonlr-row'));
    search.addEventListener('input', () => {
      const query = search.value.trim().toLowerCase();
      rows.forEach((row) => {
        row.classList.toggle('is-search-match', query !== '' && row.dataset.raw.includes(query));
      });
    });
    expandAll.addEventListener('click', () => rows.forEach((row) => { row.open = true; row.dispatchEvent(new Event('toggle')); }));
    collapseAll.addEventListener('click', () => rows.forEach((row) => { row.open = false; }));
  }

  window.JsonlReader = { render, splitLines };
})();
