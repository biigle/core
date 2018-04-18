<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Mixins\Views;

use TestCase;
use Biigle\Volume;
use Biigle\Project;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\Modules\Reports\ReportTest;

class SearchControllerMixinTest extends TestCase
{
    public function testIndex()
    {
        $r1 = ReportTest::create([
            'source_id' => VolumeTest::create(['name' => 'my volume'])->id,
            'source_type' => Volume::class,
        ]);
        $r2 = ReportTest::create([
            'user_id' => $r1->user_id,
            'source_id' => ProjectTest::create(['name' => 'my project'])->id,
            'source_type' => Project::class,
        ]);
        $r3 = ReportTest::create();

        $this->be($r1->user);
        $response = $this->get('search?t=reports')->assertStatus(200);
        $response->assertSeeText('my volume');
        $response->assertSeeText('my project');
        $response->assertDontSeeText($r3->source->name);

        $response = $this->get('search?t=reports&q=volume')->assertStatus(200);
        $response->assertSeeText('my volume');
        $response->assertDontSeeText('my project');
        $response->assertDontSeeText($r3->source->name);
    }

    public function testIndexDeleted()
    {
        $r1 = ReportTest::create([
            'source_id' => VolumeTest::create(['name' => 'my volume']),
            'source_type' => Volume::class,
        ]);
        $r1->source()->delete();

        $this->be($r1->user);
        $this->get('search?t=reports')->assertSeeText('my volume');
    }
}
