<?php

namespace Biigle\Tests\Modules\Sync\Http\Controllers\Api\Export;

use ApiTestCase;
use Biigle\Tests\LabelTreeTest;
use ZipArchive;

class LabelTreeExportControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $tree = LabelTreeTest::create();
        $this->doTestApiRoute('GET', '/api/v1/export/label-trees');

        $this->beAdmin();
        $this->get('/api/v1/export/label-trees')->assertStatus(403);

        $this->beGlobalAdmin();
        $response = $this->get('/api/v1/export/label-trees')
            ->assertStatus(200)
            ->assertHeader('content-type', 'application/zip')
            ->assertHeader('content-disposition', 'attachment; filename=biigle_label_tree_export.zip');

        $zip = new ZipArchive;
        $zip->open($response->getFile()->getRealPath());
        $contents = collect(json_decode($zip->getFromName('label_trees.json')));
        $this->assertEquals($tree->id, $contents->pluck('id')[0]);
        $this->assertNotNull($zip->getFromName('users.json'));
    }

    public function testShowExcept()
    {
        $tree1 = LabelTreeTest::create();
        $tree2 = LabelTreeTest::create();
        $id = $tree1->id;
        $this->beGlobalAdmin();
        $response = $this->get("/api/v1/export/label-trees?except={$id}")->assertStatus(200);

        $zip = new ZipArchive;
        $zip->open($response->getFile()->getRealPath());
        $contents = collect(json_decode($zip->getFromName('label_trees.json')));
        $this->assertEquals($tree2->id, $contents->pluck('id')[0]);
    }

    public function testShowOnly()
    {
        $tree1 = LabelTreeTest::create();
        $tree2 = LabelTreeTest::create();
        $id = $tree1->id;
        $this->beGlobalAdmin();
        $response = $this->get("/api/v1/export/label-trees?only={$id}")->assertStatus(200);

        $zip = new ZipArchive;
        $zip->open($response->getFile()->getRealPath());
        $contents = collect(json_decode($zip->getFromName('label_trees.json')));
        $this->assertEquals($tree1->id, $contents->pluck('id')[0]);
    }

    public function testIsAllowed()
    {
        config(['sync.allowed_exports' => ['volumes', 'users']]);
        $this->beGlobalAdmin();
        $response = $this->get('/api/v1/export/label-trees')->assertStatus(404);
    }
}
