<?php

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
        }

        Artisan::call('migrate');
    }

    public function tearDown()
    {
        if (!(DB::connection() instanceof Illuminate\Database\SQLiteConnection)) {
            Artisan::call('migrate:rollback');
        }

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

        $app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

        return $app;
    }
}
