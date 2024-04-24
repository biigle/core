<?php

namespace Biigle\Tests;

use Biigle\PendingVolume;
use Biigle\Services\MetadataParsing\ImageCsvParser;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use ModelTestCase;
use Storage;

class PendingVolumeTest extends ModelTestCase
{
    /**
     * The model class this class will test.
     */
    protected static $modelClass = PendingVolume::class;

    public function testAttributes()
    {
        $this->model->refresh(); //Populate default values.
        $this->assertNotNull($this->model->media_type_id);
        $this->assertNotNull($this->model->user_id);
        $this->assertNotNull($this->model->project_id);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNull($this->model->metadata_file_path);
        $this->assertNull($this->model->metadata_parser);
        $this->assertNull($this->model->volume_id);
        $this->assertFalse($this->model->import_annotations);
        $this->assertFalse($this->model->import_file_labels);
        $this->assertEquals([], $this->model->only_annotation_labels);
        $this->assertEquals([], $this->model->only_file_labels);
        $this->assertEquals([], $this->model->label_map);
        $this->assertEquals([], $this->model->user_map);
        $this->assertFalse($this->model->importing);
    }

    public function testCreateOnlyOneForProject()
    {
        $this->expectException(UniqueConstraintViolationException::class);
        PendingVolume::factory()->create([
            'user_id' => $this->model->user_id,
            'project_id' => $this->model->project_id,
        ]);
    }

    public function testSaveMetadata()
    {
        $disk = Storage::fake('pending-metadata');
        $csv = __DIR__."/../files/image-metadata.csv";
        $file = new UploadedFile($csv, 'metadata.csv', 'text/csv', null, true);

        $this->assertFalse($this->model->hasMetadata());
        $this->model->saveMetadata($file);

        $disk->assertExists($this->model->id.'.csv');
        $this->assertTrue($this->model->hasMetadata());
        $this->assertEquals($this->model->id.'.csv', $this->model->metadata_file_path);
    }

    public function testDeleteMetadataOnDelete()
    {
        $disk = Storage::fake('pending-metadata');
        $disk->put($this->model->id.'.csv', 'abc');
        $this->model->metadata_file_path = $this->model->id.'.csv';
        $this->model->save();
        $this->model->delete();
        $disk->assertMissing($this->model->id.'.csv');
    }

    public function testGetMetadata()
    {
        $this->assertNull($this->model->getMetadata());
        $disk = Storage::fake('pending-metadata');
        $this->model->metadata_file_path = $this->model->id.'.csv';
        $disk->put($this->model->metadata_file_path, "filename,area\n1.jpg,2.5");
        $this->model->metadata_parser = ImageCsvParser::class;
        $metadata = $this->model->getMetadata();
        $fileMeta = $metadata->getFile('1.jpg');
        $this->assertEquals(2.5, $fileMeta->area);
    }
}
