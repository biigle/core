<?php

use Illuminate\Database\Seeder;
use Illuminate\Database\Eloquent\Model;

class DatabaseSeeder extends Seeder {

	/**
	 * Run the database seeds.
	 *
	 * @return void
	 */
	public function run()
	{
		Model::unguard();

		// always required
		$this->call('RoleTableSeeder');
		$this->call('MediaTypeTableSeeder');
		$this->call('ShapeTableSeeder');
		$this->call('LabelTableSeeder');

		// for testing
		$this->call('UserTableSeeder');
		$this->call('TransectTableSeeder');

		$this->call('ProjectTableSeeder');
		$this->call('ImageTableSeeder');
		$this->call('AnnotationTableSeeder');
		$this->call('AnnotationPointTableSeeder');

	}

}