<?php

namespace Biigle\Tests\Jobs;

use Biigle\Enums\MediaType;
use Biigle\Enums\Shape;
use Biigle\Image;
use Biigle\Jobs\ImportVolumeMetadata;
use Biigle\Jobs\ProcessAnnotatedImage;
use Biigle\Jobs\ProcessAnnotatedVideo;
use Biigle\Label as DbLabel;
use Biigle\PendingVolume;
use Biigle\Services\MetadataParsing\ImageAnnotation;
use Biigle\Services\MetadataParsing\ImageMetadata;
use Biigle\Services\MetadataParsing\Label;
use Biigle\Services\MetadataParsing\LabelAndUser;
use Biigle\Services\MetadataParsing\User;
use Biigle\Services\MetadataParsing\VideoAnnotation;
use Biigle\Services\MetadataParsing\VideoMetadata;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use Biigle\User as DbUser;
use Biigle\Video;
use Biigle\Volume;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use TestCase;

class ImportVolumeMetadataTest extends TestCase
{
    public function testHandle()
    {
        $image = Image::factory()->create();
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata($image->filename);
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);
        $annotation = new ImageAnnotation(
            shape: Shape::POINT,
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type' => MediaType::IMAGE,
            'metadata_file_path' => 'mymeta.csv',
            'import_file_labels' => true,
            'import_annotations' => true,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],
            'volume_id' => $image->volume_id,
        ]);

        (new ImportVolumeMetadata($pv))->handle();

        $annotations = $image->annotations;
        $this->assertCount(1, $annotations);
        $this->assertEquals([10, 10], $annotations[0]->points);
        $this->assertEquals(Shape::POINT, $annotations[0]->shape);
        $this->assertNotNull($annotations[0]->created_at);
        $this->assertNotNull($annotations[0]->updated_at);
        $annotationLabels = $annotations[0]->labels;
        $this->assertCount(1, $annotationLabels);
        $this->assertEquals($dbUser->id, $annotationLabels[0]->user_id);
        $this->assertEquals($dbLabel->id, $annotationLabels[0]->label_id);
        $this->assertNotNull($annotationLabels[0]->created_at);
        $this->assertNotNull($annotationLabels[0]->updated_at);

        $fileLabels = $image->labels;
        $this->assertCount(1, $fileLabels);
        $this->assertEquals($dbUser->id, $fileLabels[0]->user_id);
        $this->assertEquals($dbLabel->id, $fileLabels[0]->label_id);

        $this->assertNull($pv->fresh());
        Queue::assertPushed(ProcessAnnotatedImage::class);
    }

    public function testHandleVideo()
    {
        $video = Video::factory()->create();
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata($video->filename);
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);
        $annotation = new VideoAnnotation(
            shape: Shape::POINT,
            points: [[10, 10]],
            frames: [1],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type' => MediaType::VIDEO,
            'metadata_file_path' => 'mymeta.csv',
            'import_file_labels' => true,
            'import_annotations' => true,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],
            'volume_id' => $video->volume_id,
        ]);

        (new ImportVolumeMetadata($pv))->handle();

        $annotations = $video->annotations;
        $this->assertCount(1, $annotations);
        $this->assertEquals([[10, 10]], $annotations[0]->points);
        $this->assertEquals([1], $annotations[0]->frames);
        $this->assertEquals(Shape::POINT, $annotations[0]->shape);
        $this->assertNotNull($annotations[0]->created_at);
        $this->assertNotNull($annotations[0]->updated_at);
        $annotationLabels = $annotations[0]->labels;
        $this->assertCount(1, $annotationLabels);
        $this->assertEquals($dbUser->id, $annotationLabels[0]->user_id);
        $this->assertEquals($dbLabel->id, $annotationLabels[0]->label_id);
        $this->assertNotNull($annotationLabels[0]->created_at);
        $this->assertNotNull($annotationLabels[0]->updated_at);

        $fileLabels = $video->labels;
        $this->assertCount(1, $fileLabels);
        $this->assertEquals($dbUser->id, $fileLabels[0]->user_id);
        $this->assertEquals($dbLabel->id, $fileLabels[0]->label_id);

        $this->assertNull($pv->fresh());
        Queue::assertPushed(ProcessAnnotatedVideo::class);
    }

    public function testHandleMatchByUuid()
    {
        $image = Image::factory()->create();
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata($image->filename);
        $metadata->addFile($file);
        $label = new Label(123, 'my label', uuid: $dbLabel->uuid);
        $user = new User(321, 'joe user', uuid: $dbUser->uuid);
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);
        $annotation = new ImageAnnotation(
            shape: Shape::POINT,
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type' => MediaType::IMAGE,
            'metadata_file_path' => 'mymeta.csv',
            'import_file_labels' => true,
            'import_annotations' => true,
            'volume_id' => $image->volume_id,
        ]);

        (new ImportVolumeMetadata($pv))->handle();

        $annotation = $image->annotations()->first();
        $this->assertEquals($dbUser->id, $annotation->labels[0]->user_id);
        $this->assertEquals($dbLabel->id, $annotation->labels[0]->label_id);

        $this->assertEquals($dbUser->id, $image->labels[0]->user_id);
        $this->assertEquals($dbLabel->id, $image->labels[0]->label_id);
    }

    public function testHandleDeletedUser()
    {
        $image = Image::factory()->create();
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata($image->filename);
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);
        $annotation = new ImageAnnotation(
            shape: Shape::POINT,
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type' => MediaType::IMAGE,
            'metadata_file_path' => 'mymeta.csv',
            'import_file_labels' => true,
            'import_annotations' => true,
            'user_map' => [321 => -1],
            'label_map' => [123 => $dbLabel->id],
            'volume_id' => $image->volume_id,
        ]);

        (new ImportVolumeMetadata($pv))->handle();

        $annotation = $image->annotations()->first();
        $this->assertNull($annotation->labels[0]->user_id);
        $this->assertNull($image->labels[0]->user_id);
    }

    public function testHandleDeletedLabel()
    {
        $image = Image::factory()->create();
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata($image->filename);
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);
        $annotation = new ImageAnnotation(
            shape: Shape::POINT,
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type' => MediaType::IMAGE,
            'metadata_file_path' => 'mymeta.csv',
            'import_file_labels' => true,
            'import_annotations' => true,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => -1],
            'volume_id' => $image->volume_id,
        ]);

        (new ImportVolumeMetadata($pv))->handle();

        $this->assertFalse($image->annotations()->exists());
        $this->assertFalse($image->labels()->exists());
    }

    public function testHandleIgnoreAnnotations()
    {
        $image = Image::factory()->create();
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata($image->filename);
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);
        $annotation = new ImageAnnotation(
            shape: Shape::POINT,
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type' => MediaType::IMAGE,
            'metadata_file_path' => 'mymeta.csv',
            'import_file_labels' => true,
            'import_annotations' => false,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],
            'volume_id' => $image->volume_id,
        ]);

        (new ImportVolumeMetadata($pv))->handle();

        $this->assertFalse($image->annotations()->exists());
        $this->assertTrue($image->labels()->exists());
        Queue::assertNotPushed(ProcessAnnotatedImage::class);
    }

    public function testHandleIgnoreFileLabels()
    {
        $image = Image::factory()->create();
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata($image->filename);
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);
        $annotation = new ImageAnnotation(
            shape: Shape::POINT,
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type' => MediaType::IMAGE,
            'metadata_file_path' => 'mymeta.csv',
            'import_file_labels' => false,
            'import_annotations' => true,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],
            'volume_id' => $image->volume_id,
        ]);

        (new ImportVolumeMetadata($pv))->handle();

        $this->assertTrue($image->annotations()->exists());
        $this->assertFalse($image->labels()->exists());
    }

    public function testHandleFilterAnnotationLabels()
    {
        $image = Image::factory()->create();
        $dbUser = DbUser::factory()->create();
        $dbLabel1 = DbLabel::factory()->create();
        $dbLabel2 = DbLabel::factory()->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata($image->filename);
        $metadata->addFile($file);
        $label1 = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label1, $user);
        $file->addFileLabel($lau);
        $annotation = new ImageAnnotation(
            shape: Shape::POINT,
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        $label2 = new Label(234, 'my label');
        $lau = new LabelAndUser($label2, $user);
        $file->addFileLabel($lau);
        $annotation = new ImageAnnotation(
            shape: Shape::POINT,
            points: [20, 20],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type' => MediaType::IMAGE,
            'metadata_file_path' => 'mymeta.csv',
            'import_file_labels' => true,
            'import_annotations' => true,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel1->id, 234 => $dbLabel2->id],
            'only_annotation_labels' => [123],
            'volume_id' => $image->volume_id,
        ]);

        (new ImportVolumeMetadata($pv))->handle();

        $annotations = $image->annotations;
        $this->assertCount(1, $annotations);
        $this->assertEquals([10, 10], $annotations[0]->points);
        $this->assertEquals(Shape::POINT, $annotations[0]->shape);
        $annotationLabels = $annotations[0]->labels;
        $this->assertCount(1, $annotationLabels);
        $this->assertEquals($dbLabel1->id, $annotationLabels[0]->label_id);

        $this->assertEquals(2, $image->labels()->count());
    }

    public function testHandleFilterFileLabels()
    {
        $image = Image::factory()->create();
        $dbUser = DbUser::factory()->create();
        $dbLabel1 = DbLabel::factory()->create();
        $dbLabel2 = DbLabel::factory()->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata($image->filename);
        $metadata->addFile($file);
        $label1 = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label1, $user);
        $file->addFileLabel($lau);
        $annotation = new ImageAnnotation(
            shape: Shape::POINT,
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        $label2 = new Label(234, 'my label');
        $lau = new LabelAndUser($label2, $user);
        $file->addFileLabel($lau);
        $annotation = new ImageAnnotation(
            shape: Shape::POINT,
            points: [20, 20],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type' => MediaType::IMAGE,
            'metadata_file_path' => 'mymeta.csv',
            'import_file_labels' => true,
            'import_annotations' => true,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel1->id, 234 => $dbLabel2->id],
            'only_file_labels' => [123],
            'volume_id' => $image->volume_id,
        ]);

        (new ImportVolumeMetadata($pv))->handle();

        $this->assertEquals(2, $image->annotations()->count());

        $fileLabels = $image->labels;
        $this->assertCount(1, $fileLabels);
        $this->assertEquals($dbLabel1->id, $fileLabels[0]->label_id);
    }

    public function testHandleIgnoreMissingFiles()
    {
        $image = Image::factory()->create();
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata('unknown.jpg');
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);
        $annotation = new ImageAnnotation(
            shape: Shape::POINT,
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type' => MediaType::IMAGE,
            'metadata_file_path' => 'mymeta.csv',
            'import_file_labels' => true,
            'import_annotations' => true,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],
            'volume_id' => $image->volume_id,
        ]);

        (new ImportVolumeMetadata($pv))->handle();

        $this->assertFalse($image->annotations()->exists());
        $this->assertFalse($image->labels()->exists());
    }

    public function testHandleRetryWhileCreatingAsync()
    {
        $image = Image::factory()->create();
        $volume = Volume::factory()->create();
        $volume->creating_async = true;
        $volume->save();

        $pv = PendingVolume::factory()->create(['volume_id' => $volume->id]);

        (new ImportVolumeMetadata($pv))->handle();

        $this->assertNotNull($pv->fresh());
    }

    public function testHandleChunkAnnotations()
    {
        ImportVolumeMetadata::$insertChunkSize = 1;

        $image = Image::factory()->create();
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata($image->filename);
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $annotation = new ImageAnnotation(
            shape: Shape::POINT,
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);
        $annotation = new ImageAnnotation(
            shape: Shape::POINT,
            points: [20, 20],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type' => MediaType::IMAGE,
            'metadata_file_path' => 'mymeta.csv',
            'import_annotations' => true,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],
            'volume_id' => $image->volume_id,
        ]);

        (new ImportVolumeMetadata($pv))->handle();

        $this->assertEquals(2, $image->annotations()->count());
    }

    public function testHandleWithinParamLimit()
    {
        $image = Image::factory()->create();
        $dbUser = DbUser::factory()->create();
        $dbLabels = DbLabel::factory()->count(3)->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata($image->filename);
        $metadata->addFile($file);
        $user = new User(321, 'joe user');
        $labels = [
            new LabelAndUser(new Label(1, 'label 1'), $user),
            new LabelAndUser(new Label(2, 'label 2'), $user),
            new LabelAndUser(new Label(3, 'label 3'), $user),
        ];
        for ($i = 0; $i < 3; $i++) {
            $file->addAnnotation(new ImageAnnotation(
                shape: Shape::POINT,
                points: [$i, $i],
                labels: $labels,
            ));
        }

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type' => MediaType::IMAGE,
            'metadata_file_path' => 'mymeta.csv',
            'import_annotations' => true,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [
                1 => $dbLabels[0]->id,
                2 => $dbLabels[1]->id,
                3 => $dbLabels[2]->id,
            ],
            'volume_id' => $image->volume_id,
        ]);

        // Annotations and annotation labels are inserted in chunks of two.
        config(['biigle.db_param_limit' => 12]);
        $this->assertQueriesWithinParamLimit();
        (new ImportVolumeMetadata($pv))->handle();

        $annotations = $image->annotations()->with('labels')->orderBy('id')->get();
        $this->assertSame([[0, 0], [1, 1], [2, 2]], $annotations->pluck('points')->all());
        $expect = $dbLabels->pluck('id')->all();
        foreach ($annotations as $annotation) {
            $this->assertSame($expect, $annotation->labels->sortBy('id')->pluck('label_id')->values()->all());
        }
    }

    public function testHandleVideoWithinParamLimit()
    {
        $video = Video::factory()->create();
        $dbUser = DbUser::factory()->create();
        $dbLabels = DbLabel::factory()->count(3)->create();

        $metadata = new VolumeMetadata;
        $file = new VideoMetadata($video->filename);
        $metadata->addFile($file);
        $user = new User(321, 'joe user');
        $labels = [
            new LabelAndUser(new Label(1, 'label 1'), $user),
            new LabelAndUser(new Label(2, 'label 2'), $user),
            new LabelAndUser(new Label(3, 'label 3'), $user),
        ];
        for ($i = 0; $i < 3; $i++) {
            $file->addAnnotation(new VideoAnnotation(
                shape: Shape::POINT,
                points: [[$i, $i]],
                frames: [$i],
                labels: $labels,
            ));
        }

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type' => MediaType::VIDEO,
            'metadata_file_path' => 'mymeta.csv',
            'import_annotations' => true,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [
                1 => $dbLabels[0]->id,
                2 => $dbLabels[1]->id,
                3 => $dbLabels[2]->id,
            ],
            'volume_id' => $video->volume_id,
        ]);

        // Annotations and annotation labels are inserted in chunks of two.
        config(['biigle.db_param_limit' => 12]);
        $this->assertQueriesWithinParamLimit();
        (new ImportVolumeMetadata($pv))->handle();

        $annotations = $video->annotations()->with('labels')->orderBy('id')->get();
        $this->assertSame([[[0, 0]], [[1, 1]], [[2, 2]]], $annotations->pluck('points')->all());
        $this->assertSame([[0], [1], [2]], $annotations->pluck('frames')->all());
        $expect = $dbLabels->pluck('id')->all();
        foreach ($annotations as $annotation) {
            $this->assertSame($expect, $annotation->labels->sortBy('id')->pluck('label_id')->values()->all());
        }
    }

    /*
     * This tests if the annotations and their labels match after the import. The check is
     * important because annotations and labels are inserted in two different DB
     * statements and the ordering is important. The ordering was mixed up at some point
     * so the annotations did not get the correct labels.
     */
    public function testHandleMultipleOrdering()
    {
        $image = Image::factory()->create();
        $dbUser = DbUser::factory()->create();
        $dbLabel = DbLabel::factory()->create();
        $dbLabel2 = DbLabel::factory()->create();

        $metadata = new VolumeMetadata;
        $file = new ImageMetadata($image->filename);
        $metadata->addFile($file);
        $label = new Label(123, 'my label');
        $user = new User(321, 'joe user');
        $lau = new LabelAndUser($label, $user);
        $file->addFileLabel($lau);
        $annotation = new ImageAnnotation(
            shape: Shape::POINT,
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        $label2 = new Label(321, 'my other label');
        $lau2 = new LabelAndUser($label2, $user);
        $annotation2 = new ImageAnnotation(
            shape: Shape::POINT,
            points: [10, 10],
            labels: [$lau2],
        );
        $file->addAnnotation($annotation2);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type' => MediaType::IMAGE,
            'metadata_file_path' => 'mymeta.csv',
            'import_file_labels' => true,
            'import_annotations' => true,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id, 321 => $dbLabel2->id],
            'volume_id' => $image->volume_id,
        ]);

        (new ImportVolumeMetadata($pv))->handle();

        $annotations = $image->annotations()->orderBy('id', 'asc')->get();

        $this->assertSame($dbLabel->id, $annotations[0]->labels[0]->label_id);
        $this->assertSame($dbLabel2->id, $annotations[1]->labels[0]->label_id);
    }
}
