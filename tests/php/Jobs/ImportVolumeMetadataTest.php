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
use Biigle\Services\MetadataParsing\VolumeMetadata;
use Biigle\Shape;
use Biigle\User as DbUser;
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
        $id = $pv->id;

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
        //
    }

    public function testHandleMatchByUuid()
    {
        //
    }

    public function testHandleDeletedUser()
    {
        // set null
    }

    public function testHandleDeletedLabel()
    {
        // ignore
    }

    public function testHandleIgnoreAnnotations()
    {
        // if import_annotation === false
    }

    public function testHandleIgnoreFileLabels()
    {
        // if import_file_labels === false
    }

    public function testHandleFilterAnnotationLabels()
    {
        // respect only_annotation_labels
    }

    public function testHandleFilterFileLabels()
    {
        // respect only_file_labels
    }

    public function testHandleIgnoreMissingFiles()
    {
        // skip metadata files that don't exist in the volume
    }

    public function testHandleRetryWhileCreatingAsync()
    {
        // if the volume has creating_async === true, resubmit the import job and wait for 10 minutes (max. 12 times before failing?)
    }

    public function testHandleChunkAnnotations()
    {
        // configure the cunk size to 2 and test
    }
}
