<?php

namespace Biigle\Services\MetadataParsing;

class Label
{
    /**
     * @param string $id
     * @param string $name
     * @param ?string $color The BIIGLE label color
     * @param ?string $uuid The BIIGLE label UUID.
     * @param ?string $labelTreeUuid The BIIGLE label tree UUID.
     */
    public function __construct(
        public string $id,
        public string $name,
        public ?string $color = null,
        public ?string $uuid = null,
        public ?string $labelTreeUuid = null,
    )
    {
        //
    }
}
