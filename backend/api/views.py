from datetime import datetime

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Verse, Story
from .serializers import VerseSerializer, StorySerializer
from .verse_engine import build_keyword_index, score_verses, build_answer

# In-memory index — built once on first request, cleared on restart
_INDEX_CACHE = {}


def _get_index():
    if 'index' not in _INDEX_CACHE:
        verses = list(Verse.objects.all())
        _INDEX_CACHE['verses'] = verses
        _INDEX_CACHE['index'] = build_keyword_index(verses)
    return _INDEX_CACHE['verses'], _INDEX_CACHE['index']


class HealthView(APIView):
    def get(self, request):
        verse_count = Verse.objects.count()
        story_count = Story.objects.count()
        return Response({
            'status': 'ok',
            'timestamp': datetime.utcnow().isoformat(),
            'verses_loaded': verse_count,
            'stories_loaded': story_count,
        })


class AskView(APIView):
    def post(self, request):
        question = (request.data.get('question') or '').strip()
        if len(question) < 3:
            return Response(
                {'error': 'Please ask a meaningful question.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        verses, index = _get_index()
        matched = score_verses(question, verses, index)
        result = build_answer(question, matched)
        return Response(result)


class DailyVerseView(APIView):
    def get(self, request):
        verses = list(Verse.objects.all())
        if not verses:
            return Response({'error': 'No verses in database.'}, status=404)
        day = datetime.utcnow().timetuple().tm_yday
        verse = verses[day % len(verses)]
        return Response({
            'date': datetime.utcnow().date().isoformat(),
            'verse': VerseSerializer(verse).data,
        })


class StoriesView(APIView):
    def get(self, request):
        stories = Story.objects.all()
        return Response({'stories': StorySerializer(stories, many=True).data})


class VersesView(APIView):
    def get(self, request):
        verses = Verse.objects.all()
        return Response({'verses': VerseSerializer(verses, many=True).data})


class VerseDetailView(APIView):
    def get(self, request, reference):
        try:
            parts = reference.split('.')
            chapter_num, verse_num = int(parts[0]), int(parts[1])
            verse = Verse.objects.get(chapter_number=chapter_num, verse_number=verse_num)
            return Response(VerseSerializer(verse).data)
        except (Verse.DoesNotExist, ValueError, IndexError):
            return Response({'error': 'Verse not found.'}, status=404)
