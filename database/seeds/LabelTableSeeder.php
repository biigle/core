<?php

use Illuminate\Database\Seeder;
use Dias\Label;

class LabelTableSeeder extends Seeder {

	public function run()
	{
		DB::table('labels')->delete();

		Label::create(array(
			'name' => 'Benthic Object'
		));

		Label::create(array(
			'name' => 'Coral',
			'parent_id' => 1
		));
	}

}