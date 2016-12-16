<?php

namespace Dias\Tests\Http\Controllers\Views\SystemMessages;

use TestCase;
use Dias\Tests\UserTest;
use Dias\Tests\SystemMessageTest;

class SystemMessageControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->visit('system-messages')->seePageIs('login');
    }

    public function testIndexWhenLoggedIn()
    {
        $user = UserTest::create();
        $message = SystemMessageTest::create();
        $message->publish();
        $message2 = SystemMessageTest::create();
        $this->actingAs($user)->visit('system-messages')
            ->see($message->title)
            ->dontSee($message2->title)
            ->seePageIs('system-messages');
    }

    public function testShowWhenNotLoggedIn()
    {
        $message = SystemMessageTest::create();
        $this->visit('system-messages/'.$message->id)->seePageIs('login');
    }

    public function testShowWhenLoggedIn()
    {
        $user = UserTest::create();
        $message = SystemMessageTest::create();
        $message->publish();
        $this->actingAs($user)->visit('system-messages/'.$message->id)
            ->see($message->title)
            ->see($message->body)
            ->seePageIs('system-messages/'.$message->id);
    }

    public function testShowUnpublished()
    {
        $user = UserTest::create();
        $message = SystemMessageTest::create();
        $this->actingAs($user)->get('system-messages/'.$message->id)
            ->assertResponseStatus(404);
    }
}
