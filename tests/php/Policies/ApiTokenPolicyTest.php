<?php

namespace Biigle\Tests\Policies;

use TestCase;
use Biigle\Role;
use Biigle\ApiToken;
use Biigle\Tests\UserTest;
use Biigle\Tests\ApiTokenTest;

class ApiTokenPolicyTest extends TestCase
{
    public function setUp()
    {
        parent::setUp();
        $this->globalGuest = UserTest::create(['role_id' => Role::$guest->id]);
        $this->globalEditor = UserTest::create(['role_id' => Role::$editor->id]);
        $this->globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);
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
