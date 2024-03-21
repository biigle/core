<?php

namespace Biigle\Services\MetadataParsing;

class User
{
    /**
     * @param string $id
     * @param string $name
     * @param ?string $uuid The BIIGLE UUID of the user.
     */
    public function __construct(
        public string $id,
        public string $name,
        public ?string $uuid = null,
    ) {
        //
    }
}
