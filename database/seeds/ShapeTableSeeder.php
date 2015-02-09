<?php

use Illuminate\Database\Seeder;
use Dias\Shape;

class ShapeTableSeeder extends Seeder {

	public function run()
	{
		DB::table('shapes')->delete();

		Shape::create(array(
			'name' => 'point'
		));

		Shape::create(array(
			'name' => 'line'
		));

		Shape::create(array(
			'name' => 'rectangle'
		));

		Shape::create(array(
			'name' => 'polygon'
		));

		Shape::create(array(
			'name' => 'circle'
		));
	}

}