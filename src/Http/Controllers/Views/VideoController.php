<?php

namespace Biigle\Modules\Videos\Http\Controllers\Views;

use Biigle\Project;
use Illuminate\Http\Request;
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

    /**
     * Shows the create video page.
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $project = Project::findOrFail($request->input('project'));
        $this->authorize('update', $project);

        return view('videos::store', compact('project'));
    }
}
