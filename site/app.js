/* 현재 시각(한국 시간)으로 교수님별 수업 여부를 계산해 표를 채운다.
   이름을 누르면 그 교수님의 수업 시간이 아래로 펼쳐지고, '수정'으로 연구실·수업 시간을 고쳐
   GitHub 저장소의 site/data.js에 바로 저장한다(관리자 키 필요, 저장 뒤 1~2분이면 사이트에 반영). */
(function () {
  'use strict';
  var REPO = 'taeheekim2024-star/go.taeheekim.kr';
  var DATA_PATH = 'site/data.js';
  var KEY_STORE = 'go-site-github-key';
  var AUTHOR = { name: 'taeheekim2024-star', email: '295946926+taeheekim2024-star@users.noreply.github.com' };
  var DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  var DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
  var D = null; // data.js를 받은 뒤 채움(start 참고)

  /* ---------- 수업 여부 계산 ---------- */
  // kind: class(수업 중) · free(수업 없음) · unknown(시간표 미확인) · expired(학기 밖이라 갱신 필요)
  function activeEvents(person, date, time) {
    var weekday = new Date(date + 'T12:00:00Z').getUTCDay();
    var inTerm = date >= D.semester.from && date <= D.semester.to;
    if (!inTerm || D.holidays.indexOf(date) !== -1) return [];
    return person.events.filter(function (e) { return e.day === weekday && e.start <= time && time < e.end; });
  }
  function statusAt(person, date, time) {
    var active = activeEvents(person, date, time);
    if (active.length) {
      return { kind: 'class', end: active.reduce(function (last, e) { return e.end > last ? e.end : last; }, '') };
    }
    if (!person.events.length) return { kind: 'unknown', end: '' };
    if (date < D.semester.from || date > D.semester.to) return { kind: 'expired', end: '' };
    return { kind: 'free', end: '' };
  }
  var formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  function seoulNow() {
    var parts = formatter.formatToParts(new Date());
    function value(type) {
      var part = parts.find(function (p) { return p.type === type; });
      return part ? part.value : '';
    }
    return { date: value('year') + '-' + value('month') + '-' + value('day'), time: value('hour') + ':' + value('minute') };
  }
  function sortEvents(events) {
    return events.slice().sort(function (a, b) {
      return DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || a.start.localeCompare(b.start) || a.end.localeCompare(b.end);
    });
  }

  /* ---------- data.js 읽고 쓰기(형식은 go_site_kit/migrate-data.mjs와 같아야 함) ---------- */
  var HEADER = "/* 교수님 연구실·시간표 자료. 사이트에서 '수정'으로 저장하면 이 파일 전체가 다시 써진다.\n" +
    "   'window.FACULTY = ' 뒤는 JSON 형식을 지킨다(큰따옴표, 주석·끝 쉼표 없음).\n" +
    "   events: day 0=일 1=월 … 6=토, start·end는 한국 시간 'HH:MM', room은 강의실. */";
  function serialize(d) {
    var q = JSON.stringify;
    var lines = [HEADER, 'window.FACULTY = {'];
    Object.keys(d).forEach(function (key) {
      if (key !== 'professors') lines.push('  ' + q(key) + ': ' + q(d[key]) + ',');
    });
    lines.push('  "professors": [');
    d.professors.forEach(function (p, i) {
      var head = Object.keys(p).filter(function (k) { return k !== 'events'; })
        .map(function (k) { return q(k) + ': ' + q(p[k]); }).join(', ');
      lines.push('    {' + head + ', "events": [');
      p.events.forEach(function (e, j) { lines.push('      ' + q(e) + (j < p.events.length - 1 ? ',' : '')); });
      lines.push('    ]}' + (i < d.professors.length - 1 ? ',' : ''));
    });
    lines.push('  ]', '};', '');
    return lines.join('\n');
  }
  function parseData(text) {
    var start = text.indexOf('{', text.indexOf('window.FACULTY'));
    var end = text.lastIndexOf('}');
    return JSON.parse(text.slice(start, end + 1));
  }
  function toBase64(text) {
    var bytes = new TextEncoder().encode(text);
    var binary = '';
    for (var i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  }
  function fromBase64(b64) {
    var binary = atob(b64.replace(/\s/g, ''));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  window.FacultyLogic = {
    statusAt: statusAt, seoulNow: seoulNow, serialize: serialize, parseData: parseData,
    get people() { return D.professors; },
  };

  /* ---------- 화면 ---------- */
  var LABEL = { 'class': '수업 중', free: '수업 없음', away: '부재', expired: '갱신 필요', unknown: '미확인' };
  var TONE = { 'class': 'in-class', free: 'no-class', away: 'away', expired: 'unknown', unknown: 'unknown' };
  var CHEVRON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var PENCIL = '<svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m12.9 3.2 3.9 3.9M3.3 16.7l4.1-.9L16 7.2a1.7 1.7 0 0 0 0-2.4l-.8-.8a1.7 1.7 0 0 0-2.4 0l-8.6 8.6-.9 4.1Z" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  var tbody = document.getElementById('rows');
  var search = document.getElementById('search');
  var empty = document.getElementById('empty');
  var open = {};
  var rows = [];
  var now = seoulNow();

  function buildRows() {
    tbody.textContent = '';
    rows = D.professors.map(function (p) {
      var tr = el('tr', 'person');
      var nameCell = el('th', 'professor-cell');
      nameCell.scope = 'row';
      var toggle = el('button', 'name-toggle');
      toggle.type = 'button';
      toggle.setAttribute('aria-controls', 'detail-' + p.id);
      toggle.append(el('span', 'name', p.name));
      toggle.insertAdjacentHTML('beforeend', CHEVRON);
      nameCell.append(toggle, el('span', 'department', p.department));

      var placeCell = el('td', 'location-cell');
      if (p.building) {
        var place = el('div', 'location-content');
        place.append(el('span', 'building', p.building));
        if (p.room) {
          var room = el('strong', 'room', p.room);
          room.append(el('span', '', '호'));
          place.append(room);
        }
        placeCell.append(place);
      } else {
        placeCell.append(el('span', 'missing', '위치 확인 필요'));
      }

      var statusCell = el('td', 'schedule');
      var badge = el('span', 'status unknown');
      var dot = el('i');
      dot.setAttribute('aria-hidden', 'true');
      var badgeText = el('span', '', '확인 중');
      badge.append(dot, badgeText);
      var until = el('small');
      until.hidden = true;
      statusCell.append(badge, until);
      tr.append(nameCell, placeCell, statusCell);

      var detailRow = el('tr', 'detail-row');
      detailRow.id = 'detail-' + p.id;
      var detailCell = el('td');
      detailCell.colSpan = 3;
      detailRow.append(detailCell);

      var row = { person: p, tr: tr, detailRow: detailRow, detailCell: detailCell, toggle: toggle, badge: badge, badgeText: badgeText, until: until };
      toggle.addEventListener('click', function () {
        open[p.id] = !open[p.id];
        paintOpen(row);
      });
      tbody.append(tr, detailRow);
      paintOpen(row);
      return row;
    });
    applySearch();
    paintStatuses();
  }

  function paintOpen(row) {
    var isOpen = !!open[row.person.id];
    row.toggle.setAttribute('aria-expanded', String(isOpen));
    row.tr.classList.toggle('open', isOpen);
    row.detailRow.hidden = !isOpen || row.tr.hidden;
    if (isOpen) paintDetail(row);
  }

  // 펼친 목록의 '오늘'·'지금 수업' 표시만 바꾼다(목록을 다시 만들지 않아 초점이 유지됨).
  function refreshDetail(row) {
    if (!row.items) return;
    var weekday = new Date(now.date + 'T12:00:00Z').getUTCDay();
    var running = activeEvents(row.person, now.date, now.time);
    row.items.forEach(function (it) {
      it.li.classList.toggle('today', it.event.day === weekday);
      it.li.classList.toggle('now', running.indexOf(it.event) !== -1);
    });
  }

  function paintDetail(row) {
    var p = row.person;
    var box = el('div', 'detail');
    row.items = [];
    if (p.events.length) {
      var list = el('ul', 'week');
      sortEvents(p.events).forEach(function (e) {
        var item = el('li');
        item.append(el('span', 'd', DAYS[e.day]), el('span', 't', e.start + '–' + e.end), el('span', 'c', e.title));
        if (e.room) item.append(el('span', 'r', e.room));
        list.append(item);
        row.items.push({ li: item, event: e });
      });
      box.append(list);
    } else {
      box.append(el('p', 'none', '등록된 수업이 없습니다.'));
    }
    var actions = el('div', 'detail-actions');
    var official = el('a', 'text-link', '공식 교원정보 ↗');
    official.href = D.profileUrl + p.uld;
    official.target = '_blank';
    official.rel = 'noreferrer';
    var edit = el('button', 'edit-button');
    edit.type = 'button';
    edit.innerHTML = PENCIL + '<span>수정</span>';
    edit.setAttribute('aria-label', p.name + ' 정보 수정');
    edit.addEventListener('click', function () { openEditor(p, edit); });
    actions.append(official, edit);
    box.append(actions);
    row.detailCell.textContent = '';
    row.detailCell.append(box);
    refreshDetail(row);
  }

  function paintStatuses() {
    rows.forEach(function (row) {
      var s = statusAt(row.person, now.date, now.time);
      row.badge.className = 'status ' + TONE[s.kind];
      row.badgeText.textContent = LABEL[s.kind];
      row.until.hidden = !s.end;
      row.until.textContent = s.end ? s.end + '까지' : '';
      if (open[row.person.id]) refreshDetail(row);
    });
  }

  var hh = document.getElementById('hh');
  var mm = document.getElementById('mm');
  var nowDate = document.getElementById('now-date');
  function tick() {
    now = seoulNow();
    var t = now.time.split(':');
    hh.textContent = t[0];
    mm.textContent = t[1];
    nowDate.textContent = '';
    var sep = el('span', 'sep');
    sep.setAttribute('aria-hidden', 'true');
    nowDate.append(document.createTextNode(now.date.replace(/-/g, '.')), sep, document.createTextNode('한국 시간'));
    paintStatuses();
  }

  function applySearch() {
    var query = search.value.trim();
    var shown = 0;
    rows.forEach(function (row) {
      var p = row.person;
      var match = (p.name + ' ' + p.department + ' ' + p.building + ' ' + p.room).indexOf(query) !== -1;
      row.tr.hidden = !match;
      row.detailRow.hidden = !match || !open[p.id];
      if (match) shown++;
    });
    empty.hidden = shown !== 0;
  }
  search.addEventListener('input', applySearch);
  document.getElementById('reset').addEventListener('click', function () {
    search.value = '';
    applySearch();
    search.focus();
  });

  /* ---------- 수정 창 ---------- */
  function toast(message) {
    var old = document.querySelector('.save-message');
    if (old) old.remove();
    var box = el('p', 'save-message', message);
    box.setAttribute('role', 'status');
    document.body.append(box);
    setTimeout(function () { box.remove(); }, 6000);
  }

  function field(labelText, input, className) {
    var label = el('label', 'ed-field' + (className ? ' ' + className : ''));
    label.append(el('span', '', labelText), input);
    return label;
  }
  function textInput(value, max, placeholder) {
    var input = el('input');
    input.type = 'text';
    input.value = value || '';
    input.maxLength = max;
    if (placeholder) input.placeholder = placeholder;
    input.autocomplete = 'off';
    return input;
  }
  function timeInput(value) {
    var input = el('input');
    input.type = 'time';
    input.step = 60;
    input.value = value || '';
    return input;
  }

  function openEditor(person, opener) {
    var previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    var overlay = el('div', 'ed-overlay');
    var dialog = el('div', 'ed-dialog');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'ed-title');

    var head = el('div', 'ed-head');
    var titles = el('div');
    titles.append(el('p', 'ed-eyebrow', '정보 수정'));
    var h2 = el('h2', '', person.name + ' 교수님');
    h2.id = 'ed-title';
    titles.append(h2);
    var close = el('button', 'ed-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', '수정 창 닫기');
    head.append(titles, close);

    var form = el('form', 'ed-form');
    form.noValidate = true;
    var body = el('div', 'ed-body');
    var building = textInput(person.building, 100, '예: 자연과학1관');
    var room = textInput(person.room, 40, '예: 406-02');
    var place = el('div', 'ed-place');
    place.append(field('건물', building), field('호실', room));
    body.append(place);

    body.append(el('p', 'ed-section', '수업 시간'));
    var list = el('div', 'ed-events');
    body.append(list);
    function addEventRow(e) {
      var item = el('div', 'ed-event');
      var title = textInput(e.title, 80, '수업명');
      var day = el('select');
      DAY_ORDER.forEach(function (d) {
        var option = el('option', '', DAYS[d] + '요일');
        option.value = String(d);
        if (d === e.day) option.selected = true;
        day.append(option);
      });
      var start = timeInput(e.start);
      var end = timeInput(e.end);
      var where = textInput(e.room, 40, '강의실');
      var remove = el('button', 'ed-remove', '삭제');
      remove.type = 'button';
      remove.addEventListener('click', function () { item.remove(); });
      var top = el('div', 'ed-event-top');
      top.append(field('수업명', title, 'grow'), remove);
      var times = el('div', 'ed-times');
      times.append(field('요일', day), field('시작', start), field('종료', end), field('강의실', where));
      item.append(top, times);
      item._read = function () {
        return { title: title.value.trim(), day: Number(day.value), start: start.value, end: end.value, room: where.value.trim() };
      };
      list.append(item);
      return title;
    }
    sortEvents(person.events).forEach(addEventRow);
    var add = el('button', 'ed-add', '수업 추가');
    add.type = 'button';
    add.addEventListener('click', function () {
      var input = addEventRow({ title: '', day: 1, start: '09:00', end: '10:00', room: '' });
      input.focus();
    });
    body.append(add);

    var keyBox = el('div', 'ed-key');
    var keyInput = el('input');
    keyInput.type = 'password';
    keyInput.autocomplete = 'off';
    keyInput.placeholder = 'github_pat_…';
    function paintKey() {
      keyBox.textContent = '';
      if (localStorage.getItem(KEY_STORE)) {
        var forget = el('button', 'ed-forget', '이 기기에 저장된 관리자 키 지우기');
        forget.type = 'button';
        forget.addEventListener('click', function () { localStorage.removeItem(KEY_STORE); paintKey(); });
        keyBox.append(forget);
      } else {
        keyBox.append(field('관리자 키 (GitHub)', keyInput));
        keyBox.append(el('p', 'ed-hint', '처음 한 번만 넣으면 이 기기에 저장됩니다.'));
      }
    }
    paintKey();
    body.append(keyBox);

    var foot = el('div', 'ed-foot');
    var error = el('p', 'ed-error');
    error.setAttribute('role', 'alert');
    error.hidden = true;
    var actions = el('div', 'ed-actions');
    var cancel = el('button', 'ed-cancel', '취소');
    cancel.type = 'button';
    var save = el('button', 'ed-save', '저장');
    save.type = 'submit';
    actions.append(cancel, save);
    foot.append(error, actions);
    form.append(body, foot);
    dialog.append(head, form);
    overlay.append(dialog);
    document.body.append(overlay);
    building.focus();

    var saving = false;
    function shut() {
      if (saving) return;
      overlay.remove();
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      if (opener && document.contains(opener)) opener.focus();
    }
    function onKey(event) {
      if (event.key === 'Escape') { shut(); return; }
      if (event.key !== 'Tab') return;
      var controls = Array.prototype.filter.call(
        dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled])'),
        function (c) { return c.getClientRects().length > 0; });
      if (!controls.length) return;
      var first = controls[0];
      var last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);
    close.addEventListener('click', shut);
    cancel.addEventListener('click', shut);
    overlay.addEventListener('click', function (event) { if (event.target === overlay) shut(); });

    function fail(message) {
      error.textContent = message;
      error.hidden = false;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (saving) return;
      error.hidden = true;
      var events = [];
      var items = list.querySelectorAll('.ed-event');
      for (var i = 0; i < items.length; i++) {
        var e = items[i]._read();
        if (!e.title) return fail((i + 1) + '번째 수업명을 넣어 주세요.');
        if (!/^\d{2}:\d{2}$/.test(e.start) || !/^\d{2}:\d{2}$/.test(e.end)) return fail(e.title + ': 시작·종료 시각을 넣어 주세요.');
        if (e.start >= e.end) return fail(e.title + ': 종료 시각이 시작보다 늦어야 합니다.');
        events.push(e);
      }
      var storedKey = localStorage.getItem(KEY_STORE);
      var key = storedKey || keyInput.value.trim();
      if (!key) return fail('관리자 키를 넣어 주세요.');
      var change = { building: building.value.trim(), room: room.value.trim(), events: sortEvents(events) };
      var unchanged = change.building === person.building && change.room === person.room &&
        JSON.stringify(change.events) === JSON.stringify(sortEvents(person.events));
      if (unchanged && storedKey) {
        shut();
        return toast('바뀐 내용이 없습니다.');
      }
      saving = true;
      save.disabled = true;
      save.textContent = '저장 중…';
      // 바뀐 것 없이 새 키만 넣은 경우: 저장소를 한 번 읽어 키가 맞는지만 확인하고 키를 기억한다.
      var job = unchanged
        ? github('GET', '/repos/' + REPO + '/contents/' + DATA_PATH + '?ref=main', key).then(function () { return null; })
        : saveToGitHub(person.id, person.name, change, key);
      job.then(function (latest) {
        localStorage.setItem(KEY_STORE, key);
        saving = false;
        shut();
        if (!latest) return toast('관리자 키를 이 기기에 저장했습니다. 바뀐 내용은 없습니다.');
        D = latest;
        window.FACULTY = latest;
        buildRows();
        var row = rows.find(function (r) { return r.person.id === person.id; });
        if (row && row.toggle) row.toggle.focus();
        toast(person.name + ' 교수님 정보를 저장했습니다. 1~2분 뒤 모든 화면에 반영됩니다.');
      }).catch(function (err) {
        saving = false;
        save.disabled = false;
        save.textContent = '저장';
        if (err && err.status === 401) {
          localStorage.removeItem(KEY_STORE);
          paintKey();
          return fail('관리자 키가 맞지 않습니다. 키를 다시 넣어 주세요.');
        }
        if (err && (err.status === 403 || err.status === 404)) return fail('이 키로는 저장할 수 없습니다. 키의 저장소 권한(Contents 쓰기)을 확인해 주세요.');
        fail(err && err.userMessage ? err.userMessage : '저장하지 못했습니다. 연결을 확인하고 다시 저장해 주세요.');
      });
    });
  }

  function github(method, path, key, body) {
    return fetch('https://api.github.com' + path, {
      method: method,
      cache: 'no-store',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + key,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        if (!response.ok) {
          var err = new Error(data && data.message ? data.message : 'GitHub ' + response.status);
          err.status = response.status;
          throw err;
        }
        return data;
      });
    });
  }

  // 저장소의 최신 data.js를 받아 이 교수님 자료만 바꿔 다시 올린다(다른 기기에서 고친 내용 보존).
  function saveToGitHub(id, name, change, key, retried) {
    var path = '/repos/' + REPO + '/contents/' + DATA_PATH;
    return github('GET', path + '?ref=main', key).then(function (file) {
      var latest;
      try { latest = parseData(fromBase64(file.content)); } catch (e) {
        var err = new Error('parse');
        err.userMessage = '저장소의 자료 파일 형식을 읽지 못했습니다.';
        throw err;
      }
      var target = latest.professors.find(function (p) { return p.id === id; });
      if (!target) {
        var missing = new Error('missing');
        missing.userMessage = '저장소 자료에서 이 교수님을 찾지 못했습니다.';
        throw missing;
      }
      target.building = change.building;
      target.room = change.room;
      target.events = change.events;
      return github('PUT', path, key, {
        message: name + ' 교수님 정보 수정',
        content: toBase64(serialize(latest)),
        sha: file.sha,
        branch: 'main',
        author: AUTHOR,
        committer: AUTHOR,
      }).then(function () { return latest; });
    }).catch(function (err) {
      if (!retried && err && (err.status === 409 || err.status === 422)) return saveToGitHub(id, name, change, key, true);
      throw err;
    });
  }

  function start() {
    D = window.FACULTY;
    document.getElementById('source-line').textContent = D.semester.label + ' 공개 자료 기반 · 최초 확인 ' + D.sourceDate.replace(/-/g, '.');
    buildRows();
    tick();
    setInterval(tick, 15000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
  }

  // 자료는 매번 새로 받는다(수정 저장 직후 새로고침해도 예전 자료가 캐시에서 나오지 않게).
  var loader = document.createElement('script');
  loader.src = 'data.js?t=' + Date.now();
  loader.onload = start;
  loader.onerror = function () {
    empty.hidden = false;
    empty.textContent = '';
    empty.append(el('p', '', '자료를 불러오지 못했습니다.'), el('span', '', '잠시 후 새로고침해 주세요.'));
  };
  document.head.append(loader);
})();
