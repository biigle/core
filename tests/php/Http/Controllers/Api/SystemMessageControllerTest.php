<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\SystemMessage;
use Biigle\SystemMessageType;
use Biigle\Tests\SystemMessageTest;

class SystemMessageControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/system-messages');

        $this->beAdmin();
        $response = $this->json('POST', '/api/v1/system-messages')
            ->assertStatus(403);

        $this->beGlobalAdmin();

        $response = $this->json('POST', '/api/v1/system-messages', [
                'title' => 'my title',
            ])
            // body required
            ->assertStatus(422);

        $response = $this->json('POST', '/api/v1/system-messages', [
                'body' => 'my body',
            ])
            // title required
            ->assertStatus(422);

        $response = $this->json('POST', '/api/v1/system-messages', [
                'title' => 'my title',
                'body' => 'my body',
                'type_id' => 999,
            ])
            // type must exist
            ->assertStatus(422);

        $response = $this->json('POST', '/api/v1/system-messages', [
                'title' => 'my title',
                'body' => 'my body',
                'publish' => 'some value',
            ])
            // publish must be boolean
            ->assertStatus(422);

        $this->assertEquals(0, SystemMessage::count());

        $response = $this->json('POST', '/api/v1/system-messages', [
                'title' => 'my title',
                'body' => 'my body',
            ])
            ->assertSuccessful();

        $message = SystemMessage::first();
        $this->assertEquals(SystemMessageType::typeInfoId(), $message->type_id);
        $this->assertNull($message->published_at);
        $message->delete();

        $response = $this->json('POST', '/api/v1/system-messages', [
                'title' => 'my title',
                'body' => 'my body',
                'type_id' => SystemMessageType::typeImportantId(),
                'publish' => true,
            ])
            ->assertSuccessful();

        $message = SystemMessage::first();
        $this->assertEquals(SystemMessageType::typeImportantId(), $message->type_id);
        $this->assertNotNull($message->published_at);
    }

    public function testUpdate()
    {
        $message = SystemMessageTest::create([
            'title' => 'abc',
            'body' => 'def',
            'published_at' => null,
            'type_id' => SystemMessageType::typeInfoId(),
        ]);

        $this->doTestApiRoute('PUT', '/api/v1/system-messages/'.$message->id);

        $this->beAdmin();
        $response = $this->json('PUT', '/api/v1/system-messages/'.$message->id)
            ->assertStatus(403);

        $this->beGlobalAdmin();

        $response = $this->json('PUT', '/api/v1/system-messages/'.$message->id, [
                'type_id' => 999,
            ])
            // type must exist
            ->assertStatus(422);

        $response = $this->json('PUT', '/api/v1/system-messages/'.$message->id, [
                'publish' => 'some value',
            ])
            // publish must be boolean
            ->assertStatus(422);

        $response = $this->json('PUT', '/api/v1/system-messages/'.$message->id, [
                'title' => 'my title',
                'body' => 'my body',
                'type_id' => SystemMessageType::typeImportantId(),
                'publish' => 1,
            ])
            ->assertStatus(200);

        $message = $message->fresh();
        $this->assertEquals('my title', $message->title);
        $this->assertEquals('my body', $message->body);
        $this->assertEquals(SystemMessageType::typeImportantId(), $message->type_id);
        $this->assertNotNull($message->published_at);
    }

    public function testDestroy()
    {
        $message = SystemMessageTest::create();

        $this->doTestApiRoute('DELETE', '/api/v1/system-messages/'.$message->id);

        $this->beAdmin();
        $response = $this->json('DELETE', '/api/v1/system-messages/'.$message->id)
            ->assertStatus(403);

        $this->beGlobalAdmin();

        $response = $this->json('DELETE', '/api/v1/system-messages/'.$message->id)
            ->assertStatus(200);

        $this->assertNull($message->fresh());

        $message = SystemMessageTest::create([
            'published_at' => '2016',
        ]);

        $response = $this->json('DELETE', '/api/v1/system-messages/'.$message->id)
            // published system messages may not be deleted
            ->assertStatus(403);
    }
}
