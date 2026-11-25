const { createClient } = supabase;
const db = createClient(window.APP_CONFIG.SUPABASE_URL, window.APP_CONFIG.SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
const views = ['studentView', 'loginView', 'adminView'];
const show = (name) => {
  views.forEach((v) => ($(v).hidden = v !== name));
  $('adminBtn').hidden = name !== 'studentView';
};

const ITEMS = [
  { key: '만족', label: '😊 만족', color: '#10b981' },
  { key: '보통', label: '😐 보통', color: '#f59e0b' },
  { key: '불만족', label: '😞 불만족', color: '#ef4444' },
];

document.querySelectorAll('.vote').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const buttons = document.querySelectorAll('.vote');
    buttons.forEach((b) => (b.disabled = true));
    const msg = $('studentMsg');
    msg.className = 'msg';
    const { error } = await db.from('votes').insert({ rating: btn.dataset.rating });
    if (error) {
      msg.className = 'msg error';
      msg.textContent = '저장에 실패했습니다. 다시 시도해 주세요.';
    } else {
      msg.textContent = '투표가 완료되었습니다. 감사합니다.';
    }
    buttons.forEach((b) => (b.disabled = false));
  });
});

$('adminBtn').addEventListener('click', () => {
  $('loginMsg').textContent = '';
  show('loginView');
});
$('cancelLogin').addEventListener('click', () => show('studentView'));

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await db.auth.signInWithPassword({
    email: $('email').value.trim(),
    password: $('password').value,
  });
  $('password').value = '';
  if (error) {
    $('loginMsg').textContent = '로그인에 실패했습니다. 이메일과 비밀번호를 확인하세요.';
    return;
  }
  await openAdmin();
});

async function loadResults() {
  $('adminMsg').textContent = '';
  const counts = { 만족: 0, 보통: 0, 불만족: 0 };
  for (const item of ITEMS) {
    const { count, error } = await db
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('rating', item.key);
    if (error) {
      $('adminMsg').textContent = '결과를 불러오지 못했습니다.';
      return;
    }
    counts[item.key] = count || 0;
  }
  renderResults(counts);
}

function renderResults(counts) {
  const total = ITEMS.reduce((s, i) => s + counts[i.key], 0);
  $('total').textContent = total;
  $('bars').innerHTML = '';
  ITEMS.forEach((i) => {
    const pct = total ? Math.round((counts[i.key] / total) * 1000) / 10 : 0;
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<span>${i.label}</span><div class="track"><div class="fill" style="background:${i.color}"></div></div><small>${counts[i.key]}표 (${pct}%)</small>`;
    $('bars').appendChild(row);
    requestAnimationFrame(() => (row.querySelector('.fill').style.width = pct + '%'));
  });
}

async function openAdmin() {
  show('adminView');
  await loadResults();
}

$('refreshBtn').addEventListener('click', loadResults);

$('resetBtn').addEventListener('click', async () => {
  if (!confirm('모든 투표 결과를 초기화하시겠습니까? 삭제된 결과는 복구할 수 없습니다.')) return;
  const { error } = await db.from('votes').delete().gt('id', 0);
  if (error) {
    $('adminMsg').textContent = '초기화에 실패했습니다.';
    return;
  }
  renderResults({ 만족: 0, 보통: 0, 불만족: 0 });
});

$('logoutBtn').addEventListener('click', async () => {
  await db.auth.signOut();
  $('studentMsg').textContent = '';
  show('studentView');
});

(async () => {
  const { data } = await db.auth.getSession();
  if (data.session) await openAdmin();
  else show('studentView');
})();
