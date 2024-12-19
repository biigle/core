<?php

namespace Biigle\Tests\Http\Controllers\Api\Export;

use ApiTestCase;
use Biigle\Role;
use Biigle\Tests\LabelTreeTest;
use Biigle\Visibility;
use ZipArchive;

class PublicLabelTreeExportControllerTest extends ApiTestCase
{
    public function testShow()
    {
        $tree = LabelTreeTest::create(['visibility_id' => Visibility::privateId()]);
        $tree->addMember($this->editor(), Role::editor());

        $this->doTestApiRoute('GET', "/api/v1/public-export/label-trees/{$tree->id}");

        $this->beUser();
        $this->get("/api/v1/public-export/label-trees/{$tree->id}")->assertStatus(403);

        $this->beEditor();
        $response = $this->get("/api/v1/public-export/label-trees/{$tree->id}")
            ->assertStatus(200)
            ->assertHeader('content-type', 'application/zip')
            ->assertHeader('content-disposition', 'attachment; filename=biigle_label_tree_export.zip');

        $zip = new ZipArchive;
        $zip->open($response->getFile()->getRealPath());
        $contents = json_decode($zip->getFromName('label_tree.json'));
        $this->assertEquals($tree->id, $contents->id);
        $this->assertNotNull($zip->getFromName('labels.csv'));
    }
}
