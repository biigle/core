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

		DB::table('labels')->insert(array(
			array('name' => 'Benthic Object', 'parent_id' => null),
			array('name' => 'Coral', 'parent_id' => 1),
		));

		DB::table('shapes')->insert(array(
			array('name' => 'point'),
			array('name' => 'line'),
			array('name' => 'polygon'),
			array('name' => 'circle'),
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
