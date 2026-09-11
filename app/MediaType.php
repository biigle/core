<?php

namespace Biigle;

use Biigle\Traits\EnumSerialization;
use ValueError;

/**
 * Volumes can contain either images or videos as media type.
 */
enum MediaType: int implements \JsonSerializable
{
    use EnumSerialization;

    case IMAGE = 1;
    case VIDEO = 2;

    public static function image(): self
    {
        return self::IMAGE;
    }

    public static function video(): self
    {
        return self::VIDEO;
    }

    public static function imageId(): int
    {
        return self::IMAGE->value;
    }

    public static function videoId(): int
    {
        return self::VIDEO->value;
    }

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

    public static function fromLabel(string $label): self
    {
        return match (strtoupper($label)) {
            self::IMAGE->name => self::IMAGE,
            self::VIDEO->name => self::VIDEO,
            default => throw new ValueError("Invalid media type label $label"),
        };
    }
}
