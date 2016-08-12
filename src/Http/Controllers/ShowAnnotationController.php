<?php

namespace Dias\Modules\Annotations\Http\Controllers;

use Dias\Annotation;
use Dias\Http\Controllers\Views\Controller;

class ShowAnnotationController extends Controller
{
    /**
     * Redirect to the annotator link that shows a specified annotation
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
