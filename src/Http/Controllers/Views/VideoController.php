<?php

namespace Biigle\Modules\Videos\Http\Controllers\Views;

use Biigle\Shape;
use Biigle\Project;
use Biigle\LabelTree;
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

        $shapes = Shape::pluck('name', 'id');

        $labelTrees = LabelTree::with('labels')
            ->select('id', 'name')
            ->whereIn('id', function ($query) use ($video) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->where('project_id', $video->project_id);
            })
            ->get();

        return view('videos::show', compact(
            'video',
            'shapes',
            'labelTrees'
        ));
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
