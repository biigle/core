<?php

namespace Biigle\Tests\Policies;

use Biigle\ApiToken;
use Biigle\Role;
use Biigle\Tests\ApiTokenTest;
use Biigle\Tests\UserTest;
use TestCase;

class ApiTokenPolicyTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();
        $this->globalGuest = UserTest::create(['role_id' => Role::guestId()]);
        $this->globalEditor = UserTest::create(['role_id' => Role::editorId()]);
        $this->globalAdmin = UserTest::create(['role_id' => Role::adminId()]);
    }

    public function testCreate()
    {
        $this->assertFalse($this->globalGuest->can('create', ApiToken::class));
        $this->assertTrue($this->globalEditor->can('create', ApiToken::class));
        $this->assertTrue($this->globalAdmin->can('create', ApiToken::class));
    }

    public function testDestroy()
    {
        $token = ApiTokenTest::create();
        $this->assertTrue($token->owner->can('destroy', $token));
        $this->assertFalse($this->globalAdmin->can('destroy', $token));
    }
}
