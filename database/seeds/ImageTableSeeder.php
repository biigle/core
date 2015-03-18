<?php

use Illuminate\Database\Seeder;
use Dias\Image;

class ImageTableSeeder extends Seeder {

	public function run()
	{
		DB::table('images')->delete();

		Image::create(array(
			'filename' => 'IMG_3275.JPG',
			'transect_id' => 1
		));

		Image::create(array(
			'filename' => 'IMG_3295.JPG',
			'transect_id' => 1
		));

		Image::create(array(
			'filename' => 'IMG_4005.JPG',
			'transect_id' => 1
		));
	}

}