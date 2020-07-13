<?php

namespace Biigle\Tests\Policies;

use Biigle\Role;
use Biigle\SystemMessage;
use Biigle\Tests\SystemMessageTest;
use Biigle\Tests\UserTest;
use TestCase;

class SystemMessagePolicyTest extends TestCase
{
    private $user;
    private $globalAdmin;
    private $message;

    public function setUp(): void
    {
        parent::setUp();
        $this->user = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::adminId()]);
        $this->message = SystemMessageTest::create();
    }

    public function testCreate()
    {
        $this->assertFalse($this->user->can('create', SystemMessage::class));
        $this->assertTrue($this->globalAdmin->can('create', SystemMessage::class));
    }

    public function testUpdate()
    {
        $this->assertFalse($this->user->can('update', $this->message));
        $this->assertTrue($this->globalAdmin->can('update', $this->message));
    }

    public function testDestroy()
    {
        $this->assertFalse($this->user->can('destroy', $this->message));
        $this->assertTrue($this->globalAdmin->can('destroy', $this->message));

        $this->message->published_at = '2016';

        $this->assertFalse($this->user->can('destroy', $this->message));
        $this->assertFalse($this->globalAdmin->can('destroy', $this->message));
    }
}
