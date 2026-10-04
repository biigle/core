<?php

namespace Biigle\Tests\Services\Reports\Volumes;

use Biigle\MediaType;
use Biigle\Services\Reports\Volumes\VideoMetadataReportGenerator;
use Biigle\Tests\VideoTest;
use Biigle\Tests\VolumeTest;
use TestCase;

class VideoMetadataReportGeneratorTest extends TestCase
{
    private $columns = [
        'video_id',
        'uuid',
        'volume_id',
        'filename',
        'duration',
        'width',
        'height',
        'file_size',
        'mime_type',
        'error',
        'sample_index',
        'taken_at',
        'longitude',
        'latitude',
        'gps_altitude',
        'distance_to_ground',
        'area',
        'yaw',
    ];

    public function testGenerateReportIncludesVideoWithoutSamples()
    {
        $volume = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $video = VideoTest::create([
            'volume_id' => $volume->id,
            'filename' => 'video.mp4',
            'duration' => 12.5,
            'attrs' => [
                'width' => 1920,
                'height' => 1080,
                'size' => 123456,
                'mimetype' => 'video/mp4',
                'error' => 'not-found',
            ],
        ]);

        $path = (new VideoMetadataReportGenerator)->generate($volume);
        $handle = fopen($path, 'r');

        $this->assertSame($this->columns, fgetcsv($handle));
        $this->assertSame([
            (string) $video->id,
            $video->uuid,
            (string) $volume->id,
            'video.mp4',
            '12.5',
            '1920',
            '1080',
            '123456',
            'video/mp4',
            'not-found',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
        ], fgetcsv($handle));
        $this->assertFalse(fgetcsv($handle));

        fclose($handle);
        unlink($path);
    }

    public function testGenerateReportExpandsAndOrdersUnequalSamples()
    {
        $volume = VolumeTest::create(['media_type_id' => MediaType::videoId()]);
        $second = VideoTest::create([
            'id' => 20,
            'volume_id' => $volume->id,
            'filename' => 'second.mp4',
            'duration' => 20,
            'lng' => [10.1],
            'lat' => [20.1, 20.2],
            'taken_at' => ['2024-01-01 12:00:00', '2024-01-01 12:00:01'],
            'attrs' => [
                'width' => 1280,
                'height' => 720,
                'size' => 200,
                'mimetype' => 'video/mp4',
                'metadata' => [
                    'gps_altitude' => [30.1, 30.2, 30.3],
                    'distance_to_ground' => [40.1],
                    'area' => [50.1, 50.2],
                    'yaw' => [60.1, null, 60.3],
                ],
            ],
        ]);
        $first = VideoTest::create([
            'id' => 10,
            'volume_id' => $volume->id,
            'filename' => 'first.mp4',
            'duration' => 10,
            'lng' => [1.1],
        ]);

        $path = (new VideoMetadataReportGenerator)->generate($volume);
        $handle = fopen($path, 'r');
        fgetcsv($handle);

        $this->assertSame([
            (string) $first->id,
            $first->uuid,
            (string) $volume->id,
            'first.mp4',
            '10',
            '',
            '',
            '',
            '',
            '',
            '0',
            '',
            '1.1',
            '',
            '',
            '',
            '',
            '',
        ], fgetcsv($handle));
        $this->assertSame([
            (string) $second->id,
            $second->uuid,
            (string) $volume->id,
            'second.mp4',
            '20',
            '1280',
            '720',
            '200',
            'video/mp4',
            '',
            '0',
            '2024-01-01 12:00:00',
            '10.1',
            '20.1',
            '30.1',
            '40.1',
            '50.1',
            '60.1',
        ], fgetcsv($handle));
        $this->assertSame([
            (string) $second->id,
            $second->uuid,
            (string) $volume->id,
            'second.mp4',
            '20',
            '1280',
            '720',
            '200',
            'video/mp4',
            '',
            '1',
            '2024-01-01 12:00:01',
            '',
            '20.2',
            '30.2',
            '',
            '50.2',
            '',
        ], fgetcsv($handle));
        $this->assertSame([
            (string) $second->id,
            $second->uuid,
            (string) $volume->id,
            'second.mp4',
            '20',
            '1280',
            '720',
            '200',
            'video/mp4',
            '',
            '2',
            '',
            '',
            '',
            '30.3',
            '',
            '',
            '60.3',
        ], fgetcsv($handle));
        $this->assertFalse(fgetcsv($handle));

        fclose($handle);
        unlink($path);
    }
}
