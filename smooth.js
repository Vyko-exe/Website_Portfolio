// Transition douce entre les pages : la page s'efface avant de suivre un lien interne
(function () {
  const root = document.documentElement;
  // navigateurs récents : la transition native (style.css) s'en charge
  if (root.classList.contains('vt') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/^https?:|^file:/.test(url.protocol)) return;
    if (url.pathname === location.pathname && url.hash) return;   // ancre sur la même page
    e.preventDefault();
    root.classList.add('leaving');
    setTimeout(() => { location.href = url.href; }, 260);
  });
  // retour arrière (cache du navigateur) : réafficher la page
  window.addEventListener('pageshow', e => { if (e.persisted) root.classList.remove('leaving'); });
})();

