<?php

namespace Biigle;

use Biigle\Traits\EloquentEnum;
use Biigle\Traits\EnumSerialization;
use ValueError;

/**
 * Volumes can contain either images or videos as media type.
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

    public static function fromLabel(string $label): self
    {
        return match (strtoupper($label)) {
            self::IMAGE->name => self::IMAGE,
            self::VIDEO->name => self::VIDEO,
            default => throw new ValueError("Invalid media type label $label"),
        };
    }
}
