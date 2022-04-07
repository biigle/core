<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use ApiTestCase;
use Biigle\MediaType;
use Storage;

class BrowserControllerTest extends ApiTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('test_1');
        Storage::fake('local');
        config(['volumes.editor_storage_disks' => ['test']]);
    }

    public function testIndexDirectoriesRoot()
    {
        Storage::disk('test')->makeDirectory('test_2');

        $this->doTestApiRoute('GET', '/api/v1/volumes/browser/directories/test');

        $this->beGlobalGuest();
        $this->get('/api/v1/volumes/browser/directories/test')->assertStatus(404);

        $this->beUser();
        $this->get('/api/v1/volumes/browser/directories/local')->assertStatus(404);
        $this->get('/api/v1/volumes/browser/directories/missing')->assertStatus(404);

        $this->get('/api/v1/volumes/browser/directories/test')
            ->assertStatus(200)
            ->assertExactJson(['test_1', 'test_2']);
    }

    public function testIndexDirectories()
    {
        Storage::disk('test')->makeDirectory('test_1/test_11');

        $this->doTestApiRoute('GET', '/api/v1/volumes/browser/directories/test', [
            'path' => 'test_1',
        ]);

        $this->beGlobalGuest();
        $this->get('/api/v1/volumes/browser/directories/test?path=test_1')
            ->assertStatus(404);

        $this->beUser();
        $this->get('/api/v1/volumes/browser/directories/local?path=test_1')
            ->assertStatus(404);
        $this->get('/api/v1/volumes/browser/directories/missing?path=test_1')
            ->assertStatus(404);

        $this->get('/api/v1/volumes/browser/directories/test?path=test_1')
            ->assertStatus(200)
            ->assertExactJson(['test_11']);

        $this->get('/api/v1/volumes/browser/directories/test?path=test_2')
            ->assertStatus(200)
            ->assertExactJson([]);
    }

    public function testIndexImages()
    {
        Storage::disk('test')->put('test_1/test1.jpg', '');
        Storage::disk('test')->put('test_1/test1.txt', '');
        Storage::disk('test')->put('test_1/test2.jpg', '');
        Storage::disk('test')->put('test_1/test2.mp4', '');

        $this->doTestApiRoute('GET', '/api/v1/volumes/browser/images/test', [
            'path' => 'test_1',
        ]);

        $this->beGlobalGuest();
        $this->get('/api/v1/volumes/browser/images/test?path=test_1')
            ->assertStatus(404);

        $this->beUser();
        $this->get('/api/v1/volumes/browser/images/local?path=test_1')
            ->assertStatus(404);
        $this->get('/api/v1/volumes/browser/images/missing?path=test_1')
            ->assertStatus(404);

        $this->get('/api/v1/volumes/browser/images/test?path=test_1')
            ->assertStatus(200)
            ->assertExactJson(['test1.jpg', 'test2.jpg']);
    }

    public function testIndexVideos()
    {
        Storage::disk('test')->put('test_1/test1.mp4', '');
        Storage::disk('test')->put('test_1/test1.txt', '');
        Storage::disk('test')->put('test_1/test2.mp4', '');
        Storage::disk('test')->put('test_1/test2.jpg', '');

        $this->doTestApiRoute('GET', '/api/v1/volumes/browser/videos/test', [
            'path' => 'test_1',
        ]);

        $this->beGlobalGuest();
        $this->get('/api/v1/volumes/browser/videos/test?path=test_1')
            ->assertStatus(404);

        $this->beUser();
        $this->get('/api/v1/volumes/browser/videos/local?path=test_1')
            ->assertStatus(404);
        $this->get('/api/v1/volumes/browser/videos/missing?path=test_1')
            ->assertStatus(404);

        $this->get('/api/v1/volumes/browser/videos/test?path=test_1')
            ->assertStatus(200)
            ->assertExactJson(['test1.mp4', 'test2.mp4']);
    }
}
