<?php

namespace Biigle\Tests;

use Biigle\PendingVolume;
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
        $this->assertNotNull($this->model->media_type_id);
        $this->assertNotNull($this->model->user_id);
        $this->assertNotNull($this->model->project_id);
        $this->assertNotNull($this->model->created_at);
        $this->assertNotNull($this->model->updated_at);
        $this->assertNull($this->model->metadata_file_path);
        $this->assertNull($this->model->volume_id);
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
}
