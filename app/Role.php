<?php

// TODO Move this to Biigle/Enums or smth.
namespace Biigle;

use Override;

/**
 * A role of a user. Users have one global role and can have many project-
 * specific roles.
*/
enum Role: int implements \JsonSerializable
{
    case ADMIN = 1;
    case EDITOR = 2;
    case GUEST = 3;
    case EXPERT = 4;

    public static function admin(): self
    {
        return self::ADMIN;
    }

    public static function editor(): self
    {
        return self::EDITOR;
    }

    public static function guest(): self
    {
        return self::GUEST;
    }

    public static function expert(): self
    {
        return self::EXPERT;
    }

    public static function adminId(): int
    {
        return self::ADMIN->value;
    }

    public static function editorId(): int
    {
        return self::EDITOR->value;
    }

    public static function guestId(): int
    {
        return self::GUEST->value;
    }

    public static function expertId(): int
    {
        return self::EXPERT->value;
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
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
