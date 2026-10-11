// Téléphone : le burger ouvre / ferme le menu en plein écran
(function () {
  const side = document.getElementById('side');
  const btn = document.querySelector('.menu-toggle');
  if (!side || !btn) return;
  function set(open) {
    side.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    document.documentElement.classList.toggle('menu-open', open);
  }
  btn.addEventListener('click', () => set(!side.classList.contains('open')));
  side.querySelectorAll('.s-menu a').forEach(a => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  // retour arrière depuis le cache du navigateur : menu refermé
  window.addEventListener('pageshow', () => set(false));
})();
