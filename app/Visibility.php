<?php

namespace Biigle;

use Override;

enum Visibility: int implements \JsonSerializable
{
    case PUBLIC = 1;
    case PRIVATE = 2;

    public static function public(): self
    {
        return self::PUBLIC;
    }

    public static function private(): self
    {
        return self::PRIVATE;
    }

    public static function publicId(): int
    {
        return self::PUBLIC->value;
    }

    public static function privateId(): int
    {
        return self::PRIVATE->value;
    }

    public function label(): string
    {
        return match ($this) {
            self::PUBLIC => 'public',
            self::PRIVATE => 'private',
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
