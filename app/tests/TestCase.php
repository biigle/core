<?php

class TestCase extends Illuminate\Foundation\Testing\TestCase {

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
	 * @return \Symfony\Component\HttpKernel\HttpKernelInterface
	 */
	public function createApplication()
	{
		$unitTesting = true;

		$testEnvironment = 'testing';

		return require __DIR__.'/../../bootstrap/start.php';
	}

	/**
	 * Migrates the database (SQLite in-memory).
	 * This will cause the tests to run quickly.
	 *
	 */
	private function prepareForTests()
	{
		// activate sqlite foreign key integrity checks on SQLite
		DB::statement('PRAGMA foreign_keys = ON;');
		Artisan::call('migrate');
	}

}
