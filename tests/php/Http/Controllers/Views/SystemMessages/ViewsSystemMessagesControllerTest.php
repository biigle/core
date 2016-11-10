<?php

class ViewsSystemMessageControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->visit('system-messages')->seePageIs('login');
    }

    public function testIndexWhenLoggedIn()
    {
        $user = UserTest::create();
        $message = SystemMessageTest::create();
        $this->actingAs($user)->visit('system-messages')
            ->see($message->title)
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
        $this->actingAs($user)->visit('system-messages/'.$message->id)
            ->see($message->title)
            ->see($message->body)
            ->seePageIs('system-messages/'.$message->id);
    }
}
