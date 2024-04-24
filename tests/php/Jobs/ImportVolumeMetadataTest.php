<?php

namespace Biigle\Tests\Jobs;

use Biigle\Image;
use Biigle\Jobs\ImportVolumeMetadata;
use Biigle\Label as DbLabel;
use Biigle\MediaType;
use Biigle\PendingVolume;
use Biigle\Services\MetadataParsing\ImageAnnotation;
use Biigle\Services\MetadataParsing\ImageMetadata;
use Biigle\Services\MetadataParsing\Label;
use Biigle\Services\MetadataParsing\LabelAndUser;
use Biigle\Services\MetadataParsing\User;
use Biigle\Services\MetadataParsing\VideoAnnotation;
use Biigle\Services\MetadataParsing\VolumeMetadata;
use Biigle\Shape;
use Biigle\User as DbUser;
use Biigle\Video;
use Biigle\Volume;
use Illuminate\Support\Facades\Cache;
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
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type_id' => MediaType::imageId(),
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
        $this->assertEquals(Shape::pointId(), $annotations[0]->shape_id);
        $annotationLabels = $annotations[0]->labels;
        $this->assertCount(1, $annotationLabels);
        $this->assertEquals($dbUser->id, $annotationLabels[0]->user_id);
        $this->assertEquals($dbLabel->id, $annotationLabels[0]->label_id);

        $fileLabels = $image->labels;
        $this->assertCount(1, $fileLabels);
        $this->assertEquals($dbUser->id, $fileLabels[0]->user_id);
        $this->assertEquals($dbLabel->id, $fileLabels[0]->label_id);

        $this->assertNull($pv->fresh());
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
            shape: Shape::point(),
            points: [[10, 10]],
            frames: [1],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type_id' => MediaType::videoId(),
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
        $this->assertEquals(Shape::pointId(), $annotations[0]->shape_id);
        $annotationLabels = $annotations[0]->labels;
        $this->assertCount(1, $annotationLabels);
        $this->assertEquals($dbUser->id, $annotationLabels[0]->user_id);
        $this->assertEquals($dbLabel->id, $annotationLabels[0]->label_id);

        $fileLabels = $video->labels;
        $this->assertCount(1, $fileLabels);
        $this->assertEquals($dbUser->id, $fileLabels[0]->user_id);
        $this->assertEquals($dbLabel->id, $fileLabels[0]->label_id);

        $this->assertNull($pv->fresh());
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
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type_id' => MediaType::imageId(),
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
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type_id' => MediaType::imageId(),
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
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type_id' => MediaType::imageId(),
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
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type_id' => MediaType::imageId(),
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
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type_id' => MediaType::imageId(),
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
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        $label2 = new Label(234, 'my label');
        $lau = new LabelAndUser($label2, $user);
        $file->addFileLabel($lau);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [20, 20],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type_id' => MediaType::imageId(),
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
        $this->assertEquals(Shape::pointId(), $annotations[0]->shape_id);
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
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        $label2 = new Label(234, 'my label');
        $lau = new LabelAndUser($label2, $user);
        $file->addFileLabel($lau);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [20, 20],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type_id' => MediaType::imageId(),
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
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type_id' => MediaType::imageId(),
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
            shape: Shape::point(),
            points: [10, 10],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);
        $annotation = new ImageAnnotation(
            shape: Shape::point(),
            points: [20, 20],
            labels: [$lau],
        );
        $file->addAnnotation($annotation);

        Cache::store('array')->put('metadata-pending-metadata-mymeta.csv', $metadata);

        $pv = PendingVolume::factory()->create([
            'media_type_id' => MediaType::imageId(),
            'metadata_file_path' => 'mymeta.csv',
            'import_annotations' => true,
            'user_map' => [321 => $dbUser->id],
            'label_map' => [123 => $dbLabel->id],
            'volume_id' => $image->volume_id,
        ]);

        (new ImportVolumeMetadata($pv))->handle();

        $this->assertEquals(2, $image->annotations()->count());
    }
}
