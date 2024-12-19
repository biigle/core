<?php

namespace Biigle\Tests\Modules\Sync\Http\Controllers\Views;

use ApiTestCase;
use Biigle\Modules\Sync\Support\Export\LabelTreeExport;
use Biigle\Modules\Sync\Support\Export\UserExport;
use Biigle\Modules\Sync\Support\Export\VolumeExport;
use Biigle\Modules\Sync\Support\Import\ArchiveManager;
use Illuminate\Http\UploadedFile;

class PublicLabelTreeImportControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $this->beGlobalGuest();
        $this->get('label-trees/import')->assertStatus(403);

        $this->beUser();
        $this->get('label-trees/import')->assertStatus(200);
    }
}
