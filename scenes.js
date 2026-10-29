/* Illustrations for Judgment Layer. Drawn as inline SVG so they stay sharp, load instantly and match the colour theme. */
'use strict';

const sceneDefs = `<defs>
  <linearGradient id="sbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ece9ff"/><stop offset="1" stop-color="#fff2dc"/></linearGradient>
  <filter id="ssh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#1d1a3a" flood-opacity=".16"/></filter>
</defs>`;

/* a simple, friendly figure seated behind a surface. cx = centre x, y = the surface line the torso disappears behind */
function person(cx, y, o) {
  const back = o.long ? `<path d="M${cx - 27} ${y - 100}Q${cx - 36} ${y - 54} ${cx - 18} ${y - 54}L${cx - 12} ${y - 100}Z M${cx + 27} ${y - 100}Q${cx + 36} ${y - 54} ${cx + 18} ${y - 54}L${cx + 12} ${y - 100}Z" fill="${o.hair}"/>` : '';
  return `<g>
    ${back}
    <path d="M${cx - 50} ${y}L${cx - 50} ${y - 34}Q${cx - 50} ${y - 68} ${cx} ${y - 68}Q${cx + 50} ${y - 68} ${cx + 50} ${y - 34}L${cx + 50} ${y}Z" fill="${o.shirt}"/>
    <path d="M${cx - 14} ${y - 68}Q${cx} ${y - 54} ${cx + 14} ${y - 68}Z" fill="#fff" opacity=".35"/>
    <rect x="${cx - 8}" y="${y - 78}" width="16" height="14" rx="6" fill="${o.skin}"/>
    <circle cx="${cx}" cy="${y - 98}" r="24" fill="${o.skin}"/>
    <path d="M${cx - 25} ${y - 99}Q${cx - 27} ${y - 126} ${cx} ${y - 126}Q${cx + 27} ${y - 126} ${cx + 25} ${y - 99}Q${cx + 12} ${y - 112} ${cx - 4} ${y - 110}Q${cx - 17} ${y - 108} ${cx - 25} ${y - 99}Z" fill="${o.hair}"/>
    <circle cx="${cx - 8}" cy="${y - 96}" r="2.3" fill="#1d1a3a"/><circle cx="${cx + 8}" cy="${y - 96}" r="2.3" fill="#1d1a3a"/>
    <path d="M${cx - 7} ${y - 87}Q${cx} ${y - 81} ${cx + 7} ${y - 87}" stroke="#1d1a3a" stroke-width="2" fill="none" stroke-linecap="round"/>
  </g>`;
}
const plant = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0c-24-10-30-40-22-62 14 14 22 34 22 62zM0 0c8-26 26-44 48-48-6 24-22 42-48 48zM0 0c-4-34 6-58 24-72 4 26-2 52-24 72z" fill="#22a06b"/><path d="M-22 0h44l-6 36h-32z" fill="#ff6b57"/></g>`;
const mug = (x, y) => `<g><rect x="${x}" y="${y}" width="26" height="28" rx="6" fill="#fff" stroke="#e1dccf"/><path d="M${x + 26} ${y + 6}q12 0 12 9t-12 9" fill="none" stroke="#e1dccf" stroke-width="4"/><path d="M${x + 7} ${y - 6}q-4-6 0-12M${x + 16} ${y - 6}q-4-6 0-12" stroke="#c9c4e0" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>`;

/* 1. A feedback conversation: where a participant's response comes from */
function sceneTalk() {
  return `<svg viewBox="0 0 560 380" role="img" aria-label="Illustration: a manager and a colleague talking across a table about feedback, with speech bubbles above them">${sceneDefs}
  <rect width="560" height="380" rx="28" fill="url(#sbg)"/>
  <g filter="url(#ssh)"><rect x="440" y="28" width="96" height="86" rx="12" fill="#fff"/></g>
  <circle cx="500" cy="58" r="13" fill="#ffc24b"/><path d="M440 114V92q22-14 44 0t52-6v28z" fill="#bfe7d3"/>
  ${plant(48, 300, .9)}
  <g filter="url(#ssh)"><path d="M70 120h172a16 16 0 0 1 16 16v26a16 16 0 0 1-16 16h-96l-26 20 4-20H70a16 16 0 0 1-16-16v-26a16 16 0 0 1 16-16z" fill="#fff"/></g>
  <rect x="76" y="138" width="110" height="9" rx="4.5" fill="#ff6b57"/><rect x="76" y="156" width="150" height="9" rx="4.5" fill="#ffd0c8"/><rect x="76" y="174" width="90" height="9" rx="4.5" fill="#ffd0c8"/>
  <g filter="url(#ssh)"><path d="M318 70h150a16 16 0 0 1 16 16v28a16 16 0 0 1-16 16h-86l4 20-28-20h-40a16 16 0 0 1-16-16V86a16 16 0 0 1 16-16z" fill="#fff"/></g>
  <circle cx="346" cy="100" r="13" fill="#22a06b"/><path d="M340 100l5 5 9-10" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="368" y="92" width="86" height="9" rx="4.5" fill="#3b82f6"/><rect x="368" y="108" width="62" height="9" rx="4.5" fill="#bcd5fb"/>
  ${person(188, 290, { shirt: '#ff6b57', skin: '#e0ac82', hair: '#2b2140' })}
  ${person(370, 290, { shirt: '#3b82f6', skin: '#a8714a', hair: '#14122b', long: true })}
  <rect x="64" y="288" width="432" height="24" rx="12" fill="#c9955b"/><rect x="100" y="312" width="14" height="46" rx="5" fill="#a97a44"/><rect x="446" y="312" width="14" height="46" rx="5" fill="#a97a44"/>
  <g filter="url(#ssh)"><rect x="244" y="262" width="76" height="30" rx="5" fill="#fff" transform="rotate(-3 282 277)"/></g>
  <rect x="254" y="270" width="38" height="5" rx="2.5" fill="#7c5cff"/><rect x="254" y="280" width="52" height="5" rx="2.5" fill="#d9d5ea"/>
  ${mug(424, 262)}
  </svg>`;
}

/* 2. The assessor's desk: reading a response next to the comparison chart */
function sceneDesk() {
  const rows = [[118, 70, '#ff6b57'], [134, 84, '#ebe8f4'], [150, 62, '#3b82f6'], [166, 80, '#ebe8f4'], [182, 74, '#7c5cff'], [198, 66, '#22a06b'], [214, 56, '#ebe8f4']];
  const pts = (vals, cx, cy, R) => vals.map((v, i) => { const a = [-90, 0, 90, 180][i] * Math.PI / 180; return `${(cx + Math.cos(a) * R * v / 4).toFixed(1)},${(cy + Math.sin(a) * R * v / 4).toFixed(1)}`; }).join(' ');
  return `<svg viewBox="0 0 560 380" role="img" aria-label="Illustration: an assessor at a desk with a monitor showing a response on the left and a comparison chart on the right">${sceneDefs}
  <rect width="560" height="380" rx="28" fill="url(#sbg)"/>
  <rect x="28" y="64" width="150" height="8" rx="4" fill="#c9955b"/>
  <rect x="40" y="26" width="14" height="38" rx="2" fill="#ff6b57"/><rect x="56" y="34" width="12" height="30" rx="2" fill="#3b82f6"/><rect x="70" y="22" width="16" height="42" rx="2" fill="#7c5cff"/><rect x="88" y="32" width="12" height="32" rx="2" fill="#ffc24b"/>
  ${plant(150, 64, .45)}
  <g filter="url(#ssh)"><rect x="110" y="96" width="270" height="180" rx="16" fill="#1d1a3a"/></g>
  <rect x="120" y="106" width="250" height="150" rx="9" fill="#fff"/>
  <circle cx="140" cy="124" r="9" fill="#ff6b57"/><rect x="156" y="119" width="56" height="7" rx="3.5" fill="#1d1a3a"/>
  ${rows.map(([y, w, c]) => `<rect x="132" y="${y + 18}" width="${w}" height="8" rx="4" fill="${c}"/>`).join('')}
  <line x1="246" y1="116" x2="246" y2="246" stroke="#e8e2d6"/>
  <g>${[1, 2, 3, 4].map(l => `<polygon points="${pts([l, l, l, l], 310, 180, 46)}" fill="${l % 2 ? '#faf8f3' : '#fff'}" stroke="#e1dccf"/>`).join('')}
  <polygon points="${pts([3, 4, 3, 2], 310, 180, 46)}" fill="#ff6b57" fill-opacity=".25" stroke="#ff6b57" stroke-width="2.5"/>
  <polygon points="${pts([4, 4, 3, 3], 310, 180, 46)}" fill="none" stroke="#4b3fd6" stroke-width="2.5" stroke-dasharray="5 4"/></g>
  <rect x="262" y="236" width="12" height="7" rx="3" fill="#ff6b57"/><rect x="278" y="236" width="12" height="7" rx="3" fill="#4b3fd6"/>
  <rect x="236" y="276" width="20" height="22" fill="#2b2750"/><rect x="204" y="296" width="84" height="8" rx="4" fill="#2b2750"/>
  ${person(462, 300, { shirt: '#7c5cff', skin: '#c98a64', hair: '#1d1a3a', long: true })}
  <rect x="28" y="298" width="504" height="22" rx="11" fill="#c9955b"/><rect x="60" y="320" width="14" height="44" rx="5" fill="#a97a44"/><rect x="486" y="320" width="14" height="44" rx="5" fill="#a97a44"/>
  ${mug(90, 270)}
  <path d="M388 298V250l-30-34" stroke="#ff6b57" stroke-width="5" fill="none" stroke-linecap="round" opacity="0"/>
  </svg>`;
}

/* 3. The build workspace: laptop, notes, coffee */
function sceneBuild() {
  const code = [[188, 24, '#ff6b57', 70], [204, 40, '#7c5cff', 96], [220, 40, '#3b82f6', 60], [236, 24, '#22a06b', 110], [252, 40, '#ffc24b', 80], [268, 24, '#ff6b57', 50]];
  return `<svg viewBox="0 0 560 380" role="img" aria-label="Illustration: a laptop showing code on a desk with sticky notes and a coffee mug">${sceneDefs}
  <rect width="560" height="380" rx="28" fill="url(#sbg)"/>
  <g transform="rotate(-6 70 100)" filter="url(#ssh)"><rect x="34" y="50" width="74" height="74" fill="#ffd96a"/></g>
  <rect x="46" y="68" width="48" height="6" rx="3" fill="#b88a12" opacity=".6"/><rect x="46" y="82" width="36" height="6" rx="3" fill="#b88a12" opacity=".6"/><rect x="46" y="96" width="44" height="6" rx="3" fill="#b88a12" opacity=".6"/>
  <g transform="rotate(5 160 90)" filter="url(#ssh)"><rect x="122" y="52" width="70" height="70" fill="#ffb3c8"/></g>
  <rect x="134" y="70" width="44" height="6" rx="3" fill="#b8506f" opacity=".6"/><rect x="134" y="84" width="30" height="6" rx="3" fill="#b8506f" opacity=".6"/>
  <g transform="rotate(-3 90 190)" filter="url(#ssh)"><rect x="52" y="150" width="76" height="66" fill="#b9d8ff"/></g>
  <rect x="64" y="168" width="50" height="6" rx="3" fill="#3569a8" opacity=".6"/><rect x="64" y="182" width="38" height="6" rx="3" fill="#3569a8" opacity=".6"/>
  <g filter="url(#ssh)"><rect x="168" y="92" width="270" height="180" rx="14" fill="#1d1a3a"/></g>
  <rect x="178" y="102" width="250" height="160" rx="8" fill="#14122b"/>
  <circle cx="192" cy="116" r="4" fill="#ff6b57"/><circle cx="205" cy="116" r="4" fill="#ffc24b"/><circle cx="218" cy="116" r="4" fill="#22a06b"/>
  ${[[138, 0, '#7c5cff', 60], [154, 14, '#3b82f6', 96], [170, 14, '#ffc24b', 70], [186, 28, '#22a06b', 110], [202, 28, '#ff6b57', 64], [218, 14, '#3b82f6', 80], [234, 0, '#7c5cff', 40]].map(([y, i, c, w]) => `<rect x="${196 + i}" y="${y}" width="${w}" height="7" rx="3.5" fill="${c}"/><rect x="${196 + i + w + 8}" y="${y}" width="${34 + (y % 3) * 14}" height="7" rx="3.5" fill="#4a4766"/>`).join('')}
  <rect x="332" y="232" width="3" height="13" fill="#ffc24b"/>
  <path d="M138 272h324l22 34H116z" fill="#c9c4e0"/><rect x="116" y="304" width="368" height="8" rx="4" fill="#a9a3cc"/>
  <rect x="26" y="312" width="508" height="26" rx="13" fill="#c9955b"/>
  ${mug(440, 284)}
  ${plant(512, 292, .6)}
  <rect x="52" y="262" width="76" height="46" rx="5" fill="#fff" stroke="#e1dccf" transform="rotate(-4 90 285)"/><rect x="62" y="274" width="40" height="5" rx="2.5" fill="#7c5cff" transform="rotate(-4 90 285)"/><rect x="62" y="286" width="54" height="5" rx="2.5" fill="#d9d5ea" transform="rotate(-4 90 285)"/>
  </svg>`;
}
