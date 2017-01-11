<?php

namespace Biigle\Tests\Jobs;

use App;
use Mockery;
use TestCase;
use Copria\Transect;
use Biigle\Tests\TransectTest;
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
        $transect = TransectTest::create();

        $mock = App::make('Biigle\Contracts\ThumbnailService');
        $mock->shouldReceive('generateThumbnails')
            ->once()
            ->with(Mockery::type('Biigle\Transect'), []);

        with(new GenerateThumbnails($transect))->handle();
    }

    public function testHandleWithOnly()
    {
        $transect = TransectTest::create();

        $mock = App::make('Biigle\Contracts\ThumbnailService');
        $mock->shouldReceive('generateThumbnails')
            ->once()
            ->with(Mockery::type('Biigle\Transect'), [2, 3, 4]);

        with(new GenerateThumbnails($transect, [2, 3, 4]))->handle();
    }
}
