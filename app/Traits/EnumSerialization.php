<?php

namespace Biigle\Traits;

/**
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