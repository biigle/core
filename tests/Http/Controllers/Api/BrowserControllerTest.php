<?php

namespace Biigle\Tests\Modules\Volumes\Http\Controllers\Api;

use Storage;
use ApiTestCase;

class BrowserControllerTest extends ApiTestCase
{
    public function setUp()
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

    public function testIndexRoot()
    {
        Storage::disk('test')->makeDirectory('test_2');

        $this->doTestApiRoute('GET', "/api/v1/volumes/browser/directories/test");

        $this->beUser();
        $this->get("/api/v1/volumes/browser/directories/test")->assertStatus(404);
        config(['volumes.browser' => true]);

        $this->get("/api/v1/volumes/browser/directories/local")->assertStatus(404);
        $this->get("/api/v1/volumes/browser/directories/missing")->assertStatus(404);

        $this->get("/api/v1/volumes/browser/directories/test")
            ->assertStatus(200)
            ->assertExactJson(['test_1', 'test_2']);
    }

    public function testIndexDirectories()
    {
        Storage::disk('test')->makeDirectory('test_1/test_11');

        $this->doTestApiRoute('GET', "/api/v1/volumes/browser/directories/test/test_1");

        $this->beUser();
        $this->get("/api/v1/volumes/browser/directories/test/test_1")->assertStatus(404);
        config(['volumes.browser' => true]);

        $this->get("/api/v1/volumes/browser/directories/local/test_1")
            ->assertStatus(404);
        $this->get("/api/v1/volumes/browser/directories/missing/test_1")
            ->assertStatus(404);

        $this->get("/api/v1/volumes/browser/directories/test/test_1")
            ->assertStatus(200)
            ->assertExactJson(['test_11']);
    }

    public function testIndexImages()
    {
        Storage::disk('test')->put('test_1/test.jpg', '');

        $this->doTestApiRoute('GET', "/api/v1/volumes/browser/images/test/test_1");

        $this->beUser();
        $this->get("/api/v1/volumes/browser/images/test/test_1")->assertStatus(404);
        config(['volumes.browser' => true]);

        $this->get("/api/v1/volumes/browser/images/local/test_1")
            ->assertStatus(404);
        $this->get("/api/v1/volumes/browser/images/missing/test_1")
            ->assertStatus(404);

        $this->get("/api/v1/volumes/browser/images/test/test_1")
            ->assertStatus(200)
            ->assertExactJson(['test.jpg']);
    }
}
