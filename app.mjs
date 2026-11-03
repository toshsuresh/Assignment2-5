import {INITIAL_SELECTION, COLORS, series, story, snapshot, percentChange, csvDownload} from './model.mjs';

const $ = selector => document.querySelector(selector);
const fmt = (number, digits = 2) => number == null ? 'Unavailable' : number.toLocaleString('en-US', {minimumFractionDigits: digits, maximumFractionDigits: digits});
const pct = value => value == null ? '—' : `${value > 0 ? '+' : value < 0 ? '−' : ''}${fmt(Math.abs(value), 1)}%`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const ns = 'http://www.w3.org/2000/svg';
const state = {selected: [...INITIAL_SELECTION], start: 2015, end: 2024, indexed: false, snapshotYear: 2022, query: '', sort: 'high', all: false};
let data;
let chartCount = 0;
const area = code => data.areas.find(a => a.code === code);

function svgElement(tag, attributes = {}, text) {
  const node = document.createElementNS(ns, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text != null) node.textContent = text;
  return node;
}

function tooltip(point, label, unit, event, indexed = false) {
  const box = $('#tooltip');
  box.innerHTML = `<strong>${escape(label)} · ${point.year}</strong>${fmt(point.value)} ${escape(unit)}<span>${point.estimated ? 'Estimated value (OECD status E)' : 'Normal value (OECD status A)'}${indexed ? ' · calculated index' : ''}</span>`;
  box.hidden = false;
  const bounds = event.target.getBoundingClientRect();
  const x = event.clientX || bounds.x + bounds.width / 2;
  const y = event.clientY || bounds.y;
  box.style.left = `${Math.max(8, Math.min(x + 15, innerWidth - box.offsetWidth - 8))}px`;
  box.style.top = `${Math.max(8, Math.min(y - box.offsetHeight - 12, innerHeight - box.offsetHeight - 8))}px`;
}
const hideTooltip = () => { $('#tooltip').hidden = true; };
addEventListener('scroll', hideTooltip, {passive: true});
addEventListener('keydown', event => { if (event.key === 'Escape') { hideTooltip(); $('#country-picker').hidden = true; $('#choose-countries').setAttribute('aria-expanded', 'false'); } });

function drawChart(container, groups, {start, end, domain, unit, title, description, indexed = false, filled = false, mini = false} = {}) {
  const width = Math.max(container.clientWidth - (mini ? 0 : container.id === 'story-chart' ? 0 : innerWidth <= 760 ? 10 : 40), 260);
  const mobile = width < 550;
  const height = mini ? (mobile ? 210 : 215) : filled ? (mobile ? 255 : 285) : (mobile ? 330 : 350);
  const margin = {top: 42, right: mobile ? 18 : 27, bottom: 36, left: mobile ? 38 : 50};
  const x = year => margin.left + (year - start) / (end - start) * (width - margin.left - margin.right);
  const y = value => height - margin.bottom - (value - domain[0]) / (domain[1] - domain[0]) * (height - margin.top - margin.bottom);
  const id = `chart-${++chartCount}`;
  const svg = svgElement('svg', {viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-labelledby': `${id}-title ${id}-desc`});
  svg.append(svgElement('title', {id: `${id}-title`}, title), svgElement('desc', {id: `${id}-desc`}, description));
  const gridColor = filled ? '#d7dac8' : '#e8eae1';
  const inkColor = filled ? '#7e876d' : '#7c877e';
  svg.append(svgElement('text', {x: margin.left, y: 21, fill: inkColor, 'font-size': mobile ? 9 : 10}, unit));
  let step = (domain[1] - domain[0]) / 5;
  const power = 10 ** Math.floor(Math.log10(step));
  step = [1, 2, 2.5, 5, 10].map(n => n * power).find(n => n >= step) || power * 10;
  for (let tick = Math.ceil(domain[0] / step) * step; tick <= domain[1]; tick += step) {
    svg.append(svgElement('line', {x1: margin.left, x2: width - margin.right, y1: y(tick), y2: y(tick), stroke: gridColor, 'stroke-width': 1}));
    svg.append(svgElement('text', {x: margin.left - 11, y: y(tick) + 3, 'text-anchor': 'end', fill: inkColor, 'font-size': mobile ? 9 : 10}, fmt(tick, tick % 1 ? 1 : 0)));
  }
  if (indexed && domain[0] < 100 && domain[1] >= 100) {
    svg.append(svgElement('line', {x1: margin.left, x2: width - margin.right, y1: y(100), y2: y(100), stroke: filled ? '#abb79b' : '#bbc5b5', 'stroke-dasharray': '4 4'}));
  }
  for (let year = start; year <= end; year++) {
    if (mobile && end - start > 6 && (year - start) % 2 && year !== end) continue;
    if (mobile && end - start > 6 && year === end - 1 && (year - start) % 2 === 0) continue;
    svg.append(svgElement('text', {x: x(year), y: height - 10, 'text-anchor': 'middle', fill: inkColor, 'font-size': mobile ? 9 : 10}, year));
  }
  for (const group of groups) {
    let segments = [], segment = [];
    for (const p of group.points) {
      if (p.value == null) { if (segment.length) segments.push(segment); segment = []; }
      else segment.push(p);
    }
    if (segment.length) segments.push(segment);
    for (const segment of segments) {
      const path = segment.map((p, i) => `${i ? 'L' : 'M'}${x(p.year)},${y(p.value)}`).join(' ');
      if (filled) {
        const defs = svgElement('defs');
        const gradient = svgElement('linearGradient', {id: `${id}-fill`, x1: 0, y1: 0, x2: 0, y2: 1});
        gradient.append(svgElement('stop', {offset: '0%', 'stop-color': '#9eb288', 'stop-opacity': .27}), svgElement('stop', {offset: '100%', 'stop-color': '#9eb288', 'stop-opacity': .02}));
        defs.append(gradient); svg.append(defs);
        svg.append(svgElement('path', {d: `${path} L${x(segment.at(-1).year)},${y(domain[0])} L${x(segment[0].year)},${y(domain[0])} Z`, fill: `url(#${id}-fill)`}));
      }
      svg.append(svgElement('path', {d: path, fill: 'none', stroke: group.color, 'stroke-width': filled ? 3 : group.code === 'OECD' ? 2.8 : 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...(group.dashed ? {'stroke-dasharray': '5 4'} : {})}));
    }
    for (const point of group.points.filter(p => p.value != null)) {
      const circle = svgElement('circle', {cx: x(point.year), cy: y(point.value), r: mini ? 3.2 : mobile ? 4 : 4.3, fill: point.estimated ? (filled ? '#f5f1e5' : '#fffefa') : group.color, stroke: group.color, 'stroke-width': 1.6, tabindex: '0', role: 'img', class: 'chart-point', 'aria-label': `${group.name}, ${point.year}: ${fmt(point.value)} ${unit}${point.estimated ? ', estimated' : ''}`});
      circle.addEventListener('pointerenter', event => tooltip(point, group.name, unit, event, indexed));
      circle.addEventListener('pointermove', event => tooltip(point, group.name, unit, event, indexed));
      circle.addEventListener('pointerleave', hideTooltip);
      circle.addEventListener('focus', event => tooltip(point, group.name, unit, event, indexed));
      circle.addEventListener('blur', hideTooltip);
      circle.addEventListener('click', event => tooltip(point, group.name, unit, event, indexed));
      svg.append(circle);
    }
  }
  container.replaceChildren(svg);
}

function updateYearOptions() {
  for (const option of $('#start-year').options) option.disabled = Number(option.value) >= state.end;
  for (const option of $('#end-year').options) option.disabled = Number(option.value) <= state.start;
  $('#start-year').value = state.start;
  $('#end-year').value = state.end;
}

function renderWhite() {
  hideTooltip(); updateYearOptions();
  const oecd = area('OECD');
  const observation = oecd.values[state.end];
  $('#metric-value').textContent = fmt(observation?.value);
  $('#metric-change').textContent = pct(percentChange(oecd.values[state.start]?.value, observation?.value));
  $('#metric-period').textContent = `${state.start}–${state.end}`;
  document.querySelectorAll('.end-year').forEach(el => { el.textContent = state.end; });
  $('#metric-coverage').textContent = data.areas.filter(a => !a.aggregate && a.values[state.end]).length;
  $('.estimate-label').hidden = !observation?.estimated;
  $('#absolute-button').setAttribute('aria-pressed', !state.indexed);
  $('#indexed-button').setAttribute('aria-pressed', state.indexed);
  $('#white-chart-description').textContent = state.indexed ? `Each area indexed to ${state.start} = 100 · proportional change, not total emissions` : 'Annual greenhouse gas emissions · tonnes CO₂e per person';
  const groups = state.selected.map((code, i) => ({code, name: area(code).name, color: COLORS[i], points: series(area(code), state.start, state.end, state.indexed)}));
  const max = Math.max(1, ...groups.flatMap(g => g.points.map(p => p.value ?? 0)));
  const rawStep = max / 4;
  const power = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map(n => n * power).find(n => n >= rawStep);
  const upper = Math.ceil(max / step) * step;
  drawChart($('#white-chart'), groups, {start: state.start, end: state.end, domain: [0, upper], unit: state.indexed ? `Index · ${state.start} = 100` : 'Tonnes CO₂e per person', title: 'Country emissions over time', description: `Comparison of ${groups.map(g => g.name).join(', ')} from ${state.start} to ${state.end}. Zero-based scale. Missing data is shown as gaps; estimated values use hollow points.`, indexed: state.indexed});
  $('#white-legend').innerHTML = groups.map(g => `<span class="legend-item"><i class="legend-line" style="background:${g.color}"></i>${escape(g.name)}${area(g.code).aggregate ? '<small>(aggregate)</small>' : ''}</span>`).join('');
  renderPicker(); renderTable();
}

function renderPicker() {
  const query = $('#country-search').value.toLowerCase();
  const available = [...data.areas].sort((a, b) => Number(b.aggregate) - Number(a.aggregate) || a.name.localeCompare(b.name)).filter(a => a.name.toLowerCase().includes(query));
  $('#country-options').innerHTML = available.map(a => `<label><input type="checkbox" value="${a.code}" ${state.selected.includes(a.code) ? 'checked' : ''}><span>${escape(a.name)}${a.aggregate ? ' <small>regional aggregate</small>' : ''}</span></label>`).join('') || '<p>No matching reference areas.</p>';
  $('#country-options').querySelectorAll('input').forEach(input => input.addEventListener('change', () => toggleSelection(input.value)));
}

function toggleSelection(code) {
  const present = state.selected.includes(code);
  if (present && state.selected.length === 1) { $('#selection-feedback').textContent = 'Keep at least one area selected.'; renderPicker(); return; }
  if (!present && state.selected.length === 6) { $('#selection-feedback').textContent = 'Six areas are already selected. Remove one before adding another.'; renderPicker(); if ($('#country-picker').hidden) { $('#country-picker').hidden = false; $('#choose-countries').setAttribute('aria-expanded', 'true'); $('#country-picker').scrollIntoView({block: 'center', behavior: 'smooth'}); } return; }
  state.selected = present ? state.selected.filter(c => c !== code) : [...state.selected, code];
  $('#selection-feedback').textContent = `${state.selected.length} of 6 areas selected.`;
  renderWhite();
}

function getTableRows() { return snapshot(data, state.snapshotYear, state.start, state.query, state.sort); }
function renderTable() {
  const rows = getTableRows();
  const shown = state.all ? rows : rows.slice(0, 12);
  const max = Math.max(1, ...data.areas.filter(a => !a.aggregate).map(a => a.values[state.snapshotYear]?.value ?? 0));
  $('#change-column').textContent = `Change from ${state.start}`;
  $('#table-caption').textContent = `${state.snapshotYear} greenhouse gas emissions per person, with percentage change from ${state.start}. Estimated values are labeled E. A dash means unavailable.`;
  $('#snapshot-body').innerHTML = shown.map(a => `<tr class="${state.selected.includes(a.code) ? 'selected' : ''}"><td>${escape(a.name)}<span class="country-code">${a.code}</span></td><td>${a.value == null ? '<span class="no-data">— unavailable</span>' : `<div class="bar-value"><span class="bar-track" aria-hidden="true"><i class="bar-fill" style="width:${a.value / max * 100}%"></i></span><span>${fmt(a.value)}${a.estimated ? ' <abbr title="Estimated value">E</abbr>' : ''}</span></div>`}</td><td class="${a.change == null ? 'no-data' : a.change <= 0 ? 'down' : 'up'}">${pct(a.change)}</td><td><button class="table-compare" data-code="${a.code}" aria-label="${state.selected.includes(a.code) ? 'Remove' : 'Compare'} ${escape(a.name)}${state.selected.includes(a.code) ? '' : ' in trend chart'}" aria-pressed="${state.selected.includes(a.code)}">${state.selected.includes(a.code) ? '✓' : '+'}</button></td></tr>`).join('') || '<tr><td colspan="4">No countries match this search.</td></tr>';
  const n = rows.filter(a => a.value != null).length;
  $('#table-coverage').textContent = `${n} of ${rows.length} ${state.query ? 'matching ' : ''}countries have data for ${state.snapshotYear}. Showing ${shown.length} rows.`;
  $('#show-all').textContent = state.all ? 'Show fewer ↑' : `Show all ${rows.length} countries ↓`;
  $('#show-all').hidden = rows.length <= 12;
  $('#snapshot-body').querySelectorAll('button').forEach(button => button.addEventListener('click', () => toggleSelection(button.dataset.code)));
}

function renderStory() {
  hideTooltip();
  const options = {benchmark: $('#repair-cohort').checked, extended: $('#repair-time').checked, zero: $('#repair-axis').checked};
  const original = story(data), current = story(data, options);
  const repaired = Object.values(options).some(Boolean);
  $('#story-change').textContent = `${fmt(Math.abs(current.change), 1)}%`;
  $('#story-stat-label').textContent = repaired ? `${current.change <= 0 ? 'lower' : 'higher'} emissions per person` : 'lower emissions';
  $('#story-stat-note').innerHTML = `${options.benchmark ? 'Published OECD aggregate' : 'Equal-weight average · six economies'}<br>2015–${current.end} · per person`;
  $('#brief-period').textContent = `2015–${current.end}`;
  $('#brief-headline').innerHTML = repaired ? `Emissions per person, 2015–${current.end}` : 'Emissions are falling.<br>The transition is working.';
  $('#brief-deck').textContent = repaired ? `${options.benchmark ? 'The OECD aggregate' : 'The six selected countries'} shows a ${fmt(Math.abs(current.change), 1)}% ${current.change < 0 ? 'decline' : 'increase'} since 2015. This trend alone does not explain its cause.` : 'Emissions fell by nearly a quarter across six OECD economies.';
  $('#story-chart-title').textContent = repaired ? `An indexed comparison, 2015–${current.end}.` : 'Emissions index';
  $('#story-cohort').textContent = options.benchmark ? 'Published OECD aggregate · all values marked estimated in this export' : `${current.areas.map(a => a.name).join(' · ')} · equal-weight index`;
  $('#story-line-label').textContent = options.benchmark ? 'OECD index' : 'Progress index';
  drawChart($('#story-chart'), [{name: options.benchmark ? 'OECD aggregate' : 'Six-country mean index', color: '#4e7956', points: current.points}], {start: current.start, end: current.end, domain: current.domain, unit: 'Index · 2015 = 100', indexed: true, filled: true, title: 'Selected countries: indexed emissions', description: `${options.benchmark ? 'Published OECD aggregate' : 'Equal-weight mean of six selected countries'}, 2015–${current.end}. Vertical scale begins at ${current.domain[0]}. Per-person emissions changed ${pct(current.change)}.`});
  $('#lab-original').textContent = pct(original.change);
  $('#lab-current').textContent = pct(current.change);
  const explanation = [];
  if (options.benchmark) explanation.push(`The OECD aggregate changes the reported decline from ${fmt(Math.abs(original.change), 1)}% to ${fmt(Math.abs(current.change), 1)}%${options.extended ? ' over the longer window' : ' over the same window'}.`);
  else explanation.push(`The six-country selection shows a ${fmt(Math.abs(current.change), 1)}% decline through ${current.end}; it is not representative of every country.`);
  if (options.extended) explanation.push('The line now includes 2021’s rebound and the later trajectory.');
  if (options.zero) explanation.push('A zero baseline reduces the visual size of the drop without altering the percentage.');
  if (!repaired) explanation.push('All three original framing choices are active. Switch on a repair to isolate its effect.');
  $('#lab-explanation').textContent = explanation.join(' ');
  $('#lab-mini-chart').innerHTML = '<div class="mini-legend"><span><i></i>Original chart · ends 2020</span><span><i></i>Current settings</span></div><div id="mini-chart-inner"></div>';
  drawChart($('#mini-chart-inner'), [{name: 'Original six-country chart', color: '#c09867', dashed: true, points: original.points}, {name: options.benchmark ? 'Current OECD framing' : 'Current six-country framing', color: '#247767', points: current.points}], {start: 2015, end: 2024, domain: [0, 110], unit: 'Index · 2015 = 100 · shared zero baseline', title: 'Original and updated charts on the same scale', description: `Both lines use the same zero-based axis. The original chart ends at 2020. The current line ends at ${current.end}. When settings match, lines overlap.`, indexed: true, mini: true});
}

function downloadTable() {
  const rows = getTableRows();
  const csv = csvDownload([['code', 'country_or_territory', 'year', 'tonnes_CO2e_per_person', 'status', 'baseline_year', 'baseline_tonnes_CO2e_per_person', 'change_percent'], ...rows.map(a => [a.code, a.name, state.snapshotYear, a.value, a.value == null ? 'unavailable' : a.estimated ? 'E' : 'A', state.start, a.values[state.start]?.value, a.change])]);
  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], {type: 'text/csv;charset=utf-8'}));
  link.href = url; link.download = `oecd-ghg-${state.snapshotYear}-from-${state.start}.csv`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function bindControls() {
  const opts = data.meta.years.map(year => `<option value="${year}">${year}</option>`).join('');
  for (const id of ['start-year', 'end-year', 'snapshot-year']) $(`#${id}`).innerHTML = opts;
  $('#snapshot-year').value = state.snapshotYear;
  $('#start-year').addEventListener('change', event => { state.start = Number(event.target.value); renderWhite(); });
  $('#end-year').addEventListener('change', event => { state.end = Number(event.target.value); renderWhite(); });
  $('#absolute-button').addEventListener('click', () => { state.indexed = false; renderWhite(); });
  $('#indexed-button').addEventListener('click', () => { state.indexed = true; renderWhite(); });
  $('#choose-countries').addEventListener('click', () => { const picker = $('#country-picker'); picker.hidden = !picker.hidden; $('#choose-countries').setAttribute('aria-expanded', !picker.hidden); if (!picker.hidden) $('#country-search').focus(); });
  $('#country-search').addEventListener('input', renderPicker);
  $('#snapshot-search').addEventListener('input', event => { state.query = event.target.value; state.all = false; renderTable(); });
  $('#snapshot-sort').addEventListener('change', event => { state.sort = event.target.value; renderTable(); });
  $('#snapshot-year').addEventListener('change', event => { state.snapshotYear = Number(event.target.value); renderTable(); });
  $('#show-all').addEventListener('click', () => { state.all = !state.all; renderTable(); });
  $('#download-snapshot').addEventListener('click', downloadTable);
  $('#reset-white').addEventListener('click', () => {
    Object.assign(state, {selected: [...INITIAL_SELECTION], start: 2015, end: 2024, indexed: false, snapshotYear: 2022, query: '', sort: 'high', all: false});
    $('#snapshot-year').value = 2022; $('#snapshot-search').value = ''; $('#snapshot-sort').value = 'high'; $('#country-search').value = ''; $('#country-picker').hidden = true; $('#choose-countries').setAttribute('aria-expanded', 'false'); $('#selection-feedback').textContent = 'Select one to six areas. Regional aggregates are labeled.';
    renderWhite();
  });
  for (const id of ['repair-cohort', 'repair-time', 'repair-axis']) $(`#${id}`).addEventListener('change', renderStory);
  $('#reset-story').addEventListener('click', () => { for (const id of ['repair-cohort', 'repair-time', 'repair-axis']) $(`#${id}`).checked = false; renderStory(); });
  $('#inspect-framing').addEventListener('click', () => { $('#audit').open = true; });
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { renderWhite(); renderStory(); }, 150); });
}

async function init() {
  try {
    const response = await fetch(new URL('./data/emissions.json', import.meta.url));
    if (!response.ok) throw new Error(`Data request failed (${response.status})`);
    data = await response.json();
    $('#explorer').hidden = false;
    bindControls(); renderWhite(); renderStory();
    $('#load-status').hidden = true;
    document.documentElement.dataset.ready = 'true';
  } catch (error) {
    $('#load-status').hidden = false;
    $('#load-status').classList.add('error');
    $('#load-status').textContent = `The dataset could not be loaded. Run npm start in the project folder, then open http://127.0.0.1:8002 and reload. ${error.message}`;
    console.error(error);
  }
}
init();
