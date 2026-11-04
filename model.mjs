export const SELECTED_STORY = ['EST', 'GBR', 'LUX', 'GRC', 'DEU', 'ESP'];
export const INITIAL_SELECTION = ['OECD', 'USA', 'DEU', 'GBR'];
export const COLORS = ['#234e66', '#c06a45', '#208676', '#8c6daf', '#c18c26', '#4f80ad'];
export const percentChange = (start, end) => start == null || end == null || start === 0 ? null : (end / start - 1) * 100;
export const mean = values => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
export const yearsBetween = (start, end) => Array.from({length: end - start + 1}, (_, i) => start + i);

export function series(area, start, end, indexed = false) {
  const base = area.values[start]?.value;
  return yearsBetween(start, end).map(year => {
    const observation = area.values[year];
    return {year, value: observation && (!indexed || base != null) ? (indexed ? observation.value / base * 100 : observation.value) : null, estimated: observation?.estimated ?? false};
  });
}

export function story(data, {benchmark = false, extended = false, zero = false} = {}) {
  const start = 2015, end = extended ? 2024 : 2020;
  const areas = benchmark ? data.areas.filter(a => a.code === 'OECD') : SELECTED_STORY.map(code => data.areas.find(a => a.code === code));
  const lines = areas.map(a => series(a, start, end, true));
  const points = yearsBetween(start, end).map((year, i) => ({year, value: mean(lines.map(line => line[i].value).filter(v => v != null)), estimated: areas.some(a => a.values[year]?.estimated)}));
  const change = points.at(-1).value - 100;
  // The original floor is 70. It only moves down when a value would otherwise fall below the axis.
  const lowest = Math.min(...points.map(p => p.value));
  const floor = zero ? 0 : Math.min(70, Math.floor(lowest / 10) * 10);
  return {areas, points, start, end, change, domain: [floor, 105], benchmark, extended, zero};
}

export function snapshot(data, year, baseline, query = '', sort = 'high') {
  return data.areas.filter(a => !a.aggregate && a.name.toLowerCase().includes(query.toLowerCase())).map(a => ({...a, value: a.values[year]?.value ?? null, estimated: a.values[year]?.estimated ?? false, change: year < baseline ? null : percentChange(a.values[baseline]?.value, a.values[year]?.value)})).sort((a, b) => {
    const av = sort === 'change' ? a.change : a.value;
    const bv = sort === 'change' ? b.change : b.value;
    if (av == null) return bv == null ? a.name.localeCompare(b.name) : 1;
    if (bv == null) return -1;
    return (sort === 'high' ? bv - av : av - bv) || a.name.localeCompare(b.name);
  });
}

export function csvDownload(rows) {
  const cell = v => `"${String(v ?? '').replaceAll('"', '""')}"`;
  return rows.map(row => row.map(cell).join(',')).join('\r\n');
}
