"""Guard publication, content escaping, withdrawal, and hundreds of collections."""
import copy
import json
from pathlib import Path
import tempfile
import unittest

import build_weddings as site


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


if __name__ == '__main__':
    unittest.main()
