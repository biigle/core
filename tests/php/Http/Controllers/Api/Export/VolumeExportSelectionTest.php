<?php

namespace Biigle\Tests\Http\Controllers\Api\Export;

use ApiTestCase;
use Biigle\Tests\VolumeTest;
use Biigle\VolumeExport;

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
            VolumeExport::firstOrFail()->volume_ids
        );
    }
}
