<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Volumes;

use App;
use Biigle\Modules\Reports\Support\CsvFile;
use Biigle\Modules\Reports\Support\Reports\Volumes\ImageIfdoReportGenerator;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\LabelTreeTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Mockery;
use Storage;
use TestCase;
use ZipArchive;

class ImageIfdoReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new ImageIfdoReportGenerator;
        $this->assertEquals('iFDO report', $generator->getName());
        $this->assertEquals('ifdo_report', $generator->getFilename());
        $this->assertStringEndsWith('.yaml', $generator->getFullFilename());
    }

    public function testGenerateReportEmpty()
    {
        $ifdo = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
            ],
        ];

        $volume = VolumeTest::create(['name' => 'My Cool Volume']);

        $disk = Storage::fake('ifdos');
        $disk->put($volume->id, yaml_emit($ifdo));

        $label = LabelTest::create();
        $user = UserTest::create();

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
        ]);

        $al->annotation->image->volume_id = $volume->id;
        $al->annotation->image->attrs = ['image' => 'attrs'];
        $al->annotation->image->save();

        $generator = new ImageIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
                        'type' => 'expert',
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => $al->label->id,
                        'name' => $al->label->name,
                    ],
                ],
            ],
            'image-set-items' => [
                $al->annotation->image->filename => [
                    'image-annotations' => [
                        [
                            'coordinates' => $al->annotation->points,
                            'labels' => [
                                [
                                    'label' => $al->label->id,
                                    'annotator' => $user->uuid,
                                    'confidence' => $al->confidence,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->yaml);
    }

    public function testGenerateReportImageLabels()
    {
        $this->markTestIncomplete();
    }

    public function testGenerateReportMergeSetItems()
    {
        $this->markTestIncomplete();
    }

    public function testGenerateReportRestrictExportArea()
    {
        $this->markTestIncomplete();
    }

    public function testGenerateReportRestrictNewestLabel()
    {
        $this->markTestIncomplete();
    }

    public function testGenerateReportRestrictToLabels()
    {
        $this->markTestIncomplete();
    }

    public function testGenerateReportNoIfdo()
    {
        $this->markTestIncomplete();
    }

    public function testGenerateReportLabelAphiaIdInfo()
    {
        $this->markTestIncomplete();
    }
}

class ImageIfdoReportGeneratorStub extends ImageIfdoReportGenerator
{
    public $yaml;

    protected function writeYaml(array $content, string $path)
    {
        $this->yaml = $content;
    }
}
