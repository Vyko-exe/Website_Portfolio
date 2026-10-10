// Mode nuit / clair : bouton .theme-toggle, choix mémorisé pour tout le site
(function () {
  const root = document.documentElement;
  const label = () => root.dataset.theme === 'dark' ? 'Light mode' : 'Night mode';
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = label();
    btn.addEventListener('click', () => {
      const dark = root.dataset.theme !== 'dark';
      if (dark) root.dataset.theme = 'dark'; else delete root.dataset.theme;
      try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
      document.querySelectorAll('.theme-toggle').forEach(b => { b.textContent = label(); });
    });
  });
})();
