<?php

namespace Biigle\Tests\Modules\Videos\Http\Controllers\Mixins;

use ApiTestCase;
use Biigle\Tests\Modules\Videos\VideoTest;

class SearchControllerMixinTest extends ApiTestCase
{
    public function testIndex()
    {
        $video1 = VideoTest::create([
            'project_id' => $this->project()->id,
            'name' => 'random video',
        ]);
        $video2 = VideoTest::create([
            'project_id' => $this->project()->id,
            'name' => 'another video',
        ]);

        $this->beUser();
        $this->get('search?t=videos')
            ->assertStatus(200)
            ->assertDontSeeText('random video')
            ->assertDontSeeText('another video');

        $this->beGuest();
        $this->get('search?t=videos')
            ->assertStatus(200)
            ->assertSeeText('random video')
            ->assertSeeText('another video');

        $this->get('search?t=videos&q=random')
            ->assertStatus(200)
            ->assertSeeText('random video')
            ->assertDontSeeText('another video');
    }
}
