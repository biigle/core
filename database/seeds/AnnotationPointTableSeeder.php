<?php

use Illuminate\Database\Seeder;
use Dias\AnnotationPoint;

class AnnotationPointTableSeeder extends Seeder {

	public function run()
	{
		DB::table('annotation_points')->delete();

		AnnotationPoint::create(array(
			'annotation_id' => 1,
			'index' => 1,
			'x' => 50,
			'y' => 50
		));

		AnnotationPoint::create(array(
			'annotation_id' => 2,
			'index' => 1,
			'x' => 10,
			'y' => 10
		));

		AnnotationPoint::create(array(
			'annotation_id' => 2,
			'index' => 2,
			'x' => 20,
			'y' => 10
		));

		AnnotationPoint::create(array(
			'annotation_id' => 2,
			'index' => 3,
			'x' => 15,
			'y' => 20
		));
	}

}