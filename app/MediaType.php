<?php

namespace Biigle;

use Override;

/**
 * Volumes can contain either images or videos as media type.
 */
enum MediaType: int implements \JsonSerializable
{
    // Values previously used in the DB model, kept for compatibility
    case IMAGE = 3;
    case VIDEO = 4;

    public static function image(): self
    {
        return self::IMAGE;
    }

    public static function editor(): self
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
        return strtolower($this->name);
    }

    public function toArray(): array
    {
        return [
            'id' => $this->value,
            'name' => $this->label()
        ];
    }

    #[Override]
    public function jsonSerialize(): mixed
    {
        return $this->toArray();
    }
}
