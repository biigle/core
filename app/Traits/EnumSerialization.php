<?php

namespace Biigle\Traits;

/**
 * Provides `jsonSerialize()` and `toArray()` methods for enums implementing `label()` for each case
 * @mixin \BackedEnum
 */
trait EnumSerialization
{
    public function toArray(): array
    {
        return [
            'id' => $this->value,
            'name' => $this->label()
        ];
    }

    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
