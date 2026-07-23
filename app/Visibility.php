<?php

namespace Biigle;

use Biigle\Traits\HasConstantInstances;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * The visibility of a model.
 *
 * @method static Visibility public()
 * @method static int publicId()
 * @method static Visibility private()
 * @method static int privateId()
 */
#[WithoutTimestamps]
class Visibility extends Model
{
    use HasConstantInstances, HasFactory;

    /**
     * The constant instances of this model.
     *
     * @var array<string, string>
     */
    const INSTANCES = [
        'public' => 'public',
        'private' => 'private',
    ];
}
