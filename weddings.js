/* One player per page avoids loading seven streams at once. Drive owns playback;
   changing the source stops the previous film and preserves a shareable film link. */
(() => {
  'use strict';
  const data = document.getElementById('wedding-data');
  if (data) {
    const collection = JSON.parse(data.textContent);
    const player = document.getElementById('wedding-player');
    const buttons = [...document.querySelectorAll('[data-film]')];
    let selected = collection.videos[0].id;
    function selectFilm(id, updateHistory = true, scroll = false) {
      const index = collection.videos.findIndex(video => video.id === id);
      if (index < 0) return false;
      const video = collection.videos[index];
      if (selected !== id) player.src = `https://drive.google.com/file/d/${video.drive_id}/preview`;
      selected = id;
      player.title = `${collection.names}: ${video.title}`;
      document.getElementById('screen').classList.toggle('is-portrait', video.format === 'portrait');
      document.getElementById('film-title').textContent = video.title;
      document.getElementById('film-position').textContent = `${String(index + 1).padStart(2, '0')} / ${String(collection.videos.length).padStart(2, '0')}`;
      document.getElementById('player-status').textContent = `${video.title} selected. Press play in the video player.`;
      buttons.forEach(button => button.setAttribute('aria-current', String(button.dataset.film === id)));
      if (updateHistory) history.pushState(null, '', `#${id}`);
      if (scroll) {
        player.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        player.focus({ preventScroll: true });
      }
      return true;
    }
    buttons.forEach(button => button.addEventListener('click', () => selectFilm(button.dataset.film, true, true)));
    function restoreFilm() { selectFilm(location.hash.slice(1) || collection.videos[0].id, false); }
    window.addEventListener('hashchange', restoreFilm);
    window.addEventListener('popstate', restoreFilm);
    restoreFilm();
  }

  // Only lightweight metadata is searched. At most 24 cards are shown at once;
  // all links remain in the HTML for indexing and no-JavaScript visitors.
  const search = document.getElementById('wedding-search');
  if (search) {
    const cards = [...document.querySelectorAll('.archive-item')];
    const more = document.getElementById('load-more');
    const empty = document.getElementById('archive-empty');
    let limit = 24;
    function filter() {
      const terms = search.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
      const matches = cards.filter(card => terms.every(term => card.dataset.search.includes(term)));
      const visible = new Set(matches.slice(0, limit));
      cards.forEach(card => { card.hidden = !visible.has(card); });
      document.getElementById('archive-count').textContent = `${matches.length} ${matches.length === 1 ? 'wedding' : 'weddings'}`;
      empty.hidden = matches.length !== 0;
      empty.textContent = cards.length ? 'No weddings match your search.' : 'Wedding collections are coming soon.';
      more.hidden = matches.length <= limit;
    }
    search.addEventListener('input', () => { limit = 24; filter(); });
    more.addEventListener('click', () => { limit += 24; filter(); });
    filter();
  }
})();
