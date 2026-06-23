/* ── FinFlow App ── */
"use strict";

// ── Storage keys ──
const STORAGE_KEY   = 'finflow_entries';
const PASSCODE_KEY  = 'finflow_passcode';
const AUTH_KEY      = 'finflow_auth';
const DEFAULT_CODE  = '1234';

// ── Category config ──
const CATEGORIES = [
  { id: 'เงินเดือน',    emoji: '💰', label: 'เงินเดือน' },
  { id: 'อาหาร',        emoji: '🍜', label: 'อาหาร' },
  { id: 'การเดินทาง',   emoji: '🚗', label: 'เดินทาง' },
  { id: 'ค่าบิล',       emoji: '💡', label: 'ค่าบิล' },
  { id: 'ช้อปปิ้ง',     emoji: '🛍️', label: 'ช้อปปิ้ง' },
  { id: 'ความบันเทิง',  emoji: '🎬', label: 'บันเทิง' },
  { id: 'สุขภาพ',       emoji: '🏥', label: 'สุขภาพ' },
  { id: 'การศึกษา',     emoji: '📚', label: 'การศึกษา' },
  { id: 'อื่นๆ',        emoji: '📝', label: 'อื่นๆ' },
  { id: 'custom',        emoji: '✏️', label: 'กำหนดเอง' },
];

const BANKS = [
  { id: 'กสิกร', label: 'ธนาคารกสิกร' },
  { id: 'ไทยพาณิชย์', label: 'ธนาคารไทยพาณิชย์' },
  { id: 'กรุงเทพ', label: 'ธนาคารกรุงเทพ' },
  { id: 'กรุงไทย', label: 'ธนาคารกรุงไทย' },
  { id: 'กรุงศรี', label: 'ธนาคารกรุงศรี' },
  { id: 'ทหารไทย', label: 'ธนาคารทหารไทย' },
  { id: 'custom', label: 'กำหนดเอง' },
];

// ── Utils ──
const getPasscode  = () => localStorage.getItem(PASSCODE_KEY) || DEFAULT_CODE;
const setPasscode  = v  => localStorage.setItem(PASSCODE_KEY, v);
const isAuthed     = () => localStorage.getItem(AUTH_KEY) === '1';
const setAuthed    = v  => localStorage.setItem(AUTH_KEY, v ? '1' : '0');
const getEntries   = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
const saveEntries  = e  => localStorage.setItem(STORAGE_KEY, JSON.stringify(e));
const todayISO     = (d = new Date()) => d.toISOString().slice(0, 10);

function fmtBaht(n) {
  return '฿' + new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

function fmtShortDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function catInfo(id) {
  return CATEGORIES.find(c => c.id === id) || { emoji: '📝', label: id };
}

function bankInfo(id) {
  return BANKS.find(b => b.id === id) || { label: id || 'ไม่ระบุ' };
}

// ── PIN logic ──
let pinBuffer = '';

function updateDots() {
  document.querySelectorAll('#pinDots span').forEach((sp, i) => {
    sp.classList.toggle('filled', i < pinBuffer.length);
  });
}

function pinShake() {
  const dots = document.getElementById('pinDots');
  dots.classList.add('shake');
  dots.addEventListener('animationend', () => dots.classList.remove('shake'), { once: true });
}

function handlePin(digit) {
  if (pinBuffer.length >= 4) return;
  pinBuffer += digit;
  updateDots();
  if (pinBuffer.length === 4) {
    setTimeout(() => {
      if (pinBuffer === getPasscode()) {
        setAuthed(true);
        pinBuffer = '';
        updateDots();
        showDashboard();
      } else {
        pinBuffer = '';
        updateDots();
        pinShake();
        document.getElementById('loginError').textContent = 'รหัสไม่ถูกต้อง ลองอีกครั้ง';
        setTimeout(() => { document.getElementById('loginError').textContent = ''; }, 2000);
      }
    }, 80);
  }
}

document.querySelectorAll('.num-btn[data-n]').forEach(btn => {
  btn.addEventListener('click', () => handlePin(btn.dataset.n));
});

document.getElementById('delBtn').addEventListener('click', () => {
  pinBuffer = pinBuffer.slice(0, -1);
  updateDots();
  document.getElementById('loginError').textContent = '';
});

document.getElementById('recoverBtn').addEventListener('click', () => {
  if (confirm('รีเซ็ตรหัสล็อคอินกลับเป็น 1234 หรือไม่?')) {
    setPasscode(DEFAULT_CODE);
    pinBuffer = '';
    updateDots();
    document.getElementById('loginError').textContent = 'รีเซ็ตเรียบร้อย ใช้รหัส 1234 ได้เลย';
    setTimeout(() => { document.getElementById('loginError').textContent = ''; }, 2500);
  }
});

// ── Screen switcher ──
function showLogin() {
  document.getElementById('loginScreen').hidden = false;
  document.getElementById('dashboard').hidden = true;
  pinBuffer = '';
  updateDots();
  document.getElementById('loginError').textContent = '';
}

function showDashboard() {
  document.getElementById('loginScreen').hidden = true;
  document.getElementById('dashboard').hidden = false;
  renderDashboard();
  buildCatGrid();
}

// ── Navigation ──
function activateTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });
  if (tabId === 'tabReport') renderReport();
}

document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

// ── Settings Sheet ──
const sheetOverlay = document.getElementById('sheetOverlay');

document.getElementById('settingsBtn').addEventListener('click', () => {
  sheetOverlay.hidden = false;
});

sheetOverlay.addEventListener('click', e => {
  if (e.target === sheetOverlay) sheetOverlay.hidden = true;
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  sheetOverlay.hidden = true;
  setAuthed(false);
  showLogin();
});

document.getElementById('changePassBtn').addEventListener('click', () => {
  sheetOverlay.hidden = true;
  const np = prompt('ตั้งรหัสใหม่ (อย่างน้อย 4 ตัว):');
  if (np !== null) {
    if (np.trim().length >= 4) {
      setPasscode(np.trim());
      alert('บันทึกรหัสใหม่เรียบร้อย');
    } else if (np.trim().length > 0) {
      alert('รหัสต้องยาวอย่างน้อย 4 ตัว');
    }
  }
});

// ── Category grid ──
let selectedCat = 'อาหาร';

function buildCatGrid() {
  const grid = document.getElementById('catGrid');
  grid.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn' + (cat.id === selectedCat ? ' selected' : '');
    btn.type = 'button';
    btn.innerHTML = `<span class="cat-emoji">${cat.emoji}</span><span>${cat.label}</span>`;
    btn.addEventListener('click', () => {
      selectedCat = cat.id;
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('customCategoryRow').hidden = cat.id !== 'custom';
      if (cat.id !== 'custom') document.getElementById('customCategoryInput').value = '';
    });
    grid.appendChild(btn);
  });
}

const bankSelect = document.getElementById('bankSelect');
const customBankRow = document.getElementById('customBankRow');

if (bankSelect) {
  bankSelect.addEventListener('change', () => {
    customBankRow.hidden = bankSelect.value !== 'custom';
    if (bankSelect.value !== 'custom') {
      document.getElementById('customBankInput').value = '';
    }
  });
}

// ── Type toggle ──
let currentType = 'income';
let selectedBank = 'all';

document.getElementById('toggleIncome').addEventListener('click', () => {
  currentType = 'income';
  document.getElementById('toggleIncome').classList.add('active');
  document.getElementById('toggleExpense').classList.remove('active');
});

document.getElementById('toggleExpense').addEventListener('click', () => {
  currentType = 'expense';
  document.getElementById('toggleExpense').classList.add('active');
  document.getElementById('toggleIncome').classList.remove('active');
});

function buildBankFilter(entries) {
  const container = document.getElementById('bankFilter');
  if (!container) return;

  const banks = [
    { id: 'all', label: 'ทั้งหมด' },
    ...BANKS.filter(b => b.id !== 'custom')
  ];

  const customBanks = Array.from(new Set(entries
    .map(e => e.bank)
    .filter(bank => bank && !BANKS.some(b => b.id === bank))));

  customBanks.forEach(bank => banks.push({ id: bank, label: bank }));

  container.innerHTML = '';
  banks.forEach(bank => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bank-filter-btn' + (selectedBank === bank.id ? ' active' : '');
    btn.textContent = bank.label;
    btn.addEventListener('click', () => {
      selectedBank = bank.id;
      renderReport();
    });
    container.appendChild(btn);
  });
}

// ── Save transaction ──
document.getElementById('saveBtn').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('amountInput').value);
  if (!amount || amount <= 0) {
    document.getElementById('amountInput').focus();
    document.getElementById('amountInput').style.borderColor = 'var(--rose)';
    setTimeout(() => document.getElementById('amountInput').style.borderColor = '', 1200);
    return;
  }

  let category = selectedCat;
  if (category === 'custom') {
    const cv = document.getElementById('customCategoryInput').value.trim();
    if (!cv) {
      document.getElementById('customCategoryInput').focus();
      return;
    }
    category = cv;
  }

  let bank = document.getElementById('bankSelect').value;
  if (bank === 'custom') {
    const bv = document.getElementById('customBankInput').value.trim();
    if (!bv) {
      document.getElementById('customBankInput').focus();
      return;
    }
    bank = bv;
  }

  const entry = {
    id: Date.now(),
    type: currentType,
    amount,
    category,
    bank,
    note: document.getElementById('noteInput').value.trim(),
    date: todayISO(),
    ts: Date.now(),
  };

  const entries = getEntries();
  entries.push(entry);
  saveEntries(entries);

  // reset form
  document.getElementById('amountInput').value = '';
  document.getElementById('noteInput').value = '';
  document.getElementById('customCategoryInput').value = '';
  document.getElementById('customBankInput').value = '';
  document.getElementById('customCategoryRow').hidden = true;
  document.getElementById('customBankRow').hidden = true;
  document.getElementById('bankSelect').value = 'กสิกร';

  // success feedback: switch back to home
  activateTab('tabHome');
  renderDashboard();
});

// ── Clear all ──
document.getElementById('clearAllButton').addEventListener('click', () => {
  if (confirm('ลบข้อมูลทั้งหมด?')) {
    localStorage.removeItem(STORAGE_KEY);
    renderDashboard();
  }
});

// ── Render dashboard ──
function renderDashboard() {
  const entries = getEntries();
  const today = todayISO();
  const todayEntries = entries.filter(e => e.date === today);

  let inc = 0, exp = 0;
  todayEntries.forEach(e => { e.type === 'income' ? (inc += e.amount) : (exp += e.amount); });
  const net = inc - exp;

  document.getElementById('heroIncome').textContent = fmtBaht(inc);
  document.getElementById('heroExpense').textContent = fmtBaht(exp);
  document.getElementById('heroNet').textContent = fmtBaht(net);
  document.getElementById('heroNet').style.color = net < 0 ? 'var(--rose)' : 'var(--text)';

  renderWeekly(entries);
  renderTxList(entries);
}

function renderWeekly(entries) {
  const container = document.getElementById('weeklySummary');
  container.innerHTML = '';
  const today = todayISO();

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(todayISO(d));
  }

  days.forEach((iso, idx) => {
    const dayEntries = entries.filter(e => e.date === iso);
    let inc = 0, exp = 0;
    dayEntries.forEach(e => { e.type === 'income' ? (inc += e.amount) : (exp += e.amount); });
    const net = inc - exp;

    const card = document.createElement('div');
    card.className = 'weekly-card' + (iso === today ? ' today-card' : '');
    const label = idx === 0 ? 'วันนี้' : idx === 1 ? 'เมื่อวาน' : fmtShortDate(iso);
    card.innerHTML = `
      <div class="wc-date">${label}</div>
      <div class="wc-in">+${fmtBaht(inc)}</div>
      <div class="wc-out">-${fmtBaht(exp)}</div>
      <div class="wc-net" style="color:${net < 0 ? 'var(--rose)' : net > 0 ? 'var(--green)' : 'var(--muted)'}">${fmtBaht(net)}</div>
    `;
    container.appendChild(card);
  });
}

function renderTxList(entries) {
  const list = document.getElementById('txList');
  list.innerHTML = '';

  const recent = entries.slice().reverse().slice(0, 20);

  if (!recent.length) {
    list.innerHTML = `
      <div class="tx-empty">
        <p>ยังไม่มีรายการ</p>
        <p class="tx-empty-sub">กด + เพื่อเพิ่มรายการแรก</p>
      </div>`;
    return;
  }

  recent.forEach(entry => {
    const cat = catInfo(entry.category);
    const bank = entry.bank ? bankInfo(entry.bank).label : 'ไม่ระบุ';
    const item = document.createElement('div');
    item.className = 'tx-item';

    const iconBg = entry.type === 'income'
      ? 'background:rgba(52,211,153,0.12)'
      : 'background:rgba(251,113,133,0.10)';

    item.innerHTML = `
      <div class="tx-icon" style="${iconBg}">${cat.emoji}</div>
      <div class="tx-info">
        <div class="tx-cat">${entry.category}</div>
        <div class="tx-note">${entry.note || (entry.type === 'income' ? 'รายรับ' : 'รายจ่าย')}</div>
        <div class="tx-bank">${bank}</div>
      </div>
      <div class="tx-right">
        <div class="tx-amount ${entry.type === 'income' ? 'is-income' : 'is-expense'}">
          ${entry.type === 'income' ? '+' : '-'}${fmtBaht(entry.amount)}
        </div>
        <div class="tx-time">${fmtTime(entry.ts)}</div>
      </div>
    `;
    list.appendChild(item);
  });
}

function renderBankSummary(entries) {
  const container = document.getElementById('bankSummary');
  container.innerHTML = '';
  const totals = {};

  entries.forEach(e => {
    const bank = e.bank || 'ไม่ระบุ';
    if (!totals[bank]) totals[bank] = { income: 0, expense: 0, count: 0 };
    totals[bank].count += 1;
    if (e.type === 'income') totals[bank].income += e.amount;
    else totals[bank].expense += e.amount;
  });

  const bankNames = Object.keys(totals).sort((a, b) => {
    const netA = totals[a].income - totals[a].expense;
    const netB = totals[b].income - totals[b].expense;
    return netB - netA;
  });

  if (!bankNames.length) {
    container.innerHTML = `
      <div class="tx-empty">
        <p>ยังไม่มีรายการธนาคาร</p>
      </div>`;
    return;
  }

  bankNames.forEach(bank => {
    const { income, expense, count } = totals[bank];
    const net = income - expense;
    const card = document.createElement('div');
    card.className = 'bank-card';
    card.innerHTML = `
      <div class="bank-card-top">
        <strong>${bank}</strong>
        <span>${count} รายการ</span>
      </div>
      <div class="bank-card-body">
        <span>เข้า ${fmtBaht(income)}</span>
        <span>ออก ${fmtBaht(expense)}</span>
        <span class="bank-net" style="color:${net < 0 ? 'var(--rose)' : net > 0 ? 'var(--green)' : 'var(--muted)'}">สุทธิ ${fmtBaht(net)}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// ── Render report ──
function renderReport() {
  const entries = getEntries();
  buildBankFilter(entries);

  const filteredEntries = selectedBank === 'all'
    ? entries
    : entries.filter(e => e.bank === selectedBank);

  const today = todayISO();
  const todayE = filteredEntries.filter(e => e.date === today);
  let inc = 0, exp = 0;
  todayE.forEach(e => { e.type === 'income' ? (inc += e.amount) : (exp += e.amount); });

  document.getElementById('rptIncome').textContent = fmtBaht(inc);
  document.getElementById('rptExpense').textContent = fmtBaht(exp);
  document.getElementById('rptNet').textContent = fmtBaht(inc - exp);

  const now = new Date();
  document.getElementById('reportDate').textContent =
    now.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const table = document.getElementById('reportTable');
  table.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = todayISO(d);
    const dayE = filteredEntries.filter(e => e.date === iso);
    let dInc = 0, dExp = 0;
    dayE.forEach(e => { e.type === 'income' ? (dInc += e.amount) : (dExp += e.amount); });
    const dNet = dInc - dExp;

    const row = document.createElement('div');
    row.className = 'report-row';
    const label = i === 0 ? 'วันนี้' : i === 1 ? 'เมื่อวาน' : fmtShortDate(iso);
    row.innerHTML = `
      <span class="rr-date">${label}</span>
      <span class="rr-in">+${fmtBaht(dInc)}</span>
      <span class="rr-out">-${fmtBaht(dExp)}</span>
      <span class="rr-net" style="color:${dNet < 0 ? 'var(--rose)' : dNet > 0 ? 'var(--green)' : 'var(--muted)'}">${fmtBaht(dNet)}</span>
    `;
    table.appendChild(row);
  }

  renderBankSummary(filteredEntries);
}

// ── Init ──
window.addEventListener('load', () => {
  if (isAuthed()) {
    showDashboard();
  } else {
    showLogin();
  }
});