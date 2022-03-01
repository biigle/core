<?php

namespace Biigle\Traits;

trait ChecksMetadataStrings
{
    /**
     * Determine if a value is not null and not an empty string.
     */
    public function isFilledString($x)
    {
        return !is_null($x) && $x !== '';
    }
}
