<?php

use Copria\Transect;
use Dias\Modules\Ate\Jobs\Preprocess;

class JobsPreprocessTest extends TestCase
{
    // public function setUp()
    // {
    //     parent::setUp();

    //     if (DB::connection() instanceof Illuminate\Database\SQLiteConnection) {
    //         // ignore reconnect because sqlite DB would be dumped
    //         DB::shouldReceive('reconnect')->once();
    //         DB::shouldReceive('disconnect')->once();
    //     }
    // }

    // public function testHandle()
    // {
    //     $transect = TransectTest::create();
    //     $job = new Preprocess($transect);

    //     File::shouldReceive('makeDirectory')->once();
    //     DB::shouldReceive('statement')->once();
    //     $job->handle();
    // }
}
