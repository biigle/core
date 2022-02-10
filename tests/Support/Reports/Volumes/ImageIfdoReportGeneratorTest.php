<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Volumes;

use Biigle\LabelSource;
use Biigle\Modules\Reports\Support\Reports\Volumes\ImageIfdoReportGenerator;
use Biigle\Modules\Reports\Volume;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VolumeTest;
use Exception;
use Storage;
use TestCase;

class ImageIfdoReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new ImageIfdoReportGenerator;
        $this->assertEquals('iFDO report', $generator->getName());
        $this->assertEquals('ifdo_report', $generator->getFilename());
        $this->assertStringEndsWith('.yaml', $generator->getFullFilename());
    }

    protected function setUpIfdo($merge = [])
    {
        $ifdo = array_merge_recursive([
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
            ],
        ], $merge);

        $volume = VolumeTest::create(['name' => 'My Cool Volume']);

        $disk = Storage::fake('ifdos');
        $disk->put($volume->id, yaml_emit($ifdo));

        return [$volume, $ifdo];
    }

    public function testGenerateReport()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $user = UserTest::create();

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
        ]);

        $al->annotation->image->volume_id = $volume->id;
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
                        'id' => $al->label_id,
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
                                    'label' => $al->label_id,
                                    'annotator' => $user->uuid,
                                    'confidence' => $al->confidence,
                                    'created-at' => (string) $al->created_at,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->yaml);
    }

    public function testGenerateReportMultiLabel()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $label2 = LabelTest::create();
        $user = UserTest::create();

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
        ]);

        $al2 = ImageAnnotationLabelTest::create([
            'label_id' => $label2->id,
            'user_id' => $user->id,
            'annotation_id' => $al->annotation_id,
        ]);

        $al->annotation->image->volume_id = $volume->id;
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
                        'id' => $al->label_id,
                        'name' => $al->label->name,
                    ],
                    [
                        'id' => $al2->label_id,
                        'name' => $al2->label->name,
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
                                    'label' => $al->label_id,
                                    'annotator' => $user->uuid,
                                    'confidence' => $al->confidence,
                                    'created-at' => (string) $al->created_at,
                                ],
                                [
                                    'label' => $al2->label_id,
                                    'annotator' => $user->uuid,
                                    'confidence' => $al2->confidence,
                                    'created-at' => (string) $al->created_at,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->yaml);
    }

    public function testGenerateReportEmpty()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $image = ImageTest::create(['volume_id' => $volume->id]);

        $generator = new ImageIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
            ],
            'image-set-items' => [
                $image->filename => [],
            ],
        ];

        $this->assertEquals($expect, $generator->yaml);
    }

    public function testGenerateReportImageLabels()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $user = UserTest::create();

        $il = ImageLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
        ]);

        $il->image->volume_id = $volume->id;
        $il->image->save();

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
                        'id' => $il->label_id,
                        'name' => $il->label->name,
                    ],
                ],
            ],
            'image-set-items' => [
                $il->image->filename => [
                    'image-annotations' => [
                        [
                            'coordinates' => [],
                            'labels' => [
                                [
                                    'label' => $il->label_id,
                                    'annotator' => $user->uuid,
                                    'created-at' => (string) $il->created_at,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->yaml);
    }

    public function testGenerateReportMergeImageSetItems()
    {
        $label = LabelTest::create();
        $user = UserTest::create();

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
        ]);

        $merge = [
            'image-set-header' => [
                'image-annotation-creators' => [
                    [
                        'id' => '123abc',
                        'name' => "Test User",
                        'type' => 'expert',
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => 123321,
                        'name' => 'Test Label',
                    ],
                ],
            ],
            'image-set-items' => [
                $al->annotation->image->filename => [
                    'image-area-square-meter' => 5.5,
                    'image-annotations' => [
                        [
                            'coordinates' => [10, 20],
                            'labels' => [
                                [
                                    'label' => 123321,
                                    'annotator' => '123abc',
                                    'confidence' => 1.0,
                                    'created-at' => '2022-02-10 09:47:00',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        [$volume, $ifdo] = $this->setUpIfdo($merge);

        $al->annotation->image->volume_id = $volume->id;
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
                        'id' => '123abc',
                        'name' => "Test User",
                        'type' => 'expert',
                    ],
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
                        'type' => 'expert',
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => 123321,
                        'name' => 'Test Label',
                    ],
                    [
                        'id' => $al->label_id,
                        'name' => $al->label->name,
                    ],
                ],
            ],
            'image-set-items' => [
                $al->annotation->image->filename => [
                    'image-area-square-meter' => 5.5,
                    'image-annotations' => [
                        [
                            'coordinates' => [10, 20],
                            'labels' => [
                                [
                                    'label' => 123321,
                                    'annotator' => '123abc',
                                    'confidence' => 1.0,
                                    'created-at' => '2022-02-10 09:47:00',
                                ],
                            ],
                        ],
                        [
                            'coordinates' => $al->annotation->points,
                            'labels' => [
                                [
                                    'label' => $al->label_id,
                                    'annotator' => $user->uuid,
                                    'confidence' => $al->confidence,
                                    'created-at' => (string) $al->created_at,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->yaml);
    }

    public function testGenerateReportRestrictToExportArea()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $volume = Volume::convert($volume);
        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $label = LabelTest::create();
        $user = UserTest::create();

        $image = ImageTest::create(['volume_id' => $volume->id]);
        $a1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'points' => [150, 150],
        ]);
        $al1 = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a1->id,
        ]);

        $a2 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'points' => [50, 50],
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a2->id,
        ]);

        $generator = new ImageIfdoReportGeneratorStub([
            'exportArea' => true,
        ]);
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
                        'id' => $al1->label_id,
                        'name' => $al1->label->name,
                    ],
                ],
            ],
            'image-set-items' => [
                $image->filename => [
                    'image-annotations' => [
                        [
                            'coordinates' => $a1->points,
                            'labels' => [
                                [
                                    'label' => $al1->label_id,
                                    'annotator' => $user->uuid,
                                    'confidence' => $al1->confidence,
                                    'created-at' => (string) $al1->created_at,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->yaml);
    }

    public function testGenerateReportRestrictNewestLabel()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $label2 = LabelTest::create();
        $user = UserTest::create();

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
        ]);

        $al2 = ImageAnnotationLabelTest::create([
            'label_id' => $label2->id,
            'user_id' => $user->id,
            'annotation_id' => $al->annotation_id,
        ]);

        $al->annotation->image->volume_id = $volume->id;
        $al->annotation->image->save();

        $generator = new ImageIfdoReportGeneratorStub([
            'newestLabel' => true,
        ]);
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
                        'id' => $al2->label_id,
                        'name' => $al2->label->name,
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
                                    'label' => $al2->label_id,
                                    'annotator' => $user->uuid,
                                    'confidence' => $al2->confidence,
                                    'created-at' => (string) $al->created_at,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->yaml);
    }

    public function testGenerateReportRestrictToLabels()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $label2 = LabelTest::create();
        $user = UserTest::create();

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
        ]);

        $al2 = ImageAnnotationLabelTest::create([
            'label_id' => $label2->id,
            'user_id' => $user->id,
            'annotation_id' => $al->annotation_id,
        ]);

        $al->annotation->image->volume_id = $volume->id;
        $al->annotation->image->save();

        $generator = new ImageIfdoReportGeneratorStub([
            'onlyLabels' => [$label->id],
        ]);
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
                        'id' => $al->label_id,
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
                                    'label' => $al->label_id,
                                    'annotator' => $user->uuid,
                                    'confidence' => $al->confidence,
                                    'created-at' => (string) $al->created_at,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->yaml);
    }

    public function testGenerateReportNoIfdo()
    {
        $volume = VolumeTest::create();
        $generator = new ImageIfdoReportGeneratorStub();
        $generator->setSource($volume);
        $this->expectException(Exception::class);
        $generator->generateReport('my/path');
    }

    public function testGenerateReportLabelAphiaIdInfo()
    {
        $worms = LabelSource::where('name', 'worms')->first();

        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create([
            'label_source_id' => $worms->id,
            'source_id' => 123999,
        ]);
        $user = UserTest::create();

        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
        ]);

        $al->annotation->image->volume_id = $volume->id;
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
                        'id' => 'urn:lsid:marinespecies.org:taxname:123999',
                        'name' => $al->label->name,
                        'description' => 'Imported from WoRMS',
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
                                    'label' => 'urn:lsid:marinespecies.org:taxname:123999',
                                    'annotator' => $user->uuid,
                                    'confidence' => $al->confidence,
                                    'created-at' => (string) $al->created_at,
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->yaml);
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
