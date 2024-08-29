<?php

namespace Biigle;

use Biigle\Traits\HasConstantInstances;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A role of a user. Users have one global role and can have many project-
 * specific roles.
 *
 * @method static Role admin()
 * @method static int adminId()
 * @method static Role expert()
 * @method static int expertId()
 * @method static Role editor()
 * @method static int editorId()
 * @method static Role guest()
 * @method static int guestId()
 */
class Role extends Model
{
    use HasConstantInstances, HasFactory;

    /**
     * The constant instances of this model.
     *
     * @var array<string, string>
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
