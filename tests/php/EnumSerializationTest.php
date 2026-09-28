<?php

namespace Biigle\Tests;

use Biigle\Traits\EloquentEnum;
use Biigle\Traits\EnumSerialization;
use TestCase;

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

class EnumSerializationTest extends TestCase
{
    public function testToArray(): void
    {
        $this->assertSame([
            'id' => 1,
            'name' => 'one'
        ], TestEnum::ONE->toArray());
    }

    public function testJsonSerialize(): void
    {
        $this->assertSame([
            'id' => 2,
            'name' => 'two',
        ], TestEnum::TWO->jsonSerialize());
    }
}
