<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Mixins\Views;

use TestCase;
use Biigle\Volume;
use Biigle\Project;
use Biigle\Tests\VolumeTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\Modules\Export\ReportTest;

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
        $this->get('search?t=reports')->assertResponseOk();
        $this->see('my volume');
        $this->see('my project');
        $this->dontSee($r3->source->name);

        $this->get('search?t=reports&q=volume')->assertResponseOk();
        $this->see('my volume');
        $this->dontSee('my project');
        $this->dontSee($r3->source->name);
    }

    public function testIndexDeleted()
    {
        $r1 = ReportTest::create();
        $name= $r1->source->name;
        $r1->source()->delete();

        $this->be($r1->user);
        $this->visit('search?t=reports')->see($name);
    }
}
