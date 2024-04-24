<?php

namespace Biigle\Tests\Modules\Reports\Support\Reports\Volumes;

use Biigle\LabelSource;
use Biigle\Modules\MetadataIfdo\ImageIfdoParser;
use Biigle\Modules\Reports\Support\Reports\Volumes\ImageIfdoReportGenerator;
use Biigle\Modules\Reports\Volume as ReportVolume;
use Biigle\Shape;
use Biigle\Tests\ImageAnnotationLabelTest;
use Biigle\Tests\ImageAnnotationTest;
use Biigle\Tests\ImageLabelTest;
use Biigle\Tests\ImageTest;
use Biigle\Tests\LabelTest;
use Biigle\Tests\UserTest;
use Biigle\Volume;
use Exception;
use Storage;
use TestCase;

class ImageIfdoReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new ImageIfdoReportGenerator;
        $this->assertEquals('image iFDO report', $generator->getName());
        $this->assertEquals('image_ifdo_report', $generator->getFilename());
        $this->assertStringEndsWith('.json', $generator->getFullFilename());
    }

    protected function setUpIfdo($merge = [])
    {
        $ifdo = array_merge_recursive([
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'photo',
            ],
        ], $merge);

        $volume = Volume::factory()->create([
            'name' => 'My Cool Volume',
            'metadata_file_path' => 'mymeta.json',
            'metadata_parser' => ImageIfdoParser::class,
        ]);

        $disk = Storage::fake(Volume::$metadataFileDisk);
        $disk->put('mymeta.json', json_encode($ifdo));

        return [$volume, $ifdo];
    }

    public function testGenerateReport()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $user = UserTest::create();

        $image = ImageTest::create(['volume_id' => $volume->id]);
        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'points' => [150, 150],
            'shape_id' => Shape::pointId(),
        ]);
        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $generator = new ImageIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'photo',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
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
                            'shape' => 'single-pixel',
                            'coordinates' => [$al->annotation->points],
                            'labels' => [
                                [
                                    'label' => $al->label_id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->ifdo);
    }

    public function testGenerateReportMultiLabel()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $label2 = LabelTest::create();
        $user = UserTest::create();

        $image = ImageTest::create(['volume_id' => $volume->id]);
        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'points' => [150, 150],
            'shape_id' => Shape::pointId(),
        ]);
        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $al2 = ImageAnnotationLabelTest::create([
            'label_id' => $label2->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $generator = new ImageIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'photo',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
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
                            'shape' => 'single-pixel',
                            'coordinates' => [$al->annotation->points],
                            'labels' => [
                                [
                                    'label' => $al->label_id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                                [
                                    'label' => $al2->label_id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al2->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->ifdo);
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
                'image-acquisition' => 'photo',
            ],
            'image-set-items' => [
                $image->filename => [],
            ],
        ];

        $this->assertEquals($expect, $generator->ifdo);
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
                'image-acquisition' => 'photo',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
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
                            'shape' => 'whole-image',
                            'coordinates' => [],
                            'labels' => [
                                [
                                    'label' => $il->label_id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $il->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->ifdo);
    }

    public function testGenerateReportMergeImageSetItems()
    {
        $label = LabelTest::create();
        $user = UserTest::create();

        $image = ImageTest::create();

        $merge = [
            'image-set-header' => [
                'image-annotation-creators' => [
                    [
                        'id' => '123abc',
                        'name' => "Test User",
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
                $image->filename => [
                    'image-area-square-meter' => 5.5,
                    'image-annotations' => [
                        [
                            'shape' => 'rectangle',
                            'coordinates' => [[10, 20, 20, 30, 30, 20, 20, 10]],
                            'labels' => [
                                [
                                    'label' => 123321,
                                    'annotator' => '123abc',
                                    'created-at' => '2022-02-10 09:47:00',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        [$volume, $ifdo] = $this->setUpIfdo($merge);

        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'points' => [150, 150],
            'shape_id' => Shape::pointId(),
        ]);
        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $image->volume_id = $volume->id;
        $image->save();

        $generator = new ImageIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'photo',
                'image-annotation-creators' => [
                    [
                        'id' => '123abc',
                        'name' => "Test User",
                    ],
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
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
                            'shape' => 'rectangle',
                            'coordinates' => [[10, 20, 20, 30, 30, 20, 20, 10]],
                            'labels' => [
                                [
                                    'label' => 123321,
                                    'annotator' => '123abc',
                                    'created-at' => '2022-02-10 09:47:00',
                                ],
                            ],
                        ],
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [$al->annotation->points],
                            'labels' => [
                                [
                                    'label' => $al->label_id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->ifdo);
    }

    public function testGenerateReportMergeImageSetItemsArray()
    {
        $label = LabelTest::create();
        $user = UserTest::create();

        $image = ImageTest::create();

        $merge = [
            'image-set-items' => [
                // The double array here is the difference to testGenerateReportMergeImageSetItems!
                $image->filename => [[
                    'image-area-square-meter' => 5.5,
                ]],
            ],
        ];

        [$volume, $ifdo] = $this->setUpIfdo($merge);

        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'points' => [150, 150],
            'shape_id' => Shape::pointId(),
        ]);
        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $image->volume_id = $volume->id;
        $image->save();

        $generator = new ImageIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'photo',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
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
                $al->annotation->image->filename => [[
                    'image-area-square-meter' => 5.5,
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [$al->annotation->points],
                            'labels' => [
                                [
                                    'label' => $al->label_id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ]],
            ],
        ];

        $this->assertEquals($expect, $generator->ifdo);
    }

    public function testGenerateReportRestrictToExportArea()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $volume = ReportVolume::convert($volume);
        $volume->exportArea = [100, 100, 200, 200];
        $volume->save();

        $label = LabelTest::create();
        $user = UserTest::create();

        $image = ImageTest::create(['volume_id' => $volume->id]);
        $a1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => Shape::pointId(),
            'points' => [150, 150],
        ]);
        $al1 = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a1->id,
        ]);

        $a2 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => Shape::pointId(),
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
                'image-acquisition' => 'photo',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
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
                            'shape' => 'single-pixel',
                            'coordinates' => [$a1->points],
                            'labels' => [
                                [
                                    'label' => $al1->label_id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al1->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->ifdo);
    }

    public function testGenerateReportRestrictNewestLabel()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $label2 = LabelTest::create();
        $user = UserTest::create();

        $image = ImageTest::create(['volume_id' => $volume->id]);
        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'points' => [150, 150],
            'shape_id' => Shape::pointId(),
        ]);
        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $al2 = ImageAnnotationLabelTest::create([
            'label_id' => $label2->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

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
                'image-acquisition' => 'photo',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
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
                            'shape' => 'single-pixel',
                            'coordinates' => [$al->annotation->points],
                            'labels' => [
                                [
                                    'label' => $al2->label_id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->ifdo);
    }

    public function testGenerateReportRestrictToLabels()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $label2 = LabelTest::create();
        $user = UserTest::create();

        $image1 = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => 'img1.jpg',
        ]);
        $a1 = ImageAnnotationTest::create([
            'image_id' => $image1->id,
            'shape_id' => Shape::pointId(),
        ]);
        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a1->id,
        ]);

        $il1 = ImageLabelTest::create([
            'image_id' => $image1->id,
            'label_id' => $label->id,
            'user_id' => $user->id,
        ]);

        $image2 = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => 'img2.jpg',
        ]);
        $a2 = ImageAnnotationTest::create([
            'image_id' => $image2->id,
            'shape_id' => Shape::pointId(),
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'label_id' => $label2->id,
            'user_id' => $user->id,
            'annotation_id' => $a2->id,
        ]);

        $il2 = ImageLabelTest::create([
            'image_id' => $image2->id,
            'label_id' => $label2->id,
            'user_id' => $user->id,
        ]);

        $al2->annotation->image->volume_id = $volume->id;
        $al2->annotation->image->save();

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
                'image-acquisition' => 'photo',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
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
                $image1->filename => [
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [$a1->points],
                            'labels' => [
                                [
                                    'label' => $label->id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                        [
                            'shape' => 'whole-image',
                            'coordinates' => [],
                            'labels' => [
                                [
                                    'label' => $label->id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $il1->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ],
                $image2->filename => [],
            ],
        ];

        $this->assertEquals($expect, $generator->ifdo);
    }

    public function testGenerateReportNoIfdo()
    {
        $volume = Volume::factory()->create();
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

        $image = ImageTest::create(['volume_id' => $volume->id]);
        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'points' => [150, 150],
            'shape_id' => Shape::pointId(),
        ]);
        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $generator = new ImageIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'photo',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => 'urn:lsid:marinespecies.org:taxname:123999',
                        'name' => $al->label->name,
                    ],
                ],
            ],
            'image-set-items' => [
                $al->annotation->image->filename => [
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [$al->annotation->points],
                            'labels' => [
                                [
                                    'label' => 'urn:lsid:marinespecies.org:taxname:123999',
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->ifdo);
    }

    public function testStripIfdo()
    {
        $label = LabelTest::create();
        $user = UserTest::create();

        $image = ImageTest::create();

        $merge = [
            'image-set-header' => [
                'image-annotation-creators' => [
                    [
                        'id' => '123abc',
                        'name' => "Test User",
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
                $image->filename => [
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [[10, 20]],
                            'labels' => [
                                [
                                    'label' => 123321,
                                    'annotator' => '123abc',
                                    'created-at' => '2022-02-10 09:47:00',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        [$volume, $ifdo] = $this->setUpIfdo($merge);

        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'points' => [150, 150],
            'shape_id' => Shape::pointId(),
        ]);
        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $image->volume_id = $volume->id;
        $image->save();

        $generator = new ImageIfdoReportGeneratorStub([
            'stripIfdo' => true,
        ]);
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'photo',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
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
                            'shape' => 'single-pixel',
                            'coordinates' => [$al->annotation->points],
                            'labels' => [
                                [
                                    'label' => $al->label_id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->ifdo);
    }

    public function testStripIfdoArray()
    {
        $label = LabelTest::create();
        $user = UserTest::create();

        $image = ImageTest::create();

        $merge = [
            'image-set-header' => [
                'image-annotation-creators' => [
                    [
                        'id' => '123abc',
                        'name' => "Test User",
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
                $image->filename => [[
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [[10, 20]],
                            'labels' => [
                                [
                                    'label' => 123321,
                                    'annotator' => '123abc',
                                    'created-at' => '2022-02-10 09:47:00',
                                ],
                            ],
                        ],
                    ],
                ]],
            ],
        ];

        [$volume, $ifdo] = $this->setUpIfdo($merge);

        $a = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'points' => [150, 150],
            'shape_id' => Shape::pointId(),
        ]);
        $al = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $image->volume_id = $volume->id;
        $image->save();

        $generator = new ImageIfdoReportGeneratorStub([
            'stripIfdo' => true,
        ]);
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'photo',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
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
                $al->annotation->image->filename => [[
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [$al->annotation->points],
                            'labels' => [
                                [
                                    'label' => $al->label_id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ]],
            ],
        ];

        $this->assertEquals($expect, $generator->ifdo);
    }

    public function testGeometryTypes()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $user = UserTest::create();
        $image = ImageTest::create([
            'volume_id' => $volume->id,
        ]);

        $a1 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => Shape::pointId(),
        ]);
        $al1 = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a1->id,
        ]);

        $a2 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => Shape::rectangleId(),
        ]);
        $al2 = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a2->id,
        ]);

        $a3 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => Shape::circleId(),
        ]);
        $al3 = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a3->id,
        ]);

        $a4 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => Shape::ellipseId(),
        ]);
        $al4 = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a4->id,
        ]);

        $a5 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => Shape::polygonId(),
        ]);
        $al5 = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a5->id,
        ]);

        $a6 = ImageAnnotationTest::create([
            'image_id' => $image->id,
            'shape_id' => Shape::lineId(),
        ]);
        $al6 = ImageAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a6->id,
        ]);

        $generator = new ImageIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'photo',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => $label->id,
                        'name' => $label->name,
                    ],
                ],
            ],
            'image-set-items' => [
                $image->filename => [
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [$a1->points],
                            'labels' => [
                                [
                                    'label' => $label->id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al1->created_at->toJson(),
                                ],
                            ],
                        ],
                        [
                            'shape' => 'rectangle',
                            'coordinates' => [$a2->points],
                            'labels' => [
                                [
                                    'label' => $label->id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al2->created_at->toJson(),
                                ],
                            ],
                        ],
                        [
                            'shape' => 'circle',
                            'coordinates' => [$a3->points],
                            'labels' => [
                                [
                                    'label' => $label->id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al3->created_at->toJson(),
                                ],
                            ],
                        ],
                        [
                            'shape' => 'ellipse',
                            'coordinates' => [$a4->points],
                            'labels' => [
                                [
                                    'label' => $label->id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al4->created_at->toJson(),
                                ],
                            ],
                        ],
                        [
                            'shape' => 'polygon',
                            'coordinates' => [$a5->points],
                            'labels' => [
                                [
                                    'label' => $label->id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al5->created_at->toJson(),
                                ],
                            ],
                        ],
                        [
                            'shape' => 'polyline',
                            'coordinates' => [$a6->points],
                            'labels' => [
                                [
                                    'label' => $label->id,
                                    'annotator' => $user->uuid,
                                    'created-at' => $al6->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $this->assertEquals($expect, $generator->ifdo);
    }
}

class ImageIfdoReportGeneratorStub extends ImageIfdoReportGenerator
{
    public $ifdo;

    protected function writeIfdo(array $content, string $path)
    {
        $this->ifdo = $content;
    }
}
