<?php

namespace Biigle\Tests\Modules\Videos\Support;

use TestCase;
use Biigle\Modules\Videos\Support\VideoCodecExtractor;

class VideoCodecExtractorTest extends TestCase
{
    public function testExtract()
    {
        $extractor = new VideoCodecExtractor;
        $this->assertEquals('h264', $extractor->extract(__DIR__.'/../files/test.mp4'));
    }
}
