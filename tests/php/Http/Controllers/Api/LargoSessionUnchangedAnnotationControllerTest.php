<?php

namespace Biigle\Tests\Http\Controllers\Api;

use ApiTestCase;
use Biigle\Jobs\ApplyLargoSession;
use Cache;
use Ramsey\Uuid\Uuid;

class LargoSessionUnchangedAnnotationControllerTest extends ApiTestCase
{
    public function testIndex()
    {
        $id = Uuid::uuid4()->toString();
        Cache::put(ApplyLargoSession::getUnchangedCacheKey($id), [
            'user_id' => $this->editor()->id,
            'image_annotations' => [1, 2],
            'video_annotations' => [3],
            'guideline' => true,
            'other_user' => false,
        ], 60);

        $this->doTestApiRoute('GET', "/api/v1/largo-sessions/{$id}/unchanged-annotations");

        $this->beEditor();
        $this->getJson("/api/v1/largo-sessions/{$id}/unchanged-annotations")
            ->assertStatus(200)
            ->assertExactJson([
                'image_annotations' => [1, 2],
                'video_annotations' => [3],
                'guideline' => true,
                'other_user' => false,
            ]);
    }

    public function testIndexOtherUser()
    {
        $id = Uuid::uuid4()->toString();
        Cache::put(ApplyLargoSession::getUnchangedCacheKey($id), [
            'user_id' => $this->editor()->id,
            'image_annotations' => [1, 2],
            'video_annotations' => [],
            'guideline' => true,
            'other_user' => false,
        ], 60);

        $this->beAdmin();
        $this->getJson("/api/v1/largo-sessions/{$id}/unchanged-annotations")
            ->assertStatus(404);
    }

    public function testIndexNotFound()
    {
        $id = Uuid::uuid4()->toString();
        $this->beEditor();
        $this->getJson("/api/v1/largo-sessions/{$id}/unchanged-annotations")
            ->assertStatus(404);
    }

    public function testIndexInvalidUuid()
    {
        $this->beEditor();
        $this->getJson('/api/v1/largo-sessions/abc/unchanged-annotations')
            ->assertStatus(404);
    }
}
