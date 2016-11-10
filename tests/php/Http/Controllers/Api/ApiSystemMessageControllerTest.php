<?php

use Dias\SystemMessage;
use Dias\SystemMessageType;

class ApiSystemMessageControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/system-messages');

        $this->beAdmin();
        $this->json('POST', '/api/v1/system-messages')
            ->assertResponseStatus(403);

        $this->beGlobalAdmin();

        $this->json('POST', '/api/v1/system-messages', [
                'title' => 'my title',
            ])
            // body required
            ->assertResponseStatus(422);

        $this->json('POST', '/api/v1/system-messages', [
                'body' => 'my body',
            ])
            // title required
            ->assertResponseStatus(422);

        $this->json('POST', '/api/v1/system-messages', [
                'title' => 'my title',
                'body' => 'my body',
                'type_id' => 999
            ])
            // type must exist
            ->assertResponseStatus(422);

        $this->json('POST', '/api/v1/system-messages', [
                'title' => 'my title',
                'body' => 'my body',
                'publish' => 'some value',
            ])
            // publish must be boolean
            ->assertResponseStatus(422);

        $this->assertEquals(0, SystemMessage::count());

        $this->json('POST', '/api/v1/system-messages', [
                'title' => 'my title',
                'body' => 'my body',
            ])
            ->assertResponseOk();

        $message = SystemMessage::first();
        $this->assertEquals(SystemMessageType::$info->id, $message->type_id);
        $this->assertNull($message->published_at);
        $message->delete();

        $this->json('POST', '/api/v1/system-messages', [
                'title' => 'my title',
                'body' => 'my body',
                'type_id' => SystemMessageType::$important->id,
                'publish' => true,
            ])
            ->assertResponseOk();

        $message = SystemMessage::first();
        $this->assertEquals(SystemMessageType::$important->id, $message->type_id);
        $this->assertNotNull($message->published_at);
    }

    public function testUpdate()
    {
        $message = SystemMessageTest::create([
            'title' => 'abc',
            'body' => 'def',
            'published_at' => null,
            'type_id' => SystemMessageType::$info->id,
        ]);

        $this->doTestApiRoute('PUT', '/api/v1/system-messages/'.$message->id);

        $this->beAdmin();
        $this->json('PUT', '/api/v1/system-messages/'.$message->id)
            ->assertResponseStatus(403);

        $this->beGlobalAdmin();

        $this->json('PUT', '/api/v1/system-messages/'.$message->id, [
                'type_id' => 999
            ])
            // type must exist
            ->assertResponseStatus(422);

        $this->json('PUT', '/api/v1/system-messages/'.$message->id, [
                'publish' => 'some value',
            ])
            // publish must be boolean
            ->assertResponseStatus(422);

        $this->json('PUT', '/api/v1/system-messages/'.$message->id, [
                'title' => 'my title',
                'body' => 'my body',
                'type_id' => SystemMessageType::$important->id,
                'publish' => 1,
            ])
            ->assertResponseOk();

        $message = $message->fresh();
        $this->assertEquals('my title', $message->title);
        $this->assertEquals('my body', $message->body);
        $this->assertEquals(SystemMessageType::$important->id, $message->type_id);
        $this->assertNotNull($message->published_at);
    }

    public function testDestroy()
    {
        $message = SystemMessageTest::create();

        $this->doTestApiRoute('DELETE', '/api/v1/system-messages/'.$message->id);

        $this->beAdmin();
        $this->json('DELETE', '/api/v1/system-messages/'.$message->id)
            ->assertResponseStatus(403);

        $this->beGlobalAdmin();

        $this->json('DELETE', '/api/v1/system-messages/'.$message->id)
            ->assertResponseOk();

        $this->assertNull($message->fresh());

        $message = SystemMessageTest::create([
            'published_at' => '2016'
        ]);

        $this->json('DELETE', '/api/v1/system-messages/'.$message->id)
            // published system messages may not be deleted
            ->assertResponseStatus(403);
    }
}
