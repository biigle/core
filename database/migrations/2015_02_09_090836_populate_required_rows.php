<?php

use Illuminate\Database\Migrations\Migration;

class PopulateRequiredRows extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		DB::table('roles')->insert(array(
			array('name' => 'admin'),
			array('name' => 'editor'),
			array('name' => 'guest'),
		));

		DB::table('media_types')->insert(array(
			array('name' => 'time-series'),
			array('name' => 'location-series'),
		));

		DB::table('shapes')->insert(array(
			array('name' => 'Point'),
			array('name' => 'LineString'),
			array('name' => 'Polygon'),
			array('name' => 'Circle'),
			array('name' => 'Rectangle'),
		));

		//TODO attributes?
		DB::table('attributes')->insert(array(
			array('name' => 'bad_quality', 'type' => 'boolean'),
		));
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		// violates foreign key constraints of a populated database!
		// DB::table('roles')->delete();
		// DB::table('media_types')->delete();
		// DB::table('labels')->delete();
		// DB::table('shapes')->delete();
	}

}
