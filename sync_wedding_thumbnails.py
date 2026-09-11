#!/usr/bin/env python3
"""Cache the public main-film thumbnails locally; never download wedding videos."""
import argparse
import concurrent.futures
import json
import urllib.request

from build_weddings import ROOT, thumbnail_path, validate


def sync(record, refresh=False, check=False):
    target = ROOT / thumbnail_path(record).lstrip('/')
    if target.exists() and not refresh:
        if not target.read_bytes().startswith(b'\xff\xd8\xff'):
            raise ValueError(f'{record["slug"]}: thumbnail is not a JPEG')
        return
    if check:
        raise ValueError(f'{record["slug"]}: missing main-film thumbnail')
    file_id = record['videos'][0]['drive_id']
    url = f'https://drive.google.com/thumbnail?id={file_id}&sz=w1000'
    with urllib.request.urlopen(url, timeout=30) as response:
        data = response.read(5_000_001)
        if response.headers.get_content_type() != 'image/jpeg' or not data.startswith(b'\xff\xd8\xff') or len(data) > 5_000_000:
            raise ValueError(f'{record["slug"]}: expected a public JPEG thumbnail')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true', help='Refresh covers after main-film content changes')
    parser.add_argument('--check', action='store_true', help='Validate cached covers without using the network')
    args = parser.parse_args()
    if args.refresh and args.check:
        parser.error('--refresh and --check cannot be combined')
    records = [validate(json.loads(p.read_text())) for p in (ROOT / 'data/weddings').glob('*.json')]
    records = [r for r in records if r['status'] == 'published']
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        jobs = {pool.submit(sync, r, args.refresh, args.check): r['slug'] for r in records}
        failures = []
        for job in concurrent.futures.as_completed(jobs):
            try:
                job.result()
            except Exception as error:
                failures.append(f'{jobs[job]}: {error}')
        if failures:
            raise SystemExit('\n'.join(sorted(failures)))
    print(f'Validated {len(records)} main-film thumbnails.')


if __name__ == '__main__':
    main()
