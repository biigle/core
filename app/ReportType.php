<?php

namespace Biigle;

use Biigle\Traits\EnumSerialization;

enum ReportType: int implements \JsonSerializable
{
    use EnumSerialization;

    case IMAGE_ANNOTATIONS_AREA = 1;
    case IMAGE_ANNOTATIONS_BASIC = 2;
    case IMAGE_ANNOTATIONS_CSV = 3;
    case IMAGE_ANNOTATIONS_EXTENDED = 4;
    case IMAGE_ANNOTATIONS_FULL = 5;
    case IMAGE_LABELS_BASIC = 6;
    case IMAGE_LABELS_CSV = 7;
    case VIDEO_ANNOTATIONS_CSV = 8;
    case IMAGE_ANNOTATIONS_ABUNDANCE = 9;
    case VIDEO_LABELS_CSV = 10;
    case IMAGE_LABELS_IMAGE_LOCATION = 11;
    case IMAGE_ANNOTATIONS_IMAGE_LOCATION = 12;
    case IMAGE_ANNOTATIONS_ANNOTATION_LOCATION = 13;
    case IMAGE_IFDO = 14;
    case VIDEO_IFDO = 15;
    case IMAGE_ANNOTATIONS_COCO = 16;

    public static function getSortedTypes(bool $imageReports, bool $videoReports): \Illuminate\Support\Collection
    {
        $cases = collect(self::cases());

        if ($imageReports xor $videoReports) {
            $prefix = $imageReports ? 'Image' : 'Video';
            $cases = $cases->filter(fn (self $type) => str_starts_with($type->label(), $prefix));
        }

        return $cases->sortBy(fn (self $type) => $type->label())
            ->values();
    }

    public function label(): string
    {
        return match ($this) {
            self::IMAGE_ANNOTATIONS_AREA => 'ImageAnnotations\Area',
            self::IMAGE_ANNOTATIONS_BASIC => 'ImageAnnotations\Basic',
            self::IMAGE_ANNOTATIONS_CSV => 'ImageAnnotations\Csv',
            self::IMAGE_ANNOTATIONS_EXTENDED => 'ImageAnnotations\Extended',
            self::IMAGE_ANNOTATIONS_FULL => 'ImageAnnotations\Full',
            self::IMAGE_LABELS_BASIC => 'ImageLabels\Basic',
            self::IMAGE_LABELS_CSV => 'ImageLabels\Csv',
            self::VIDEO_ANNOTATIONS_CSV => 'VideoAnnotations\Csv',
            self::IMAGE_ANNOTATIONS_ABUNDANCE => 'ImageAnnotations\Abundance',
            self::VIDEO_LABELS_CSV => 'VideoLabels\Csv',
            self::IMAGE_LABELS_IMAGE_LOCATION => 'ImageLabels\ImageLocation',
            self::IMAGE_ANNOTATIONS_IMAGE_LOCATION => 'ImageAnnotations\ImageLocation',
            self::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION => 'ImageAnnotations\AnnotationLocation',
            self::IMAGE_IFDO => 'ImageIfdo',
            self::VIDEO_IFDO => 'VideoIfdo',
            self::IMAGE_ANNOTATIONS_COCO => 'ImageAnnotations\Coco',
        };
    }
}
