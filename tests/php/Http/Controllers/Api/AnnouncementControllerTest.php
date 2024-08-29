<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Announcement;

class AnnouncementControllerTest extends ApiTestCase
{
    public function testStore()
    {
        $this->doTestApiRoute('POST', '/api/v1/announcements');

        $this->beAdmin();
        $this->json('POST', '/api/v1/announcements')
            ->assertStatus(403);

        $this->beGlobalAdmin();

        $this
            ->json('POST', '/api/v1/announcements', [
                'title' => 'my title',
            ])
            // body required
            ->assertStatus(422);

        $this
            ->json('POST', '/api/v1/announcements', [
                'body' => 'my body',
            ])
            // title required
            ->assertStatus(422);

        $this
            ->json('POST', '/api/v1/announcements', [
                'title' => 'my title',
                'body' => 'my body',
                'show_until' => '2000-01-01',
            ])
            // show_until must be in the future
            ->assertStatus(422);

        $this->assertSame(0, Announcement::count());

        $this
            ->json('POST', '/api/v1/announcements', [
                'title' => 'my title',
                'body' => 'my body',
            ])
            ->assertSuccessful();

        $announcement = Announcement::first();
        $this->assertNull($announcement->show_until);
        $announcement->delete();

        $this
            ->json('POST', '/api/v1/announcements', [
                'title' => 'my title',
                'body' => 'my body',
                'show_until' => now()->addDay(),
            ])
            ->assertSuccessful();

        $announcement = Announcement::first();
        $this->assertNotNull($announcement->show_until);
    }

    public function testStoreDenyOtherWithDate()
    {
        Announcement::factory()->create(['show_until' => now()->addDay()]);
        $this->beGlobalAdmin();
        $this
            ->json('POST', '/api/v1/announcements', [
                'title' => 'my title',
                'body' => 'my body',
            ])
            ->assertStatus(422);
    }

    public function testStoreDenyOtherWithoutDate()
    {
        Announcement::factory()->create();
        $this->beGlobalAdmin();
        $this
            ->json('POST', '/api/v1/announcements', [
                'title' => 'my title',
                'body' => 'my body',
            ])
            ->assertStatus(422);
    }

    public function testStoreAllowOtherHidden()
    {
        Announcement::factory()->create(['show_until' => '2022-10-20 16:00:00']);
        $this->beGlobalAdmin();
        $this
            ->json('POST', '/api/v1/announcements', [
                'title' => 'my title',
                'body' => 'my body',
            ])
            ->assertSuccessful();
    }

    public function testDestroy()
    {
        $announcement = Announcement::factory()->create();

        $this->doTestApiRoute('DELETE', '/api/v1/announcements/'.$announcement->id);

        $this->beAdmin();
        $this->json('DELETE', '/api/v1/announcements/'.$announcement->id)
            ->assertStatus(403);

        $this->beGlobalAdmin();

        $this->json('DELETE', '/api/v1/announcements/'.$announcement->id)
            ->assertStatus(200);

        $this->assertNull($announcement->fresh());
    }
}
