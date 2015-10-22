<?php

use Copria\Transect;
use Dias\Jobs\GenerateThumbnails;

class JobsGenerateThumbnailsTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
         // mock this, so no actual thumbnail is generated
        App::singleton('Dias\Contracts\ThumbnailService', function () {
            return Mockery::mock('Dias\Services\Thumbnails\InterventionImage');
        });

        if (DB::connection() instanceof Illuminate\Database\SQLiteConnection) {
            // ignore reconnect because sqlite DB would be dumped
            DB::shouldReceive('reconnect')->once();
            // add this, otherwise disconnect of TestCase would fail
            DB::shouldReceive('disconnect')->once();
        }
    }

    public function testHandle()
    {
        $transect = TransectTest::create();
        // mock in TestCase catches automatic queueing; we'll do this manually here

        $mock = App::make('Dias\Contracts\ThumbnailService');
        $mock->shouldReceive('generateThumbnails')
            ->once()
            ->with(Mockery::type('Dias\Transect'));

        // queue is synchronous in test environment and processes immediately
        Queue::push(new GenerateThumbnails($transect));
    }
}
