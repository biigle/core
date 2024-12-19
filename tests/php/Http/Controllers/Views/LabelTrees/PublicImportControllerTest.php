<?php

namespace Biigle\Tests\Http\Controllers\Views;

use ApiTestCase;
use Biigle\Services\Export\LabelTreeExport;
use Biigle\Services\Export\UserExport;
use Biigle\Services\Export\VolumeExport;
use Biigle\Services\Import\ArchiveManager;
use Illuminate\Http\UploadedFile;

class PublicImportControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->beGlobalGuest();
        $this->get('label-trees/import')->assertStatus(403);

        $this->beUser();
        $this->get('label-trees/import')->assertStatus(200);
    }
}
