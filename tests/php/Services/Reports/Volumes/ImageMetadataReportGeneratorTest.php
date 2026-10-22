<?php

namespace Biigle\Tests\Services\Reports\Volumes;

use Biigle\Services\Reports\Volumes\ImageMetadataReportGenerator;
use Biigle\Tests\ImageTest;
use Biigle\Tests\VolumeTest;
use TestCase;

class ImageMetadataReportGeneratorTest extends TestCase
{
    private $columns = [
        'image_id',
        'uuid',
        'volume_id',
        'filename',
        'taken_at',
        'longitude',
        'latitude',
        'width',
        'height',
        'file_size',
        'mime_type',
        'tiled',
        'tiling_in_progress',
        'gps_altitude',
        'distance_to_ground',
        'area',
        'yaw',
    ];

    public function testGenerateReportIncludesImageWithoutMetadata()
    {
        $volume = VolumeTest::create();
        $image = ImageTest::create([
            'volume_id' => $volume->id,
            'filename' => 'image.jpg',
        ]);

        $path = (new ImageMetadataReportGenerator)->generate($volume);
        $handle = fopen($path, 'r');

        $this->assertSame($this->columns, fgetcsv($handle));
        $this->assertSame([
            (string) $image->id,
            $image->uuid,
            (string) $volume->id,
            'image.jpg',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '0',
            '0',
            '',
            '',
            '',
            '',
        ], fgetcsv($handle));
        $this->assertFalse(fgetcsv($handle));

        fclose($handle);
        unlink($path);
    }

    public function testGenerateReportExportsPopulatedImagesInOrder()
    {
        $volume = VolumeTest::create();
        $second = ImageTest::create([
            'id' => 20,
            'volume_id' => $volume->id,
            'filename' => 'second.jpg',
            'taken_at' => '2024-01-01 12:00:00',
            'lng' => 10.1,
            'lat' => 20.1,
            'tiled' => true,
            'attrs' => [
                'width' => 1920,
                'height' => 1080,
                'size' => 123456,
                'mimetype' => 'image/jpeg',
                'tilingInProgress' => true,
                'metadata' => [
                    'gps_altitude' => 30.1,
                    'distance_to_ground' => 40.1,
                    'area' => 50.1,
                    'yaw' => 60.1,
                ],
            ],
        ]);
        $first = ImageTest::create([
            'id' => 10,
            'volume_id' => $volume->id,
            'filename' => 'first.jpg',
        ]);

        $path = (new ImageMetadataReportGenerator)->generate($volume);
        $handle = fopen($path, 'r');
        fgetcsv($handle);

        $this->assertSame((string) $first->id, fgetcsv($handle)[0]);
        $this->assertSame([
            (string) $second->id,
            $second->uuid,
            (string) $volume->id,
            'second.jpg',
            '2024-01-01 12:00:00',
            '10.1',
            '20.1',
            '1920',
            '1080',
            '123456',
            'image/jpeg',
            '1',
            '1',
            '30.1',
            '40.1',
            '50.1',
            '60.1',
        ], fgetcsv($handle));
        $this->assertFalse(fgetcsv($handle));

        fclose($handle);
        unlink($path);
    }

    public function testGenerateReportUsesEffectiveAreaPrecedence()
    {
        $volume = VolumeTest::create();
        ImageTest::create([
            'id' => 10,
            'volume_id' => $volume->id,
            'filename' => 'metadata-area.jpg',
            'attrs' => [
                'metadata' => ['area' => 5.1],
                'laserpoints' => ['area' => 6.1],
            ],
        ]);
        ImageTest::create([
            'id' => 20,
            'volume_id' => $volume->id,
            'filename' => 'laser-area.jpg',
            'attrs' => ['laserpoints' => ['area' => 6.2]],
        ]);
        ImageTest::create([
            'id' => 30,
            'volume_id' => $volume->id,
            'filename' => 'no-area.jpg',
        ]);

        $path = (new ImageMetadataReportGenerator)->generate($volume);
        $handle = fopen($path, 'r');
        fgetcsv($handle);
        $areas = [
            fgetcsv($handle)[15],
            fgetcsv($handle)[15],
            fgetcsv($handle)[15],
        ];

        $this->assertSame(['5.1', '6.2', ''], $areas);

        fclose($handle);
        unlink($path);
    }
}
