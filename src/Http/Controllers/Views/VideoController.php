<?php

namespace Biigle\Modules\Videos\Http\Controllers\Views;

use Ramsey\Uuid\Uuid;
use Biigle\Modules\Videos\Video;
use Biigle\Http\Controllers\Views\Controller;

class VideoController extends Controller
{
    /**
     * Show the video annotation tool.
     *
     * @param number $id
     *
     * @return mixed
     */
    public function show($id)
    {
        $video = Video::findOrFail($id);
        $this->authorize('access', $video);

        return view('videos::show', compact('video'));
    }
}
