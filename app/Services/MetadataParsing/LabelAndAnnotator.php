<?php

namespace Biigle\Services\MetadataParsing;

class LabelAndAnnotator
{
    public function __construct(
        public Label $label,
        public Annotator $annotator,
    ) {
        //
    }
}
