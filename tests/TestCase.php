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
        if ($this->isSqlite()) {
            DB::statement('PRAGMA foreign_keys = ON;');
            $this->artisan('migrate');
        } else {
            // in case the real DB connection should be tested
            $this->artisan('migrate:refresh');
        }

        // $this->withoutEvents();
        $this->withoutJobs();
    }

    public function tearDown()
    {
        if (!$this->isSqlite()) {
            DB::disconnect();
        }
        parent::tearDown();
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

    public function isSqlite()
    {
        return DB::connection() instanceof Illuminate\Database\SQLiteConnection;
    }
}
