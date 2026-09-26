<?php

namespace Biigle;

use Biigle\Traits\EloquentEnum;
use Biigle\Traits\EnumSerialization;

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
