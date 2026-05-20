from django.db import models
from django.contrib.postgres.fields import ArrayField


class Chapter(models.Model):
    number = models.IntegerField(unique=True)
    title_sanskrit = models.TextField()
    title_hindi = models.TextField()
    title_english = models.TextField()
    summary = models.TextField(blank=True)
    total_verses = models.IntegerField(default=0)

    class Meta:
        ordering = ['number']

    def __str__(self):
        return f"Chapter {self.number}: {self.title_english}"


class Verse(models.Model):
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='verses')
    chapter_number = models.IntegerField(db_index=True)
    verse_number = models.IntegerField()
    sanskrit_text = models.TextField()
    transliteration = models.TextField()
    hindi_meaning = models.TextField()
    english_meaning = models.TextField()
    keywords = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    themes = ArrayField(models.CharField(max_length=200), default=list, blank=True)
    practical_guidance = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['chapter_number', 'verse_number']
        ordering = ['chapter_number', 'verse_number']

    @property
    def reference(self):
        return f"{self.chapter_number}.{self.verse_number}"

    def __str__(self):
        return f"BG {self.reference}"

    def to_dict(self):
        return {
            'id': self.id,
            'chapter_number': self.chapter_number,
            'verse_number': self.verse_number,
            'reference': self.reference,
            'sanskrit_text': self.sanskrit_text,
            'transliteration': self.transliteration,
            'hindi_meaning': self.hindi_meaning,
            'english_meaning': self.english_meaning,
            'keywords': self.keywords,
            'themes': self.themes,
            'practical_guidance': self.practical_guidance,
        }


class Story(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    characters = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    moral = models.TextField()
    chapter_reference = models.IntegerField(default=1)
    image_placeholder = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['chapter_reference']

    def __str__(self):
        return self.title
