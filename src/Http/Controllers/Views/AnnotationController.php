<?php

namespace Biigle\Modules\Annotations\Http\Controllers\Views;

use Biigle\Annotation;
use Biigle\Http\Controllers\Views\Controller;

class AnnotationController extends Controller
{
    /**
     * Redirect to the annotator link that shows a specified annotation.
     *
     * @param int $id Annotation ID
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $annotation = Annotation::findOrFail($id);
        $this->authorize('access', $annotation);

        return redirect()->route('annotate', [
            'id' => $annotation->image_id,
            'annotation' => $annotation->id,
        ]);
    }
}
