<?php

namespace Biigle\Http\Controllers\Views\Annotations;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\ImageAnnotation;

class ImageAnnotationController extends Controller
{
    /**
     * Redirect to the annotator link that shows a specified annotation.
     *
     * @param int $id Image annotation ID
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $annotation = ImageAnnotation::findOrFail($id);
        $this->authorize('access', $annotation);

        return redirect()->route('annotate', [
            'id' => $annotation->image_id,
            'annotation' => $annotation->id,
        ]);
    }
}
