<?php

namespace Biigle;

use Biigle\Traits\EloquentEnum;
use Biigle\Traits\EnumSerialization;

/**
 * Volumes can contain either images or videos as media type.
 *
 * Adding a case requires a migration that updates the range check constraints of the
 * referencing columns (volumes_media_type_check, pending_volumes_media_type_check).
 * See EnumRangeConstraintTest.
 */
enum MediaType: int implements \JsonSerializable
{
    use EnumSerialization, EloquentEnum;

    case IMAGE = 1;
    case VIDEO = 2;

    public function label(): string
    {
        return match ($this) {
            self::IMAGE => 'image',
            self::VIDEO => 'video',
        };
    }

    public static function labels(): array
    {
        return array_map(
            fn (self $type) => $type->label(),
            self::cases()
        );
    }

    public static function tryFromValueOrLabel(mixed $key): ?self
    {
        if (is_numeric($key)) {
            return self::tryFrom((int) $key);
        } elseif (is_string($key)) {
            return match (strtolower($key)) {
                self::IMAGE->label() => self::IMAGE,
                self::VIDEO->label() => self::VIDEO,
                default => null,
            };
        }

        return null;
    }
}
