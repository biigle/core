<?php

namespace Biigle\Tests\Support;

use Biigle\Support\VideoCodecExtractor;
use TestCase;

class VideoCodecExtractorTest extends TestCase
{
    public function testExtract()
    {
        $extractor = new VideoCodecExtractor;
        $this->assertEquals('h264', $extractor->extract(__DIR__.'/../../files/test.mp4'));
    }
}
