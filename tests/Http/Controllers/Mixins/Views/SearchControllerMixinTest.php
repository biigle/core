<?php

namespace Biigle\Tests\Modules\Reports\Http\Controllers\Mixins\Views;

use Biigle\Modules\Reports\ReportType;
use Biigle\Project;
use Biigle\Tests\Modules\Reports\ReportTest;
use Biigle\Tests\ProjectTest;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use Biigle\Video;
use Biigle\Volume;
use TestCase;

class SearchControllerMixinTest extends TestCase
{
    public function testIndexVolume()
    {
        $r1 = ReportTest::create([
            'type_id' => ReportType::imageAnnotationsCsvId(),
            'source_id' => VolumeTest::create(['name' => 'my volume'])->id,
            'source_type' => Volume::class,
        ]);
        $r2 = ReportTest::create([
            'type_id' => ReportType::imageAnnotationsCsvId(),
            'user_id' => $r1->user_id,
            'source_id' => ProjectTest::create(['name' => 'my project'])->id,
            'source_type' => Project::class,
        ]);
        $r3 = ReportTest::create();

        $this->be($r1->user);
        $this->get('search?t=reports')
            ->assertStatus(200)
            ->assertSeeText('my volume')
            ->assertSeeText('my project')
            ->assertDontSeeText($r3->source->name);

        $this->get('search?t=reports&q=volume')
            ->assertStatus(200)
            ->assertSeeText('my volume')
            ->assertDontSeeText('my project')
            ->assertDontSeeText($r3->source->name);
    }

    public function testIndexVideo()
    {
        $r1 = ReportTest::create([
            'type_id' => ReportType::videoAnnotationsCsvId(),
            'source_id' => VideoTest::create()->id,
            'source_type' => Video::class,
            'source_name' => 'my video',
        ]);

        $this->be($r1->user);
        $this->get('search?t=reports&q=video')
            ->assertStatus(200)
            ->assertSeeText('my video');
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

    public function testIndexWhereExists()
    {
        $r1 = ReportTest::create([
            'type_id' => ReportType::imageAnnotationsCsvId(),
            'source_id' => VolumeTest::create(['name' => 'my volume'])->id,
            'source_type' => Volume::class,
        ]);
        $r2 = ReportTest::create([
            'type_id' => ReportType::imageAnnotationsCsvId(),
            'source_id' => ProjectTest::create(['name' => 'my project'])->id,
            'source_type' => Project::class,
        ]);

        $this->be($r1->user);
        $this->get('search?t=reports&q=my')
            ->assertStatus(200)
            ->assertSeeText('my volume')
            ->assertDontSeeText('my project');
    }
}
