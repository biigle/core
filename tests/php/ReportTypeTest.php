<?php

namespace Biigle\Tests;

use Biigle\ReportType;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ReportTypeTest extends TestCase
{
    #[DataProvider('sortedTypesProvider')]
    public function testGetSortedTypes(
        bool $imageReports,
        bool $videoReports,
        array $expected
    ): void {
        $this->assertSame(
            $expected,
            ReportType::getSortedTypes($imageReports, $videoReports)->all()
        );
    }

    public static function sortedTypesProvider(): array
    {
        return [
            'all reports' => [
                true,
                true,
                [
                    ReportType::IMAGE_ANNOTATIONS_ABUNDANCE,
                    ReportType::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION,
                    ReportType::IMAGE_ANNOTATIONS_AREA,
                    ReportType::IMAGE_ANNOTATIONS_BASIC,
                    ReportType::IMAGE_ANNOTATIONS_COCO,
                    ReportType::IMAGE_ANNOTATIONS_CSV,
                    ReportType::IMAGE_ANNOTATIONS_EXTENDED,
                    ReportType::IMAGE_ANNOTATIONS_FULL,
                    ReportType::IMAGE_ANNOTATIONS_IMAGE_LOCATION,
                    ReportType::IMAGE_IFDO,
                    ReportType::IMAGE_LABELS_BASIC,
                    ReportType::IMAGE_LABELS_CSV,
                    ReportType::IMAGE_LABELS_IMAGE_LOCATION,
                    ReportType::VIDEO_ANNOTATIONS_CSV,
                    ReportType::VIDEO_IFDO,
                    ReportType::VIDEO_LABELS_CSV,
                ],
            ],

            'image reports only' => [
                true,
                false,
                [
                    ReportType::IMAGE_ANNOTATIONS_ABUNDANCE,
                    ReportType::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION,
                    ReportType::IMAGE_ANNOTATIONS_AREA,
                    ReportType::IMAGE_ANNOTATIONS_BASIC,
                    ReportType::IMAGE_ANNOTATIONS_COCO,
                    ReportType::IMAGE_ANNOTATIONS_CSV,
                    ReportType::IMAGE_ANNOTATIONS_EXTENDED,
                    ReportType::IMAGE_ANNOTATIONS_FULL,
                    ReportType::IMAGE_ANNOTATIONS_IMAGE_LOCATION,
                    ReportType::IMAGE_IFDO,
                    ReportType::IMAGE_LABELS_BASIC,
                    ReportType::IMAGE_LABELS_CSV,
                    ReportType::IMAGE_LABELS_IMAGE_LOCATION,
                ],
            ],

            'video reports only' => [
                false,
                true,
                [
                    ReportType::VIDEO_ANNOTATIONS_CSV,
                    ReportType::VIDEO_IFDO,
                    ReportType::VIDEO_LABELS_CSV,
                ],
            ],

            'nothing' => [
                false,
                false,
                []
            ]
        ];
    }
}
