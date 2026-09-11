<?php

namespace Biigle;

use Biigle\Traits\EnumSerialization;

/**
 * A role of a user. Users have one global role and can have many project-
 * specific roles.
 * This used to be a eloquent db model and was turned into an enum later. To keep some compatibility, some methods were introduced.
*/
enum Role: int implements \JsonSerializable
{
    use EnumSerialization;

    case ADMIN = 1;
    case EDITOR = 2;
    case GUEST = 3;
    case EXPERT = 4;

    public function label(): string
    {
        return match ($this) {
            self::ADMIN => 'admin',
            self::EDITOR => 'editor',
            self::GUEST => 'guest',
            self::EXPERT => 'expert',
        };
    }
}
