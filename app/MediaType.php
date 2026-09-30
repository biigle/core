<?php

namespace Biigle;

use Biigle\Traits\HasConstantInstances;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Volumes can contain either images or videos as media type.
 *
 * @method static MediaType image()
 * @method static int imageId()
 * @method static MediaType video()
 * @method static int videoId()
 */
#[WithoutTimestamps]
class MediaType extends Model
{
    use HasConstantInstances, HasFactory;

    /**
     * The constant instances of this model.
     *
     * @var array<string, string>
     */
    const INSTANCES = [
        'image' => 'image',
        'video' => 'video',
    ];
}
