<?php

namespace Biigle\Services\MetadataParsing;

use JsonSerializable;

class User implements JsonSerializable
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

    public function jsonSerialize(): mixed
    {
        $ret = [
            'id' => $this->id,
            'name' => $this->name,
        ];

        if (!is_null($this->uuid)) {
            $ret['uuid'] = $this->uuid;
        }

        return $ret;
    }
}
