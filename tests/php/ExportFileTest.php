<?php

namespace Biigle\Tests;

use Biigle\ExportFile;
use Biigle\User;
use Storage;
use TestCase;

class ExportFileTest extends TestCase
{
    public function testObserveSelf()
    {
        $disk = Storage::fake('exports');
        $export = $this->createExport();
        $disk->put($export->getStorageFilename(), 'content');
        $export->delete();
        $disk->assertMissing($export->getStorageFilename());
    }

    public function testObserveUser()
    {
        $disk = Storage::fake('exports');
        $export = $this->createExport();
        $disk->put($export->getStorageFilename(), 'content');
        $export->user->delete();
        $this->assertNull($export->fresh());
        $disk->assertMissing($export->getStorageFilename());
    }

    protected function createExport(): ExportFile
    {
        $export = new ExportFile;
        $export->user()->associate(User::factory()->create());
        $export->type = 'volumes';
        $export->entity_ids = [];
        $export->save();

        return $export;
    }
}
