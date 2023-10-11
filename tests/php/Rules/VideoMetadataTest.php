<?php

namespace Biigle\Tests\Rules;

use Biigle\Rules\VideoMetadata;

class VideoMetadataTest extends ImageMetadataTest
{
    protected static $ruleClass = VideoMetadata::class;

    public function testMultipleRowsWithTakenAtCol()
    {
        $validator = new static::$ruleClass(['abc.mp4']);
        $metadata = [
            ['filename', 'taken_at', 'lng', 'lat'],
            ['abc.mp4', '2016-12-19 12:27:00', '52.220', '28.123'],
            ['abc.mp4', '2016-12-19 12:28:00', '52.230', '28.133'],
        ];
        $this->assertTrue($validator->passes(null, $metadata));
    }

    public function testMultipleRowsWithoutTakenAtCol()
    {
        $validator = new static::$ruleClass(['abc.mp4']);
        $metadata = [
            ['filename', 'lng', 'lat'],
            ['abc.mp4', '52.220', '28.123'],
            ['abc.mp4', '52.230', '28.133'],
        ];
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testMultipleRowsWithEmptyTakenAtCol()
    {
        $validator = new static::$ruleClass(['abc.mp4']);
        $metadata = [
            ['filename', 'taken_at', 'lng', 'lat'],
            ['abc.mp4', '2016-12-19 12:27:00', '52.220', '28.123'],
            ['abc.mp4', '', '52.230', '28.133'],
        ];
        $this->assertFalse($validator->passes(null, $metadata));
    }

    public function testOneRowWithoutTakenAtCol()
    {
        $validator = new static::$ruleClass(['abc.mp4']);
        $metadata = [
            ['filename', 'lng', 'lat'],
            ['abc.mp4', '52.220', '28.123'],
        ];
        $this->assertTrue($validator->passes(null, $metadata));
    }
}
