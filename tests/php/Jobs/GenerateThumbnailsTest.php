<?php

namespace Dias\Tests\Jobs;

use App;
use Mockery;
use TestCase;
use Copria\Transect;
use Dias\Tests\TransectTest;
use Dias\Jobs\GenerateThumbnails;

class GenerateThumbnailsTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
         // mock this, so no actual thumbnail is generated
        App::singleton('Dias\Contracts\ThumbnailService', function () {
            return Mockery::mock('Dias\Services\Thumbnails\InterventionImage');
        });
    }

    public function testHandle()
    {
        $transect = TransectTest::create();

        $mock = App::make('Dias\Contracts\ThumbnailService');
        $mock->shouldReceive('generateThumbnails')
            ->once()
            ->with(Mockery::type('Dias\Transect'), []);

        with(new GenerateThumbnails($transect))->handle();
    }

    public function testHandleWithOnly()
    {
        $transect = TransectTest::create();

        $mock = App::make('Dias\Contracts\ThumbnailService');
        $mock->shouldReceive('generateThumbnails')
            ->once()
            ->with(Mockery::type('Dias\Transect'), [2, 3, 4]);

        with(new GenerateThumbnails($transect, [2, 3, 4]))->handle();
    }
}
