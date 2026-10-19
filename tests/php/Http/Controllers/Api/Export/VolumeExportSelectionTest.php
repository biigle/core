<?php

namespace Biigle\Tests\Http\Controllers\Api\Export;

use ApiTestCase;
use Biigle\ExportFile;
use Biigle\Tests\VolumeTest;

class VolumeExportSelectionTest extends ApiTestCase
{
    public function testStoreAcceptsEmptyExceptSelection()
    {
        $first = VolumeTest::create();
        $second = VolumeTest::create();
        $this->beGlobalAdmin();

        $this->postJson('/api/v1/export/volumes', ['except' => []])
            ->assertStatus(201);

        $this->assertSame(
            [$first->id, $second->id],
            ExportFile::firstOrFail()->entity_ids
        );
    }
}
