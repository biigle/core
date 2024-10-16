<?php

namespace Biigle\Tests\Jobs;

use TestCase;
use Biigle\Tests\VideoTest;
use Biigle\Jobs\CloneVideoThumbnails;
use Illuminate\Support\Facades\Storage;

class CloneVideoThumbnailsTest extends TestCase
{
    public function testHandle()
    {
        config(['videos.thumbnail_storage_disk' => 'test-thumbs']);
        
        $disk = Storage::fake('test-thumbs');

        $video = VideoTest::create();
        $prefix = fragment_uuid_path($video->uuid);
        $copyVideo = VideoTest::create();
        $copyPrefix = fragment_uuid_path($copyVideo->uuid);

        $v1 = '/v-thumb.jpg';
        $v2 = '/sprite_1.jpg';

        $p1 = $prefix.$v1;
        $p2 = $prefix.$v2;

        $disk->put($p1, '');
        $disk->put($p2, '');

        $this->assertFileExists($disk->path($p1));
        $this->assertFileExists($disk->path($p2));

        with(new CloneVideoThumbnails($prefix, copyPrefix: $copyPrefix))->handle();

        $this->assertFileExists($disk->path($copyPrefix.$v1));
        $this->assertFileExists($disk->path($copyPrefix.$v2));
    }
}
