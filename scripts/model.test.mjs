import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {series, story, snapshot, percentChange, csvDownload, SELECTED_STORY} from '../model.mjs';
const data = JSON.parse(fs.readFileSync(new URL('../data/emissions.json', import.meta.url)));
const area = code => data.areas.find(a => a.code === code);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('source coverage and units retain the original export dimensions', () => {
  assert.equal(data.meta.observations, 792);
  assert.equal(data.areas.length, 94);
  assert.equal(data.areas.filter(a => a.aggregate).length, 5);
  assert.equal(data.areas.reduce((n, a) => n + Object.keys(a.values).length, 0), 792);
  near(area('OECD').values[2015].value, 11.91588);
  near(area('OECD').values[2024].value, 10.29296);
  assert.ok(Object.values(area('OECD').values).every(o => o.estimated));
});

test('missing observations stay missing and never become zero or a carried value', () => {
  const usa = series(area('USA'), 2021, 2024);
  assert.deepEqual(usa.map(p => p.year), [2021, 2022, 2023, 2024]);
  assert.ok(usa[0].value > 0);
  assert.equal(usa[2].value, null);
  assert.equal(usa[3].value, null);
  assert.ok(series(area('CHN'), 2015, 2024, true).every(p => p.value === null));
  assert.equal(percentChange(null, 10), null);
  assert.equal(percentChange(10, null), null);
});

test('index and relative change use the selected baseline without rounding inputs', () => {
  const germany = series(area('DEU'), 2015, 2020, true);
  near(germany[0].value, 100);
  near(germany.at(-1).value, 79.83638481035782);
  near(percentChange(11.91588, 10.4057), -12.673675800696216);
});

test('the black hat cohort really is the six strongest 2015–2020 OECD declines', () => {
  // The supplied file lists the 38 member-country series before the EU aggregate.
  const memberCodes = 'AUS AUT BEL CAN CHL COL CRI CZE DNK EST FIN FRA DEU GRC HUN ISL IRL ISR ITA JPN KOR LVA LTU LUX MEX NLD NZL NOR POL PRT SVK SVN ESP SWE CHE TUR GBR USA'.split(' ');
  const ranked = memberCodes.map(code => ({code, delta: percentChange(area(code).values[2015].value, area(code).values[2020].value)})).sort((a, b) => a.delta - b.delta);
  assert.deepEqual(SELECTED_STORY, ranked.slice(0, 6).map(a => a.code));
  near(story(data).change, -23.433267306767235);
});

test('the framing repairs isolate cohort, time window, and scale', () => {
  const original = story(data);
  const axis = story(data, {zero: true});
  assert.deepEqual(axis.points, original.points);
  assert.equal(axis.change, original.change);
  assert.equal(original.domain[0], 70);
  assert.equal(axis.domain[0], 0);
  const benchmark = story(data, {benchmark: true});
  near(benchmark.change, -12.673675800696216);
  assert.ok(benchmark.points.every(p => p.estimated));
  const extended = story(data, {extended: true});
  assert.equal(extended.points.length, 10);
  assert.equal(extended.end, 2024);
  assert.deepEqual(extended.points.slice(0, 6), original.points);
  assert.ok(extended.points[6].value > extended.points[5].value);
  for (const benchmark of [false, true]) for (const extended of [false, true]) for (const zero of [false, true]) {
    assert.ok(story(data, {benchmark, extended, zero}).points.every(p => Number.isFinite(p.value)));
  }
});

test('rankings exclude aggregates, sort numeric values, preserve missing rows, and search', () => {
  const high = snapshot(data, 2024, 2015);
  assert.equal(high.length, 89);
  assert.ok(high.every(a => !a.aggregate));
  assert.ok(high.at(-1).value === null);
  const valid = high.filter(a => a.value != null);
  assert.ok(valid.every((a, i) => i === 0 || a.value <= valid[i - 1].value));
  assert.equal(snapshot(data, 2022, 2015, 'united states')[0].code, 'USA');
  assert.deepEqual(snapshot(data, 2022, 2015, 'no such country'), []);
});

test('CSV export quotes delimiters and quotes, and leaves missing data empty', () => {
  assert.equal(csvDownload([['a,b', 'a"b', null, 0], ['x', 1]]), '"a,b","a""b","","0"\r\n"x","1"');
});
