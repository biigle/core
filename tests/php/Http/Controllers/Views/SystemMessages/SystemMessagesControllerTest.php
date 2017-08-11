<?php

namespace Biigle\Tests\Http\Controllers\Views\SystemMessages;

use TestCase;
use Biigle\Tests\UserTest;
use Biigle\Tests\SystemMessageTest;

class SystemMessageControllerTest extends TestCase
{
    public function testIndexWhenNotLoggedIn()
    {
        $this->get('system-messages')->assertRedirect('login');
    }

    public function testIndexWhenLoggedIn()
    {
        $user = UserTest::create();
        $message = SystemMessageTest::create();
        $message->publish();
        $message2 = SystemMessageTest::create();
        $this->actingAs($user)->get('system-messages')
            ->assertSeeText($message->title)
            ->assertDontSeeText($message2->title)
            ->assertViewIs('system-messages.index');
    }

    public function testShowWhenNotLoggedIn()
    {
        $message = SystemMessageTest::create();
        $this->get('system-messages/'.$message->id)->assertRedirect('login');
    }

    public function testShowWhenLoggedIn()
    {
        $user = UserTest::create();
        $message = SystemMessageTest::create();
        $message->publish();
        $this->actingAs($user)->get('system-messages/'.$message->id)
            ->assertSeeText($message->title)
            ->assertSeeText($message->body)
            ->assertViewIs('system-messages.show');
    }

    public function testShowUnpublished()
    {
        $user = UserTest::create();
        $message = SystemMessageTest::create();
        $this->actingAs($user)->get('system-messages/'.$message->id)
            ->assertStatus(404);
    }
}
