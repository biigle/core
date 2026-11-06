<?php

namespace Biigle\Tests\Services\Reports;

use Biigle\Services\Reports\MakesZipArchives;
use Biigle\Services\Reports\ReportGenerator;
use Biigle\Tests\VolumeTest;
use TestCase;
use ZipArchive;

class MakesZipArchivesTest extends TestCase
{
    public function testMakeZipDirectory()
    {
        $volume = VolumeTest::create();
        $generator = new MakesZipArchivesStub;
        $generator->setSource($volume);
        $path = tempnam(sys_get_temp_dir(), 'biigle-zip-test');
        $file = tempnam(sys_get_temp_dir(), 'biigle-zip-test');
        file_put_contents($file, 'abc');

        try {
            $generator->generateReport($path, [$file => 'file.csv']);

            $zip = new ZipArchive;
            $this->assertTrue($zip->open($path));
            // The file is in a directory with the same name as the downloaded ZIP file
            // so its location after extraction is predictable.
            $this->assertSame("{$volume->id}_my_report/file.csv", $zip->getNameIndex(0));
            $this->assertSame(1, $zip->count());
            $zip->close();
        } finally {
            unlink($path);
            unlink($file);
        }
    }
}

class MakesZipArchivesStub extends ReportGenerator
{
    use MakesZipArchives;

    public $filename = 'my_report';

    public $extension = 'zip';

    public function generateReport($path, $files = [])
    {
        $this->makeZip($files, $path);
    }
}
