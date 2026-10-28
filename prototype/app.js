// Theme: system by default, or the choice saved on the settings screen. No network, no tracking.
(function () {
  var KEY = 'kognai-theme';
  var root = document.documentElement;
  function apply(v) { if (v === 'light' || v === 'dark') root.setAttribute('data-theme', v); else root.removeAttribute('data-theme'); }
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved) apply(saved);
  document.addEventListener('DOMContentLoaded', function () {
    var radios = document.querySelectorAll('input[name="theme"]');
    radios.forEach(function (r) {
      if ((saved || 'system') === r.value) r.checked = true;
      r.addEventListener('change', function () { try { localStorage.setItem(KEY, r.value); } catch (e) {} apply(r.value); });
    });
    var toggle = document.querySelector('[data-toggle-theme]');
    if (toggle) toggle.addEventListener('click', function () {
      var dark = root.getAttribute('data-theme') === 'dark' || (!root.hasAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
      var next = dark ? 'light' : 'dark';
      try { localStorage.setItem(KEY, next); } catch (e) {}
      apply(next);
    });
    document.querySelectorAll('[aria-pressed]').forEach(function (b) {
      b.addEventListener('click', function () { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); });
    });
  });
})();
