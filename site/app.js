/* 현재 시각(한국 시간)으로 교수님별 수업 여부를 계산해 표를 채운다. 자료는 data.js. */
(function () {
  'use strict';
  var D = window.FACULTY;
  var DAY = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };

  function pad(n) { return String(n).padStart(2, '0'); }
  function clock(minutes) { return pad(Math.floor(minutes / 60)) + ':' + pad(minutes % 60); }

  // 천안 학사종합안내: 1~18교시는 09:00부터 30분 단위, 19교시부터는 18:00부터 55분 간격(50분 수업).
  function periodTime(period, end) {
    if (period <= 18) return clock(540 + (period - 1) * 30 + (end ? 30 : 0));
    return clock(1080 + (period - 19) * 55 + (end ? 50 : 0));
  }

  function toEvents(courses) {
    var events = [];
    courses.forEach(function (course) {
      var title = course[0];
      var pattern = /([월화수목금토일])([\d,]+)(?:\(([^)]+)\))?/g;
      var match;
      while ((match = pattern.exec(course[1])) !== null) {
        var periods = match[2].split(',').map(Number);
        events.push({
          title: title,
          day: DAY[match[1]],
          start: periodTime(Math.min.apply(null, periods)),
          end: periodTime(Math.max.apply(null, periods), true),
        });
      }
    });
    return events;
  }

  // kind: class(수업 중) · free(수업 없음) · unknown(시간표 미확인) · expired(학기 밖이라 갱신 필요)
  function statusAt(person, date, time) {
    var weekday = new Date(date + 'T12:00:00Z').getUTCDay();
    var inTerm = date >= D.semester.from && date <= D.semester.to;
    var holiday = D.holidays.indexOf(date) !== -1;
    var active = inTerm && !holiday ? person.events.filter(function (e) {
      return e.day === weekday && e.start <= time && time < e.end;
    }) : [];
    if (active.length) {
      return { kind: 'class', end: active.reduce(function (last, e) { return e.end > last ? e.end : last; }, '') };
    }
    if (!person.events.length) return { kind: 'unknown', end: '' };
    if (!inTerm) return { kind: 'expired', end: '' };
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

  var people = D.professors.map(function (p) {
    return {
      id: p.id, name: p.name, department: p.department, building: p.building, room: p.room,
      sourceUrl: D.profileUrl + p.uld, events: toEvents(p.courses),
    };
  });
  window.FacultyLogic = { periodTime: periodTime, statusAt: statusAt, seoulNow: seoulNow, people: people };

  var LABEL = { 'class': '수업 중', free: '수업 없음', away: '부재', expired: '갱신 필요', unknown: '미확인' };
  var TONE = { 'class': 'in-class', free: 'no-class', away: 'away', expired: 'unknown', unknown: 'unknown' };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  var tbody = document.getElementById('rows');
  var rows = people.map(function (p) {
    var tr = document.createElement('tr');
    var nameCell = el('th', 'professor-cell');
    nameCell.scope = 'row';
    var link = el('a', '', p.name);
    link.href = p.sourceUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.title = p.name + ' 교수님 공식 교원정보';
    nameCell.append(link, el('span', 'department', p.department));

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
    var badgeText = el('span', '', '확인 중');
    var dot = el('i');
    dot.setAttribute('aria-hidden', 'true');
    badge.append(dot, badgeText);
    var until = el('small');
    until.hidden = true;
    statusCell.append(badge, until);

    tr.append(nameCell, placeCell, statusCell);
    tbody.append(tr);
    return { person: p, tr: tr, badge: badge, badgeText: badgeText, until: until, haystack: p.name + ' ' + p.department + ' ' + p.building + ' ' + p.room };
  });

  var hh = document.getElementById('hh');
  var mm = document.getElementById('mm');
  var nowDate = document.getElementById('now-date');
  function tick() {
    var now = seoulNow();
    var t = now.time.split(':');
    hh.textContent = t[0];
    mm.textContent = t[1];
    nowDate.textContent = '';
    var sep = el('span', 'sep');
    sep.setAttribute('aria-hidden', 'true');
    nowDate.append(document.createTextNode(now.date.replace(/-/g, '.')), sep, document.createTextNode('한국 시간'));
    rows.forEach(function (row) {
      var s = statusAt(row.person, now.date, now.time);
      row.badge.className = 'status ' + TONE[s.kind];
      row.badgeText.textContent = LABEL[s.kind];
      row.until.hidden = !s.end;
      row.until.textContent = s.end ? s.end + '까지' : '';
    });
  }

  var search = document.getElementById('search');
  var empty = document.getElementById('empty');
  function applySearch() {
    var query = search.value.trim();
    var shown = 0;
    rows.forEach(function (row) {
      var match = row.haystack.indexOf(query) !== -1;
      row.tr.hidden = !match;
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

  document.getElementById('source-line').textContent = D.semester.label + ' 공개 자료 기반 · 최초 확인 ' + D.sourceDate.replace(/-/g, '.');
  tick();
  applySearch();
  setInterval(tick, 15000);
  window.addEventListener('focus', tick);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
})();
