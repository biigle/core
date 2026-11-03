<?php

namespace Biigle\Tests\Fixtures;

use Biigle\Traits\EloquentEnum;
use Biigle\Traits\EnumSerialization;

enum TestEnum: int
{
    use EnumSerialization, EloquentEnum;

    case ONE = 1;
    case TWO = 2;

    public function label(): string
    {
        return match ($this) {
            self::ONE => 'one',
            self::TWO => 'two',
        };
    }
}
