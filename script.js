/* CombiFit prototype. Everything here is MOCK data + local state (no backend, no real AI/auth).
   Structure: state (S) -> helpers -> screens (SC) -> actions (A) -> one click handler. */
const KEY = 'combifit-proto-v1';
const DEF = {
  name: 'Rajkaran', age: 21, h: 178, w: 73, water: 2500, cal: 1720, pro: 118, meals: 0,
  // sel: 1 = include, -1 = "I don't want this", undefined = no opinion yet
  sel: { Strength: 1, Endurance: 1, Mobility: 1, Boxing: -1, Wrestling: -1 },
  eq: { Bodyweight: 1, Dumbbells: 1, 'Gym Equipment': 1 },
  ex: { w: 60, r: 8, s: 3, rpe: 7 }, done: 0, pr: false, seg: {}, replaced: 0
};
let S = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}'));
const save = () => localStorage.setItem(KEY, JSON.stringify(S));
let cur = 'splash', param = null, hist = [];
const app = document.getElementById('app');

const ACT = ['Strength', 'Endurance', 'Mobility', 'Boxing', 'Muay Thai', 'Wrestling', 'BJJ', 'MMA Conditioning'];
const EQ = ['Bodyweight', 'Dumbbells', 'Barbell', 'Resistance Bands', 'Pull-up Bar', 'Punching Bag', 'Gym Equipment'];
const FIGHTERS = [ // SAMPLE data: verify before presenting as fact. No current rankings are shown.
  { n: 'Khabib Nurmagomedov', d: 'Lightweight', c: 'Russia', rec: '29-0 (retired)', st: 'Wrestling / Sambo', ach: 'Former UFC Lightweight Champion' },
  { n: 'Israel Adesanya', d: 'Middleweight', c: 'Nigeria / New Zealand', rec: 'Sample', st: 'Striking / Kickboxing', ach: 'Former UFC Middleweight Champion' },
  { n: 'Alexander Volkanovski', d: 'Featherweight', c: 'Australia', rec: 'Sample', st: 'Well-rounded / Wrestling', ach: 'Former UFC Featherweight Champion' },
  { n: 'Amanda Nunes', d: "Women's Bantamweight", c: 'Brazil', rec: 'Sample (retired)', st: 'BJJ / Boxing', ach: 'Former two-division UFC Champion' }
];
const INDIAN = [ // SAMPLE grouping only; confirm details before the presentation
  { n: 'Puja Tomar', g: 'Active', d: "Women's Strawweight", note: 'Widely reported as first Indian woman to win a UFC fight.' },
  { n: 'Bharat Kandare', g: 'Former', d: 'Featherweight', note: 'Indian fighter who competed in the UFC.' },
  { n: 'Anshul Jubli', g: 'Historical', d: 'Lightweight', note: 'Widely reported as the first Indian to compete in the UFC.' }
];

/* ---------- helpers ---------- */
const bar = (p, c = '') => `<div class="bar ${c}"><i style="width:${Math.min(100, p)}%"></i></div>`;
const card = (h, c = '') => `<section class="card ${c}">${h}</section>`;
const head = (t, back) => `<header class="top">${back ? '<button class="back" data-back>‹</button>' : ''}<h2>${t}</h2></header>`;
const seg = (k, o) => `<div class="seg">${o.map(x => `<button class="${(S.seg[k] || o[0]) === x ? 'on' : ''}" data-seg="${k}|${x}">${x}</button>`).join('')}</div>`;
const segv = (k, o) => S.seg[k] || o[0];
const stat = (l, v) => `<div class="stat"><span class="mu">${l}</span><b>${v}</b></div>`;
const disc = t => `<p style="font-size:12px;margin-top:8px">${t}</p>`;
function ring(p, big, small) { // circular progress (SVG circle stroke trick)
  const C = 2 * Math.PI * 52;
  return `<div class="ring"><svg width="130" height="130" viewBox="0 0 130 130"><circle cx="65" cy="65" r="52" fill="none" stroke="#212936" stroke-width="10"/>
  <circle cx="65" cy="65" r="52" fill="none" stroke="#F5A524" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p / 100)}" transform="rotate(-90 65 65)"/></svg>
  <div>${big}<small>${small}</small></div></div>`;
}
function bars(vals, labels) { // simple bar chart
  const m = Math.max(...vals);
  return `<svg viewBox="0 0 300 100" width="100%">${vals.map((v, i) => `<rect x="${i * 42 + 10}" y="${80 - v / m * 70}" width="26" height="${v / m * 70}" rx="6" fill="#F5A524"/><text x="${i * 42 + 23}" y="94" text-anchor="middle">${labels[i]}</text>`).join('')}</svg>`;
}
function line(vals) { // simple line graph
  const m = Math.max(...vals), n = Math.min(...vals);
  const pts = vals.map((v, i) => `${20 + i * (260 / (vals.length - 1))},${80 - (v - n) / (m - n || 1) * 60}`);
  return `<svg viewBox="0 0 300 100" width="100%"><polyline points="${pts.join(' ')}" fill="none" stroke="#2FD1B4" stroke-width="3"/>${pts.map(p => `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="4" fill="#2FD1B4"/>`).join('')}</svg>`;
}
function toast(t) {
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = t;
  document.querySelector('.phone').appendChild(d); setTimeout(() => d.remove(), 2400);
}
const chips = () => `<div class="chips">${ACT.map(a => `<button class="chip ${S.sel[a] === 1 ? 'on' : S.sel[a] === -1 ? 'off' : ''}" data-chip="${a}">${S.sel[a] === 1 ? '✓ ' : S.sel[a] === -1 ? '✗ ' : ''}${a}</button>`).join('')}</div>
  <p style="font-size:12px">Tap once to include, again to skip, again to clear.</p>`;

/* Core prototype logic: the plan is BUILT FROM the user's choices. Skipped activities never appear. */
function plan() {
  const p = [['Warm-up', 10, 'Dynamic mobility and light cardio']];
  if (S.sel.Strength === 1) p.push(['Strength', 30, S.eq.Dumbbells || S.eq['Gym Equipment'] ? 'Bench press, goblet squat, rows' : 'Push-ups, split squats, band rows']);
  if (S.sel.Endurance === 1) p.push(['Endurance', 15, 'Intervals plus steady run']);
  if (S.sel.Mobility === 1) p.push(['Mobility', 10, 'Hips, shoulders, thoracic spine']);
  ['Boxing', 'Muay Thai', 'Wrestling', 'BJJ', 'MMA Conditioning'].filter(c => S.sel[c] === 1)
    .forEach(c => p.push([c, 15, S.eq['Punching Bag'] ? 'Bag rounds' : 'Shadow techniques, footwork, conditioning drills']));
  return p;
}
const mins = () => plan().reduce((a, b) => a + b[1], 0);
const skipped = () => ACT.filter(a => S.sel[a] === -1);

/* ---------- screens ---------- */
const SC = {
  splash: () => `<div class="hero"><h1 style="color:var(--amber)">COMBI<br>FIT</h1>
    <h2 style="margin:18px 0 6px">Train Your Way.<br>Get Combat Ready.</h2>
    <p>Personalized strength, endurance, combat training, nutrition and recovery — built around you.</p>
    <button class="btn" data-go="login">Get Started</button><button class="btn alt" data-act="demo">Explore Demo</button></div>`,

  login: () => `${head('Welcome to CombiFit', 1)}<p>Prototype login. No real account is created.</p><br>
    <label>Mobile number</label><div class="row" style="gap:6px"><input value="+91" style="max-width:70px"><input id="mob" placeholder="98765 43210" inputmode="numeric"></div>
    <button class="btn" data-go="otp">Send OTP</button><button class="btn alt" data-act="demo">Use Demo User</button>`,

  otp: () => `${head('Verify OTP', 1)}<p>Simulated. Any 6 digits work. Demo code: 123456</p><br>
    <div class="otp">${[0, 1, 2, 3, 4, 5].map(() => '<input maxlength="1" inputmode="numeric">').join('')}</div>
    <button class="btn alt sm" data-act="fillotp">Fill demo OTP</button><button class="btn" data-go="setup">Verify</button>`,

  setup: () => `${head('Your profile', 1)}
    <label>Name</label><input id="f-name" value="${S.name}">
    <div class="row"><div><label>Age</label><input value="${S.age}"></div><div><label>Gender</label><select><option>Male</option><option>Female</option><option>Other</option></select></div></div>
    <div class="row"><div><label>Height (cm)</label><input value="${S.h}"></div><div><label>Weight (kg)</label><input value="${S.w}"></div><div><label>Waist (cm)</label><input value="84"></div></div>
    <label>Fitness level</label><select><option>Beginner</option><option selected>Intermediate</option><option>Advanced</option></select>
    <label>Training experience</label><select><option>Under 1 year</option><option selected>1–3 years</option><option>3+ years</option></select>
    <label>Main goal</label><div class="chips">${['Fat Loss', 'Muscle Gain', 'Strength', 'Endurance', 'General Fitness', 'Combat Fitness'].map((g, i) => `<button class="chip ${i == 2 || i == 3 ? 'on' : ''}" onclick="this.classList.toggle('on')">${g}</button>`).join('')}</div>
    <button class="btn" data-act="saveprofile">Continue</button>`,

  prefs: () => `${head('What do you want to train?', 1)}${chips()}
    <h3>Which equipment do you have?</h3><div class="chips">${EQ.map(e => `<button class="chip ${S.eq[e] ? 'on' : ''}" data-eq="${e}">${e}</button>`).join('')}</div>
    <label>Exercises or activities you don't want to do</label><input placeholder="e.g. burpees, jumping (optional)">
    ${card('<b>CombiFit recommends. You decide.</b><p>Skipped activities are removed from your plan. Nothing is forced.</p>', 'hi')}
    <button class="btn" data-go="assess">Continue</button>`,

  assess: () => `${head('Your starting point', 1)}
    ${card(`<div class="sp">${ring(57, '57', 'of 100')}<div style="flex:1"><h3>Combat & Fitness Readiness</h3><p>A simple indicator built from the tests below.</p></div></div>`)}
    ${card(`<div class="grid">${stat('Weight', S.w + ' kg')}${stat('BMI', (S.w / (S.h / 100) ** 2).toFixed(1))}${stat('Waist', '84 cm')}${stat('Push-ups', '32')}${stat('Squats', '45 / min')}${stat('Plank', '1:40')}${stat('Running', '30:00 5K')}${stat('Mobility', 'Good')}</div>`)}
    ${card(Object.entries({ Strength: 62, Endurance: 48, Mobility: 71, Core: 55, Explosiveness: 44, Recovery: 68 }).map(([k, v]) => `<div class="sp"><span>${k}</span><b>${v}</b></div>${bar(v, k == 'Endurance' ? '' : 't')}`).join(''))}
    ${disc('Prototype fitness-readiness indicator. Not a medical assessment.')}
    <button class="btn" data-go="home">Build my plan</button>`,

  home: () => `<h2>Good Morning, ${S.name} 👋</h2><p>Here is your recommended day.</p><br>
    ${card(`<div class="sp">${ring(57, '57', 'readiness')}<div style="flex:1"><h3>Today's focus</h3><div class="chips">${ACT.filter(a => S.sel[a] === 1).map(a => `<span class="tag">${a}</span>`).join('')}</div></div></div>`, 'hi')}
    <div class="grid">${stat('Workout', mins() + ' min')}${stat('Calories', '2,100 kcal target')}${stat('Protein', '140 g target')}${stat('Water', (S.water / 1000).toFixed(1) + ' / 3.0 L')}${stat('Sleep', '7h 25m')}${stat('Recovery', 'GOOD 🟢')}</div>
    <button class="btn" data-go="train">START TODAY'S TRAINING</button>
    <div class="row"><button class="btn alt" data-act="food">Nutrition</button><button class="btn alt" data-go="control">My choices</button></div>`,

  train: () => `<h2>TODAY'S TRAINING</h2><p>${mins()} min · Recommended for you</p><br>
    ${plan().map(([n, m, d]) => card(`<div class="sp"><div><b>${n}</b><p>${d}</p></div><span class="tag">${m} min</span></div>`)).join('')}
    ${skipped().length ? card(`<p>You chose not to include ${skipped().join(' and ')}. Your plan has been adjusted.</p>`) : ''}
    ${card(`<h3>Why this plan?</h3><p>Your current endurance is lower than your strength, so today's plan gives additional conditioning while maintaining strength work.</p>`, 'hi')}
    <div class="row"><button class="btn" data-act="start">Start</button><button class="btn alt" data-act="replace">Replace Exercise</button><button class="btn alt" data-act="skip">Skip</button></div>
    <button class="btn alt" data-go="combat">Optional: Combat Hub</button>`,

  log: () => `${head('BENCH PRESS', 1)}
    ${card(`<div class="grid">${stat('Previous', '60 kg × 8 × 3')}${stat('Suggested next', '62.5 kg × 8 × 3')}${stat('Monthly target', '70 kg × 8')}${stat('Sets done today', S.done)}</div>`)}
    ${card(`<div class="grid"><div><label>Weight (kg)</label><input id="e-w" value="${S.ex.w}"></div><div><label>Reps</label><input id="e-r" value="${S.ex.r}"></div><div><label>Sets</label><input id="e-s" value="${S.ex.s}"></div><div><label>RPE (1–10)</label><input id="e-p" value="${S.ex.rpe}"></div></div>`)}
    ${S.pr ? '<div class="pr">🏆 NEW PERSONAL RECORD</div>' : ''}
    <button class="btn" data-act="complete">Complete Exercise</button>`,

  progress: () => {
    const t = segv('p', ['Progression', 'Records', 'Endurance', 'Week', 'Month']);
    let b = '';
    if (t == 'Progression') b = [['Bench Press', [60, 62.5, 65, 70], 'kg'], ['Squat', [80, 85, 90, 95], 'kg'], ['Push-ups', [32, 38, 44, 50], ''], ['5K Running', ['30:00', '29:00', '28:30', '27:30'], '']]
      .map(([n, v, u]) => card(`<b>${n}</b><p>${v.join(' → ')} ${u}</p><div class="chips"><span class="tag">Current ${v[0]}</span><span class="tag">Weekly target ${v[1]}</span><span class="tag">Monthly goal ${v[3]}</span></div>`)).join('') + disc('Targets are suggestions that adapt to you. Results are not guaranteed.');
    if (t == 'Records') b = (S.pr ? '<div class="pr">🏆 NEW PERSONAL RECORD</div>' : '') + card(Object.entries({ 'Bench Press': S.pr ? S.ex.w + ' kg' : '70 kg', Squat: '100 kg', Deadlift: '120 kg', 'Push-ups': 45, 'Pull-ups': 10, '5K Run': '28:40', Plank: '2:15' }).map(([k, v]) => `<div class="sp" style="padding:9px 0;border-bottom:1px solid var(--line)"><span>${k}</span><b>${v}</b></div>`).join(''));
    if (t == 'Endurance') b = card(`<b>Running</b><div class="grid" style="margin-top:8px">${stat('Distance', '3.0 km')}${stat('Time', '18:45')}${stat('Pace', '6:15 / km')}${stat('Weekly target', '3.5 km')}</div>${bar(3 / 5 * 100, 't')}<p>3.0 of 5 km monthly goal</p>`) + card(`<b>Distance, last 4 runs (km)</b>${line([2, 2.4, 2.5, 3])}`);
    if (t == 'Week') b = card(`<b>COMBIFIT WEEKLY REPORT</b><div class="grid" style="margin-top:8px">${stat('Workouts', '5 / 6')}${stat('Strength', '+8%')}${stat('Endurance', '+6%')}${stat('Mobility', '+4%')}${stat('Water goal', '87%')}${stat('Avg sleep', '7h 18m')}</div>`) + card(`<b>Training minutes per day</b>${bars([55, 40, 60, 0, 50, 45, 30], ['M', 'T', 'W', 'T', 'F', 'S', 'S'])}`);
    if (t == 'Month') b = card(`<b>SEPTEMBER PERFORMANCE REPORT</b><p style="margin-top:8px">Weight moved from 76 to 73.8 kg. Bench went from 60 to 67.5 kg, squat from 80 to 95 kg, push-ups from 32 to 45, and your 5K from 30:00 to 28:40. Readiness rose from 45 to 57.</p>`) +
      card(`<h3>Areas improving</h3><p>Strength and consistency are trending up.</p><h3 style="margin-top:10px">Areas requiring attention</h3><p>Endurance and explosiveness are your lowest scores.</p><h3 style="margin-top:10px">Next month's suggested focus</h3><p>Steady conditioning work while keeping your strength routine.</p>`) + disc('Not medical advice. No results are guaranteed.');
    return `<h2>Progress</h2><br>${seg('p', ['Progression', 'Records', 'Endurance', 'Week', 'Month'])}${b}`;
  },

  combat: () => `${head('Combat Hub', 1)}<p>Optional. Pick any combination, or none.</p><br>
    <div class="chips">${[['🥊', 'Boxing'], ['🔥', 'Muay Thai'], ['🤼', 'Wrestling'], ['🥋', 'BJJ'], ['⚡', 'MMA Conditioning']].map(([i, n]) => `<button class="chip ${S.sel[n] === 1 ? 'on' : S.sel[n] === -1 ? 'off' : ''}" data-chip="${n}" data-stay>${i} ${n}</button>`).join('')}</div>
    ${card(`<b>Muay Thai</b><div class="grid" style="margin-top:8px">${stat("Today's session", '3 × 2 min rounds')}${stat('Weekly target', '4 × 2 min')}${stat('Monthly goal', '5 × 3 min')}</div>`)}
    ${card(`<h3>No equipment?</h3><p>Try shadow techniques, footwork and conditioning drills instead.</p>`, 'hi')}`,

  recovery: () => {
    const t = segv('r', ['Sleep', 'Water', 'Food']);
    let b = '';
    if (t == 'Sleep') b = card(`<div class="sp">${ring(82, '7h 25m', 'target 7–9 h')}<div style="flex:1"><h3>Recovery: GOOD 🟢</h3>${['Sleep', 'Hydration', 'Training load', 'Recovery rating'].map((k, i) => `<div class="sp"><small>${k}</small><small>${['Good', 'On track', 'Moderate', 'Good'][i]}</small></div>`).join('')}</div></div>`) +
      card(`<h3>Tomorrow's training intensity: MODERATE</h3><p>Your recovery is good, so normal training volume is recommended.</p>`, 'hi');
    if (t == 'Water') b = card(`<div class="sp">${ring(S.water / 30, (S.water / 1000).toFixed(2), 'of 3.0 L')}<div style="flex:1"><button class="btn" data-act="water">+250 ml</button></div></div>`) +
      card(`<h3>Reminders</h3>${[['08:00', 400], ['10:30', 300], ['13:00', 400], ['15:30', 300], ['18:00', 400], ['20:30', 300]].map(([a, b]) => `<div class="sp" style="padding:6px 0"><span>${a}</span><span class="mu">${b} ml</span></div>`).join('')}`);
    if (t == 'Food') b = card(`<b>DAILY NUTRITION</b><div class="sp" style="margin-top:6px"><span>Calories</span><b>${S.cal.toLocaleString()} / 2,100 kcal</b></div>${bar(S.cal / 21)}<div class="sp"><span>Protein</span><b>${S.pro} / 140 g</b></div>${bar(S.pro / 1.4, 't')}<div class="sp"><span class="mu">Carbs 190 g</span><span class="mu">Fat 55 g</span></div>`) +
      ['Breakfast · Oats, eggs, banana', 'Lunch · Dal, rice, paneer', 'Pre-workout · Peanut butter toast', 'Post-workout · Whey shake, fruit', 'Dinner · Chicken, roti, salad'].map(m => card(`<b>${m.split(' · ')[0]}</b><p>${m.split(' · ')[1]}</p>`)).join('') +
      `<div class="row"><button class="btn" data-act="meal">Add Meal</button><button class="btn alt" data-act="meal">Add Food</button></div>`;
    return `<h2>Recovery</h2><br>${seg('r', ['Sleep', 'Water', 'Food'])}${b}`;
  },

  ufc: () => {
    const t = segv('u', ['Fighters', 'Weight Classes', 'History', 'Indian Fighters 🇮🇳']);
    let b = '';
    if (t == 'Fighters') b = FIGHTERS.map((f, i) => card(`<div class="row" style="align-items:center"><div class="ph" style="flex:0 0 54px">👤</div><div><b>${f.n}</b><p>${f.d} · ${f.c}<br>${f.rec} · ${f.st}</p></div></div><button class="btn alt sm" data-go="fighter" data-arg="${i}">View profile</button>`)).join('') + disc('SAMPLE / DEMO data. Verify stats before presenting. No current rankings shown.');
    if (t == 'Weight Classes') b = card(`<h3>Men</h3><p>Flyweight, Bantamweight, Featherweight, Lightweight, Welterweight, Middleweight, Light Heavyweight, Heavyweight</p><h3 style="margin-top:12px">Women</h3><p>Strawweight, Flyweight, Bantamweight, Featherweight</p>`);
    if (t == 'History') b = card(`<p>The UFC held its first event in 1993 as a tournament comparing different martial arts. Over time, fighters combined striking, wrestling and grappling into what is now called mixed martial arts (MMA).</p>`) + disc('Educational summary. Sample content.');
    if (t.startsWith('Indian')) b = ['Active', 'Former', 'Historical'].map(g => `<h3>${g}</h3>` + INDIAN.filter(f => f.g == g).map(f => card(`<b>${f.n}</b> <span class="tag">${g}</span><p>${f.d}. ${f.note}</p>`)).join('')).join('') + disc('SAMPLE grouping. Confirm details before presenting.');
    return `<h2>UFC Hub</h2><br>${seg('u', ['Fighters', 'Weight Classes', 'History', 'Indian Fighters 🇮🇳'])}${b}`;
  },

  fighter: i => { const f = FIGHTERS[i]; return `${head('Fighter Profile', 1)}${card(`<div class="ph" style="width:80px;height:80px;font-size:36px">👤</div><h2 style="margin-top:8px">${f.n}</h2><p>${f.d} · ${f.c}</p>`)}
    ${card(`<div class="grid">${stat('UFC record', f.rec)}${stat('Style', f.st)}</div>`)}${card(`<h3>Achievements</h3><p>${f.ach}</p><h3 style="margin-top:10px">Career highlights</h3><p>Sample text placeholder for the demo.</p>`)}${disc('SAMPLE / DEMO data.')}`; },

  profile: () => `<h2>Profile</h2><br>${card(`<b>${S.name}</b><p>${S.age} yrs · ${S.h} cm · ${S.w} kg<br>Goal: Strength + Endurance<br>Equipment: ${Object.keys(S.eq).filter(k => S.eq[k]).join(', ')}</p>`)}
    <button class="btn" data-go="control">My choices (you decide)</button><button class="btn alt" data-go="assess">View assessment</button><button class="btn alt" data-act="reset">Reset demo</button>`,

  control: () => `${head('You decide', 1)}${chips()}
    ${card(`<h3>Your plan has been adapted.</h3><p>Today: ${plan().map(p => p[0]).join(' · ')}</p>${skipped().length ? `<p>Not included: ${skipped().join(', ')}.</p>` : ''}`, 'hi')}
    ${card('<p>CombiFit can explain the benefits of activities you haven\'t selected, but your choice always comes first.</p>')}`
};

/* ---------- navigation ---------- */
const NAV = [['home', '🏠', 'Home'], ['train', '🏋️', 'Train'], ['progress', '📈', 'Progress'], ['recovery', '🌙', 'Recovery'], ['ufc', '🥊', 'UFC'], ['profile', '👤', 'Profile']];
const TAB = { home: 'home', train: 'train', log: 'train', combat: 'train', progress: 'progress', recovery: 'recovery', ufc: 'ufc', fighter: 'ufc', profile: 'profile', control: 'profile' };
function render() {
  const nav = TAB[cur] ? `<nav class="nav">${NAV.map(([k, i, l]) => `<button class="${TAB[cur] == k ? 'on' : ''}" data-go="${k}" data-root><span>${i}</span>${l}</button>`).join('')}</nav>` : '';
  app.innerHTML = `<div class="scr">${SC[cur](param)}</div>${nav}`;
  save();
}
function go(id, arg, root) { if (!root) hist.push([cur, param]); else hist = []; cur = id; param = arg; render(); }

/* ---------- actions (each simulates what a backend would do later) ---------- */
const A = {
  demo() { S = Object.assign({}, DEF); hist = []; go('home', null, true); },
  reset() { localStorage.removeItem(KEY); S = Object.assign({}, DEF); hist = []; go('splash', null, true); },
  fillotp() { document.querySelectorAll('.otp input').forEach((e, i) => e.value = '123456'[i]); },
  saveprofile() { const n = document.getElementById('f-name').value.trim(); if (n) S.name = n; go('prefs'); },
  start() { go('log'); },
  replace() { S.replaced++; toast('Try this alternative: dumbbell floor press.'); },
  skip() { toast('Skipped. Your plan adjusts, no penalty.'); },
  complete() { // read inputs, compare with best bench (70 kg) to simulate a personal record
    const g = id => +document.getElementById(id).value || 0;
    S.ex = { w: g('e-w'), r: g('e-r'), s: g('e-s'), rpe: g('e-p') };
    S.done += S.ex.s; S.pr = S.ex.w > 70; render();
    toast(S.pr ? '🏆 New personal record!' : 'Exercise completed. Progress updated.');
  },
  water() { S.water = Math.min(3000, S.water + 250); render(); },
  meal() { S.cal = Math.min(2100, S.cal + 190); S.pro = Math.min(140, S.pro + 12); render(); toast('Meal added.'); },
  food() { S.seg.r = 'Food'; go('recovery', null, true); }
};
document.addEventListener('click', e => {
  const t = e.target.closest('[data-go],[data-act],[data-seg],[data-chip],[data-eq],[data-back]'); if (!t) return;
  const d = t.dataset;
  if ('back' in d) { const h = hist.pop() || ['home', null]; cur = h[0]; param = h[1]; render(); }
  else if (d.act) A[d.act]();
  else if (d.seg) { const [k, v] = d.seg.split('|'); S.seg[k] = v; render(); }
  else if (d.chip) { const c = d.chip; S.sel[c] = S.sel[c] === 1 ? -1 : S.sel[c] === -1 ? undefined : 1; render(); }
  else if (d.eq) { S.eq[d.eq] = S.eq[d.eq] ? 0 : 1; render(); }
  else if (d.go) go(d.go, d.arg, 'root' in d);
});
// OTP boxes: jump to next box after typing a digit
document.addEventListener('input', e => { if (e.target.closest('.otp') && e.target.value && e.target.nextElementSibling) e.target.nextElementSibling.focus(); });
render();
