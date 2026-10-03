"""Generate the website template from a private Supabase connector export.

Input: {manifest: <current manifest>, parts: [{title, body}, ...]}.
No credentials or database access belong in the public website.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path


def reconstruct(envelope):
    manifest = envelope['manifest']
    titles = manifest['full_record_parts']
    parts = envelope['parts']
    by_title = {p['title']: p['body'] for p in parts}
    if len(by_title) != len(parts) or set(by_title) != set(titles):
        raise ValueError('Missing, extra or duplicate template parts')
    fragments = []
    for ordinal, title in enumerate(titles, 1):
        body = by_title[title]
        body = json.loads(body) if isinstance(body, str) else body
        if body['part'] != ordinal:
            raise ValueError('Template part order mismatch')
        fragments.append(body['fragment'])
    data = json.loads(''.join(fragments))
    fingerprint = data['fingerprint']
    unsigned = {k: v for k, v in data.items() if k != 'fingerprint'}
    actual = hashlib.sha256(json.dumps(unsigned, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    if actual != fingerprint or fingerprint != manifest['fingerprint']:
        raise ValueError('Template fingerprint mismatch')
    if data['revision'] != manifest['revision']:
        raise ValueError('Template revision mismatch')
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('export', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    data = reconstruct(json.loads(args.export.read_text()))
    root = Path(__file__).resolve().parents[1]
    target = root / 'editor-preview/template.json'
    if args.check:
        if json.loads(target.read_text()) != data:
            raise ValueError('Published source differs from authoritative Supabase export')
    else:
        target.write_text(json.dumps(data, indent=2) + '\n')
        index = root / 'editor-preview/index.html'
        text, count = re.subn(r'WEDDING FILM TEMPLATE / REVISION [0-9.-]+',
                             'WEDDING FILM TEMPLATE / REVISION ' + data['revision'], index.read_text())
        if count != 1:
            raise ValueError('Expected exactly one template revision label')
        index.write_text(text)
    print('Verified Supabase template', data['revision'], data['fingerprint'])


if __name__ == '__main__':
    main()
