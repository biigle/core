<?php

namespace Biigle\Tests;

use Biigle\Role;
use PHPUnit\Framework\TestCase;

class RoleTest extends TestCase
{
    public function testToArray(): void
    {
        $this->assertSame([
            'id' => 2,
            'name' => 'editor',
        ], Role::EDITOR->toArray());
    }

    public function testJsonSerialize(): void
    {
        $this->assertSame([
            'id' => 2,
            'name' => 'editor',
        ], Role::EDITOR->jsonSerialize());
    }
}
