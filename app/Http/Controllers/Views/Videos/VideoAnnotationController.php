<?php

namespace Biigle\Http\Controllers\Views\Videos;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\VideoAnnotation;

class VideoAnnotationController extends Controller
{
    /**
     * Redirect to the annotator link that shows a specified annotation.
     *
     * @param int $id Video annotation ID
     * @return \Illuminate\Http\RedirectResponse
     */
    public function show($id)
    {
        $annotation = VideoAnnotation::findOrFail($id);
        $this->authorize('access', $annotation);

        return redirect()->route('video-annotate', [
            'id' => $annotation->video_id,
            'annotation' => $annotation->id,
        ]);
    }
}
