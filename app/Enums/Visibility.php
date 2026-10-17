<?php

namespace Biigle\Enums;

use Biigle\Traits\EloquentEnum;
use Biigle\Traits\EnumSerialization;

/**
 * Adding a case requires a migration that updates the range check constraint of the
 * referencing column (label_trees_visibility_check). See EnumRangeConstraintTest.
 */
enum Visibility: int implements \JsonSerializable
{
    use EnumSerialization, EloquentEnum;

    case PUBLIC = 1;
    case PRIVATE = 2;

    public function label(): string
    {
        return match ($this) {
            self::PUBLIC => 'public',
            self::PRIVATE => 'private',
        };
    }
}
