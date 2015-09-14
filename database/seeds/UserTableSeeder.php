<?php

use Illuminate\Database\Seeder;
use Dias\User;

class UserTableSeeder extends Seeder
{
    public function run()
    {
        DB::table('users')->delete();

        $joe = User::create([
            'firstname' => 'Joe',
            'lastname'  => 'User',
            'email'     => 'joe@user.com',
            'password'  => Hash::make('joespassword'),
        ]);

        $joe->generateApiKey();
        $joe->save();

        $jane = User::create([
            'firstname' => 'Jane',
            'lastname'  => 'User',
            'email'     => 'jane@user.com',
            'password'  => Hash::make('janespassword'),
        ]);

        $jane->role()->associate(Dias\Role::$admin);
    }
}
