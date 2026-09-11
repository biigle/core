<?php

namespace Biigle\Tests;

use Biigle\Role;
use PHPUnit\Framework\TestCase;

// TODO Create similar tests for the other enums?
class RoleTest extends TestCase
{
    public function testAdmin(): void
    {
        $this->assertSame(Role::ADMIN, Role::ADMIN);
        $this->assertSame(Role::ADMIN->value, Role::ADMIN->value);
    }

    public function testExpert(): void
    {
        $this->assertSame(Role::EXPERT, Role::EXPERT);
        $this->assertSame(Role::EXPERT->value, Role::EXPERT->value);
    }

    public function testEditor(): void
    {
        $this->assertSame(Role::EDITOR, Role::EDITOR);
        $this->assertSame(Role::EDITOR->value, Role::EDITOR->value);
    }

    public function testGuest(): void
    {
        $this->assertSame(Role::GUEST, Role::GUEST);
        $this->assertSame(Role::GUEST->value, Role::GUEST->value);
    }

    public function testLabel(): void
    {
        $this->assertSame('admin', Role::ADMIN->label());
        $this->assertSame('editor', Role::EDITOR->label());
        $this->assertSame('guest', Role::GUEST->label());
        $this->assertSame('expert', Role::EXPERT->label());
    }

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
