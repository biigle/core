<?php

namespace Biigle\Tests\Services\Export;

use Biigle\Services\Export\Export;
use File;
use TestCase;
use ZipArchive;

class ExportTest extends TestCase
{
    public function testGetArchive()
    {
        $export = new ExportStub([]);
        $path = $export->getArchive();
        try {
            $zip = new ZipArchive;
            $zip->open($path);
            $content = $zip->getFromName('data.json');
            $this->assertEquals(['test'], json_decode($content));
        } finally {
            File::delete($path);
        }
    }

    public function testGetArchiveCleansPartialArchiveOnFailure(): void
    {
        $directory = sys_get_temp_dir().'/biigle-export-'.uniqid();
        mkdir($directory);
        config(['sync.tmp_storage' => $directory]);

        try {
            (new PartiallyFailingExportStub([]))->getArchive();
            $this->fail('Archive generation did not fail.');
        } catch (\RuntimeException) {
            // Expected.
        }

        $files = glob("{$directory}/*");
        array_map('unlink', $files);
        rmdir($directory);
        $this->assertEmpty($files);
    }
}

class ExportStub extends Export
{
    public function getContent()
    {
        return ['test'];
    }
}

class FailingExportStub extends Export
{
    public function getContent()
    {
        throw new \RuntimeException;
    }
}

class PartiallyFailingExportStub extends ExportStub
{
    public function getAdditionalExports()
    {
        return [new FailingExportStub([])];
    }
}
