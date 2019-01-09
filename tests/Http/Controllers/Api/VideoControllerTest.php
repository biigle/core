<?php

namespace Tests\Http\Controllers\Api;

use Storage;
use App\Video;
use Tests\TestCase;
use Illuminate\Http\UploadedFile;

class VideoControllerTest extends TestCase
{
    public function testStore()
    {
        Storage::fake('videos');
        // Name and file are required.
        $this->postJson('api/v1/videos')->assertStatus(422);

        $this->postJson('api/v1/videos', [
                'name' => 'test',
            ])->assertStatus(422);

        $path = __DIR__.'/../../../files/test.mp4';
        $file = new UploadedFile($path, 'test.mp4', 'video/mp4', null, true);

        $this->postJson('api/v1/videos', [
                'name' => 'test',
                'file' => $file,
            ])->assertStatus(201);

        $video = Video::first();
        $this->assertNotNull($video);
        $this->assertEquals('test', $video->name);
        $expect = [
            'filename' => 'test.mp4',
            'size' => 104500,
            'mimetype' => 'video/mp4',
        ];
        $this->assertEquals($expect, $video->meta);
        $this->assertTrue(Storage::disk('videos')->exists($video->uuid));
    }
}
