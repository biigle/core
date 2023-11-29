<?php

namespace Biigle\Tests;

use Biigle\MediaType;
use Biigle\PendingVolume;
use Biigle\Role;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use ModelTestCase;
use Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

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
    }

    public function testCreateOnlyOneForProject()
    {
        $this->expectException(UniqueConstraintViolationException::class);
        PendingVolume::factory()->create([
            'user_id' => $this->model->user_id,
            'project_id' => $this->model->project_id,
        ]);
    }

    public function testStoreMetadataFile()
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
}
