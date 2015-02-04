<?php

class RoleTableSeeder extends Seeder {

	public function run()
	{
		DB::table('roles')->delete();

		Role::create(array(
			'name' => 'admin'
		));

		Role::create(array(
			'name' => 'editor'
		));

		Role::create(array(
			'name' => 'guest'
		));
	}

}