<?php

namespace Biigle;

use Override;

enum ReportType: int implements \JsonSerializable
{
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

    public static function imageAnnotationsArea(): self
    {
        return self::IMAGE_ANNOTATIONS_AREA;
    }

    public static function imageAnnotationsBasic(): self
    {
        return self::IMAGE_ANNOTATIONS_BASIC;
    }

    public static function imageAnnotationsCsv(): self
    {
        return self::IMAGE_ANNOTATIONS_CSV;
    }

    public static function imageAnnotationsExtended(): self
    {
        return self::IMAGE_ANNOTATIONS_EXTENDED;
    }

    public static function imageAnnotationsFull(): self
    {
        return self::IMAGE_ANNOTATIONS_FULL;
    }

    public static function imageLabelsBasic(): self
    {
        return self::IMAGE_LABELS_BASIC;
    }

    public static function imageLabelsCsv(): self
    {
        return self::IMAGE_LABELS_CSV;
    }

    public static function videoAnnotationsCsv(): self
    {
        return self::VIDEO_ANNOTATIONS_CSV;
    }

    public static function imageAnnotationsAbundance(): self
    {
        return self::IMAGE_ANNOTATIONS_ABUNDANCE;
    }

    public static function videoLabelsCsv(): self
    {
        return self::VIDEO_LABELS_CSV;
    }

    public static function imageLabelsImageLocation(): self
    {
        return self::IMAGE_LABELS_IMAGE_LOCATION;
    }

    public static function imageAnnotationsImageLocation(): self
    {
        return self::IMAGE_ANNOTATIONS_IMAGE_LOCATION;
    }

    public static function imageAnnotationsAnnotationLocation(): self
    {
        return self::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION;
    }

    public static function imageIfdo(): self
    {
        return self::IMAGE_IFDO;
    }

    public static function videoIfdo(): self
    {
        return self::VIDEO_IFDO;
    }

    public static function imageAnnotationsCoco(): self
    {
        return self::IMAGE_ANNOTATIONS_COCO;
    }

    public static function imageAnnotationsAreaId(): int
    {
        return self::IMAGE_ANNOTATIONS_AREA->value;
    }

    public static function imageAnnotationsBasicId(): int
    {
        return self::IMAGE_ANNOTATIONS_BASIC->value;
    }

    public static function imageAnnotationsCsvId(): int
    {
        return self::IMAGE_ANNOTATIONS_CSV->value;
    }

    public static function imageAnnotationsExtendedId(): int
    {
        return self::IMAGE_ANNOTATIONS_EXTENDED->value;
    }

    public static function imageAnnotationsFullId(): int
    {
        return self::IMAGE_ANNOTATIONS_FULL->value;
    }

    public static function imageLabelsBasicId(): int
    {
        return self::IMAGE_LABELS_BASIC->value;
    }

    public static function imageLabelsCsvId(): int
    {
        return self::IMAGE_LABELS_CSV->value;
    }

    public static function videoAnnotationsCsvId(): int
    {
        return self::VIDEO_ANNOTATIONS_CSV->value;
    }

    public static function imageAnnotationsAbundanceId(): int
    {
        return self::IMAGE_ANNOTATIONS_ABUNDANCE->value;
    }

    public static function videoLabelsCsvId(): int
    {
        return self::VIDEO_LABELS_CSV->value;
    }

    public static function imageLabelsImageLocationId(): int
    {
        return self::IMAGE_LABELS_IMAGE_LOCATION->value;
    }

    public static function imageAnnotationsImageLocationId(): int
    {
        return self::IMAGE_ANNOTATIONS_IMAGE_LOCATION->value;
    }

    public static function imageAnnotationsAnnotationLocationId(): int
    {
        return self::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION->value;
    }

    public static function imageIfdoId(): int
    {
        return self::IMAGE_IFDO->value;
    }

    public static function videoIfdoId(): int
    {
        return self::VIDEO_IFDO->value;
    }

    public static function imageAnnotationsCocoId(): int
    {
        return self::IMAGE_ANNOTATIONS_COCO->value;
    }

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

    public function toArray(): array
    {
        return [
            'id' => $this->value,
            'name' => $this->label(),
        ];
    }

    #[Override]
    public function jsonSerialize(): mixed
    {
        return $this->toArray();
    }
}
