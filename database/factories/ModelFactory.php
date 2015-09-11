<?php

/*
|--------------------------------------------------------------------------
| Model Factories
|--------------------------------------------------------------------------
|
| Here you may define all of your model factories. Model factories give
| you a convenient way to create models for testing and seeding your
| database. Just tell the factory how a default model should look.
|
*/

$factory->define(Dias\Role::class, function ($faker) {
    return [
        'name' => str_random(10),
    ];
});

$factory->define(Dias\User::class, function ($faker) {
    return [
        'firstname' => $faker->firstName,
        'lastname' => $faker->lastName,
        'password' => bcrypt(str_random(10)),
        'email' => $faker->email,
        'remember_token' => str_random(10),
    ];
});

$factory->define(Dias\Project::class, function ($faker) {
    return [
        'name' => str_random(10),
        'description' => $faker->sentence(),
        'creator_id' => factory(Dias\User::class)->create()->id,
    ];
});

$factory->define(Dias\MediaType::class, function ($faker) {
    return [
        'name' => str_random(10),
    ];
});

$factory->define(Dias\Transect::class, function ($faker) {
    return [
        'name' => $faker->sentence(),
        'media_type_id' => factory(Dias\MediaType::class)->create()->id,
        'creator_id' => factory(Dias\User::class)->create()->id,
        'url' => base_path().'/tests/files',
    ];
});

$factory->define(Dias\Image::class, function ($faker) {
    return [
        'filename' => 'test-image.jpg',
        'transect_id' => factory(Dias\Transect::class)->create()->id,
    ];
});

$factory->define(Dias\Label::class, function ($faker) {
    return [
        'name' => str_random(10),
        'parent_id' => null,
        'project_id' => null,
        'aphia_id' => null,
    ];
});

$factory->define(Dias\Shape::class, function ($faker) {
    return [
        'name' => str_random(10),
    ];
});

$factory->define(Dias\Annotation::class, function ($faker) {
    return [
        'image_id' => factory(Dias\Image::class)->create()->id,
        'shape_id' => factory(Dias\Shape::class)->create()->id,
    ];
});

$factory->define(Dias\AnnotationPoint::class, function ($faker) {
    return [
        'annotation_id' => factory(Dias\Annotation::class)->create()->id,
        'index' => 0,
        'x' => $faker->randomDigit(),
        'y' => $faker->randomDigit(),
    ];
});

$factory->define(Dias\AnnotationLabel::class, function ($faker) {
    return [
        'annotation_id' => factory(Dias\Annotation::class)->create()->id,
        'label_id' => factory(Dias\Label::class)->create()->id,
        'user_id' => factory(Dias\User::class)->create()->id,
        'confidence' => $faker->randomFloat(null, 0, 1),
    ];
});

$factory->define(Dias\Attribute::class, function ($faker) {
    return [
        'name' => str_random(10),
        'type' => $faker->randomElement(['integer', 'double', 'string', 'boolean']),
    ];
});
