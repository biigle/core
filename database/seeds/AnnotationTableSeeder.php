<?php

use Illuminate\Database\Seeder;
use Dias\Annotation;
use Dias\User;

class AnnotationTableSeeder extends Seeder {

	public function run()
	{
		DB::table('annotations')->delete();
		DB::table('annotation_labels')->delete();

		$annotation = Annotation::create(array(
			'image_id' => 1,
			'shape_id' => 1
		));

		$joe = User::find(1);
		$jane = User::find(2);

		$annotation->addLabel(2, 0.5, $joe);
		$annotation->addLabel(1, 0.2, $joe);
		$annotation->addLabel(1, 0.75, $jane);

		$annotation = Annotation::create(array(
			'image_id' => 1,
			'shape_id' => 3
		));

		$annotation->addLabel(2, 0.9, $joe);

		$annotation = Annotation::create(array(
			'image_id' => 1,
			'shape_id' => 2
		));

		$annotation = Annotation::create(array(
			'image_id' => 1,
			'shape_id' => 4
		));
	}

}