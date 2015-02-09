<?php

use Illuminate\Database\Seeder;
use Dias\Annotation;

class AnnotationTableSeeder extends Seeder {

	public function run()
	{
		DB::table('annotations')->delete();
		DB::table('annotation_label')->delete();

		$annotation = Annotation::create(array(
			'image_id' => 1,
			'shape_id' => 1
		));

		$annotation->labels()->attach(2, array(
			'confidence' => 0.5,
			'user_id' => 1
		));

		$annotation->labels()->attach(1, array(
			'confidence' => 0.75,
			'user_id' => 2
		));

		$annotation = Annotation::create(array(
			'image_id' => 1,
			'shape_id' => 4
		));

		$annotation->labels()->attach(2, array(
			'confidence' => 0.9,
			'user_id' => 1
		));
	}

}