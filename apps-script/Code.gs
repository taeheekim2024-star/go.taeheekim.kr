/**
 * go.taeheekim.kr 저장 담당 (Google Apps Script 웹 앱)
 *
 * 사이트의 '수정'에서 보낸 한 교수님의 연구실·수업 정보를 검사한 뒤
 * GitHub 저장소 taeheekim2024-star/go.taeheekim.kr 의 site/data.js 를 고쳐 커밋한다.
 * 누구나 저장할 수 있으므로 형식·길이를 엄격히 검사하고, 바꿀 수 있는 것은
 * 기존 교수님의 건물·호실·수업 목록뿐이다. 모든 변경은 GitHub 이력에 남아 되돌릴 수 있다.
 *
 * 설정: 프로젝트 설정 > 스크립트 속성 GITHUB_TOKEN = 이 저장소 Contents 읽기·쓰기 fine-grained 토큰
 * 배포: 웹 앱, 다음 사용자 인증 정보로 실행 = 나, 액세스 권한 = 모든 사용자
 */
var REPO = 'taeheekim2024-star/go.taeheekim.kr';
var DATA_PATH = 'site/data.js';
var AUTHOR = { name: 'taeheekim2024-star', email: '295946926+taeheekim2024-star@users.noreply.github.com' };
var SAVES_PER_10_MIN = 30;
var DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

// 상태 확인용: 토큰이 있고 저장소를 읽을 수 있는지만 알려 준다(아무것도 바꾸지 않음).
function doGet() {
  var token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) return json_({ ok: false, error: 'GITHUB_TOKEN 없음' });
  var res = UrlFetchApp.fetch(apiUrl_() + '?ref=main', { headers: headers_(token), muteHttpExceptions: true });
  return json_({ ok: res.getResponseCode() === 200, read: res.getResponseCode() });
}

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var change = clean_(body);
    if (!underLimit_()) throw userError_('저장이 잠시 너무 많습니다. 몇 분 뒤 다시 저장해 주세요.');
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      return json_({ ok: true, data: commit_(change) });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ ok: false, error: err && err.userMessage ? err.userMessage : '저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.' });
  }
}

/* ---------- 입력 검사 ---------- */
function userError_(message) {
  var err = new Error(message);
  err.userMessage = message;
  return err;
}
function text_(value, max, label) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw userError_(label + ' 형식이 맞지 않습니다.');
  var s = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (s.length > max) throw userError_(label + '은(는) ' + max + '자까지 쓸 수 있습니다.');
  return s;
}
function time_(value, label) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw userError_(label + ' 시각 형식이 맞지 않습니다.');
  return value;
}
function clean_(body) {
  if (!body || typeof body !== 'object') throw userError_('보낸 내용이 비어 있습니다.');
  if (typeof body.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(body.id)) throw userError_('교수님 정보가 맞지 않습니다.');
  if (!Array.isArray(body.events)) throw userError_('수업 목록 형식이 맞지 않습니다.');
  if (body.events.length > 60) throw userError_('수업은 60개까지 넣을 수 있습니다.');
  var events = body.events.map(function (e, i) {
    if (!e || typeof e !== 'object') throw userError_((i + 1) + '번째 수업 형식이 맞지 않습니다.');
    var title = text_(e.title, 80, '수업명');
    if (!title) throw userError_((i + 1) + '번째 수업명을 넣어 주세요.');
    var day = e.day;
    if (typeof day !== 'number' || day % 1 !== 0 || day < 0 || day > 6) throw userError_(title + ': 요일이 맞지 않습니다.');
    var start = time_(e.start, title + ' 시작');
    var end = time_(e.end, title + ' 종료');
    if (start >= end) throw userError_(title + ': 종료 시각이 시작보다 늦어야 합니다.');
    return { title: title, day: day, start: start, end: end, room: text_(e.room, 40, '강의실') };
  });
  return { id: body.id, building: text_(body.building, 100, '건물'), room: text_(body.room, 40, '호실'), events: sortEvents_(events) };
}
function sortEvents_(events) {
  return events.slice().sort(function (a, b) {
    return DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || (a.start < b.start ? -1 : a.start > b.start ? 1 : 0) || (a.end < b.end ? -1 : a.end > b.end ? 1 : 0);
  });
}

// 10분에 저장 30번까지(장난·폭주 막기). 넘으면 잠시 거절.
function underLimit_() {
  var cache = CacheService.getScriptCache();
  var count = Number(cache.get('saves') || 0);
  if (count >= SAVES_PER_10_MIN) return false;
  cache.put('saves', String(count + 1), 600);
  return true;
}

/* ---------- GitHub에 저장 ---------- */
function apiUrl_() {
  return 'https://api.github.com/repos/' + REPO + '/contents/' + DATA_PATH;
}
function headers_(token) {
  return { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
}
function commit_(change) {
  var token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw userError_('저장 설정이 아직 끝나지 않았습니다.');
  for (var attempt = 0; attempt < 2; attempt++) {
    var got = UrlFetchApp.fetch(apiUrl_() + '?ref=main', { headers: headers_(token), muteHttpExceptions: true });
    if (got.getResponseCode() !== 200) throw userError_('저장소를 읽지 못했습니다(GitHub ' + got.getResponseCode() + ').');
    var file = JSON.parse(got.getContentText());
    var text = Utilities.newBlob(Utilities.base64Decode(String(file.content).replace(/\s/g, ''))).getDataAsString('UTF-8');
    var data = parse_(text);
    var target = null;
    for (var i = 0; i < data.professors.length; i++) if (data.professors[i].id === change.id) target = data.professors[i];
    if (!target) throw userError_('자료에서 이 교수님을 찾지 못했습니다.');
    target.building = change.building;
    target.room = change.room;
    target.events = change.events;
    var put = UrlFetchApp.fetch(apiUrl_(), {
      method: 'put',
      contentType: 'application/json',
      headers: headers_(token),
      muteHttpExceptions: true,
      payload: JSON.stringify({
        message: target.name + ' 교수님 정보 수정 (사이트)',
        content: Utilities.base64Encode(serialize_(data), Utilities.Charset.UTF_8),
        sha: file.sha,
        branch: 'main',
        author: AUTHOR,
        committer: AUTHOR,
      }),
    });
    var code = put.getResponseCode();
    if (code === 200 || code === 201) return data;
    if ((code === 409 || code === 422) && attempt === 0) continue;
    throw userError_('저장하지 못했습니다(GitHub ' + code + ').');
  }
  throw userError_('다른 저장과 겹쳤습니다. 다시 저장해 주세요.');
}

/* ---------- data.js 읽고 쓰기(site/app.js·go_site_kit와 같은 형식) ---------- */
var HEADER = "/* 교수님 연구실·시간표 자료. 사이트에서 '수정'으로 저장하면 이 파일 전체가 다시 써진다.\n" +
  "   'window.FACULTY = ' 뒤는 JSON 형식을 지킨다(큰따옴표, 주석·끝 쉼표 없음).\n" +
  "   events: day 0=일 1=월 … 6=토, start·end는 한국 시간 'HH:MM', room은 강의실. */";
function parse_(text) {
  var start = text.indexOf('{', text.indexOf('window.FACULTY'));
  var end = text.lastIndexOf('}');
  return JSON.parse(text.slice(start, end + 1));
}
function serialize_(d) {
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

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
