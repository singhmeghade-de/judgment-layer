/* Judgment Layer: AI-assisted assessment prototype. Vanilla JS, no build step, nothing leaves the browser. */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ic = (n, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;

/* ---------- data ---------- */
const COMPS = [
  { id: 'sa', n: 1, name: 'Self-awareness', short: 'Self-awareness', icon: 'bulb', color: '#ff6b57',
    def: 'Names their own part, assumptions or habits, not only what happened to others.',
    anchors: { 1: 'Describes events only. No mention of their own part.', 2: 'Mentions their own part briefly, with no detail.', 3: 'Names their own assumption or habit and what it changed.', 4: 'Names their own pattern, shows what they changed because of it, and keeps doing it.' },
    probe: 'What would you do differently if the same situation came up tomorrow, and what tells you that?',
    pats: [/\bi (still |now |always )?(realis|realiz|noticed|learned|learnt|struggl|assumed|avoid|tend|usually|often|should have|made a mistake|was wrong)/, /\b(my own|my) (blind spot|assumption|reaction|tone|mistake|bias|part)\b/, /\b(looking back|in hindsight|reflect)/] },
  { id: 'pt', n: 2, name: 'Perspective-taking', short: 'Perspective', icon: 'users', color: '#3b82f6',
    def: 'Finds out what the other person needs or feels, and acts on it.',
    anchors: { 1: 'Only their own view of the other person.', 2: 'Mentions what the other person said or felt.', 3: 'Asks, listens and adjusts to what the other person needs.', 4: 'Finds the real cause through the other person\'s view and builds the solution on it.' },
    probe: 'What did the other person need from you in that moment, and how do you know?',
    pats: [/\b(asked|ask)\b.*\b(her|him|them|what|why)\b/, /\b(listen(ed)?|understand|understood|realis(ed|e)|realiz(ed|e))\b/, /\b(she|he|they)\b.*\b(felt|explained|needed|worried|wanted|said)\b/, /\b(perspective|point of view|concern|pressure|their side)\b/] },
  { id: 'dq', n: 3, name: 'Decision quality', short: 'Decisions', icon: 'scale', color: '#7c5cff',
    def: 'Weighs options and says why one was chosen.',
    anchors: { 1: 'One action, no alternatives.', 2: 'Hints at a choice without saying why.', 3: 'Compares options and gives a reason for the choice.', 4: 'Compares concrete options, names the trade-off and checks the choice later.' },
    probe: 'Which options did you rule out, and on what basis?',
    pats: [/\b(options?|alternatives?|trade-?offs?|criteria|weigh(ed)?|compare(d)?|decid(ed|e)|chose|choose|cost|risk|evidence|data)\b/] },
  { id: 'ao', n: 4, name: 'Action orientation', short: 'Action', icon: 'flag', color: '#22a06b',
    def: 'Turns the decision into concrete steps with owners and timing, and checks they worked.',
    anchors: { 1: 'No next steps.', 2: 'A vague plan, no owner or date.', 3: 'Concrete steps with an owner or a date.', 4: 'Steps with owners, dates and a way to check they worked.' },
    probe: 'What happened after the conversation, and how did you check it worked?',
    pats: [/\b(agreed|scheduled|book(ed)?|wrote|set up|followed up|follow-?up|review on|deadline|next step|action)\b/, /\bevery (monday|tuesday|wednesday|thursday|friday|week|month)\b/, /\bby (monday|tuesday|wednesday|thursday|friday|next week|noon|\d)/, /\bsame (day|afternoon)\b/] }
];
const LEVELS = { 1: 'Not shown', 2: 'Emerging', 3: 'Solid', 4: 'Strong' };
const PROMPT = 'Describe a time you had to give difficult feedback. What did you do, and what happened next?';
const PEOPLE = [
  { id: 'p1', name: 'Participant A', role: 'Team lead, Finance operations', color: '#ff6b57', initials: 'A',
    text: 'Last quarter I had to tell Marta, a senior analyst on my team, that her reports were arriving late and that clients had noticed. I put it off for two weeks because I assumed she was simply careless. Looking back, that assumption was my own blind spot. When we finally talked, I asked her what was getting in the way. She explained that two new projects had been added without anyone removing older ones, and that she felt she could not say no. I listened and realised the problem was our planning, not her effort. We compared three options: hire a freelancer, move one project to another analyst, or cut the weekly report to a shorter format. We chose the shorter format because it cost nothing and kept the client informed. I wrote down the new format the same day, agreed a review on 14 November, and Marta now sends the report every Friday by noon. I still tend to avoid hard conversations, so I now book them in my calendar.' },
  { id: 'p2', name: 'Participant B', role: 'Project manager, Retail', color: '#3b82f6', initials: 'B',
    text: 'A developer on my team missed two sprint deadlines in a row. I called a meeting on Monday and told him the delays were affecting the release. He said the backlog had grown because of unclear tickets. We compared two options: pairing him with a senior developer or reducing his sprint scope. I moved three tickets to another colleague. I set a weekly check-in every Thursday at ten, wrote the agreed dates into our tracker and sent him the summary the same afternoon. The next two sprints were completed on time.' },
  { id: 'p3', name: 'Participant C', role: 'Department head, Healthcare', color: '#7c5cff', initials: 'C',
    text: 'I think communication is important. I always try to be open and clear with my team and I believe in feedback. We had some issues but we worked through them together and things improved.' }
];

/* ---------- analysis (rule-based stand-in for an LLM evidence pass) ---------- */
const wordCount = t => (t.trim().match(/\S+/g) || []).length;
const sentences = t => t.match(/[^.!?\n]+[.!?]*\s*/g) || [];
function concrete(s) {
  return /\d/.test(s) || /["“”]/.test(s) ||
    /\b(two|three|four|five|six|seven|eight|nine|ten|monday|tuesday|wednesday|thursday|friday|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(s) ||
    /\s[A-Z][a-z]{2,}/.test(s.trim().replace(/^\S+\s/, ' '));
}
function analyse(text) {
  const ss = sentences(text), words = wordCount(text), out = {};
  COMPS.forEach(c => {
    const hits = [];
    ss.forEach((s, i) => { if (c.pats.some(p => p.test(s.toLowerCase()))) hits.push(i); });
    const n = hits.length, k = hits.filter(i => concrete(ss[i])).length;
    const score = n === 0 ? 1 : n === 1 ? 2 : ((n >= 3 && k >= 1) || (n >= 2 && k >= 2)) ? 4 : 3;
    const conf = words < 60 ? 'low' : n >= 3 ? 'high' : 'medium';
    out[c.id] = { score, conf, hits, n };
  });
  return out;
}

/* ---------- state ---------- */
const state = { sessions: {}, current: 'p1', last: null, blind: true, custom: null, editing: false };
const getP = id => id === 'custom' && state.custom
  ? { id: 'custom', name: 'Your own text', role: 'Pasted response', color: '#14b8a6', initials: '+', text: state.custom }
  : PEOPLE.find(p => p.id === id) || PEOPLE[0];
function newSession(id) {
  const p = getP(id);
  const s = { id, text: p.text, ai: analyse(p.text), own: {}, final: {}, reason: {}, ownAfter: {}, revealed: false, lockOwn: true, signed: false, log: [], t0: Date.now(), t1: null };
  logE(s, 'file', `Response opened (${wordCount(p.text)} words)`);
  return s;
}
const session = id => state.sessions[id] || (state.sessions[id] = newSession(id));
function logE(s, icon, text) { s.log.push({ t: Date.now(), icon, text }); }
const mmss = ms => { const t = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const compName = id => COMPS.find(c => c.id === id).name;

/* ---------- illustrations ---------- */
function heroArt() {
  const rows = [[140, 230, null], [162, 262, '#ff6b57'], [184, 210, null], [206, 252, '#3b82f6'], [228, 190, null], [250, 258, '#7c5cff'], [272, 220, null], [294, 246, '#22a06b'], [316, 180, null], [338, 232, null]];
  const badge = { '#ff6b57': 1, '#3b82f6': 2, '#7c5cff': 3, '#22a06b': 4 };
  return `<svg viewBox="0 0 560 460" role="img" aria-label="Illustration: a participant response with highlighted evidence, an AI draft card, and the assessor's own rating card">
  <defs>
    <linearGradient id="hg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9e6ff"/><stop offset="1" stop-color="#fff0d9"/></linearGradient>
    <linearGradient id="hg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a5cff"/><stop offset="1" stop-color="#4b3fd6"/></linearGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#1d1a3a" flood-opacity=".15"/></filter>
  </defs>
  <path d="M60 120C40 60 140 10 250 30s250 20 270 120-30 200-120 250S160 440 90 360 80 180 60 120z" fill="url(#hg1)"/>
  <circle cx="500" cy="52" r="16" fill="#ffc24b"/><circle cx="54" cy="404" r="10" fill="#ff6b57"/>
  <path d="M26 300q15-20 30 0t30 0" stroke="#7c5cff" stroke-width="5" fill="none" stroke-linecap="round"/>
  <g filter="url(#sh)"><rect x="70" y="56" width="290" height="352" rx="22" fill="#fff"/></g>
  <circle cx="106" cy="98" r="19" fill="#ff6b57"/><text x="106" y="105" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-weight="700" font-size="19" fill="#fff">A</text>
  <rect x="136" y="86" width="116" height="10" rx="5" fill="#1d1a3a"/><rect x="136" y="104" width="80" height="8" rx="4" fill="#d9d5ea"/>
  ${rows.map(([y, w, c]) => `<rect x="94" y="${y}" width="${w}" height="10" rx="5" fill="${c || '#ebe8f4'}" ${c ? 'opacity=".9"' : ''}/>${c ? `<circle cx="${94 + w + 18}" cy="${y + 5}" r="9" fill="${c}"/><text x="${94 + w + 18}" y="${y + 9}" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="11" fill="#fff">${badge[c]}</text>` : ''}`).join('')}
  <g filter="url(#sh)"><rect x="296" y="108" width="236" height="178" rx="20" fill="#fff"/></g>
  <circle cx="326" cy="140" r="16" fill="url(#hg2)"/><text x="326" y="145" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="11" fill="#fff">AI</text>
  <text x="350" y="146" font-family="Inter,sans-serif" font-weight="700" font-size="15" fill="#1d1a3a">AI draft</text>
  <rect x="446" y="130" width="70" height="20" rx="10" fill="#e9e6ff"/><text x="481" y="144" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700" font-size="11" fill="#3a30b0">evidence</text>
  ${[['#ff6b57', 'Self-awareness', 4], ['#3b82f6', 'Perspective', 4], ['#7c5cff', 'Decisions', 3], ['#22a06b', 'Action', 3]].map(([c, l, v], i) => `<circle cx="318" cy="${176 + i * 26}" r="6" fill="${c}"/><text x="332" y="${180 + i * 26}" font-family="Inter,sans-serif" font-size="12" font-weight="600" fill="#4a4766">${l}</text>${[1, 2, 3, 4].map(k => `<rect x="${440 + k * 17}" y="${171 + i * 26}" width="13" height="10" rx="3" fill="${k <= v ? c : '#ebe8f4'}"/>`).join('')}`).join('')}
  <g filter="url(#sh)"><rect x="330" y="312" width="202" height="104" rx="20" fill="#fff"/></g>
  <text x="350" y="342" font-family="Inter,sans-serif" font-weight="700" font-size="15" fill="#1d1a3a">Your rating</text>
  <circle cx="500" cy="336" r="14" fill="#22a06b"/><path d="M493 336l5 5 9-10" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  ${[['#ff6b57', 3], ['#3b82f6', 4], ['#7c5cff', 3], ['#22a06b', 2]].map(([c, v], i) => `<circle cx="${358 + i * 44}" cy="378" r="14" fill="${c}"/><text x="${358 + i * 44}" y="383" text-anchor="middle" font-family="Fraunces,Georgia,serif" font-weight="700" font-size="15" fill="#fff">${v}</text>`).join('')}
  <path d="M300 214c-14 0-14 36-34 36" stroke="#4b3fd6" stroke-width="3" fill="none" stroke-dasharray="2 7" stroke-linecap="round"/>
</svg>`;
}

function radar(series) {
  const cx = 180, cy = 140, R = 92, A = [-90, 0, 90, 180].map(a => a * Math.PI / 180);
  const pt = (i, v) => [cx + Math.cos(A[i]) * R * v / 4, cy + Math.sin(A[i]) * R * v / 4];
  const poly = vals => vals.map((v, i) => pt(i, v).map(n => n.toFixed(1)).join(',')).join(' ');
  const labels = [[cx, cy - R - 16, 'middle'], [cx + R + 12, cy + 4, 'start'], [cx, cy + R + 26, 'middle'], [cx - R - 12, cy + 4, 'end']];
  return `<svg viewBox="0 0 360 300" role="img" aria-label="Radar chart comparing ratings across the four competencies">
  ${[1, 2, 3, 4].map(l => `<polygon points="${poly([l, l, l, l])}" fill="${l % 2 ? '#faf8f3' : '#fff'}" stroke="#e1dccf" stroke-width="1"/>`).join('')}
  ${A.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${pt(i, 4)[0]}" y2="${pt(i, 4)[1]}" stroke="#e1dccf"/>`).join('')}
  ${series.map(s => `<polygon points="${poly(s.vals)}" fill="${s.fill || 'none'}" fill-opacity="${s.fill ? .22 : 0}" stroke="${s.color}" stroke-width="2.5" ${s.dash ? 'stroke-dasharray="6 5"' : ''} stroke-linejoin="round"/>${s.vals.map((v, i) => `<circle cx="${pt(i, v)[0]}" cy="${pt(i, v)[1]}" r="4" fill="${s.color}"/>`).join('')}`).join('')}
  ${COMPS.map((c, i) => `<text x="${labels[i][0]}" y="${labels[i][1]}" text-anchor="${labels[i][2]}" font-family="Inter,sans-serif" font-size="12.5" font-weight="700" fill="${c.color}">${c.short}</text>`).join('')}
  <text x="${cx + 4}" y="${cy - R * .25 + 3}" font-family="Inter,sans-serif" font-size="9" fill="#9a96b0">1</text><text x="${cx + 4}" y="${cy - R + 3}" font-family="Inter,sans-serif" font-size="9" fill="#9a96b0">4</text>
</svg>`;
}

/* ---------- views: overview ---------- */
function viewHome() {
  return `<div class="page">
  <section class="hero">
    <div>
      <span class="eyebrow">${ic('layers', 'sm')} Prototype for atrain's Innovation Hub · Problem 01: Reinvent Assessment</span>
      <h1>Let AI draft the evidence. Let people <span class="hl">make the call.</span></h1>
      <p class="lede">Judgment Layer is a working prototype of an assessment flow. The AI reads a participant's response and finds the evidence for each competency. The assessor still rates first, decides last and signs the result.</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="#/workspace">${ic('play')} Try the workspace</a>
        <a class="btn" href="#/why">${ic('help')} Why it works this way</a>
      </div>
    </div>
    <div class="hero-art">${heroArt()}</div>
  </section>

  <section class="section">
    <span class="tag">Three design principles</span>
    <h2>Fast like AI. Accountable like a person.</h2>
    <div class="grid g3 principles" style="margin-top:20px">
      <div class="card" style="--c:#7c5cff"><div class="ibub">${ic('eye-off', 'lg')}</div><h3>Rate first</h3><p>The AI draft stays hidden until the assessor has committed their own ratings. A number you have already seen is a number you drift towards.</p></div>
      <div class="card" style="--c:#3b82f6"><div class="ibub">${ic('quote', 'lg')}</div><h3>Evidence, not verdicts</h3><p>Every suggested score points to the exact sentences behind it. When the evidence is thin, the tool says so and proposes a follow-up question.</p></div>
      <div class="card" style="--c:#22a06b"><div class="ibub">${ic('shield', 'lg')}</div><h3>Overrides need reasons</h3><p>If the final rating differs from the draft, the assessor writes why. The record shows who decided what, and when.</p></div>
    </div>
  </section>

  <section class="section duo">
    <div class="art">${sceneTalk()}</div>
    <div>
      <span class="tag">Where the response comes from</span>
      <h2 style="margin-top:6px">It starts with a real conversation</h2>
      <p class="lede" style="margin-top:12px">In a leadership simulation, participants write about a situation from their own work, such as giving a colleague difficult feedback. The assessor reads that text and rates how it shows four competencies.</p>
      <ul class="list">
        <li>${ic('check')}<span>A short written reflection, not a test with right answers</span></li>
        <li>${ic('check')}<span>Four competencies, each rated 1 to 4 against a written rubric</span></li>
        <li>${ic('check')}<span>The same flow for every participant, so ratings stay comparable</span></li>
      </ul>
    </div>
  </section>

  <section class="section">
    <span class="tag">The assessor's flow</span>
    <h2>Four steps, one clear owner for each</h2>
    <div class="grid g4 steps4" style="margin-top:28px">
      <div class="card step"><div class="ibub" style="--c:#ff6b57">${ic('book')}</div><h3>Read</h3><p>Open a participant's written reflection from the queue.</p></div>
      <div class="card step"><div class="ibub" style="--c:#3b82f6">${ic('pen')}</div><h3>Rate</h3><p>Score four competencies from 1 to 4 on your own, with the rubric beside you.</p></div>
      <div class="card step"><div class="ibub" style="--c:#7c5cff">${ic('layers')}</div><h3>Compare</h3><p>Reveal the AI draft, check its evidence, and see where you and it differ.</p></div>
      <div class="card step"><div class="ibub" style="--c:#22a06b">${ic('shield')}</div><h3>Sign off</h3><p>Set final ratings, explain any difference, and sign a record with an audit trail.</p></div>
    </div>
  </section>

  <section class="section">
    <span class="tag">The brief</span>
    <h2>Two of atrain's questions, answered in the product</h2>
    <div class="grid g2" style="margin-top:20px">
      <div class="q">
        <span class="tag">Question 01</span>
        <h3>How could AI make assessments faster and smarter without losing the human judgment that makes them valuable?</h3>
        <div class="answers">
          <div>${ic('check')}<span><b>Faster:</b> evidence is pre-highlighted, and gaps come with a follow-up question.</span></div>
          <div>${ic('check')}<span><b>Smarter:</b> blind-first rating guards against anchoring, and a radar shows where you and the AI differ.</span></div>
          <div>${ic('check')}<span><b>Still human:</b> the final rating is always the assessor's, with a reason when it differs.</span></div>
        </div>
      </div>
      <div class="q" style="background:#2a1f6e">
        <span class="tag">Question 02</span>
        <h3>What could consultants achieve if AI handled the routine work and humans focused entirely on creating impact?</h3>
        <div class="answers">
          <div>${ic('check')}<span><b>Routine work, drafted:</b> reading, highlighting and the first evidence table.</span></div>
          <div>${ic('check')}<span><b>Record, assembled:</b> ratings, reasons and timeline are compiled automatically.</span></div>
          <div>${ic('check')}<span><b>Time kept for judgment:</b> the assessor spends it on the cases where they disagree with the draft.</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="band">
    <h2>Try it with a sample participant</h2>
    <a class="btn" href="#/workspace">${ic('arrow')} Open the workspace</a>
  </section>
  </div>`;
}

/* ---------- views: why ---------- */
function node(icon, color, title, text) {
  return `<div class="node"><div class="ibub" style="--c:${color}">${ic(icon)}</div><b>${title}</b>${text}</div>`;
}
function viewWhy() {
  return `<div class="page">
  <div class="pagehead head2">
    <div>
      <span class="eyebrow">${ic('help', 'sm')} Why it exists</span>
      <h1>Assessment is slow, and AI alone makes it risky</h1>
      <p class="lede">Reading every written response closely takes hours. Handing the scoring to an AI is quick, but it moves the judgment somewhere nobody can question it. This prototype looks for the middle path.</p>
    </div>
    <div class="art">${sceneDesk()}</div>
  </div>

  <section class="section" style="margin-top:36px">
    <h2>Three tensions in AI-assisted assessment</h2>
    <div class="grid g3" style="margin-top:20px">
      <div class="card"><div class="ibub" style="--c:#ff6b57">${ic('clock', 'lg')}</div><h3>Speed against depth</h3><p>Close reading finds the detail that matters, but it does not scale. Skimming scales, but it misses what makes a response strong or weak.</p></div>
      <div class="card"><div class="ibub" style="--c:#3b82f6">${ic('target', 'lg')}</div><h3>Anchoring</h3><p>People tend to settle near a number they have already seen. If the AI score appears first, it quietly becomes the assessor's first guess.</p></div>
      <div class="card"><div class="ibub" style="--c:#7c5cff">${ic('shield', 'lg')}</div><h3>Accountability</h3><p>When a rating is questioned, "the tool said so" is not an answer. Someone has to own the decision and be able to explain it.</p></div>
    </div>
  </section>

  <section class="section">
    <h2>Two ways to put AI into the loop</h2>
    <div class="lane-title bad">${ic('alert')} Typical AI scoring: the AI speaks first</div>
    <div class="lane">
      ${node('file', '#6f6c8a', 'Response in', 'A written reflection arrives.')}<span class="arrow">${ic('arrow')}</span>
      ${node('layers', '#7c5cff', 'AI gives a score', 'A number appears before the assessor has formed a view.')}<span class="arrow">${ic('arrow')}</span>
      ${node('users', '#ff6b57', 'Human nods along', 'Agreeing is faster than disagreeing.')}<span class="arrow">${ic('arrow')}</span>
      ${node('lock', '#6f6c8a', 'Score recorded', 'Nobody can tell whose judgment it was.')}
    </div>
    <div class="lane-title good">${ic('check')} Judgment Layer: the assessor speaks first</div>
    <div class="lane">
      ${node('file', '#6f6c8a', 'Response in', 'Same input.')}<span class="arrow">${ic('arrow')}</span>
      ${node('pen', '#3b82f6', 'Human rates first', 'The AI draft stays hidden.')}<span class="arrow">${ic('arrow')}</span>
      ${node('layers', '#7c5cff', 'AI draft revealed', 'Scores with linked evidence and confidence.')}<span class="arrow">${ic('arrow')}</span>
      ${node('scale', '#ff6b57', 'Differences explained', 'A radar shows where you and the AI split.')}<span class="arrow">${ic('arrow')}</span>
      ${node('shield', '#22a06b', 'Human decides, signs', 'Reasons and a timeline go on the record.')}
    </div>
  </section>

  <section class="section">
    <h2>What the AI does, and what it never does</h2>
    <div class="split" style="margin-top:20px">
      <div class="card yes"><span class="chip ok">${ic('check', 'sm')} The AI does</span>
        <ul class="list">
          <li>${ic('check')}<span>Finds the sentences that show each competency</span></li>
          <li>${ic('check')}<span>Estimates how strong the evidence is, and how confident it is</span></li>
          <li>${ic('check')}<span>Flags thin evidence and proposes a follow-up question</span></li>
          <li>${ic('check')}<span>Assembles the record and the audit trail</span></li>
        </ul></div>
      <div class="card no"><span class="chip warn">${ic('alert', 'sm')} The AI never</span>
        <ul class="list">
          <li>${ic('alert')}<span>Sets the final rating</span></li>
          <li>${ic('alert')}<span>Shows its score before the assessor has rated</span></li>
          <li>${ic('alert')}<span>Hides where its evidence came from</span></li>
          <li>${ic('alert')}<span>Judges tone, sincerity or the person behind the text</span></li>
        </ul></div>
    </div>
  </section>

  <section class="section">
    <p class="pull">Speed from the machine. <span>Judgment from the person.</span> A record that shows which was which.</p>
  </section>

  <section class="band">
    <h2>See it work on a real flow</h2>
    <a class="btn" href="#/workspace">${ic('arrow')} Open the workspace</a>
  </section>
  </div>`;
}

/* ---------- views: how ---------- */
function viewHow() {
  const evJSON = esc(`{
  "competency": "decision_quality",
  "score": 3,
  "confidence": "medium",
  "evidence": [
    { "sentence": 7, "quote": "We compared three options: ..." },
    { "sentence": 8, "quote": "We chose the shorter format because ..." }
  ],
  "gap": null,
  "follow_up": null
}`);
  const recJSON = esc(`{
  "participant": "A",
  "ratings": [
    { "competency": "Decision quality",
      "first": 3, "ai_draft": 3, "final": 3, "reason": null }
  ],
  "blind_first": true,
  "audit": [ "Response opened", "Rated", "AI draft revealed", "Signed off" ]
}`);
  const step = (icon, color, who, whoLabel, title, text, extra = '') => `<div class="pstep"><div class="pdot" style="--c:${color}">${ic(icon, 'lg')}</div><div class="pbody"><span class="who ${who}">${whoLabel}</span><h3>${title}</h3><p>${text}</p>${extra}</div></div>`;
  return `<div class="page">
  <div class="pagehead">
    <span class="eyebrow">${ic('layers', 'sm')} How it works</span>
    <h1>Six steps, with a clear owner for every one</h1>
    <p class="lede">The flow is the product. The analysis step can be swapped for a better model later without changing who owns the decision.</p>
  </div>

  <div class="pipe">
    ${step('file', '#6f6c8a', 'human', 'Input', '1. Response comes in', 'A participant writes a short reflection in a leadership simulation. In this prototype it is sample text, or text you paste.')}
    ${step('layers', '#7c5cff', 'ai', 'AI, hidden', '2. Evidence pass runs in the background', 'Each sentence is checked against the four competencies. The result is a score, a confidence level and the supporting quotes. The assessor cannot see it yet.', `<div class="code">${evJSON}</div>`)}
    ${step('pen', '#3b82f6', 'human', 'Assessor', '3. Blind rating', 'The assessor reads the response and rates each competency from 1 to 4, using a rubric that describes what each level looks like.')}
    ${step('eye', '#ff6b57', 'both', 'Both', '4. Reveal and compare', 'The draft appears with linked evidence. A radar chart overlays the assessor\'s first ratings and the AI draft. Differences are labelled, not hidden.')}
    ${step('scale', '#f59e0b', 'human', 'Assessor', '5. Final rating with a reason', 'The assessor keeps their rating, takes the AI\'s, or sets another. Any final rating that differs from the draft needs a short written reason.')}
    ${step('shield', '#22a06b', 'human', 'Assessor signs', '6. Signed record', 'The record stores first rating, AI draft, final rating, reasons, whether anything changed after the reveal, the time taken and a timeline.', `<div class="code">${recJSON}</div>`)}
  </div>

  <section class="section">
    <h2>What is real in this prototype, and what is a stand-in</h2>
    <div class="split" style="margin-top:20px">
      <div class="card"><span class="chip ok">${ic('check', 'sm')} Working now</span>
        <ul class="list">
          <li>${ic('check')}<span>Blind-first flow with a locked AI draft</span></li>
          <li>${ic('check')}<span>Evidence linked back to the exact sentences</span></li>
          <li>${ic('check')}<span>Confidence levels, thin-evidence flags and follow-up questions</span></li>
          <li>${ic('check')}<span>Reasons required for overrides, and an audit trail</span></li>
          <li>${ic('check')}<span>Works on pasted text as well as the samples</span></li>
        </ul></div>
      <div class="card"><span class="chip info">${ic('code', 'sm')} Stand-in</span>
        <p style="margin-top:12px">The evidence pass is a <b>rule-based analyser</b>. It matches phrase patterns per competency, counts distinct evidence sentences and checks how concrete they are. It is deliberately simple, and it runs in your browser.</p>
        <p style="margin-top:10px">A language model would read context, not patterns. The rest of the flow would stay as it is, which is why the model is not the interesting part of this prototype.</p></div>
    </div>
  </section>

  <section class="section">
    <h2>From prototype to product</h2>
    <p class="lede" style="margin-top:8px">How I would take this forward with a team.</p>
    <div class="road">
      <div class="rcard" style="--c:#7c5cff"><span class="tag">Now</span><h3>Prototype</h3><p>The review flow, rubric and record, with a rule-based evidence pass.</p></div>
      <div class="rcard" style="--c:#3b82f6"><span class="tag">Next</span><h3>Model-based evidence</h3><p>Replace the analyser with an LLM that returns structured output. Reject any quote that is not literally in the text.</p></div>
      <div class="rcard" style="--c:#ff6b57"><span class="tag">Then</span><h3>Calibrate with assessors</h3><p>Compare drafts with experienced assessors' ratings on real, consented examples. Tune the rubric wording.</p></div>
      <div class="rcard" style="--c:#22a06b"><span class="tag">Later</span><h3>Fairness and data care</h3><p>Review for bias across groups, minimise stored data, and involve data protection and the works council early.</p></div>
    </div>
  </section>

  <section class="section">
    <h2>What I would measure</h2>
    <div class="grid g4" style="margin-top:20px">
      <div class="card"><div class="ibub" style="--c:#ff6b57">${ic('clock')}</div><h3>Time per assessment</h3><p>Does the evidence pass really save time, and where?</p></div>
      <div class="card"><div class="ibub" style="--c:#3b82f6">${ic('scale')}</div><h3>Agreement rate</h3><p>How often the first rating and the draft match.</p></div>
      <div class="card"><div class="ibub" style="--c:#7c5cff">${ic('pen')}</div><h3>Override rate</h3><p>How often final ratings differ from the draft, and why.</p></div>
      <div class="card"><div class="ibub" style="--c:#22a06b">${ic('eye')}</div><h3>Changed after reveal</h3><p>A direct signal of anchoring when blind-first is switched off.</p></div>
    </div>
  </section>
  </div>`;
}

/* ---------- views: build ---------- */
function viewBuild() {
  const st = (icon, color, title, text) => `<div class="card step"><div class="ibub" style="--c:${color}">${ic(icon)}</div><h3>${title}</h3><p>${text}</p></div>`;
  return `<div class="page">
  <div class="pagehead head2">
    <div>
      <span class="eyebrow">${ic('code', 'sm')} About the build</span>
      <h1>Why I built this, and how</h1>
      <p class="lede">atrain's job post asks for something that shows how you think and build, and says not to send a cover letter. So this is my answer to the first of their three problems: reinvent assessment without losing human judgment.</p>
    </div>
    <div class="art">${sceneBuild()}</div>
  </div>

  <section class="section" style="margin-top:36px">
    <h2>The process</h2>
    <div class="grid g3 steps4" style="margin-top:28px">
      ${st('book', '#ff6b57', 'Read the brief', 'Three problems, one mission: turn an idea into a working prototype, not a slide.')}
      ${st('target', '#3b82f6', 'Pick the problem', 'I chose "Reinvent Assessment" because the hard part is trust, not model quality.')}
      ${st('layers', '#7c5cff', 'Design the flow', 'Blind-first rating, linked evidence, reasoned overrides and an audit trail came before any code.')}
      ${st('code', '#22a06b', 'Build with an AI coding agent', 'Plain HTML, CSS and JavaScript, built with Claude Code. No frameworks, so anyone can open and read it.')}
      ${st('check', '#f59e0b', 'Test and correct', 'The whole flow was click-tested, including the rating gate and the required reasons. Scoring rules that gave wrong results on the samples were found and fixed.')}
      ${st('rocket', '#14b8a6', 'Ship it', 'Hosted as a static site, so the link opens straight away with nothing to install.')}
    </div>
  </section>

  <section class="section">
    <div class="split">
      <div class="card">
        <div class="me">
          <div class="avatar">MS</div>
          <div>
            <h2 style="font-size:28px">Megha Singh</h2>
            <p style="margin-top:6px">B.Tech in Information Technology and a Master's in Entrepreneurship and Digital Transformation from Hochschule München. Thesis on how people perceive AI-generated content, graded 1.0.</p>
          </div>
        </div>
        <p style="margin-top:14px">At Infineon I built AI workflows and n8n automation for a marketing team, and I built the Framer website for About-Watt, a second-life EV battery startup. I work in Git, GitHub, Figma and Framer.</p>
        <div class="links-row">
          <a class="btn btn-sm" href="https://www.linkedin.com/in/meghasingh5554/" target="_blank" rel="noopener">${ic('link', 'sm')} LinkedIn</a>
          <a class="btn btn-sm" href="https://singhmeghade-de.github.io/megha-singh-portfolio/" target="_blank" rel="noopener">${ic('link', 'sm')} Portfolio</a>
          <a class="btn btn-sm" href="https://about-watt.framer.website" target="_blank" rel="noopener">${ic('link', 'sm')} About-Watt site</a>
        </div>
      </div>
      <div class="card">
        <span class="tag">Stack</span>
        <div class="stack"><span class="chip">HTML</span><span class="chip">CSS</span><span class="chip">JavaScript</span><span class="chip">Inline SVG</span><span class="chip">Static hosting</span><span class="chip">Claude Code</span></div>
        <h3 style="margin-top:20px">What I would do next with the team</h3>
        <ul class="list">
          <li>${ic('check')}<span>Sit with an assessor and watch the flow on a real batch of responses</span></li>
          <li>${ic('check')}<span>Replace the rule-based evidence pass with a model, and measure agreement</span></li>
          <li>${ic('check')}<span>Pair with your Experience Design counterpart on the rubric language and the reveal moment</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="band">
    <h2>Now try the tool itself</h2>
    <a class="btn" href="#/workspace">${ic('arrow')} Open the workspace</a>
  </section>
  </div>`;
}

/* ---------- views: workspace ---------- */
function stats(s) {
  const ratedN = COMPS.filter(c => s.own[c.id] != null).length;
  const finals = COMPS.filter(c => s.final[c.id] != null).length;
  const reasonsOk = COMPS.every(c => s.final[c.id] === s.ai[c.id].score || (s.reason[c.id] || '').trim().length >= 3);
  const stage = s.signed ? 4 : s.revealed ? 3 : ratedN > 0 ? 2 : 1;
  return { ratedN, finals, reasonsOk, stage, ready: s.revealed && finals === 4 && reasonsOk };
}
function status(s) {
  const { ratedN } = stats(s);
  return s.signed ? '<span class="chip ok">Signed</span>' : s.revealed ? '<span class="chip info">Comparing</span>' : ratedN ? `<span class="chip warn">${ratedN}/4</span>` : '<span class="chip">New</span>';
}
function renderText(s) {
  const ss = sentences(s.text); let h = '';
  ss.forEach((t, i) => {
    const cs = s.revealed ? COMPS.filter(c => s.ai[c.id].hits.includes(i)) : [];
    if (!cs.length) { h += esc(t); return; }
    const trail = t.match(/\s*$/)[0], core = t.slice(0, t.length - trail.length);
    const shadow = cs.map((c, j) => `inset 0 -${2 + j * 3}px 0 ${c.color}`).join(',');
    h += `<span class="ev" id="s${i}" style="box-shadow:${shadow};background:color-mix(in srgb,${cs[0].color} 14%,white)">${esc(core)}<sup>${cs.map(c => c.n).join('·')}</sup></span>${esc(trail)}`;
  });
  return h;
}
function levelButtons(kind, c, current, locked, s) {
  return [1, 2, 3, 4].map(v => `<button class="lvl" data-act="${kind}" data-c="${c.id}" data-v="${v}" data-key="${kind}-${c.id}-${v}" aria-pressed="${current === v}" ${locked ? 'disabled' : ''} title="${esc(c.anchors[v])}"><span class="bars">${[1, 2, 3, 4].map(i => `<i class="${i <= v ? 'on' : ''}"></i>`).join('')}</span>${v} · ${LEVELS[v]}</button>`).join('');
}
function compCard(c, s) {
  const a = s.ai[c.id], own = s.own[c.id], fin = s.final[c.id];
  const ss = sentences(s.text);
  const lockOwn = s.signed || (s.revealed && s.lockOwn);
  let h = `<div class="ccard" style="--c:${c.color}"><div class="chead"><div class="ibub" style="--c:${c.color}">${ic(c.icon)}</div><div><h3>${c.n}. ${c.name}</h3><p>${c.def}</p></div></div>`;
  h += `<div class="lab">${s.revealed && s.lockOwn ? 'Your first rating' : 'Your rating'}</div><div class="lvls" role="group" aria-label="${c.name} rating">${levelButtons('own', c, own, lockOwn, s)}</div>`;
  h += `<p class="anchor">${own ? `<b>${LEVELS[own]}:</b> ${esc(c.anchors[own])}` : 'Pick a level. Hover a level to read what it means.'}</p>`;
  if (s.revealed) {
    const diff = own == null ? '' : a.score === own ? `<span class="chip ok">${ic('check', 'sm')} Matches your rating</span>` : `<span class="chip warn">${a.score > own ? 'AI is higher' : 'AI is lower'} by ${Math.abs(a.score - own)}</span>`;
    h += `<div class="aiblk"><div class="aihead"><b>${ic('layers', 'sm')} AI draft: ${a.score} · ${LEVELS[a.score]}</b><span class="chip">Confidence: ${a.conf}</span>${diff}</div>`;
    if (a.hits.length) h += a.hits.slice(0, 3).map(i => `<button class="quote" data-act="flash" data-i="${i}">“${esc(ss[i].trim().slice(0, 150))}${ss[i].trim().length > 150 ? '…' : ''}”</button>`).join('');
    if (a.score <= 2) h += `<div class="gap">${ic('alert', 'sm')}<span>Thin evidence for this competency in the text.</span></div>`;
    if (a.conf === 'low') h += `<div class="gap">${ic('alert', 'sm')}<span>Low confidence: the response is very short.</span></div>`;
    if (a.score <= 2 || a.conf === 'low') h += `<div class="probe">${ic('help', 'sm')}<span><b>Follow-up question:</b> ${c.probe}</span></div>`;
    h += `</div><div class="lab">Your final rating</div><div class="finrow">
      <button class="btn btn-sm" data-act="keep" data-c="${c.id}" ${own == null || s.signed ? 'disabled' : ''}>Keep mine</button>
      <button class="btn btn-sm" data-act="useai" data-c="${c.id}" ${s.signed ? 'disabled' : ''}>Use AI's</button></div>
      <div class="lvls" role="group" aria-label="${c.name} final rating">${levelButtons('final', c, fin, s.signed, s)}</div>`;
    if (fin != null && fin !== a.score) h += `<div style="margin-top:12px"><label class="lab" for="r-${c.id}" style="display:block">Why does your final rating differ from the draft?</label><input class="reason ${(s.reason[c.id] || '').trim().length >= 3 ? 'ok' : ''}" id="r-${c.id}" data-reason="${c.id}" type="text" placeholder="A short reason, for the record" value="${esc(s.reason[c.id] || '')}" ${s.signed ? 'disabled' : ''}></div>`;
  }
  return h + '</div>';
}
function viewWorkspace(arg) {
  const id = (arg === 'custom' && !state.custom) ? 'p1' : (arg || state.current || 'p1');
  state.current = id;
  const p = getP(id), s = session(id), st = stats(s);
  const names = ['Read & rate', 'Keep rating', 'Compare with AI', 'Sign off'];
  const stepIcons = ['book', 'pen', 'layers', 'shield'];
  const coach = s.signed ? ['check', 'Signed and recorded', 'The assessment is signed. Open the record to see the comparison and the audit trail.', `<a class="btn btn-primary btn-sm" href="#/report">${ic('file', 'sm')} View the record</a>`]
    : st.stage === 1 ? ['book', `Step 1: read ${p.name}'s response, then rate`, 'Rate each competency from 1 to 4 on your own. The AI draft is hidden on purpose, so it cannot steer you.', `<button class="btn btn-sm" data-act="fill">${ic('play', 'sm')} Fill in sample ratings</button>`]
    : st.stage === 2 ? (st.ratedN === 4 ? ['layers', 'All four rated, ready to compare', 'Your ratings are locked in. Reveal the AI draft when you are ready to compare.', '']
      : ['pen', `Step 2: ${st.ratedN} of 4 rated`, state.blind ? 'Rate the remaining competencies to unlock the AI draft.' : 'Blind-first is off, so you can reveal the draft now. Rating after the reveal is marked on the record.', ''])
    : st.stage === 3 ? ['layers', 'Step 3: compare with the AI draft', 'Check the evidence the AI used, then set your final rating. Where it differs from the draft, add a short reason.', '']
    : ['shield', 'Ready', '', ''];
  const customCard = state.custom ? `<button class="pcard ${id === 'custom' ? 'on' : ''}" data-act="pick" data-id="custom"><span class="pav" style="--c:#14b8a6">+</span><span><b>Your own text</b><small>Pasted response</small></span><span class="pst">${status(session('custom'))}</span></button>` : '';
  const radarBlk = s.revealed ? `<div class="card radarc"><h3>${ic('chart')} You and the AI, side by side</h3>${radar([
    { vals: COMPS.map(c => s.own[c.id] || 0), color: '#ff6b57', fill: '#ff6b57' },
    { vals: COMPS.map(c => s.ai[c.id].score), color: '#4b3fd6', dash: true }
  ])}<div class="rleg"><span><i style="background:#ff6b57"></i>Your first rating</span><span><i style="background:#4b3fd6"></i>AI draft</span></div></div>` : '';
  const pct = Math.round((s.revealed ? (st.finals / 4) : (st.ratedN / 4)) * 100);
  const bar = s.signed ? '' : `<div class="actbar"><div class="prog"><small>${s.revealed ? `${st.finals} of 4 final ratings set` : `${st.ratedN} of 4 rated`}</small><div><span style="width:${pct}%"></span></div></div><div class="actbtns">
      ${s.revealed ? `<button class="btn btn-coral" data-act="signoff" ${st.ready ? '' : 'disabled'}>${ic('shield', 'sm')} Sign off</button>` : `<button class="btn btn-coral" data-act="reveal" ${state.blind && st.ratedN < 4 ? 'disabled' : ''}>${ic('layers', 'sm')} Reveal AI draft</button>`}</div></div>
      <p class="anchor" style="text-align:right;margin-top:8px">${s.revealed ? (st.finals < 4 ? 'Set a final rating for each competency.' : (!st.reasonsOk ? 'Add a short reason wherever your final rating differs from the draft.' : '')) : (state.blind && st.ratedN < 4 ? 'Rate all four competencies to unlock the AI draft.' : '')}</p>`;

  return `<div class="page">
  <div class="ws-head"><div><span class="eyebrow">${ic('users', 'sm')} Assessor workspace</span><h1 style="margin-top:12px">Assess a response</h1><p>Pick a participant, rate on your own, then compare with the AI draft. Everything here is sample data.</p></div>
    <label style="display:flex;gap:10px;align-items:flex-start;max-width:340px;font-size:14px;color:var(--ink2)"><input type="checkbox" id="blind" ${state.blind ? 'checked' : ''} style="width:20px;height:20px;margin-top:2px;accent-color:#4b3fd6"><span><b style="color:var(--ink)">Rate first, then reveal</b><br>Hides the AI draft until all four ratings are in.</span></label></div>
  <div class="coach" aria-live="polite"><div class="ibub" style="--c:#4b3fd6">${ic(coach[0])}</div><div><b>${esc(coach[1])}</b><p>${coach[2]}</p>${coach[3] ? `<div class="acts">${coach[3]}</div>` : ''}</div></div>
  <ol class="stepper" aria-label="Progress">${names.map((n, i) => `<li class="${i + 1 === st.stage && !s.signed ? 'on' : (i + 1 < st.stage || s.signed) ? 'done' : ''}">${ic(i + 1 < st.stage || s.signed ? 'check' : stepIcons[i], 'sm')} ${n}</li>`).join('')}</ol>
  <div class="ws-grid">
    <aside class="people"><h2>Participants</h2><div class="people-list">
      ${PEOPLE.map(q => `<button class="pcard ${id === q.id ? 'on' : ''}" data-act="pick" data-id="${q.id}"><span class="pav" style="--c:${q.color}">${q.initials}</span><span><b>${q.name}</b><small>${q.role}</small></span><span class="pst">${status(session(q.id))}</span></button>`).join('')}
      ${customCard}
      <button class="btn btn-sm" data-act="edit" style="width:100%">${ic('plus', 'sm')} Paste your own response</button></div></aside>
    <article class="card respc">
      <div class="rhead"><span class="pav" style="--c:${p.color};width:46px;height:46px">${p.initials}</span><div><h2>${esc(p.name)}</h2><small>${esc(p.role)} · ${wordCount(s.text)} words</small></div></div>
      <div class="promptbox"><b>Prompt:</b> ${PROMPT}</div>
      <div class="response ${state.editing ? 'hidden' : ''}">${renderText(s)}</div>
      <div class="${state.editing ? '' : 'hidden'}"><textarea id="ta" aria-label="Paste a participant response">${esc(state.custom || '')}</textarea><div class="tools"><button class="btn btn-primary btn-sm" data-act="applyEdit">Use this text</button><button class="btn btn-sm" data-act="cancelEdit">Cancel</button></div></div>
      ${s.revealed ? `<div class="legend">${COMPS.map(c => `<span style="--c:${c.color}"><i></i>${c.n} ${c.short}</span>`).join('')}</div>` : `<p class="anchor" style="margin-top:12px">${ic('lock', 'sm')} AI evidence highlights appear after you reveal the draft.</p>`}
      <div class="tools"><button class="btn btn-sm" data-act="reset">${ic('history', 'sm')} Start this one over</button></div>
    </article>
    <section>${radarBlk}${COMPS.map(c => compCard(c, s)).join('')}${bar}</section>
  </div></div>`;
}

/* ---------- views: report ---------- */
function viewReport() {
  const s = state.last && state.sessions[state.last];
  if (!s || !s.signed) return `<div class="page"><div class="card empty" style="margin-top:40px"><div class="ibub" style="--c:#7c5cff">${ic('file', 'lg')}</div><h2>No signed assessment yet</h2><p class="lede" style="margin:10px auto 20px">Rate a participant, compare with the AI draft and sign off. The record appears here.</p><a class="btn btn-primary" href="#/workspace">${ic('arrow')} Open the workspace</a></div></div>`;
  const p = getP(s.id);
  const overrides = COMPS.filter(c => s.final[c.id] !== s.ai[c.id].score).length;
  const changed = COMPS.filter(c => s.own[c.id] != null && s.final[c.id] !== s.own[c.id]).length;
  const delta = c => { const d = s.final[c.id] - s.ai[c.id].score; return d === 0 ? '<span class="chip ok">Matches AI</span>' : `<span class="chip warn">${d > 0 ? 'Above' : 'Below'} AI by ${Math.abs(d)}</span>`; };
  return `<div class="page">
  <div class="pagehead"><span class="eyebrow">${ic('shield', 'sm')} Signed assessment</span><h1>${esc(p.name)}</h1><p class="lede">${esc(p.role)}. Signed by the assessor on ${new Date(s.t1).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.</p></div>
  <div class="rep-top">
    <div class="card"><h3 style="display:flex;gap:8px;align-items:center">${ic('chart')} Your final ratings against the AI draft</h3>${radar([
      { vals: COMPS.map(c => s.ai[c.id].score), color: '#4b3fd6', dash: true },
      { vals: COMPS.map(c => s.final[c.id]), color: '#22a06b', fill: '#22a06b' }
    ])}<div class="rleg"><span><i style="background:#22a06b"></i>Final rating</span><span><i style="background:#4b3fd6"></i>AI draft</span></div></div>
    <div>
      <div class="stats"><div class="stat"><b>${mmss(s.t1 - s.t0)}</b><small>Time in this session</small></div><div class="stat"><b>${overrides}/4</b><small>Differ from AI draft</small></div><div class="stat"><b>${changed}/4</b><small>Changed after reveal</small></div></div>
      <div class="card" style="padding:8px 14px"><div style="overflow-x:auto"><table><tr><th>Competency</th><th>First</th><th>AI</th><th>Final</th><th>Reason</th></tr>
      ${COMPS.map(c => `<tr><td><span class="dotc" style="--c:${c.color}"></span>${c.name}</td><td>${s.own[c.id] ?? 'none'}</td><td>${s.ai[c.id].score}</td><td><b>${s.final[c.id]}</b><br>${delta(c)}</td><td>${esc(s.reason[c.id] || '')}</td></tr>`).join('')}</table></div></div>
    </div>
  </div>
  <section class="section" style="margin-top:28px"><div class="card"><h3 style="display:flex;gap:8px;align-items:center">${ic('history')} Audit trail</h3>
    <ol class="tl">${s.log.map(l => `<li><div class="ibub" style="--c:#4b3fd6">${ic(l.icon, 'sm')}</div><span>${esc(l.text)}</span><small>+${mmss(l.t - s.t0)}</small></li>`).join('')}</ol>
    <div class="tools"><button class="btn btn-sm" data-act="copy" id="copyBtn">${ic('copy', 'sm')} Copy as JSON</button><button class="btn btn-sm" data-act="print">${ic('print', 'sm')} Print</button><a class="btn btn-primary btn-sm" href="#/workspace">${ic('arrow', 'sm')} Assess another</a></div></div></section>
  </div>`;
}

/* ---------- router ---------- */
const ROUTES = { '': viewHome, why: viewWhy, workspace: viewWorkspace, report: viewReport, how: viewHow, build: viewBuild };
let lastKey = null;
function render() {
  const [route = '', arg] = location.hash.replace(/^#\/?/, '').split('/');
  const fn = ROUTES[route] || viewHome;
  const keepScroll = render.prev === route + '/' + (arg || '') ? window.scrollY : 0;
  $('#view').innerHTML = fn(arg);
  document.querySelectorAll('[data-nav]').forEach(a => {
    const on = (a.dataset.nav === 'home' ? '' : a.dataset.nav) === route || (route === 'report' && a.dataset.nav === 'workspace');
    a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const same = render.prev === route + '/' + (arg || '');
  render.prev = route + '/' + (arg || '');
  if (!same && $('#view').firstElementChild) $('#view').firstElementChild.classList.add('enter');
  window.scrollTo(0, same ? keepScroll : 0);
  if (lastKey) { const el = document.querySelector(`[data-key="${lastKey}"]`); if (el) el.focus({ preventScroll: true }); lastKey = null; }
  document.title = `${route ? ({ why: 'Why it exists', workspace: 'Workspace', report: 'Record', how: 'How it works', build: 'About the build' }[route] || 'Judgment Layer') + ' | ' : ''}Judgment Layer`;
}
window.addEventListener('hashchange', render);

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const a = el.dataset.act, id = state.current, s = state.sessions[id];
  if (el.dataset.key) lastKey = el.dataset.key;
  if (a === 'own') {
    const c = el.dataset.c, v = +el.dataset.v; s.own[c] = v;
    if (s.revealed) s.ownAfter[c] = true;
    logE(s, 'pen', `Rated ${compName(c)}: ${v}${s.revealed ? ' (after seeing the draft)' : ''}`);
  } else if (a === 'final') {
    const c = el.dataset.c, v = +el.dataset.v; s.final[c] = v;
    logE(s, 'scale', `Final ${compName(c)}: ${v}${v !== s.ai[c].score ? ' (differs from AI draft)' : ''}`);
  } else if (a === 'keep') { const c = el.dataset.c; s.final[c] = s.own[c]; logE(s, 'scale', `Kept own rating for ${compName(c)}: ${s.own[c]}`); }
  else if (a === 'useai') { const c = el.dataset.c; s.final[c] = s.ai[c].score; logE(s, 'layers', `Took AI rating for ${compName(c)}: ${s.final[c]}`); }
  else if (a === 'fill') { COMPS.forEach((c, i) => { s.own[c.id] = Math.max(1, Math.min(4, s.ai[c.id].score - (i % 2 ? 1 : 0))); }); logE(s, 'pen', 'Filled in sample ratings'); }
  else if (a === 'reveal') { s.revealed = true; s.lockOwn = state.blind; logE(s, 'layers', 'AI draft revealed'); }
  else if (a === 'signoff') { s.signed = true; s.t1 = Date.now(); state.last = id; logE(s, 'shield', 'Assessment signed off by the assessor'); location.hash = '#/report'; return; }
  else if (a === 'pick') { location.hash = '#/workspace/' + el.dataset.id; return; }
  else if (a === 'edit') { state.editing = true; }
  else if (a === 'cancelEdit') { state.editing = false; }
  else if (a === 'applyEdit') { const t = $('#ta').value.trim(); if (t.length < 20) { $('#ta').focus(); return; } state.custom = t; delete state.sessions.custom; state.editing = false; location.hash = '#/workspace/custom'; render(); return; }
  else if (a === 'reset') { delete state.sessions[id]; }
  else if (a === 'flash') { const n = document.getElementById('s' + el.dataset.i); if (n) { n.scrollIntoView({ block: 'center', behavior: 'smooth' }); n.classList.add('flash'); setTimeout(() => n.classList.remove('flash'), 1400); } return; }
  else if (a === 'print') { window.print(); return; }
  else if (a === 'copy') { copyJSON(); return; }
  render();
});
document.addEventListener('change', e => { if (e.target.id === 'blind') { state.blind = e.target.checked; const s = state.sessions[state.current]; if (s) logE(s, 'eye', `Blind-first ${state.blind ? 'on' : 'off'}`); render(); } });
document.addEventListener('input', e => {
  const c = e.target.dataset && e.target.dataset.reason; if (!c) return;
  const s = state.sessions[state.current]; s.reason[c] = e.target.value;
  e.target.classList.toggle('ok', e.target.value.trim().length >= 3);
  const st = stats(s), btn = document.querySelector('[data-act="signoff"]'); if (btn) btn.disabled = !st.ready;
});
async function copyJSON() {
  const s = state.sessions[state.last]; if (!s) return;
  const data = { participant: getP(s.id).name, blind_first: s.lockOwn, seconds: Math.round((s.t1 - s.t0) / 1000),
    ratings: COMPS.map(c => ({ competency: c.name, first: s.own[c.id] ?? null, ai_draft: s.ai[c.id].score, ai_confidence: s.ai[c.id].conf, final: s.final[c.id], reason: s.reason[c.id] || null })),
    audit: s.log.map(l => ({ at_s: Math.round((l.t - s.t0) / 1000), event: l.text })) };
  const b = document.getElementById('copyBtn');
  try { await navigator.clipboard.writeText(JSON.stringify(data, null, 2)); b.textContent = 'Copied'; } catch (_) { b.textContent = 'Copy not available here'; }
  setTimeout(() => { b.innerHTML = `${ic('copy', 'sm')} Copy as JSON`; }, 1800);
}

render();
