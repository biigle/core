<?php

use Illuminate\Database\Seeder;
use Dias\MediaType;

class MediaTypeTableSeeder extends Seeder {

	public function run()
	{
		DB::table('media_types')->delete();

		MediaType::create(array(
			'name' => 'time-series'
		));

		MediaType::create(array(
			'name' => 'location-series'
		));
	}

}