<?php

namespace Biigle\Tests\Http\Controllers\Api\Import;

use ApiTestCase;
use Biigle\Enums\Role;
use Biigle\Services\Import\ArchiveManager;
use Biigle\Services\Import\PublicLabelTreeImport;
use Biigle\Tests\LabelTreeTest;
use Exception;
use Illuminate\Http\UploadedFile;
use Mockery;

class PublicLabelTreeImportControllerTest extends ApiTestCase
{
    public function testStoreValidation()
    {
        $mock = Mockery::mock(ArchiveManager::class);
        $mock->shouldNotReceive('store');
        $this->app->bind(ArchiveManager::class, fn () => $mock);

        $wrongFile = UploadedFile::fake()->create('file.txt', 1, 'text/plain');

        $this->doTestApiRoute('POST', '/api/v1/label-trees/import');

        $this->beGlobalGuest();
        $this->postJson('/api/v1/label-trees/import')->assertStatus(403);

        $this->beUser();
        $this->postJson('/api/v1/label-trees/import')->assertStatus(422);

        $this->postJson('/api/v1/label-trees/import', ['archive' => $wrongFile])
            ->assertStatus(422);
    }

    public function testStore()
    {
        $newTree = LabelTreeTest::create();
        $importMock = Mockery::mock(PublicLabelTreeImport::class);
        $importMock->shouldReceive('perform')->once()->andReturn($newTree);
        $importMock->shouldReceive('treeExists')->once()->andReturn(false);
        $managerMock = Mockery::mock(ArchiveManager::class);
        $managerMock->shouldReceive('store')->once()->andReturn('123abc');
        $managerMock->shouldReceive('get')
            ->once()
            ->with('123abc')
            ->andReturn($importMock);
        $managerMock->shouldReceive('delete')->once()->with('123abc');
        $this->app->bind(ArchiveManager::class, fn () => $managerMock);

        $file = UploadedFile::fake()->create('label-tree.zip');

        $this->beUser();
        $this->postJson('/api/v1/label-trees/import', ['archive' => $file])
            ->assertSuccessful();

        $hasMember = $newTree->members()
            ->where('id', $this->user()->id)
            ->where('label_tree_user.role', Role::ADMIN)
            ->exists();
        $this->assertTrue($hasMember);
    }

    public function testStoreValidationException()
    {
        $mock = Mockery::mock(ArchiveManager::class);
        $mock->shouldReceive('store')->once()->andThrow(Exception::class);
        $this->app->bind(ArchiveManager::class, fn () => $mock);

        $file = UploadedFile::fake()->create('label-tree.zip');

        $this->beUser();
        $this->postJson('/api/v1/label-trees/import', ['archive' => $file])
            ->assertStatus(422);
    }
}
