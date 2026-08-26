<?php

namespace Biigle\Tests;

use Biigle\Enums\Role;
use PHPUnit\Framework\TestCase;

class RoleTest extends TestCase
{
    public function testAdmin(): void
    {
        $this->assertSame(Role::ADMIN, Role::admin());
        $this->assertSame(Role::ADMIN->value, Role::adminId());
    }

    public function testExpert(): void
    {
        $this->assertSame(Role::EXPERT, Role::expert());
        $this->assertSame(Role::EXPERT->value, Role::expertId());
    }

    public function testEditor(): void
    {
        $this->assertSame(Role::EDITOR, Role::editor());
        $this->assertSame(Role::EDITOR->value, Role::editorId());
    }

    public function testGuest(): void
    {
        $this->assertSame(Role::GUEST, Role::guest());
        $this->assertSame(Role::GUEST->value, Role::guestId());
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
