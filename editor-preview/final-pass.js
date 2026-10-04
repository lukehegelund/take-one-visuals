/* Review notes are device-local and independent of the editing timeline. */
(() => {
  'use strict';
  const key = 'tov-final-pass-v1';
  let workflow, active = 0, saved = {};
  try {
    const input = JSON.parse(localStorage.getItem(key));
    if (input && typeof input === 'object' && !Array.isArray(input)) saved = input;
  } catch {}
  const node = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const checked = (stage, i) => saved[stage.id]?.checks?.[i] === true;
  const count = stage => stage.checks.filter((_, i) => checked(stage, i)).length;
  function persist() {
    try { localStorage.setItem(key, JSON.stringify(saved)); }
    catch { document.getElementById('final-storage').textContent = 'Device storage is unavailable; these review notes will last only for this visit.'; }
  }
  function progress() {
    const complete = workflow.stages.filter(s => count(s) === s.checks.length).length;
    document.getElementById('final-progress').textContent = `${complete} of ${workflow.stages.length} stages reviewed`;
    for (const [i, s] of workflow.stages.entries()) {
      const button = document.querySelector(`[data-stage="${s.id}"]`);
      button.classList.toggle('active', i === active);
      button.setAttribute('aria-pressed', String(i === active));
      button.querySelector('.final-stage-count').textContent = `${count(s)}/${s.checks.length}`;
    }
  }
  function sourceLinks(ids, parent) {
    const links = node('div', undefined, 'final-source-links');
    for (const id of ids || []) {
      const source = workflow.sources.find(s => s.id === id);
      if (!source) continue;
      const link = node('a', source.title);
      link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      links.append(link);
    }
    parent.append(links);
  }
  function renderStage() {
    const stage = workflow.stages[active], content = document.getElementById('final-stage');
    content.replaceChildren();
    content.append(node('p', `STAGE ${active + 1} / ${workflow.stages.length} · ${stage.owner}`, 'final-owner'), node('h2', stage.title), node('p', stage.summary, 'final-summary'));
    const checks = node('fieldset', undefined, 'final-checks');
    checks.append(node('legend', 'Review checklist'));
    stage.checks.forEach((text, i) => {
      const label = node('label'), input = node('input'), copy = node('span', text);
      input.type = 'checkbox'; input.checked = checked(stage, i);
      input.dataset.check = i;
      input.onchange = () => {
        const previous = saved[stage.id];
        const entries = stage.checks.map((_, j) => j === i ? input.checked : checked(stage, j));
        saved[stage.id] = { checks: entries, note: typeof previous?.note === 'string' ? previous.note : '' };
        persist(); progress();
      };
      label.append(input, copy); checks.append(label);
    });
    content.append(checks, node('p', 'Ready when: ' + stage.done, 'final-ready'));
    const noteLabel = node('label', 'Notes for this stage', 'final-note-label'), note = node('textarea');
    note.rows = 2; note.maxLength = 1500; note.placeholder = 'References, adjustments or anything still to review';
    note.value = typeof saved[stage.id]?.note === 'string' ? saved[stage.id].note.slice(0, 1500) : '';
    note.oninput = () => {
      saved[stage.id] = { checks: stage.checks.map((_, i) => checked(stage, i)), note: note.value };
      persist();
    };
    noteLabel.append(note); content.append(noteLabel);
    if (stage.research?.length) {
      const details = node('details', undefined, 'final-research');
      details.append(node('summary', 'Research and verification method'));
      for (const method of stage.research) {
        const article = node('article');
        article.append(node('h3', method.title), node('p', method.text));
        sourceLinks(method.sourceIds, article); details.append(article);
      }
      content.append(details);
    }
    const footer = node('div', undefined, 'final-stage-footer');
    if (active > 0) {
      const previous = node('button', 'Previous stage');
      previous.onclick = () => select(active - 1); footer.append(previous);
    }
    if (active < workflow.stages.length - 1) {
      const next = node('button', 'Next: ' + workflow.stages[active + 1].title);
      next.onclick = () => select(active + 1); footer.append(next);
    }
    content.append(footer); progress();
  }
  function select(index) {
    active = index; renderStage();
    document.getElementById('final-stage').scrollTop = 0;
  }
  window.mountFinalPass = value => {
    workflow = value;
    const panel = document.getElementById('final-pass');
    if (!workflow?.stages?.length) { panel.textContent = 'The finishing plan could not load. Please refresh.'; return; }
    panel.replaceChildren();
    const layout = node('div', undefined, 'final-layout'), side = node('aside', undefined, 'final-sidebar');
    side.append(node('h1', workflow.title), node('p', workflow.intro), node('output', undefined, 'final-progress'));
    side.lastChild.id = 'final-progress';
    const nav = node('nav'); nav.setAttribute('aria-label', 'Final pass stages');
    workflow.stages.forEach((s, i) => {
      const button = node('button'); button.dataset.stage = s.id;
      button.append(node('span', String(i + 1).padStart(2, '0'), 'final-stage-number'), node('span', s.title), node('span', undefined, 'final-stage-count'));
      button.onclick = () => select(i); nav.append(button);
    });
    side.append(nav, node('p', workflow.reviewNote, 'final-local-note'));
    const storage = node('p', undefined, 'final-local-note'); storage.id = 'final-storage'; side.append(storage);
    const stage = node('section'); stage.id = 'final-stage'; stage.setAttribute('aria-label', 'Selected finishing stage');
    layout.append(side, stage); panel.append(layout);
    const sources = node('details', undefined, 'final-sources');
    sources.append(node('summary', 'Sources and research status'), node('p', workflow.researchStatus));
    for (const source of workflow.sources) {
      const item = node('p'), link = node('a', source.title);
      link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      item.append(link, node('span', ' · ' + source.detail)); sources.append(item);
    }
    panel.append(sources); renderStage();
  };
})();
