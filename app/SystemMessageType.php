<?php

namespace Biigle;

use Biigle\Traits\HasConstantInstances;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemMessageType extends Model
{
    use HasConstantInstances, HasFactory;

    /**
     * The constant instances of this model.
     *
     * @var array
     */
    const INSTANCES = [
        // Prefix with "type" because a Model has the non-static method "update".
        'typeImportant' => 'important',
        'typeUpdate' => 'update',
        'typeInfo' => 'info',
    ];

    /**
     * Don't maintain timestamps for this model.
     *
     * @var bool
     */
    public $timestamps = false;
}
