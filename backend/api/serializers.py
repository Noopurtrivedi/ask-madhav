from rest_framework import serializers
from .models import Chapter, Verse, Story


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = '__all__'


class VerseSerializer(serializers.ModelSerializer):
    reference = serializers.SerializerMethodField()

    class Meta:
        model = Verse
        fields = [
            'id', 'chapter_number', 'verse_number', 'reference',
            'sanskrit_text', 'transliteration', 'hindi_meaning',
            'english_meaning', 'keywords', 'themes', 'practical_guidance',
        ]

    def get_reference(self, obj):
        return obj.reference


class VerseCardSerializer(serializers.ModelSerializer):
    """Slim serializer used inside /ask responses."""
    reference = serializers.SerializerMethodField()
    sanskrit = serializers.CharField(source='sanskrit_text')
    hindi_meaning = serializers.CharField()
    english_meaning = serializers.CharField()
    chapter = serializers.IntegerField(source='chapter_number')
    verse = serializers.IntegerField(source='verse_number')

    class Meta:
        model = Verse
        fields = [
            'chapter', 'verse', 'reference',
            'sanskrit', 'transliteration',
            'hindi_meaning', 'english_meaning', 'practical_guidance',
        ]

    def get_reference(self, obj):
        return obj.reference


class StorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Story
        fields = '__all__'
