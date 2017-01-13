<?php

namespace Biigle\Tests\Jobs;

use App;
use Mockery;
use TestCase;
use Biigle\Tests\VolumeTest;
use Biigle\Jobs\GenerateThumbnails;

class GenerateThumbnailsTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
         // mock this, so no actual thumbnail is generated
        App::singleton('Biigle\Contracts\ThumbnailService', function () {
            return Mockery::mock('Biigle\Services\Thumbnails\InterventionImage');
        });
    }

    public function testHandle()
    {
        $volume = VolumeTest::create();

        $mock = App::make('Biigle\Contracts\ThumbnailService');
        $mock->shouldReceive('generateThumbnails')
            ->once()
            ->with(Mockery::type('Biigle\Volume'), []);

        with(new GenerateThumbnails($volume))->handle();
    }

    public function testHandleWithOnly()
    {
        $volume = VolumeTest::create();

        $mock = App::make('Biigle\Contracts\ThumbnailService');
        $mock->shouldReceive('generateThumbnails')
            ->once()
            ->with(Mockery::type('Biigle\Volume'), [2, 3, 4]);

        with(new GenerateThumbnails($volume, [2, 3, 4]))->handle();
    }
}
