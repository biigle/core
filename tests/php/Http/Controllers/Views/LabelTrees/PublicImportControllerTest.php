<?php

namespace Biigle\Tests\Http\Controllers\Views\LabelTrees;

use ApiTestCase;

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
