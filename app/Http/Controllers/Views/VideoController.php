<?php

namespace App\Http\Controllers\Views;

use App\Video;
use Ramsey\Uuid\Uuid;
use App\Http\Controllers\Controller;

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

        return view('video', compact('video'));
    }
}
