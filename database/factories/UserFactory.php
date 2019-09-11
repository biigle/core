<?php

 use Illuminate\Support\Str;
use Faker\Generator as Faker;

/*
|--------------------------------------------------------------------------
| Model Factories
|--------------------------------------------------------------------------
|
| This directory should contain each of the model factory definitions for
| your application. Factories provide a convenient way to generate new
| model instances for testing / seeding your application's database.
|
*/

$factory->define(Biigle\User::class, function (Faker $faker) {
    return [
        'firstname' => $faker->firstName(),
        'lastname' => $faker->lastName(),
        // 'password'
        'password' => '$2y$10$CD13uR2iKSZ2Eyuro5H4yu9sflwe/AA2GAJsdrzRyKnkV9qaz1FaK',
        'email' => $faker->unique()->email(),
        'remember_token' => Str::random(10),
        'uuid' => $faker->unique()->uuid(),
        'affiliation' => $faker->company(),
        'role_id' => Biigle\Role::editorId(),
    ];
});
