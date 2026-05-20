from django.contrib import admin
from .models import Chapter, Verse, Story


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ['number', 'title_english', 'total_verses']
    ordering = ['number']


@admin.register(Verse)
class VerseAdmin(admin.ModelAdmin):
    list_display = ['reference', 'chapter_number', 'verse_number', 'transliteration']
    list_filter = ['chapter_number']
    search_fields = ['transliteration', 'english_meaning', 'keywords']
    ordering = ['chapter_number', 'verse_number']

    def reference(self, obj):
        return obj.reference


@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'chapter_reference']
    ordering = ['chapter_reference']
