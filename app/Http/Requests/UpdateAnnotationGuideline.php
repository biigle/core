<?php

namespace Biigle\Http\Requests;

use Biigle\AnnotationGuideline;

class UpdateAnnotationGuideline extends StoreAnnotationGuideline
{
    /**
     * The guideline that should be updated.
     *
     * @var AnnotationGuideline
     */
    public $guideline;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->guideline = AnnotationGuideline::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->guideline);
    }
}
