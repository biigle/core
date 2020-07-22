<?php

namespace Biigle\Http\Controllers\Views\Videos;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Shape;
use Biigle\Video;
use Illuminate\Http\Request;

class VideoController extends Controller
{
    /**
     * Show the video annotation tool.
     *
     * @param int $id
     *
     * @return mixed
     */
    public function show($id)
    {
        $video = Video::findOrFail($id);
        $this->authorize('access', $video);

        $shapes = Shape::where('name', '!=', 'Ellipse')->pluck('name', 'id');

        $labelTrees = LabelTree::select('id', 'name', 'version_id')
            ->with('labels', 'version')
            ->whereIn('id', function ($query) use ($video) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->where('project_id', $video->project_id);
            })
            ->get();

        return view('videos.show', compact(
            'video',
            'shapes',
            'labelTrees'
        ));
    }
}
