<?php

namespace Biigle;

use Biigle\Traits\HasConstantInstances;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Volumes can contain either images or videos as media type.
 */
class MediaType extends Model
{
    use HasConstantInstances, HasFactory;

    /**
     * The constant instances of this model.
     *
     * @var array
     */
    const INSTANCES = [
        'image' => 'image',
        'video' => 'video',
    ];

    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;
}
