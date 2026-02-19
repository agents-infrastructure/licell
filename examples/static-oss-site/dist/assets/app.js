(function () {
  var STORAGE_KEY = 'licell_static_todos_v1';
  var THEME_KEY = 'licell_static_theme_v1';

  function $(id) {
    return document.getElementById(id);
  }

  function safeJsonParse(raw, fallback) {
    try {
      var parsed = JSON.parse(raw);
      return parsed;
    } catch (_err) {
      return fallback;
    }
  }

  function loadTodos() {
    var raw = localStorage.getItem(STORAGE_KEY);
    var todos = safeJsonParse(raw || '[]', []);
    if (!Array.isArray(todos)) return [];
    return todos
      .filter(function (t) { return t && typeof t.title === 'string'; })
      .map(function (t) {
        return { id: String(t.id || Date.now()), title: String(t.title), done: Boolean(t.done) };
      })
      .slice(0, 50);
  }

  function saveTodos(todos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function renderTodos(todos) {
    var list = $('todo-list');
    if (!list) return;
    list.innerHTML = '';

    if (todos.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'muted';
      empty.textContent = 'No todos yet. Add one above, or click Seed.';
      list.appendChild(empty);
      return;
    }

    todos.forEach(function (todo) {
      var li = document.createElement('li');
      li.className = 'item';

      var chk = document.createElement('input');
      chk.type = 'checkbox';
      chk.className = 'chk';
      chk.checked = todo.done;

      var title = document.createElement('div');
      title.className = 'title' + (todo.done ? ' done' : '');
      title.textContent = todo.title;

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'icon-btn danger';
      del.setAttribute('aria-label', 'delete todo');
      del.title = 'Delete';
      del.textContent = '×';

      chk.addEventListener('change', function () {
        todo.done = chk.checked;
        title.className = 'title' + (todo.done ? ' done' : '');
        saveTodos(todos);
      });

      del.addEventListener('click', function () {
        var next = todos.filter(function (t) { return t.id !== todo.id; });
        saveTodos(next);
        renderTodos(next);
      });

      li.appendChild(chk);
      li.appendChild(title);
      li.appendChild(del);
      list.appendChild(li);
    });
  }

  function setTheme(theme) {
    var root = document.documentElement;
    if (theme === 'paper') {
      root.setAttribute('data-theme', 'paper');
    } else {
      root.removeAttribute('data-theme');
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  function initTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === 'paper') setTheme('paper');
  }

  function initMeta() {
    var urlEl = $('site-url');
    if (urlEl) {
      urlEl.textContent = window.location.href;
      urlEl.href = window.location.href;
    }
    var loadedEl = $('loaded-at');
    if (loadedEl) {
      loadedEl.textContent = new Date().toLocaleString();
    }
    var uaEl = $('ua');
    if (uaEl) uaEl.textContent = navigator.userAgent || 'unknown';
    var langEl = $('lang');
    if (langEl) langEl.textContent = navigator.language || 'unknown';
    var tzEl = $('tz');
    if (tzEl) {
      try {
        tzEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
      } catch (_err) {
        tzEl.textContent = 'unknown';
      }
    }
  }

  function seedTodos() {
    return [
      { id: 't-1', title: 'Deploy this static site with licell', done: true },
      { id: 't-2', title: 'Change appName if OSS bucket conflicts', done: false },
      { id: 't-3', title: 'Try deploy API examples next', done: false }
    ];
  }

  function main() {
    initTheme();
    initMeta();

    var todos = loadTodos();
    renderTodos(todos);

    var form = $('todo-form');
    var input = $('todo-input');
    if (form && input) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var title = String(input.value || '').trim();
        if (!title) return;
        var next = [{ id: 't-' + Date.now(), title: title, done: false }].concat(todos);
        todos = next.slice(0, 50);
        saveTodos(todos);
        renderTodos(todos);
        input.value = '';
        input.focus();
      });
    }

    var btnSeed = $('btn-seed');
    if (btnSeed) {
      btnSeed.addEventListener('click', function () {
        todos = seedTodos();
        saveTodos(todos);
        renderTodos(todos);
      });
    }

    var btnClear = $('btn-clear');
    if (btnClear) {
      btnClear.addEventListener('click', function () {
        todos = [];
        saveTodos(todos);
        renderTodos(todos);
      });
    }

    var btnTheme = $('btn-theme');
    if (btnTheme) {
      btnTheme.addEventListener('click', function () {
        var current = localStorage.getItem(THEME_KEY) || 'night';
        setTheme(current === 'paper' ? 'night' : 'paper');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();

