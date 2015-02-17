<?php

use Illuminate\Database\Seeder;
use Dias\User;

class UserTableSeeder extends Seeder {

	public function run()
	{
		DB::table('users')->delete();

		$joe = User::create(array(
			'firstname' => 'Joe',
			'lastname'  => 'User',
			'email'     => 'joe@user.com',
			'password'  => Hash::make('joespassword'),
		));

		$joe->generateApiKey();
		$joe->save();

		User::create(array(
			'firstname' => 'Jane',
			'lastname'  => 'User',
			'email'     => 'jane@user.com',
			'password'  => Hash::make('janespassword'),
		));
	}

}