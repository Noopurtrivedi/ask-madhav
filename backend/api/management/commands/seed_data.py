"""
Management command: python manage.py seed_data

Loads chapters, verses, and stories from /data/*.json into PostgreSQL.
Safe to run multiple times — uses get_or_create.
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.conf import settings

from api.models import Chapter, Verse, Story

CHAPTERS = [
    (1,  'अर्जुनविषादयोग',         'अर्जुन विषाद योग',       'Arjuna Vishada Yoga',          "Arjuna's grief and moral crisis on the Kurukshetra battlefield.",       47),
    (2,  'साङ्ख्ययोग',              'सांख्य योग',              'Sankhya Yoga',                 'Krishna teaches the immortality of the soul and the path of knowledge.',  72),
    (3,  'कर्मयोग',                 'कर्म योग',                'Karma Yoga',                   'The path of selfless action without attachment to results.',               43),
    (4,  'ज्ञानकर्मसन्न्यासयोग',   'ज्ञान-कर्म-संन्यास योग', 'Jnana Karma Sanyasa Yoga',     'The synthesis of knowledge, action, and renunciation.',                   42),
    (5,  'कर्मसन्न्यासयोग',        'कर्म संन्यास योग',        'Karma Sanyasa Yoga',           'Renunciation of action and the path of the self-disciplined.',             29),
    (6,  'आत्मसंयमयोग',            'आत्म संयम योग',           'Dhyana Yoga',                  'The practice of meditation and mastery of the mind.',                      47),
    (7,  'ज्ञानविज्ञानयोग',        'ज्ञान विज्ञान योग',       'Jnana Vijnana Yoga',           'Knowledge of the Absolute and the nature of the Divine.',                  30),
    (8,  'अक्षरब्रह्मयोग',         'अक्षर ब्रह्म योग',        'Aksara Brahma Yoga',           'The imperishable Brahman and the path at the time of death.',               28),
    (9,  'राजविद्याराजगुह्ययोग',   'राज विद्या राज गुह्य योग','Raja Vidya Raja Guhya Yoga',   'The royal knowledge — the most secret path of devotion.',                  34),
    (10, 'विभूतियोग',               'विभूति योग',              'Vibhuti Yoga',                 'The divine manifestations and glories of Krishna.',                        42),
    (11, 'विश्वरूपदर्शनयोग',       'विश्वरूप दर्शन योग',      'Vishwarupa Darshana Yoga',     'Arjuna witnesses the universal cosmic form of Krishna.',                   55),
    (12, 'भक्तियोग',               'भक्ति योग',               'Bhakti Yoga',                  'The path of devotion and the qualities of the ideal devotee.',              20),
    (13, 'क्षेत्रक्षेत्रज्ञविभागयोग','क्षेत्र-क्षेत्रज्ञ विभाग योग','Kshetra Kshetrajna Vibhaga Yoga','The field and the knower of the field — body and soul.',          35),
    (14, 'गुणत्रयविभागयोग',        'गुण त्रय विभाग योग',      'Gunatraya Vibhaga Yoga',       'The three qualities of nature — sattva, rajas, and tamas.',                27),
    (15, 'पुरुषोत्तमयोग',          'पुरुषोत्तम योग',           'Purushottama Yoga',            'The Yoga of the Supreme Person — the eternal and the transcendent.',        20),
    (16, 'दैवासुरसम्पद्विभागयोग', 'दैव-असुर संपद विभाग योग','Daivasura Sampad Vibhaga Yoga','Divine and demoniac natures — two paths of human beings.',                 24),
    (17, 'श्रद्धात्रयविभागयोग',   'श्रद्धात्रय विभाग योग',   'Shraddhatraya Vibhaga Yoga',   'The three kinds of faith corresponding to the three gunas.',               28),
    (18, 'मोक्षसन्न्यासयोग',       'मोक्ष संन्यास योग',        'Moksha Sanyasa Yoga',          'The final teaching — renunciation, liberation, and total surrender.',      78),
]


class Command(BaseCommand):
    help = 'Seed database with Bhagavad Gita chapters, verses, and Mahabharata stories from JSON files.'

    def handle(self, *args, **options):
        self.stdout.write('🌸 Seeding Ask Madhav database...')

        # Seed chapters
        self.stdout.write('  → Seeding 18 chapters...')
        for num, skt, hi, en, summary, total in CHAPTERS:
            Chapter.objects.get_or_create(
                number=num,
                defaults={
                    'title_sanskrit': skt,
                    'title_hindi': hi,
                    'title_english': en,
                    'summary': summary,
                    'total_verses': total,
                }
            )
        self.stdout.write(self.style.SUCCESS('    ✓ Chapters done'))

        # Seed verses from JSON
        verses_path = settings.DATA_DIR / 'verses.json'
        if not verses_path.exists():
            self.stdout.write(self.style.ERROR(f'    ✗ verses.json not found at {verses_path}'))
            return

        with open(verses_path, encoding='utf-8') as f:
            verses_data = json.load(f)

        self.stdout.write(f'  → Seeding {len(verses_data)} verses...')
        created = 0
        for v in verses_data:
            chapter = Chapter.objects.get(number=v['chapter_number'])
            _, was_created = Verse.objects.get_or_create(
                chapter_number=v['chapter_number'],
                verse_number=v['verse_number'],
                defaults={
                    'chapter': chapter,
                    'sanskrit_text': v['sanskrit_text'],
                    'transliteration': v['transliteration'],
                    'hindi_meaning': v['hindi_meaning'],
                    'english_meaning': v['english_meaning'],
                    'keywords': v.get('keywords', []),
                    'themes': v.get('themes', []),
                    'practical_guidance': v.get('practical_guidance', ''),
                }
            )
            if was_created:
                created += 1

        self.stdout.write(self.style.SUCCESS(f'    ✓ {created} new verses inserted ({len(verses_data) - created} already existed)'))

        # Seed stories from JSON
        stories_path = settings.DATA_DIR / 'stories.json'
        if stories_path.exists():
            with open(stories_path, encoding='utf-8') as f:
                stories_data = json.load(f)
            self.stdout.write(f'  → Seeding {len(stories_data)} stories...')
            s_created = 0
            for s in stories_data:
                _, was_created = Story.objects.get_or_create(
                    title=s['title'],
                    defaults={
                        'description': s['description'],
                        'characters': s.get('characters', []),
                        'moral': s['moral'],
                        'chapter_reference': s.get('chapter_reference', 1),
                        'image_placeholder': s.get('image_placeholder', ''),
                    }
                )
                if was_created:
                    s_created += 1
            self.stdout.write(self.style.SUCCESS(f'    ✓ {s_created} new stories inserted'))

        self.stdout.write(self.style.SUCCESS('\n🙏 Database seeded successfully! Ask Madhav is ready.'))
