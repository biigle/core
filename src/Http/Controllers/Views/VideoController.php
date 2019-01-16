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
     * @param string $uuid
     *
     * @return mixed
     */
    public function show($uuid)
    {
        $video = Video::where('uuid', $uuid)->firstOrFail();

        return view('show', compact('video'));
    }
}
