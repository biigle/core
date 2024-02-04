<?php

namespace Biigle\Events;

use Biigle\AnnotationLabel;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

class AnnotationLabelAttached implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public AnnotationLabel $annotationLabel)
    {
        //
    }
}
