<?php

namespace Biigle\Tests\Modules\Sync\Support\Import;

use File;
use TestCase;
use Exception;
use ZipArchive;
use Biigle\Tests\UserTest;
use Biigle\Modules\Sync\Support\Export\UserExport;
use Biigle\Modules\Sync\Support\Import\UserImport;

class UserImportTest extends TestCase
{
    protected $destination;

    public function setUp()
    {
        parent::setUp();

        $user = UserTest::create();
        $export = new UserExport([$user->id]);
        $path = $export->getArchive();
        $this->destination = tempnam(sys_get_temp_dir(), 'user_import_test');
        // This should be a directory, not a file.
        File::delete($this->destination);

        $zip = new ZipArchive;
        $zip->open($path);
        $zip->extractTo($this->destination);
        $zip->close();
    }

    public function tearDown()
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
            $this->assertContains('are missing keys: uuid', $e->getMessage());
        }
    }
}
