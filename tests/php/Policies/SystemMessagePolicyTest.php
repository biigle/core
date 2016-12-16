<?php

namespace Dias\Tests\Policies;

use TestCase;
use Dias\Role;
use Dias\SystemMessage;
use Dias\Tests\UserTest;
use Dias\Tests\SystemMessageTest;

class SystemMessagePolicyTest extends TestCase
{
    private $user;
    private $globalAdmin;
    private $message;

    public function setUp()
    {
        parent::setUp();
        $this->user = UserTest::create();
        $this->globalAdmin = UserTest::create(['role_id' => Role::$admin->id]);
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
