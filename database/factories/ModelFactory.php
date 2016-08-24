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
        'creator_id' => function () {
            return factory(Dias\User::class)->create()->id;
        },
    ];
});

$factory->define(Dias\MediaType::class, function ($faker) {
    return [
        'name' => str_random(10),
    ];
});

$factory->define(Dias\Transect::class, function ($faker) {
    return [
        'name' => str_random(10),
        'media_type_id' => function () {
            return factory(Dias\MediaType::class)->create()->id;
        },
        'creator_id' => function () {
            return factory(Dias\User::class)->create()->id;
        },
        'url' => base_path('tests/files'),
    ];
});

$factory->define(Dias\Image::class, function ($faker) {
    return [
        'filename' => 'test-image.jpg',
        'uuid' => $faker->uuid(),
        'transect_id' => function () {
            return factory(Dias\Transect::class)->create()->id;
        },
    ];
});

$factory->define(Dias\Label::class, function ($faker) {
    return [
        'name' => str_random(10),
        'color' => '0099ff',
        'parent_id' => null,
        'label_tree_id' => function () {
            return factory(Dias\LabelTree::class)->create()->id;
        },
    ];
});

$factory->define(Dias\Shape::class, function ($faker) {
    return [
        'name' => str_random(10),
    ];
});

$factory->define(Dias\Annotation::class, function ($faker) {
    return [
        'image_id' => function () {
            return factory(Dias\Image::class)->create()->id;
        },
        'shape_id' => function () {
            return factory(Dias\Shape::class)->create()->id;
        },
        'points' => [0, 0],
    ];
});

$factory->define(Dias\AnnotationLabel::class, function ($faker) {
    return [
        'annotation_id' => function () {
            return factory(Dias\Annotation::class)->create()->id;
        },
        'label_id' => function () {
            return factory(Dias\Label::class)->create()->id;
        },
        'user_id' => function () {
            return factory(Dias\User::class)->create()->id;
        },
        'confidence' => $faker->randomFloat(null, 0, 1),
    ];
});

$factory->define(Dias\ApiToken::class, function ($faker) {
    return [
        'owner_id' => function () {
            return factory(Dias\User::class)->create()->id;
        },
        'purpose' => $faker->sentence(),
        'hash' => bcrypt(str_random(10)),
    ];
});

$factory->define(Dias\Visibility::class, function ($faker) {
    return [
        'name' => str_random(10),
    ];
});

$factory->define(Dias\LabelTree::class, function ($faker) {
    return [
        'name' => str_random(10),
        'description' => $faker->sentence(),
        'visibility_id' => Dias\Visibility::$public->id,
    ];
});

$factory->define(Dias\ImageLabel::class, function ($faker) {
    return [
        'image_id' => function () {
            return factory(Dias\Image::class)->create()->id;
        },
        'label_id' => function () {
            return factory(Dias\Label::class)->create()->id;
        },
        'user_id' => function () {
            return factory(Dias\User::class)->create()->id;
        },
    ];
});

$factory->define(Dias\LabelSource::class, function ($faker) {
    return [
        'name' => str_random(10),
        'description' => $faker->sentence(),
    ];
});
