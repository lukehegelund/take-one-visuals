"""Validate the public template before syncing it to Supabase or publishing."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
data = json.loads((root / 'editor-preview/template.json').read_text())
fingerprint = data.pop('fingerprint')
assert fingerprint == hashlib.sha256(json.dumps(data, sort_keys=True, separators=(',', ':')).encode()).hexdigest(), 'Fingerprint mismatch'
assert [t['id'] for t in data['trackOrder']] == [6, 5, 4, 3, 2, 1]
picture = [c for c in data['cards'] if c['track'] == 6]
assert len(picture) == 36
assert len({c['id'] for c in data['cards']}) == len(data['cards'])
assert len({c['takes'][0]['id'] for c in picture}) == 36
assert all(len(c['takes']) == 3 for c in picture)
assert picture[1]['speed'] == picture[2]['speed'] == 70
assert picture[1]['opticalFlow'] and picture[2]['opticalFlow']
assert picture[0]['fadeIn'] == picture[-1]['fadeOut'] == 1
kiss = next(c for c in picture if c.get('kissEnding'))
restart = next(c for c in picture if c['id'] == '6-26')
assert kiss['end'] == restart['start'] == 120
assert kiss['fadeOut'] == 1
assert 'still kissing' in kiss['detail']
assert all(0 <= c['start'] < c['end'] <= 168 for c in data['cards'])
for c in picture:
    for take in c['takes']:
        assert take['src'].startswith('/cam-b/clips/')
        assert (root / take['src'].lstrip('/')).is_file()
        assert (root / take['poster'].lstrip('/')).is_file()
serialized = json.dumps(data)
for forbidden in ['/Users/', 'source_video_id', 'api_key', 'service_role', 'source_file', 'source_start']:
    assert forbidden not in serialized, forbidden
assert all(c['end'] <= 120 for c in data['cards'] if c['track'] == 2)
print(f"Template {data['revision']}: {len(data['cards'])} cards, public assets and fingerprint verified")
