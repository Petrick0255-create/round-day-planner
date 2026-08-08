const DAYS = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
const COLORS = ['#789aa2','#e6bd62','#dc8862','#8aa17a','#b38aa7','#78a892','#c59366','#9b8fb5'];
const STORAGE_KEY = 'roundDayStateV3';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clone = value => JSON.parse(JSON.stringify(value));

let state = loadState();
let dayIndex = new Date().getDay();
let selected = -1;
let editing = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved?.version === 3 && Array.isArray(saved.plans)) return saved;
  } catch (_) {}
  return { version: 3, active: null, plans: [] };
}

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function plan() { return state.plans.find(p => p.id === state.active) || null; }
function items() { return plan()?.days?.[DAYS[dayIndex]] || []; }
function fmt(minute) {
  minute = (Number(minute) + 1440) % 1440;
  return `${String(Math.floor(minute / 60)).padStart(2,'0')}:${String(minute % 60).padStart(2,'0')}`;
}
function currentMinute() { const now = new Date(); return now.getHours() * 60 + now.getMinutes(); }
function currentItemIndex() { return items().findIndex(it => currentMinute() >= it.start && currentMinute() < it.end); }
function timeOptions() {
  return Array.from({ length: 288 }, (_, i) => `<option value="${i * 5}">${fmt(i * 5)}</option>`).join('');
}

function render() {
  const now = new Date();
  const active = plan();
  const isToday = dayIndex === now.getDay();
  const nowIndex = active && isToday ? currentItemIndex() : -1;
  if (selected < 0) selected = Math.max(0, nowIndex);
  $('#todayChip').textContent = `${now.getMonth() + 1}월 ${now.getDate()}일`;
  $('#todayName').textContent = DAYS[dayIndex];
  $('#planName').textContent = active?.title || '선택된 시간표 없음';
  $('#centerDate').textContent = isToday ? `지금 ${fmt(currentMinute())}` : `${now.getMonth() + 1}.${now.getDate()}`;
  $('#centerProgress').textContent = active && isToday && nowIndex >= 0 ? items()[nowIndex].title : active ? `${items().length}개의 일정` : '계획 만들기';
  draw();
  drawNowMarker();
  renderSelected();
  renderLists();
}

function draw() {
  const c = $('#clock'), ctx = c.getContext('2d'), C = c.width / 2, R = 314;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.beginPath(); ctx.arc(C, C, R, 0, Math.PI * 2); ctx.fillStyle = '#ebe6dc'; ctx.fill();
  if (!plan()) {
    ctx.fillStyle = '#8b857a'; ctx.font = '700 23px Noto Sans KR'; ctx.textAlign = 'center';
    ctx.fillText('아직 계획이 없어요', C, C - 95);
  }
  items().forEach((it, i) => {
    const a = it.start / 1440 * Math.PI * 2 - Math.PI / 2;
    const b = it.end / 1440 * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(C, C); ctx.arc(C, C, R, a, b); ctx.closePath();
    ctx.fillStyle = it.color; ctx.globalAlpha = i === selected ? 1 : .82; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = '#f8f4ec'; ctx.lineWidth = 5; ctx.stroke();
    const mid = (a + b) / 2, rr = i === selected ? 236 : 226;
    ctx.save(); ctx.translate(C + Math.cos(mid) * rr, C + Math.sin(mid) * rr); ctx.rotate(mid + Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.font = '700 18px Noto Sans KR';
    const label = it.title.length > 10 ? `${it.title.slice(0, 9)}…` : it.title;
    ctx.fillText(label, 0, 0); ctx.font = '600 14px DM Sans'; ctx.fillText(`${fmt(it.start)}–${fmt(it.end)}`, 0, 23); ctx.restore();
  });
  for (let h = 0; h < 24; h++) {
    const a = h / 24 * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(C + Math.cos(a) * (R - 10), C + Math.sin(a) * (R - 10));
    ctx.lineTo(C + Math.cos(a) * (R - 25), C + Math.sin(a) * (R - 25));
    ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = h % 3 === 0 ? 4 : 2; ctx.stroke();
    if (h % 3 === 0) { ctx.fillStyle = '#5d5a52'; ctx.font = '700 15px DM Sans'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(h, C + Math.cos(a) * (R + 23), C + Math.sin(a) * (R + 23)); }
  }
}

function drawNowMarker() {
  if (!plan() || dayIndex !== new Date().getDay()) return;
  const c = $('#clock'), ctx = c.getContext('2d'), C = c.width / 2, R = 314;
  const a = currentMinute() / 1440 * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath(); ctx.moveTo(C + Math.cos(a) * 82, C + Math.sin(a) * 82); ctx.lineTo(C + Math.cos(a) * (R + 4), C + Math.sin(a) * (R + 4));
  ctx.strokeStyle = '#292b27'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(C + Math.cos(a) * (R + 4), C + Math.sin(a) * (R + 4), 9, 0, Math.PI * 2); ctx.fillStyle = '#292b27'; ctx.fill();
}

function renderSelected() {
  if (!plan()) {
    $('#selectedCard').innerHTML = `<div class="row"><div><span class="time">빈 시간표</span><h3>내 계획을 직접 만들어 보세요</h3><p>고정된 예시 일정은 들어 있지 않습니다.</p></div><button id="emptyCreate">만들기</button></div>`;
    $('#emptyCreate').onclick = startWizard;
    return;
  }
  const it = items()[selected] || items()[0];
  if (!it) {
    $('#selectedCard').innerHTML = `<div class="row"><div><span class="time">${DAYS[dayIndex]}</span><h3>이 요일은 비어 있어요</h3><p>시간표 수정에서 일정을 추가할 수 있습니다.</p></div><button id="editEmptyDay">수정</button></div>`;
    $('#editEmptyDay').onclick = () => editPlanDay(DAYS[dayIndex]);
    return;
  }
  $('#selectedCard').innerHTML = `<div class="row"><div><span class="time">${fmt(it.start)} — ${fmt(it.end)}</span><h3>${escapeHtml(it.title)}</h3><p>${escapeHtml(it.detail || '세부 계획을 메모해 보세요.')}</p></div><button id="editSelected">수정</button></div>`;
  $('#editSelected').onclick = () => openDetail(it);
}

function renderLists() {
  if (!state.plans.length) {
    $('#recentPlans').innerHTML = '<div class="plan-row"><div><b>저장된 계획이 없습니다</b><small>위의 계획 만들기 버튼을 눌러 시작하세요.</small></div></div>';
    $('#planLibrary').innerHTML = '<div class="plan-row"><div><b>시간표 보관함이 비어 있습니다</b><small>직접 만든 시간표가 여기에 저장됩니다.</small></div></div>';
    return;
  }
  $('#recentPlans').innerHTML = state.plans.slice().reverse().map(p => `<div class="plan-row"><div class="mini-clock"></div><div><b>${escapeHtml(p.title)}</b><small>${p.created} · ${Object.values(p.days).reduce((n,list)=>n+list.length,0)}개 일정</small></div><button class="icon-btn edit-plan" data-id="${p.id}">✎</button></div>`).join('');
  $('#planLibrary').innerHTML = state.plans.map(p => `<button class="library-card ${p.id === state.active ? 'active-plan' : ''}" data-id="${p.id}"><div class="mini-clock"></div><div><b>${escapeHtml(p.title)}</b><small>${p.created} · 직접 만든 주간 계획</small></div><span class="check">${p.id === state.active ? '✓' : ''}</span></button>`).join('');
  $$('.library-card').forEach(button => button.onclick = () => { state.active = button.dataset.id; selected = -1; save(); toast('이 시간표를 사용합니다'); render(); });
  $$('.edit-plan').forEach(button => button.onclick = () => openPlanManager(button.dataset.id));
}

function switchTab(id) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === id));
  $$('nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
  $('#pageTitle').textContent = id === 'today' ? '동그란 하루' : id === 'build' ? '계획 세우기' : '시간표 보관함';
}

function startWizard() {
  editing = { mode: 'new', step: 0, title: '', days: [...DAYS], dayIndex: 0, dayData: {} };
  renderWizard(); $('#wizard').showModal();
}

function renderWizard() {
  const body = $('#wizardBody');
  if (editing.step === 0) {
    body.innerHTML = `<span class="eyebrow">STEP 1 · 기본 설정</span><h2 class="question">어떤 일주일을<br>만들까요?</h2><div class="field"><label>계획 제목</label><input id="planTitle" placeholder="예: 방학 기본 계획, 여행 1주차"></div><div class="field"><label>계획할 요일</label><div class="day-grid">${DAYS.map(d => `<button type="button" class="selected" data-day="${d}">${d[0]}</button>`).join('')}</div></div><button class="next-btn" type="button" id="wizardNext">요일별 계획 짜기</button>`;
    $$('.day-grid button').forEach(b => b.onclick = () => b.classList.toggle('selected'));
    $('#wizardNext').onclick = () => {
      editing.title = $('#planTitle').value.trim();
      editing.days = $$('.day-grid .selected').map(b => b.dataset.day);
      if (!editing.title) return toast('계획 제목을 적어주세요');
      if (!editing.days.length) return toast('요일을 하나 이상 선택해주세요');
      editing.step = 1; editing.dayIndex = 0; renderWizard();
    };
    return;
  }
  renderDayEditor(editing.days[editing.dayIndex], true);
}

function renderDayEditor(day, inWizard) {
  const body = inWizard ? $('#wizardBody') : $('#detailBody');
  const prev = DAYS[(DAYS.indexOf(day) + 6) % 7];
  const existing = editing.dayData?.[day] || editing.existing || null;
  const sleepWhen = existing?.sleepWhen || 'prev';
  const sleepTime = existing?.sleepTime ?? 1380;
  const wakeTime = existing?.wakeTime ?? 420;
  editing.blocks = clone(existing?.blocks || []);
  body.innerHTML = `<span class="eyebrow">${inWizard ? `${editing.dayIndex + 1} / ${editing.days.length}` : '요일 수정'} · ${day}</span><h2 class="question">${day}은<br>어떻게 보낼까요?</h2><div class="field"><label>${prev}에서 이어지는 취침 시각</label><div class="time-line"><select id="sleepWhen"><option value="prev">전날</option><option value="today">오늘</option></select><span></span><select id="sleepTime">${timeOptions()}</select></div></div><div class="field"><label>몇 시에 일어날 거야?</label><select id="wakeTime">${timeOptions()}</select></div><div id="scheduleBuilder"></div><button class="next-btn" type="button" id="saveDay">${inWizard ? (editing.dayIndex === editing.days.length - 1 ? '시간표 완성하기' : '다음 요일 계획하기') : '이 요일 저장하기'}</button>`;
  $('#sleepWhen').value = sleepWhen; $('#sleepTime').value = sleepTime; $('#wakeTime').value = wakeTime;
  renderScheduleBuilder();
  $('#saveDay').onclick = () => saveEditedDay(day, inWizard);
}

function renderScheduleBuilder() {
  const wake = +$('#wakeTime').value;
  const lastEnd = editing.blocks.length ? editing.blocks.at(-1).end : wake;
  $('#scheduleBuilder').innerHTML = `<div class="schedule-stack">${editing.blocks.map((b,i) => `<div class="schedule-chip" style="border-color:${b.color}"><b>${fmt(b.start)} — ${fmt(b.end)}</b>${escapeHtml(b.title)} <button type="button" class="remove-block" data-index="${i}">×</button></div>`).join('')}</div><div class="field"><label>다음엔 뭘 할까?</label><input id="newBlockTitle" placeholder="예: 씻고 아침 먹기"><div class="time-line"><input value="${fmt(lastEnd)}" disabled><span>–</span><select id="newBlockEnd">${timeOptions()}</select></div><small>시작 시각은 앞 일정의 끝 시각으로 자동 연결됩니다.</small></div><button type="button" class="next-btn secondary-add" id="addBlock">＋ 일정 추가</button>`;
  $('#newBlockEnd').value = Math.min(lastEnd + 60, 1435);
  $('#addBlock').onclick = addBlock;
  $$('.remove-block').forEach(b => b.onclick = () => { editing.blocks.splice(+b.dataset.index, 1); editing.blocks.forEach((x,i) => { x.start = i ? editing.blocks[i-1].end : +$('#wakeTime').value; }); renderScheduleBuilder(); });
  $('#wakeTime').onchange = () => { if (editing.blocks.length) editing.blocks[0].start = +$('#wakeTime').value; renderScheduleBuilder(); };
}

function addBlock() {
  const title = $('#newBlockTitle').value.trim();
  const start = editing.blocks.length ? editing.blocks.at(-1).end : +$('#wakeTime').value;
  const end = +$('#newBlockEnd').value;
  if (!title) return toast('할 일을 적어주세요');
  if (end <= start) return toast('끝나는 시간을 더 늦게 선택해주세요');
  editing.blocks.push({ start, end, title, detail: '', color: COLORS[editing.blocks.length % COLORS.length] });
  renderScheduleBuilder();
}

function saveEditedDay(day, inWizard) {
  const wakeTime = +$('#wakeTime').value, sleepTime = +$('#sleepTime').value, sleepWhen = $('#sleepWhen').value;
  if (!editing.blocks.length) return toast('기상 후 일정을 하나 이상 추가해주세요');
  const dayRecord = { wakeTime, sleepTime, sleepWhen, blocks: clone(editing.blocks) };
  const finalItems = [];
  if (sleepWhen === 'prev') finalItems.push({ start: 0, end: wakeTime, title: '꿈나라', detail: `${DAYS[(DAYS.indexOf(day)+6)%7]} ${fmt(sleepTime)} 취침`, color: COLORS[0] });
  else finalItems.push({ start: sleepTime, end: wakeTime, title: '꿈나라', detail: `${day} ${fmt(sleepTime)} 취침`, color: COLORS[0] });
  finalItems.push(...clone(editing.blocks));
  dayRecord.items = finalItems.sort((a,b) => a.start - b.start);
  if (inWizard) {
    editing.dayData[day] = dayRecord;
    if (editing.dayIndex < editing.days.length - 1) { editing.dayIndex++; renderWizard(); }
    else finishWizard();
  } else {
    const p = state.plans.find(x => x.id === editing.planId);
    p.daySettings[day] = dayRecord; p.days[day] = dayRecord.items; save(); $('#detail').close(); selected = -1; toast(`${day} 계획을 저장했습니다`); render();
  }
}

function finishWizard() {
  const days = Object.fromEntries(DAYS.map(d => [d, editing.dayData[d]?.items || []]));
  const p = { id: `p${Date.now()}`, title: editing.title, created: new Date().toLocaleDateString('ko-KR'), days, daySettings: editing.dayData };
  state.plans.push(p); state.active = p.id; save(); $('#wizard').close(); selected = -1; switchTab('today'); toast('직접 만든 시간표를 저장했습니다'); render();
}

function editPlanDay(day) {
  if (!plan()) return startWizard();
  const p = plan();
  editing = { mode: 'day', planId: p.id, existing: p.daySettings?.[day] || { blocks: p.days[day]?.filter(x => x.title !== '꿈나라') || [] } };
  $('#detail .modal-head b').textContent = `${day} 수정`; $('#deleteItem').style.visibility = 'hidden'; renderDayEditor(day, false); $('#detail').showModal();
}

function openPlanManager(planId) {
  const p = state.plans.find(x => x.id === planId);
  editing = { planId };
  $('#detail .modal-head b').textContent = '시간표 관리'; $('#deleteItem').style.visibility = 'visible';
  $('#detailBody').innerHTML = `<div class="field"><label>계획 제목</label><input id="managerTitle" value="${escapeHtml(p.title)}"></div><div class="field"><label>수정할 요일</label><div class="day-grid">${DAYS.map(d => `<button type="button" class="manager-day" data-day="${d}">${d[0]}</button>`).join('')}</div></div><button class="next-btn" type="button" id="savePlanTitle">제목 저장</button>`;
  $$('.manager-day').forEach(b => b.onclick = () => { $('#detail').close(); state.active = planId; save(); editPlanDay(b.dataset.day); });
  $('#savePlanTitle').onclick = () => { p.title = $('#managerTitle').value.trim() || p.title; save(); $('#detail').close(); render(); };
  $('#deleteItem').onclick = () => { state.plans = state.plans.filter(x => x.id !== planId); if (state.active === planId) state.active = state.plans[0]?.id || null; save(); $('#detail').close(); selected = -1; toast('시간표를 삭제했습니다'); render(); };
  $('#detail').showModal();
}

function openDetail(it) {
  editing = { item: it };
  $('#detail .modal-head b').textContent = '일정 자세히'; $('#deleteItem').style.visibility = 'visible';
  $('#detailBody').innerHTML = `<div class="field"><label>일정 이름</label><input id="detailTitle" value="${escapeHtml(it.title)}"></div><div class="field"><label>시간</label><div class="time-line"><select id="detailStart">${timeOptions()}</select><span>–</span><select id="detailEnd">${timeOptions()}</select></div><div id="conflict"></div></div><div class="field"><label>세부 계획 · 링크도 함께 저장할 수 있어요</label><textarea id="detailMemo">${escapeHtml(it.detail || '')}</textarea></div><button class="next-btn" type="button" id="saveDetail">저장하기</button>`;
  $('#detailStart').value = it.start; $('#detailEnd').value = it.end; $('#saveDetail').onclick = saveDetail;
  $('#deleteItem').onclick = () => { plan().days[DAYS[dayIndex]] = items().filter(x => x !== it); save(); $('#detail').close(); selected = -1; toast('일정을 삭제했습니다'); render(); };
  $('#detail').showModal();
}

function saveDetail() {
  const it = editing.item, start = +$('#detailStart').value, end = +$('#detailEnd').value;
  const other = items().find(x => x !== it && start < x.end && end > x.start);
  if (end <= start) return $('#conflict').innerHTML = '<div class="conflict">끝나는 시간은 시작 시간보다 늦어야 합니다.</div>';
  if (other) return $('#conflict').innerHTML = `<div class="conflict">${fmt(other.start)}부터 ‘${escapeHtml(other.title)}’ 일정이 있습니다.</div>`;
  Object.assign(it, { start, end, title: $('#detailTitle').value.trim() || '이름 없는 일정', detail: $('#detailMemo').value });
  items().sort((a,b) => a.start - b.start); save(); $('#detail').close(); selected = items().indexOf(it); toast('일정을 수정했습니다'); render();
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function toast(message) { const t = $('#toast'); t.textContent = message; t.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 1800); }

$('#clock').addEventListener('click', e => {
  if (!plan()) return startWizard();
  const r = e.target.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 720 - 360, y = (e.clientY - r.top) / r.height * 720 - 360;
  let angle = Math.atan2(y, x) + Math.PI / 2; if (angle < 0) angle += Math.PI * 2;
  const minute = angle / (Math.PI * 2) * 1440, found = items().findIndex(it => minute >= it.start && minute < it.end);
  if (found >= 0) { selected = found; render(); }
});
$$('nav button').forEach(b => b.onclick = () => switchTab(b.dataset.tab));
$('#prevDay').onclick = () => { dayIndex = (dayIndex + 6) % 7; selected = -1; render(); };
$('#nextDay').onclick = () => { dayIndex = (dayIndex + 1) % 7; selected = -1; render(); };
$('#newPlan').onclick = startWizard; $('#libraryAdd').onclick = startWizard;
render(); setInterval(() => { if (plan() && dayIndex === new Date().getDay()) { selected = currentItemIndex(); render(); } }, 60000);
