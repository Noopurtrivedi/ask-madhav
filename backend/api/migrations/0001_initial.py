from django.db import migrations, models
import django.contrib.postgres.fields
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Chapter',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('number', models.IntegerField(unique=True)),
                ('title_sanskrit', models.TextField()),
                ('title_hindi', models.TextField()),
                ('title_english', models.TextField()),
                ('summary', models.TextField(blank=True)),
                ('total_verses', models.IntegerField(default=0)),
            ],
            options={
                'ordering': ['number'],
            },
        ),
        migrations.CreateModel(
            name='Story',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('characters', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=100), blank=True, default=list, size=None)),
                ('moral', models.TextField()),
                ('chapter_reference', models.IntegerField(default=1)),
                ('image_placeholder', models.CharField(blank=True, max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['chapter_reference'],
            },
        ),
        migrations.CreateModel(
            name='Verse',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('chapter_number', models.IntegerField(db_index=True)),
                ('verse_number', models.IntegerField()),
                ('sanskrit_text', models.TextField()),
                ('transliteration', models.TextField()),
                ('hindi_meaning', models.TextField()),
                ('english_meaning', models.TextField()),
                ('keywords', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=100), blank=True, default=list, size=None)),
                ('themes', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=200), blank=True, default=list, size=None)),
                ('practical_guidance', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('chapter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='verses', to='api.chapter')),
            ],
            options={
                'ordering': ['chapter_number', 'verse_number'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='verse',
            unique_together={('chapter_number', 'verse_number')},
        ),
    ]
