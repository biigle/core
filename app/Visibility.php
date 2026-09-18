<?php

namespace Biigle;

use Biigle\Traits\EnumSerialization;

enum Visibility: int implements \JsonSerializable
{
    use EnumSerialization;

    case PUBLIC = 1;
    case PRIVATE = 2;

    public static function public(): self
    {
        return self::PUBLIC;
    }

    public static function private(): self
    {
        return self::PRIVATE;
    }

    public function label(): string
    {
        return match ($this) {
            self::PUBLIC => 'public',
            self::PRIVATE => 'private',
        };
    }
}
