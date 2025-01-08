<?php

namespace Biigle\Tests\Services\Reports\Volumes;

use Biigle\LabelSource;
use Biigle\MediaType;
use Biigle\Modules\MetadataIfdo\IfdoParser;
use Biigle\Services\Reports\Volumes\VideoIfdoReportGenerator;
use Biigle\Shape;
use Biigle\Tests\LabelTest;
use Biigle\Tests\UserTest;
use Biigle\Tests\VideoAnnotationLabelTest;
use Biigle\Tests\VideoAnnotationTest;
use Biigle\Tests\VideoLabelTest;
use Biigle\Tests\VideoTest;
use Biigle\Volume;
use Exception;
use Storage;
use TestCase;

class VideoIfdoReportGeneratorTest extends TestCase
{
    public function testProperties()
    {
        $generator = new VideoIfdoReportGenerator;
        $this->assertSame('video iFDO report', $generator->getName());
        $this->assertSame('video_ifdo_report', $generator->getFilename());
        $this->assertStringEndsWith('.json', $generator->getFullFilename());
    }

    protected function setUpIfdo($merge = [])
    {
        $ifdo = array_merge_recursive([
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'video',
            ],
        ], $merge);

        $volume = Volume::factory()->create([
            'media_type_id' => MediaType::videoId(),
            'name' => 'My Cool Volume',
            'metadata_file_path' => 'mymeta.json',
            'metadata_parser' => IfdoParser::class,
        ]);

        $disk = Storage::fake($volume->getMetadataFileDisk());
        $disk->put('mymeta.json', json_encode($ifdo));

        return [$volume, $ifdo];
    }

    public function testGenerateReport()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $user = UserTest::create();

        $video = VideoTest::create(['volume_id' => $volume->id]);
        $a = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'points' => [[150, 150], [200, 200]],
            'frames' => [100.0, 200.0],
            'shape_id' => Shape::pointId(),
        ]);
        $al = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $generator = new VideoIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'video',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
                        'uuid' => $user->uuid,
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => "$al->label_id",
                        'name' => $al->label->name,
                        'uuid' => $al->label->uuid,
                        'color' => $al->label->color,
                    ],
                ],
            ],
            'image-set-items' => [
                $al->annotation->video->filename => [[
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [[150, 150], [200, 200]],
                            'frames' => [100, 200],
                            'labels' => [
                                [
                                    'label' => "$al->label_id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ]],
            ],
        ];

        $this->assertSame($expect, $generator->ifdo);
    }

    public function testGenerateReportMultiLabel()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $label2 = LabelTest::create();
        $user = UserTest::create();

        $video = VideoTest::create(['volume_id' => $volume->id]);
        $a = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'points' => [[150, 150]],
            'frames' => [100],
            'shape_id' => Shape::pointId(),
        ]);
        $al = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $al2 = VideoAnnotationLabelTest::create([
            'label_id' => $label2->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $generator = new VideoIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'video',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
                        'uuid' => $user->uuid,
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => "$al->label_id",
                        'name' => $al->label->name,
                        'uuid' => $al->label->uuid,
                        'color' => $al->label->color,
                    ],
                    [
                        'id' => "$al2->label_id",
                        'name' => $al2->label->name,
                        'uuid' => $al2->label->uuid,
                        'color' => $al2->label->color,
                    ],
                ],
            ],
            'image-set-items' => [
                $al->annotation->video->filename => [[
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [[150, 150]],
                            'frames' => [100],
                            'labels' => [
                                [
                                    'label' => "$al->label_id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                                [
                                    'label' => "$al2->label_id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ]],
            ],
        ];

        $this->assertSame($expect, $generator->ifdo);
    }

    public function testGenerateReportEmpty()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $video = VideoTest::create(['volume_id' => $volume->id]);

        $generator = new VideoIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'video',
            ],
            'image-set-items' => [
                $video->filename => [],
            ],
        ];

        $this->assertSame($expect, $generator->ifdo);
    }

    public function testGenerateReportVideoLabels()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $user = UserTest::create();

        $vl = VideoLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
        ]);

        $vl->video->volume_id = $volume->id;
        $vl->video->save();

        $generator = new VideoIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'video',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
                        'uuid' => $user->uuid,
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => "$vl->label_id",
                        'name' => $vl->label->name,
                        'uuid' => $vl->label->uuid,
                        'color' => $vl->label->color,
                    ],
                ],
            ],
            'image-set-items' => [
                $vl->video->filename => [[
                    'image-annotations' => [
                        [
                            'shape' => 'whole-image',
                            'coordinates' => [[]],
                            'frames' => [],
                            'labels' => [
                                [
                                    'label' => "$vl->label_id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $vl->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ]],
            ],
        ];

        $this->assertSame($expect, $generator->ifdo);
    }

    public function testGenerateReportMergeImageSetItems()
    {
        $label = LabelTest::create();
        $user = UserTest::create();

        $video = VideoTest::create();

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
                        'id' => "123321",
                        'name' => 'Test Label',
                    ],
                ],
            ],
            'image-set-items' => [
                $video->filename => [[
                    'image-area-square-meter' => 5.5,
                    'image-annotations' => [
                        [
                            'shape' => 'rectangle',
                            'coordinates' => [10, 20, 20, 30, 30, 20, 20, 10],
                            'labels' => [
                                [
                                    'label' => "123321",
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

        $a = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'points' => [[150, 150]],
            'frames' => [100],
            'shape_id' => Shape::pointId(),
        ]);
        $al = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $video->volume_id = $volume->id;
        $video->save();

        $generator = new VideoIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'video',
                'image-annotation-creators' => [
                    [
                        'id' => '123abc',
                        'name' => "Test User",
                    ],
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
                        'uuid' => $user->uuid,
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => "123321",
                        'name' => 'Test Label',
                    ],
                    [
                        'id' => "$al->label_id",
                        'name' => $al->label->name,
                        'uuid' => $al->label->uuid,
                        'color' => $al->label->color,
                    ],
                ],
            ],
            'image-set-items' => [
                $al->annotation->video->filename => [[
                    'image-area-square-meter' => 5.5,
                    'image-annotations' => [
                        [
                            'shape' => 'rectangle',
                            'coordinates' => [10, 20, 20, 30, 30, 20, 20, 10],
                            'labels' => [
                                [
                                    'label' => "123321",
                                    'annotator' => '123abc',
                                    'created-at' => '2022-02-10 09:47:00',
                                ],
                            ],
                        ],
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [[150, 150]],
                            'frames' => [100],
                            'labels' => [
                                [
                                    'label' => "$al->label_id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ]],
            ],
        ];

        $this->assertSame($expect, $generator->ifdo);
    }

    public function testGenerateReportMergeImageSetItemsMultiple()
    {
        $label = LabelTest::create();
        $user = UserTest::create();

        $video = VideoTest::create();

        $merge = [
            'image-set-items' => [
                $video->filename => [
                    [
                        'image-area-square-meter' => 5.5,
                    ],
                    [
                        'image-area-square-meter' => 6.0,
                    ],
                ],
            ],
        ];

        [$volume, $ifdo] = $this->setUpIfdo($merge);

        $a = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'points' => [[150, 150]],
            'frames' => [100],
            'shape_id' => Shape::pointId(),
        ]);
        $al = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $video->volume_id = $volume->id;
        $video->save();

        $generator = new VideoIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'video',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
                        'uuid' => $user->uuid,
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => "$al->label_id",
                        'name' => $al->label->name,
                        'uuid' => $al->label->uuid,
                        'color' => $al->label->color,
                    ],
                ],
            ],
            'image-set-items' => [
                $al->annotation->video->filename => [
                    [
                        'image-area-square-meter' => 5.5,
                        'image-annotations' => [
                            [
                                'shape' => 'single-pixel',
                                'coordinates' => [[150, 150]],
                                'frames' => [100],
                                'labels' => [
                                    [
                                        'label' => "$al->label_id",
                                        'annotator' => $user->uuid,
                                        'created-at' => $al->created_at->toJson(),
                                    ],
                                ],
                            ],
                        ],
                    ],
                    [
                        'image-area-square-meter' => 6,
                    ],
                ],
            ],
        ];

        $this->assertSame($expect, $generator->ifdo);
    }

    public function testGenerateReportRestrictNewestLabel()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $label2 = LabelTest::create();
        $user = UserTest::create();

        $video = VideoTest::create(['volume_id' => $volume->id]);
        $a = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'points' => [[150, 150]],
            'frames' => [100],
            'shape_id' => Shape::pointId(),
        ]);
        $al = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $al2 = VideoAnnotationLabelTest::create([
            'label_id' => $label2->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $generator = new VideoIfdoReportGeneratorStub([
            'newestLabel' => true,
        ]);
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'video',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
                        'uuid' => $user->uuid,
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => "$al2->label_id",
                        'name' => $al2->label->name,
                        'uuid' => $al2->label->uuid,
                        'color' => $al2->label->color,
                    ],
                ],
            ],
            'image-set-items' => [
                $al->annotation->video->filename => [[
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [[150, 150]],
                            'frames' => [100],
                            'labels' => [
                                [
                                    'label' => "$al2->label_id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ]],
            ],
        ];

        $this->assertSame($expect, $generator->ifdo);
    }

    public function testGenerateReportRestrictToLabels()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $label2 = LabelTest::create();
        $user = UserTest::create();

        $video1 = VideoTest::create([
            'volume_id' => $volume->id,
            'filename' => 'img1.jpg',
        ]);
        $a1 = VideoAnnotationTest::create([
            'video_id' => $video1->id,
            'shape_id' => Shape::pointId(),
        ]);
        $al = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a1->id,
        ]);

        $vl1 = VideoLabelTest::create([
            'video_id' => $video1->id,
            'label_id' => $label->id,
            'user_id' => $user->id,
        ]);

        $video2 = VideoTest::create([
            'volume_id' => $volume->id,
            'filename' => 'img2.jpg',
        ]);
        $a2 = VideoAnnotationTest::create([
            'video_id' => $video2->id,
            'shape_id' => Shape::pointId(),
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'label_id' => $label2->id,
            'user_id' => $user->id,
            'annotation_id' => $a2->id,
        ]);

        $vl2 = VideoLabelTest::create([
            'video_id' => $video2->id,
            'label_id' => $label2->id,
            'user_id' => $user->id,
        ]);

        $al2->annotation->video->volume_id = $volume->id;
        $al2->annotation->video->save();

        $generator = new VideoIfdoReportGeneratorStub([
            'onlyLabels' => [$label->id],
        ]);
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'video',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
                        'uuid' => $user->uuid,
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => "$al->label_id",
                        'name' => $al->label->name,
                        'uuid' => $al->label->uuid,
                        'color' => $al->label->color,
                    ],
                ],
            ],
            'image-set-items' => [
                $video1->filename => [[
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => $a1->points,
                            'frames' => $a1->frames,
                            'labels' => [
                                [
                                    'label' => "$label->id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                        [
                            'shape' => 'whole-image',
                            'coordinates' => [[]],
                            'frames' => [],
                            'labels' => [
                                [
                                    'label' => "$label->id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $vl1->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ]],
                $video2->filename => [],
            ],
        ];

        $this->assertSame($expect, $generator->ifdo);
    }

    public function testGenerateReportNoIfdo()
    {
        $volume = Volume::factory()->create();
        $generator = new VideoIfdoReportGeneratorStub();
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

        $video = VideoTest::create(['volume_id' => $volume->id]);
        $a = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'points' => [[150, 150]],
            'frames' => [100],
            'shape_id' => Shape::pointId(),
        ]);
        $al = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $generator = new VideoIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'video',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
                        'uuid' => $user->uuid,
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => 'urn:lsid:marinespecies.org:taxname:123999',
                        'name' => $al->label->name,
                        'uuid' => $al->label->uuid,
                        'color' => $al->label->color,
                    ],
                ],
            ],
            'image-set-items' => [
                $al->annotation->video->filename => [[
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [[150, 150]],
                            'frames' => [100],
                            'labels' => [
                                [
                                    'label' => 'urn:lsid:marinespecies.org:taxname:123999',
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ]],
            ],
        ];

        $this->assertSame($expect, $generator->ifdo);
    }

    public function testStripIfdo()
    {
        $label = LabelTest::create();
        $user = UserTest::create();

        $video = VideoTest::create();

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
                        'id' => "123321",
                        'name' => 'Test Label',
                    ],
                ],
            ],
            'image-set-items' => [
                $video->filename => [[
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [10, 20],
                            'labels' => [
                                [
                                    'label' => "123321",
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

        $a = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'points' => [[150, 150]],
            'frames' => [100],
            'shape_id' => Shape::pointId(),
        ]);
        $al = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a->id,
        ]);

        $video->volume_id = $volume->id;
        $video->save();

        $generator = new VideoIfdoReportGeneratorStub([
            'stripIfdo' => true,
        ]);
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'video',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
                        'uuid' => $user->uuid,
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => "$al->label_id",
                        'name' => $al->label->name,
                        'uuid' => $al->label->uuid,
                        'color' => $al->label->color,
                    ],
                ],
            ],
            'image-set-items' => [
                $al->annotation->video->filename => [[
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => [[150, 150]],
                            'frames' => [100],
                            'labels' => [
                                [
                                    'label' => "$al->label_id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $al->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ]],
            ],
        ];

        $this->assertSame($expect, $generator->ifdo);
    }

    public function testGeometryTypes()
    {
        [$volume, $ifdo] = $this->setUpIfdo();

        $label = LabelTest::create();
        $user = UserTest::create();
        $video = VideoTest::create([
            'volume_id' => $volume->id,
        ]);

        $a1 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'shape_id' => Shape::pointId(),
        ]);
        $al1 = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a1->id,
        ]);

        $a2 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'shape_id' => Shape::rectangleId(),
        ]);
        $al2 = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a2->id,
        ]);

        $a3 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'shape_id' => Shape::circleId(),
        ]);
        $al3 = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a3->id,
        ]);

        $a4 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'shape_id' => Shape::ellipseId(),
        ]);
        $al4 = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a4->id,
        ]);

        $a5 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'shape_id' => Shape::polygonId(),
        ]);
        $al5 = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a5->id,
        ]);

        $a6 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'shape_id' => Shape::wholeFrameId(),
        ]);
        $al6 = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a6->id,
        ]);

        $a7 = VideoAnnotationTest::create([
            'video_id' => $video->id,
            'shape_id' => Shape::lineId(),
        ]);
        $al7 = VideoAnnotationLabelTest::create([
            'label_id' => $label->id,
            'user_id' => $user->id,
            'annotation_id' => $a7->id,
        ]);

        $generator = new VideoIfdoReportGeneratorStub;
        $generator->setSource($volume);
        $generator->generateReport('my/path');

        $expect = [
            'image-set-header' => [
                'image-set-handle' => '20.500.12085/test-example',
                'image-set-name' => 'My Cool Volume',
                'image-set-uuid' => 'd7546c4b-307f-4d42-8554-33236c577450',
                'image-acquisition' => 'video',
                'image-annotation-creators' => [
                    [
                        'id' => $user->uuid,
                        'name' => "{$user->firstname} {$user->lastname}",
                        'uuid' => $user->uuid,
                    ],
                ],
                'image-annotation-labels' => [
                    [
                        'id' => "$label->id",
                        'name' => $label->name,
                        'uuid' => $label->uuid,
                        'color' => $label->color,
                    ],
                ],
            ],
            'image-set-items' => [
                $video->filename => [[
                    'image-annotations' => [
                        [
                            'shape' => 'single-pixel',
                            'coordinates' => $a1->points,
                            'frames' => $a1->frames,
                            'labels' => [
                                [
                                    'label' => "$label->id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $al1->created_at->toJson(),
                                ],
                            ],
                        ],
                        [
                            'shape' => 'rectangle',
                            'coordinates' => $a2->points,
                            'frames' => $a2->frames,
                            'labels' => [
                                [
                                    'label' => "$label->id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $al2->created_at->toJson(),
                                ],
                            ],
                        ],
                        [
                            'shape' => 'circle',
                            'coordinates' => $a3->points,
                            'frames' => $a3->frames,
                            'labels' => [
                                [
                                    'label' => "$label->id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $al3->created_at->toJson(),
                                ],
                            ],
                        ],
                        [
                            'shape' => 'ellipse',
                            'coordinates' => $a4->points,
                            'frames' => $a4->frames,
                            'labels' => [
                                [
                                    'label' => "$label->id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $al4->created_at->toJson(),
                                ],
                            ],
                        ],
                        [
                            'shape' => 'polygon',
                            'coordinates' => $a5->points,
                            'frames' => $a5->frames,
                            'labels' => [
                                [
                                    'label' => "$label->id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $al5->created_at->toJson(),
                                ],
                            ],
                        ],
                        [
                            'shape' => 'whole-image',
                            'coordinates' => $a6->points,
                            'frames' => $a6->frames,
                            'labels' => [
                                [
                                    'label' => "$label->id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $al6->created_at->toJson(),
                                ],
                            ],
                        ],
                        [
                            'shape' => 'polyline',
                            'coordinates' => $a7->points,
                            'frames' => $a7->frames,
                            'labels' => [
                                [
                                    'label' => "$label->id",
                                    'annotator' => $user->uuid,
                                    'created-at' => $al7->created_at->toJson(),
                                ],
                            ],
                        ],
                    ],
                ]],
            ],
        ];

        $this->assertSame($expect, $generator->ifdo);
    }
}

class VideoIfdoReportGeneratorStub extends VideoIfdoReportGenerator
{
    public $ifdo;

    protected function writeIfdo(array $content, string $path)
    {
        $this->ifdo = $content;
    }
}
