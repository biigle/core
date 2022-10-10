<?php

namespace Biigle;

use Biigle\Traits\HasConstantInstances;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A role of a user. Users have one global role and can have many project-
 * specific roles.
 */
class Role extends Model
{
    use HasConstantInstances, HasFactory;

    /**
     * The constant instances of this model.
     *
     * @var array
     */
    const INSTANCES = [
        'admin' => 'admin',
        'expert' => 'expert',
        'editor' => 'editor',
        'guest' => 'guest',
    ];

    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;
}
