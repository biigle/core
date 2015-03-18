<?php

use Illuminate\Database\Seeder;
use Dias\Transect;

class TransectTableSeeder extends Seeder {

	public function run()
	{
		DB::table('transects')->delete();

		Transect::create(array(
			'name' => 'Test transect',
			'media_type_id' => 2,
			'creator_id' => 1,
			'url' => '/prj/uwi/images/270'
		));
	}

}