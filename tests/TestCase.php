<?php

class TestCase extends Illuminate\Foundation\Testing\TestCase {

	protected $baseUrl = 'http://localhost';

	/**
	 * Default preparation for each test
	 *
	 */
	public function setUp()
	{
		parent::setUp();
		$this->prepareForTests();
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

	/**
	 * Migrates the database (SQLite in-memory).
	 * This will cause the tests to run quickly.
	 *
	 */
	private function prepareForTests()
	{
		// activate sqlite foreign key integrity checks on SQLite
		if (DB::connection() instanceof Illuminate\Database\SQLiteConnection)
		{
			DB::statement('PRAGMA foreign_keys = ON;');
			Artisan::call('migrate');
		}
		else
		{
			// in case the real DB connection should be tested
			Artisan::call('migrate:refresh');
		}
	}

}
