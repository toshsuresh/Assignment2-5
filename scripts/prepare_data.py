"""Validate the supplied OECD slice and create the browser's reproducible data file."""
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/oecd-ghg-original.csv'
AGGREGATES = {'OECD', 'OECDA', 'OECDSO', 'OECDE', 'EU27_2020'}


def main():
    areas = {}
    with SOURCE.open(encoding='utf-8-sig', newline='') as handle:
        rows = list(csv.DictReader(handle))
    for row in rows:
        assert (row['POLLUTANT'], row['MEASURE'], row['UNIT_MEASURE'], row['UNIT_MULT'], row['FREQ']) == ('GHG', '_T', 'KG_CO2E_PS', '3', 'A'), 'Unexpected dimensions or units'
        code, year = row['REF_AREA'], int(row['TIME_PERIOD'])
        area = areas.setdefault(code, {'code': code, 'name': row['Reference area'], 'aggregate': code in AGGREGATES, 'values': {}})
        assert str(year) not in area['values'], f'Duplicate observation: {code}, {year}'
        # OBS_VALUE * 10^3 kg / 10^3 kg per tonne = OBS_VALUE tonnes.
        value = float(row['OBS_VALUE'])
        assert value >= 0 and row['OBS_STATUS'] in ('A', 'E')
        area['values'][str(year)] = {'value': value, 'estimated': row['OBS_STATUS'] == 'E'}
    years = sorted({int(row['TIME_PERIOD']) for row in rows})
    payload = {
        'meta': {'source': 'OECD.ENV.EPI:DSD_AIR_GHG@DF_AIR_GHG(1.0)', 'exportDate': '2026-11-01', 'observations': len(rows), 'years': years, 'unit': 'tonnes CO₂e per person', 'sourceSHA256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(), 'estimatedObservations': sum(row['OBS_STATUS'] == 'E' for row in rows)},
        'areas': list(areas.values()),
    }
    (ROOT / 'data/emissions.json').write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'Validated {len(rows)} observations / {len(areas)} areas / {years[0]}–{years[-1]}. Values retain original precision; no imputation.')


if __name__ == '__main__':
    main()
