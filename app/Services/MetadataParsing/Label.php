<?php

namespace Biigle\Services\MetadataParsing;

use JsonSerializable;

class Label implements JsonSerializable
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
    ) {
        //
    }

    public function jsonSerialize(): mixed
    {
        $ret = [
            'id' => $this->id,
            'name' => $this->name,
        ];

        if (!is_null($this->color)) {
            $ret['color'] = $this->color;
        }

        if (!is_null($this->uuid)) {
            $ret['uuid'] = $this->uuid;
        }

        if (!is_null($this->labelTreeUuid)) {
            $ret['labelTreeUuid'] = $this->labelTreeUuid;
        }

        return $ret;
    }
}
