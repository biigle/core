<?php

namespace Biigle\Services\MetadataParsing;

class AnnotationLabel
{
    public function __construct(
        public Label $label,
        public Annotator $annotator,
    )
    {
        //
    }
}
