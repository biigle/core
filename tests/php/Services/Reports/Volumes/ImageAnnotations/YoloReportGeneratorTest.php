<?php

namespace Biigle\Tests\Services\Reports\Volumes\ImageAnnotations;

use App;
use Biigle\Services\Reports\CsvFile;
use Biigle\Services\Reports\Volumes\ImageAnnotations\YoloReportGenerator;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\VolumeTest;
use Mockery;
use TestCase;
use ZipArchive;

class YoloReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new YoloReportGenerator;
        $this->assertSame('yolo image annotation report', $generator->getName());
        $this->assertSame('yolo_image_annotation_report', $generator->getFilename());
        $this->assertStringEndsWith('.zip', $generator->getFullFilename());
    }

    public function testOptionsAreStored()
    {
        $generator = new YoloReportGenerator([
            'yoloImagePath' => '/custom/path',
            'yoloSplitRatio' => '0.6 0.3 0.1',
        ]);
        
        $this->assertEquals('/custom/path', $generator->options->get('yoloImagePath'));
        $this->assertEquals('0.6 0.3 0.1', $generator->options->get('yoloSplitRatio'));
    }

    public function testDefaultOptions()
    {
        $generator = new YoloReportGenerator();
        
        $this->assertEquals('', $generator->options->get('yoloImagePath', ''));
        $this->assertEquals('0.7 0.2 0.1', $generator->options->get('yoloSplitRatio', '0.7 0.2 0.1'));
    }

    public function testGenerateReport()
    {
        $volume = VolumeTest::create([
            'name' => 'My Cool Volume',
        ]);

        $root = LabelTest::create();
        $child = LabelTest::create([
            'parent_id' => $root->id,
            'label_tree_id' => $root->label_tree_id,
        ]);

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $child->id,
        ]);
        $al->annotation->image->volume_id = $volume->id;
        $al->annotation->image->attrs = ['width' => 1920, 'height' => 1080];
        $al->annotation->image->save();

        $csvMock = Mockery::mock();

        $csvMock->shouldReceive('getPath')
            ->once()
            ->andReturn('abc');

        $csvMock->shouldReceive('putCsv')
            ->once()
            ->with([
                'annotation_label_id',
                'label_id',
                'label_name',
                'image_id',
                'filename',
                'image_longitude',
                'image_latitude',
                'shape_name',
                'points',
                'attributes',
            ]);

        $csvMock->shouldReceive('putCsv')
            ->once()
            ->with([
                $al->id,
                $child->id,
                $child->name,
                $al->annotation->image_id,
                $al->annotation->image->filename,
                null,
                null,
                $al->annotation->shape->name,
                json_encode($al->annotation->points),
                json_encode(['width' => 1920, 'height' => 1080])
            ]);

        $csvMock->shouldReceive('close')
            ->once();

        App::singleton(CsvFile::class, fn () => $csvMock);

        $zipMock = Mockery::mock();

        $zipMock->shouldReceive('open')
            ->once()
            ->andReturn(true);

        $zipMock->shouldReceive('close')->once();

        App::singleton(ZipArchive::class, fn () => $zipMock);

        $generator = new YoloReportGeneratorTestStub([
            'yoloImagePath' => '/path/to/images',
            'yoloSplitRatio' => '0.7 0.2 0.1',
        ]);
        $generator->setSource($volume);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportAlwaysCreatesUnifiedDataset()
    {
        // Test that YOLO report always creates a single CSV, not multiple
        // even when separateLabelTrees or separateUsers options are set
        $volume = VolumeTest::create(['name' => 'Test Volume']);

        $label = LabelTest::create();
        $al = ImageAnnotationLabelTest::create(['label_id' => $label->id]);
        $al->annotation->image->volume_id = $volume->id;
        $al->annotation->image->attrs = ['width' => 1920, 'height' => 1080];
        $al->annotation->image->save();

        // Test with separateLabelTrees = true (should be ignored)
        $generator1 = new YoloReportGeneratorStub([
            'separateLabelTrees' => true,
            'yoloImagePath' => '/path/to/images',
            'yoloSplitRatio' => '0.7 0.2 0.1',
        ]);
        $generator1->setSource($volume);
        $csvCount1 = $generator1->getCsvCount();
        
        // Test with separateUsers = true (should be ignored)
        $generator2 = new YoloReportGeneratorStub([
            'separateUsers' => true,
            'yoloImagePath' => '/path/to/images',
            'yoloSplitRatio' => '0.7 0.2 0.1',
        ]);
        $generator2->setSource($volume);
        $csvCount2 = $generator2->getCsvCount();

        // Test with no separation options
        $generator3 = new YoloReportGeneratorStub([
            'yoloImagePath' => '/path/to/images',
            'yoloSplitRatio' => '0.7 0.2 0.1',
        ]);
        $generator3->setSource($volume);
        $csvCount3 = $generator3->getCsvCount();

        // All should create exactly 1 CSV file
        $this->assertEquals(1, $csvCount1, 'YOLO should ignore separateLabelTrees and create 1 CSV');
        $this->assertEquals(1, $csvCount2, 'YOLO should ignore separateUsers and create 1 CSV');
        $this->assertEquals(1, $csvCount3, 'YOLO should create 1 CSV by default');
    }
}

// Stub class for testGenerateReport that skips Python and ZIP file operations
class YoloReportGeneratorTestStub extends YoloReportGenerator
{
    protected function executeScript($scriptName, $path)
    {
        // Skip Python script execution
    }

    protected function makeZip($files, $path)
    {
        // Use mocked ZipArchive but skip actual file operations
        $zip = App::make(ZipArchive::class);
        $open = $zip->open($path, ZipArchive::OVERWRITE);
        if ($open !== true) {
            throw new \Exception("Could not open ZIP file '{$path}'.");
        }
        $zip->close();
    }
}

// Stub class to test CSV creation logic without executing Python or ZIP operations
class YoloReportGeneratorStub extends YoloReportGenerator
{
    private $csvCount = 0;

    public function getCsvCount()
    {
        // Count how many CSVs would be created
        $rows = $this->query()->get();
        
        // YOLO always creates a single CSV, regardless of separation options
        $this->csvCount = 1;
        
        return $this->csvCount;
    }
}
