<?php

class UserTableSeeder extends Seeder {

	public function run()
	{
		DB::table('users')->delete();

		User::create(array(
			'firstname' => 'Joe',
			'lastname'  => 'User',
			'email'     => 'joe@example.com',
			'password'  => Hash::make('joespassword'),
		));
	}

}