<?php

namespace Biigle\Services\MetadataParsing;

class LabelAndUser
{
    public function __construct(
        public Label $label,
        public User $user,
    ) {
        //
    }
}
