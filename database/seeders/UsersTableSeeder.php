<?php

namespace Database\Seeders;

use Biigle\User;
use Illuminate\Database\Seeder;

class UsersTableSeeder extends Seeder
{
    public function run()
    {
        DB::table('users')->delete();
        $jane = User::create([
            'firstname' => 'Jane',
            'lastname'  => 'User',
            'email'     => 'jane@user.com',
            'password'  => Hash::make('janespassword'),
        ]);
        $jane->role()->associate(Biigle\Role::admin());
        $jane->save();
    }
}
