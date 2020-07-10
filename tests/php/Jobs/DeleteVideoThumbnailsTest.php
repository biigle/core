<?php

namespace Biigle\Tests\Jobs;

use Storage;
use TestCase;
use Biigle\Tests\VideoTest;
use Biigle\Jobs\DeleteVideoThumbnails;

class DeleteVideoThumbnailsTest extends TestCase
{
    public function testHandle()
    {
        $video = VideoTest::create();
        Storage::fake('video-thumbs');
        $disk = Storage::disk('video-thumbs');
        $fragment = fragment_uuid_path($video->uuid);
        $disk->put("{$fragment}/0.jpg", 'content');

        $job = new DeleteVideoThumbnails($video);
        $job->handle();

        $this->assertFalse($disk->exists($fragment));
    }
}
