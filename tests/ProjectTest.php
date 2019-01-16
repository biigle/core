<?php

namespace Biigle\Tests\Modules\Videos;

use TestCase;
use Biigle\Modules\Videos\Video;
use Biigle\Modules\Videos\Project;

class ProjectTest extends TestCase
{
    public function testVideos()
    {
        $project = new Project;
        $project->name = 'test';
        $project->description = 'test';
        $project->save();

        $video = factory(Video::class)->create(['project_id' => $project->id]);
        $this->assertEquals($video->id, $project->videos()->first()->id);
    }
}
