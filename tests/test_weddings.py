"""Guard publication, content escaping, withdrawal, and hundreds of collections."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import build_weddings as site
import sync_wedding_thumbnails as thumbnails


class WeddingBuildTests(unittest.TestCase):
    def setUp(self):
        self.gallery = json.loads((site.ROOT / 'data/weddings/rachel-ryan.json').read_text())

    def test_draft_not_public_and_withdrawn_page_removed(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / 'data/weddings'
            source.mkdir(parents=True)
            path = source / 'rachel-ryan.json'
            self.gallery['status'] = 'draft'
            path.write_text(json.dumps(self.gallery))
            self.assertEqual(site.build(root), 0)
            self.assertFalse((root / 'weddings/rachel-ryan/index.html').exists())
            self.gallery['status'] = 'published'
            path.write_text(json.dumps(self.gallery))
            self.assertEqual(site.build(root), 1)
            self.assertTrue((root / 'weddings/rachel-ryan/index.html').exists())
            self.gallery['status'] = 'draft'
            path.write_text(json.dumps(self.gallery))
            site.build(root)
            self.assertFalse((root / 'weddings/rachel-ryan/index.html').exists())

    def test_html_and_json_escape_untrusted_names(self):
        self.gallery['names'] = '</script><script>alert(1)</script> & Ryan'
        page = site.couple_page(self.gallery)
        self.assertNotIn('</script><script>alert(1)', page)
        self.assertIn('\\u003c/script\\u003e', page)
        self.assertIn('&lt;/script&gt;', page)

    def test_reject_private_fields_path_traversal_and_duplicate_ids(self):
        for field, value in [('contact_email', 'private@example.com'), ('slug', '../../secret')]:
            invalid = copy.deepcopy(self.gallery)
            invalid[field] = value
            with self.assertRaises(ValueError):
                site.validate(invalid)
        invalid = copy.deepcopy(self.gallery)
        invalid['videos'].append(invalid['videos'][0])
        with self.assertRaises(ValueError):
            site.validate(invalid)

    def test_hundreds_are_deterministic_and_archive_loads_no_video_players(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / 'data/weddings'
            source.mkdir(parents=True)
            for i in range(350):
                record = copy.deepcopy(self.gallery)
                record.update(slug=f'couple-{i}', names=f'Couple {i}', status='published')
                (source / f'couple-{i}.json').write_text(json.dumps(record))
            self.assertEqual(site.build(root), 350)
            site.build(root, check=True)
            archive = (root / 'weddings/index.html').read_text()
            self.assertEqual(archive.count('class="archive-item"'), 350)
            self.assertNotIn('<iframe', archive)
            self.assertLess(len(archive), 400_000)
            page = root / 'weddings/couple-0/index.html'
            page.write_text('stale')
            with self.assertRaises(ValueError):
                site.build(root, check=True)

    def test_each_collection_has_one_player_and_all_seven_films(self):
        page = site.couple_page(self.gallery, preview=True)
        self.assertEqual(page.count('<iframe'), 1)
        self.assertEqual(page.count('data-film='), 7)
        self.assertIn('noindex,nofollow', page)
        for video in self.gallery['videos']:
            self.assertIn(video['drive_id'], page)

    def test_cover_tracks_main_film_and_unknown_date_is_omitted(self):
        self.gallery.pop('cover', None)
        self.gallery['date'] = None
        site.validate(self.gallery)
        original = self.gallery['videos'][0]['drive_id']
        self.gallery['videos'].reverse()
        main = self.gallery['videos'][0]['drive_id']
        archive = site.archive_page([self.gallery])
        page = site.couple_page(self.gallery)
        self.assertIn(f'/images/weddings/{main}.jpg', archive)
        self.assertNotIn(f'/images/weddings/{original}.jpg', archive)
        self.assertIn(f'og:image" content="https://takeonevisuals.com/images/weddings/{main}.jpg', page)
        self.assertIn(f'/file/d/{main}/preview', page)
        self.assertNotIn('<time', archive + page)
        self.assertNotIn('None', archive + page)
        self.assertIn('loading="lazy"', archive)

    def test_selected_cover_survives_playback_reordering_and_refresh(self):
        self.gallery['cover'] = {'source': 'drive', 'video_id': self.gallery['videos'][0]['drive_id'], 'time_seconds': 30}
        site.validate(self.gallery)
        path = site.thumbnail_path(self.gallery)
        self.gallery['videos'].reverse()
        self.assertEqual(site.thumbnail_path(self.gallery), path)
        with tempfile.TemporaryDirectory() as temp, patch.object(thumbnails, 'ROOT', Path(temp)), patch.object(thumbnails.urllib.request, 'urlopen') as request:
            target = Path(temp) / path.lstrip('/')
            target.parent.mkdir(parents=True)
            selected_image = b'\xff\xd8\xffchosen cover'
            target.write_bytes(selected_image)
            thumbnails.sync(self.gallery, refresh=True)
            request.assert_not_called()
            self.assertEqual(target.read_bytes(), selected_image)
            target.unlink()
            with self.assertRaisesRegex(ValueError, 'missing selected cover'):
                thumbnails.sync(self.gallery)

    def test_reject_invalid_cover_sources(self):
        for cover in [
            {'source': 'drive', 'video_id': 'not-a-collection-file', 'time_seconds': 3},
            {'source': 'youtube', 'video_id': '../../private', 'time_seconds': None},
            {'source': 'drive', 'video_id': self.gallery['videos'][0]['drive_id'], 'time_seconds': float('nan')},
        ]:
            self.gallery['cover'] = cover
            with self.assertRaises(ValueError):
                site.validate(self.gallery)


if __name__ == '__main__':
    unittest.main()
