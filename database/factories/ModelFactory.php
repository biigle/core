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

$factory->define(Biigle\Role::class, function ($faker) {
    return [
        'name' => $faker->username(),
    ];
});

$factory->define(Biigle\User::class, function ($faker) {
    return [
        'firstname' => $faker->firstName(),
        'lastname' => $faker->lastName(),
        // 'password'
        'password' => '$2y$10$CD13uR2iKSZ2Eyuro5H4yu9sflwe/AA2GAJsdrzRyKnkV9qaz1FaK',
        'email' => $faker->email(),
        'remember_token' => 'abc',
    ];
});

$factory->define(Biigle\Project::class, function ($faker) {
    return [
        'name' => $faker->company(),
        'description' => $faker->sentence(),
        'creator_id' => function () {
            return factory(Biigle\User::class)->create()->id;
        },
    ];
});

$factory->define(Biigle\MediaType::class, function ($faker) {
    return [
        'name' => $faker->username(),
    ];
});

$factory->define(Biigle\Volume::class, function ($faker) {
    return [
        'name' => $faker->company(),
        'media_type_id' => function () {
            return factory(Biigle\MediaType::class)->create()->id;
        },
        'creator_id' => function () {
            return factory(Biigle\User::class)->create()->id;
        },
        'url' => base_path('tests/files'),
        'visibility_id' => Biigle\Visibility::$public->id,
    ];
});

$factory->define(Biigle\ProjectVolume::class, function ($faker) {
    return [
        'project_id' => function () {
            return factory(Biigle\Project::class)->create()->id;
        },
        'volume_id' => function () {
            return factory(Biigle\Volume::class)->create()->id;
        },
    ];
});

$factory->define(Biigle\Image::class, function ($faker) {
    return [
        'filename' => 'test-image.jpg',
        'uuid' => $faker->uuid(),
        'volume_id' => function () {
            return factory(Biigle\Volume::class)->create()->id;
        },
        'tiled' => false,
    ];
});

$factory->define(Biigle\Label::class, function ($faker) {
    return [
        'name' => $faker->username(),
        'color' => '0099ff',
        'parent_id' => null,
        'label_tree_id' => function () {
            return factory(Biigle\LabelTree::class)->create()->id;
        },
    ];
});

$factory->define(Biigle\Shape::class, function ($faker) {
    return [
        'name' => $faker->username(),
    ];
});

$factory->define(Biigle\Annotation::class, function ($faker) {
    $image = factory(Biigle\Image::class)->create();
    return [
        'image_id' => function () use ($image) {
            return $image->id;
        },
        'shape_id' => Biigle\Shape::$pointId,
        'project_volume_id' => function () use ($image) {
            return factory(Biigle\ProjectVolume::class)->create([
                'volume_id' => $image->volume_id,
            ])->id;
        },
        'points' => [0, 0],
    ];
});

$factory->define(Biigle\AnnotationLabel::class, function ($faker) {
    return [
        'annotation_id' => function () {
            return factory(Biigle\Annotation::class)->create()->id;
        },
        'label_id' => function () {
            return factory(Biigle\Label::class)->create()->id;
        },
        'user_id' => function () {
            return factory(Biigle\User::class)->create()->id;
        },
        'confidence' => $faker->randomFloat(null, 0, 1),
    ];
});

$factory->define(Biigle\ApiToken::class, function ($faker) {
    return [
        'owner_id' => function () {
            return factory(Biigle\User::class)->create()->id;
        },
        'purpose' => $faker->sentence(),
        // 'password'
        'hash' => '$2y$10$CD13uR2iKSZ2Eyuro5H4yu9sflwe/AA2GAJsdrzRyKnkV9qaz1FaK',
    ];
});

$factory->define(Biigle\Visibility::class, function ($faker) {
    return [
        'name' => $faker->username(),
    ];
});

$factory->define(Biigle\LabelTree::class, function ($faker) {
    return [
        'name' => $faker->username(),
        'description' => $faker->sentence(),
        'visibility_id' => Biigle\Visibility::$public->id,
    ];
});

$factory->define(Biigle\ImageLabel::class, function ($faker) {
    $image = factory(Biigle\Image::class)->create();
    return [
        'image_id' => function () use ($image) {
            return $image->id;
        },
        'label_id' => function () {
            return factory(Biigle\Label::class)->create()->id;
        },
        'user_id' => function () {
            return factory(Biigle\User::class)->create()->id;
        },
        'project_volume_id' => function () use ($image) {
            return factory(Biigle\ProjectVolume::class)->create([
                'volume_id' => $image->volume_id,
            ])->id;
        },
    ];
});

$factory->define(Biigle\LabelSource::class, function ($faker) {
    return [
        'name' => $faker->username(),
        'description' => $faker->sentence(),
    ];
});

$factory->define(Biigle\AnnotationSession::class, function ($faker) {
    return [
        'name' => $faker->username(),
        'description' => $faker->sentence(),
        'project_id' => function () {
            return factory(Biigle\Project::class)->create()->id;
        },
        'starts_at' => '2016-09-04',
        'ends_at' => '2016-09-06',
        'hide_other_users_annotations' => $faker->boolean(),
        'hide_own_annotations' => $faker->boolean(),
    ];
});

$factory->define(Biigle\SystemMessageType::class, function ($faker) {
    return [
        'name' => $faker->username(),
    ];
});

$factory->define(Biigle\SystemMessage::class, function ($faker) {
    return [
        'body' => $faker->text(),
        'title' => $faker->sentence(),
        'type_id' => $faker->randomElement([
            Biigle\SystemMessageType::$important->id,
            Biigle\SystemMessageType::$update->id,
            Biigle\SystemMessageType::$info->id,
        ]),
    ];
});
