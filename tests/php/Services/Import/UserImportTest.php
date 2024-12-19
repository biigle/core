<?php

namespace Biigle\Tests\Services\Import;

use Biigle\Services\Export\UserExport;
use Biigle\Services\Import\UserImport;
use Biigle\Tests\UserTest;
use Biigle\User;
use DB;
use Exception;
use File;
use Ramsey\Uuid\Uuid;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;
use TestCase;
use ZipArchive;

class UserImportTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        $this->user = UserTest::create();
        $this->user->setSettings(['ab' => 'cd']);
        $this->user->save();
        $this->user2 = UserTest::create();
        $export = new UserExport([$this->user->id, $this->user2->id]);
        $path = $export->getArchive();
        $this->destination = tempnam(sys_get_temp_dir(), 'user_import_test');
        // This should be a directory, not a file.
        File::delete($this->destination);

        $zip = new ZipArchive;
        $zip->open($path);
        $zip->extractTo($this->destination);
        $zip->close();
    }

    public function tearDown(): void
    {
        File::deleteDirectory($this->destination);
        parent::tearDown();
    }

    public function testFilesMatch()
    {
        $import = new UserImport($this->destination);

        $this->assertTrue($import->filesMatch());
        File::delete("{$this->destination}/users.json");
        $this->assertFalse($import->filesMatch());
    }

    public function testValidateFiles()
    {
        $import = new UserImport($this->destination);
        $import->validateFiles();

        $content = json_decode(File::get("{$this->destination}/users.json"), true);
        unset($content[0]['uuid']);
        File::put("{$this->destination}/users.json", json_encode($content));

        try {
            $import->validateFiles();
            $this->assertFalse(true);
        } catch (Exception $e) {
            $this->assertStringContainsString('are missing keys: uuid', $e->getMessage());
        }
    }

    public function testGetImportUsers()
    {
        $import = new UserImport($this->destination);
        $this->assertCount(2, $import->getImportUsers());
    }

    public function testGetUserImportCandidates()
    {
        $import = new UserImport($this->destination);
        $this->assertCount(0, $import->getUserImportCandidates());
        DB::table('users')->where('id', DB::table('users')->min('id'))->delete();
        $this->assertCount(1, $import->getUserImportCandidates());
    }

    public function testPerform()
    {
        $import = new UserImport($this->destination);
        DB::table('users')->delete();
        $map = $import->perform();
        $this->assertEquals(2, DB::table('users')->count());
        $user = User::find($map[$this->user->id]);
        $this->assertNotNull($user);
        $this->assertNotNull($user->created_at);
        $this->assertNotNull($user->updated_at);
        $this->assertEquals(['ab' => 'cd'], $user->settings);
    }

    public function testPerformConflicts()
    {
        $import = new UserImport($this->destination);
        DB::table('users')
            ->where('id', DB::table('users')->min('id'))
            ->update(['uuid' => Uuid::uuid4()]);
        try {
            $import->perform();
            $this->assertFalse(true);
        } catch (UnprocessableEntityHttpException $e) {
            $this->assertStringContainsString('users exist according to their email address but the UUIDs do not match', $e->getMessage());
        }
    }

    public function testPerformNone()
    {
        $import = new UserImport($this->destination);
        $map = $import->perform();
        $this->assertEquals(2, DB::table('users')->count());
        $id = $this->user->id;
        $id2 = $this->user2->id;
        $this->assertEquals([$id => $id, $id2 => $id2], $map);
    }

    public function testPerformOnly()
    {
        $import = new UserImport($this->destination);
        DB::table('users')->delete();
        $map = $import->perform([$this->user->id]);
        $this->assertEquals(1, DB::table('users')->count());
        $id = DB::table('users')->first()->id;
        $this->assertEquals([$this->user->id => $id], $map);
    }
}
