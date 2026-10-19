<?php

namespace Biigle\Tests;

use Biigle\Tests\Fixtures\TestEnum;
use TestCase;

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
