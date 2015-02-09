<?php

use Illuminate\Database\Seeder;
use Dias\Image;

class ImageTableSeeder extends Seeder {

	public function run()
	{
		DB::table('images')->delete();

		Image::create(array(
			'filename' => '1.jpg',
			'transect_id' => 1
		));

		Image::create(array(
			'filename' => '2.jpg',
			'transect_id' => 1
		));

		Image::create(array(
			'filename' => '3.jpg',
			'transect_id' => 1
		));
	}

}