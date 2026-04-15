<?php

namespace Biigle\Tests\Rules;

use Biigle\Rules\VolumeAccessibleAtUrl;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use Storage;
use TestCase;

class VolumeAccessibleAtUrlTest extends TestCase
{
    public function testPassesWhenAllSampleFilesExist()
    {
        $disk = Storage::fake('test');
        $disk->put('volumes/img-1.jpg', 'a');
        $disk->put('volumes/img-2.jpg', 'b');

        $volume = VolumeTest::create();
        ImageTest::create(['volume_id' => $volume->id, 'filename' => 'img-1.jpg']);
        ImageTest::create(['volume_id' => $volume->id, 'filename' => 'img-2.jpg']);

        $rule = new VolumeAccessibleAtUrl($volume);
        $this->assertTrue($rule->passes('url', 'test://volumes'));
    }

    public function testFailsWhenAnyFileMissing()
    {
        $disk = Storage::fake('test');
        $disk->put('volumes/img-1.jpg', 'a');
        // img-2.jpg is intentionally missing.

        $volume = VolumeTest::create();
        ImageTest::create(['volume_id' => $volume->id, 'filename' => 'img-1.jpg']);
        ImageTest::create(['volume_id' => $volume->id, 'filename' => 'img-2.jpg']);

        $rule = new VolumeAccessibleAtUrl($volume);
        $this->assertFalse($rule->passes('url', 'test://volumes'));
        $this->assertStringContainsString('could not be accessed', $rule->message());
        $this->assertStringContainsString('img-2.jpg', $rule->message());
    }

    public function testPassesWhenVolumeHasNoFiles()
    {
        // A volume with no registered files yet should not block a URL change;
        // the subsequent ProcessNewVolumeFiles run will surface any problems.
        $volume = VolumeTest::create();
        $rule = new VolumeAccessibleAtUrl($volume);
        $this->assertTrue($rule->passes('url', 'test://volumes'));
    }

    public function testStripsTrailingSlash()
    {
        $disk = Storage::fake('test');
        $disk->put('volumes/img-1.jpg', 'a');

        $volume = VolumeTest::create();
        ImageTest::create(['volume_id' => $volume->id, 'filename' => 'img-1.jpg']);

        $rule = new VolumeAccessibleAtUrl($volume);
        $this->assertTrue($rule->passes('url', 'test://volumes/'));
    }

    public function testRejectsNonStringValue()
    {
        $volume = VolumeTest::create();
        $rule = new VolumeAccessibleAtUrl($volume);
        $this->assertFalse($rule->passes('url', null));
        $this->assertFalse($rule->passes('url', 42));
    }
}
