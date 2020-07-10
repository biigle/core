<?php

namespace Biigle\Tests\Http\Controllers\Api\Volumes;

use Storage;
use ApiTestCase;

class BrowserControllerTest extends ApiTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        Storage::fake('test');
        Storage::disk('test')->makeDirectory('test_1');
        Storage::fake('local');
        config([
            'volumes.browser' => false,
            'volumes.browser_disks' => ['test', 'missing'],
        ]);
    }

    public function testIndexDirectoriesRoot()
    {
        Storage::disk('test')->makeDirectory('test_2');

        $this->doTestApiRoute('GET', '/api/v1/volumes/browser/directories/test');

        $this->beUser();
        $this->get('/api/v1/volumes/browser/directories/test')->assertStatus(404);
        config(['volumes.browser' => true]);

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

        $this->beUser();
        $this->get('/api/v1/volumes/browser/directories/test?path=test_1')
            ->assertStatus(404);
        config(['volumes.browser' => true]);

        $this->get('/api/v1/volumes/browser/directories/local?path=test_1')
            ->assertStatus(404);
        $this->get('/api/v1/volumes/browser/directories/missing?path=test_1')
            ->assertStatus(404);

        $this->get('/api/v1/volumes/browser/directories/test?path=test_1')
            ->assertStatus(200)
            ->assertExactJson(['test_11']);
    }

    public function testIndexImages()
    {
        Storage::disk('test')->put('test_1/test1.jpg', '');
        Storage::disk('test')->put('test_1/test1.txt', '');
        Storage::disk('test')->put('test_1/test2.jpg', '');
        Storage::disk('test')->put('test_1/test2.txt', '');

        $this->doTestApiRoute('GET', '/api/v1/volumes/browser/images/test', [
            'path' => 'test_1',
        ]);

        $this->beUser();
        $this->get('/api/v1/volumes/browser/images/test?path=test_1')
            ->assertStatus(404);
        config(['volumes.browser' => true]);

        $this->get('/api/v1/volumes/browser/images/local?path=test_1')
            ->assertStatus(404);
        $this->get('/api/v1/volumes/browser/images/missing?path=test_1')
            ->assertStatus(404);

        $this->get('/api/v1/volumes/browser/images/test?path=test_1')
            ->assertStatus(200)
            ->assertExactJson(['test1.jpg', 'test2.jpg']);
    }
}
