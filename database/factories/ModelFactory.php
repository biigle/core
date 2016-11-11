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
        'name' => $faker->username(),
    ];
});

$factory->define(Dias\User::class, function ($faker) {
    return [
        'firstname' => $faker->firstName(),
        'lastname' => $faker->lastName(),
        // 'password'
        'password' => '$2y$10$CD13uR2iKSZ2Eyuro5H4yu9sflwe/AA2GAJsdrzRyKnkV9qaz1FaK',
        'email' => $faker->email(),
        'remember_token' => 'abc',
    ];
});

$factory->define(Dias\Project::class, function ($faker) {
    return [
        'name' => $faker->company(),
        'description' => $faker->sentence(),
        'creator_id' => function () {
            return factory(Dias\User::class)->create()->id;
        },
    ];
});

$factory->define(Dias\MediaType::class, function ($faker) {
    return [
        'name' => $faker->username(),
    ];
});

$factory->define(Dias\Transect::class, function ($faker) {
    return [
        'name' => $faker->company(),
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
        'name' => $faker->username(),
        'color' => '0099ff',
        'parent_id' => null,
        'label_tree_id' => function () {
            return factory(Dias\LabelTree::class)->create()->id;
        },
    ];
});

$factory->define(Dias\Shape::class, function ($faker) {
    return [
        'name' => $faker->username(),
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
        // 'password'
        'hash' => '$2y$10$CD13uR2iKSZ2Eyuro5H4yu9sflwe/AA2GAJsdrzRyKnkV9qaz1FaK',
    ];
});

$factory->define(Dias\Visibility::class, function ($faker) {
    return [
        'name' => $faker->username(),
    ];
});

$factory->define(Dias\LabelTree::class, function ($faker) {
    return [
        'name' => $faker->username(),
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
        'name' => $faker->username(),
        'description' => $faker->sentence(),
    ];
});

$factory->define(Dias\AnnotationSession::class, function ($faker) {
    return [
        'name' => $faker->username(),
        'description' => $faker->sentence(),
        'transect_id' => function () {
            return factory(Dias\Transect::class)->create()->id;
        },
        'starts_at' => '2016-09-04',
        'ends_at' => '2016-09-06',
        'hide_other_users_annotations' => $faker->boolean(),
        'hide_own_annotations' => $faker->boolean(),
    ];
});

$factory->define(Dias\SystemMessageType::class, function ($faker) {
    return [
        'name' => $faker->username(),
    ];
});

$factory->define(Dias\SystemMessage::class, function ($faker) {
    return [
        'body' => $faker->text(),
        'title' => $faker->sentence(),
        'type_id' => $faker->randomElement([
            Dias\SystemMessageType::$important->id,
            Dias\SystemMessageType::$update->id,
            Dias\SystemMessageType::$info->id,
        ])
    ];
});
