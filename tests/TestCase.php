<?php

use Dias\Transect;

class TestCase extends Illuminate\Foundation\Testing\TestCase
{
    protected $baseUrl = 'http://localhost';

    /**
     * Default preparation for each test.
     */
    public function setUp()
    {
        parent::setUp();

        // activate sqlite foreign key integrity checks on SQLite
        if (DB::connection() instanceof Illuminate\Database\SQLiteConnection) {
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            // in case the real DB connection should be tested
            Artisan::call('migrate:rollback');
        }

        Artisan::call('migrate');

        // replace observer class with mock for regular tests
        Transect::flushEventListeners();
        // use builtin PHPUnit mock to disable the 'created' method
        // because this would generate thumbnail images for each test
        $mock = $this->getMockBuilder('Dias\Observers\TransectObserver')
            ->setMethods(['created'])
            ->getMock();
        Transect::observe($mock);
    }

    public function tearDown()
    {
        DB::disconnect();
    }

    /**
     * Creates the application.
     *
     * @return \Illuminate\Foundation\Application
     */
    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';

        $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

        return $app;
    }
}
