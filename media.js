// Images optimisées + petits outils partagés par les galeries.
// Les versions WebP sont générées par _editeur/optimize_images.py dans images/_web/{thumb,full}/.
// Si une version optimisée manque (image pas encore traitée), on retombe sur l'original.
const Media = (() => {
  const OPT = /^images\/(?!_web\/).+\.(jpe?g|png)$/i;
  const web = (src, size) => OPT.test(src) ? 'images/_web/' + size + '/' + src.slice(7) + '.webp' : src;
  const css = u => "url('" + u.replace(/'/g, "\\'") + "')";

  // Charge une image : version optimisée d'abord, original ensuite, sinon onFail
  function load(src, size, onOk, onFail) {
    const tryUrl = (u, next) => { const t = new Image(); t.onload = () => onOk(u); t.onerror = next; t.src = u; };
    const w = web(src, size);
    const original = () => tryUrl(src, () => onFail && onFail());
    w === src ? original() : tryUrl(w, original);
  }

  return {
    web,
    // Miniature en fond : data-bg → data-src (l'original reste connu pour la lightbox)
    bg(el, onFail) {
      const src = el.dataset.bg;
      if (!src) return;
      el.dataset.src = src;
      delete el.dataset.bg;
      load(src, 'thumb', u => { el.style.backgroundImage = css(u); }, onFail);
    },
    // Chemin original d'une miniature
    src(el) {
      if (!el) return '';
      return el.dataset.bg || el.dataset.src || el.style.backgroundImage.replace(/url\(['"]?|['"]?\)/g, '').replace(/\\'/g, "'");
    },
    // <img> grand format, avec repli sur l'original
    img(img, src) {
      const w = web(src, 'full');
      if (w !== src) img.onerror = () => { img.onerror = null; img.src = src; };
      img.src = w;
    },
    // Glisser au doigt gauche/droite (mobile)
    swipe(el, onPrev, onNext) {
      let x0 = null, y0 = 0;
      el.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) { x0 = null; return; }
        x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
      }, {passive: true});
      el.addEventListener('touchend', e => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        x0 = null;
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        dx > 0 ? onPrev() : onNext();
      }, {passive: true});
    },
    // Badge "n images" sur les projets qui en contiennent plusieurs
    badges() {
      document.querySelectorAll('.thumb[data-images]').forEach(t => {
        t.querySelector('.thumb-count')?.remove();
        const n = t.dataset.images.split(',').filter(s => s.trim()).length;
        if (n < 2) return;
        const b = document.createElement('span');
        b.className = 'thumb-count';
        b.innerHTML = '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="13" height="14" rx="1.5"/><path d="M8 3h11.5A1.5 1.5 0 0 1 21 4.5V16"/></svg>' + n;
        t.appendChild(b);
      });
    },
  };
})();
