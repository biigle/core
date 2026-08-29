<?php

namespace Biigle\Tests\Policies;

use Biigle\FederatedSearchInstance;
use Biigle\Role;
use Biigle\Tests\FederatedSearchInstanceTest;
use Biigle\Tests\UserTest;
use TestCase;

class FederatedSearchInstancePolicyTest extends TestCase
{
    private $user;
    private $globalAdmin;

    public function setUp(): void
    {
        parent::setUp();
        $this->user = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::adminId()]);
    }

    public function testCreate()
    {
        $this->assertFalse($this->user->can('create', FederatedSearchInstance::class));
        $this->assertTrue($this->globalAdmin->can('create', FederatedSearchInstance::class));
    }

    public function testUpdate()
    {
        $instance = FederatedSearchInstanceTest::create();
        $this->assertFalse($this->user->can('update', $instance));
        $this->assertTrue($this->globalAdmin->can('update', $instance));
    }

    public function testDestroy()
    {
        $instance = FederatedSearchInstanceTest::create();
        $this->assertFalse($this->user->can('destroy', $instance));
        $this->assertTrue($this->globalAdmin->can('destroy', $instance));
    }
}
