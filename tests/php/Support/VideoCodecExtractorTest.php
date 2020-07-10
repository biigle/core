<?php

namespace Biigle\Tests\Support;

use TestCase;
use Biigle\Support\VideoCodecExtractor;

class VideoCodecExtractorTest extends TestCase
{
    public function testExtract()
    {
        $extractor = new VideoCodecExtractor;
        $this->assertEquals('h264', $extractor->extract(__DIR__.'/../../files/test.mp4'));
    }
}
