<?php

namespace Biigle\Http\Controllers\Views\Videos;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Role;
use Biigle\Shape;
use Biigle\Video;
use DB;
use Illuminate\Http\Request;

class VideoController extends Controller
{
    /**
     * Show the video annotation tool.
     *
     * @param Request $request
     * @param int $id
     *
     * @return mixed
     */
    public function show(Request $request, $id)
    {
        $video = Video::findOrFail($id);
        $this->authorize('access', $video);
        $user = $request->user();
        $volume = $video->volume;

        $shapes = Shape::where('name', '!=', 'Ellipse')->pluck('name', 'id');

        if ($user->can('sudo')) {
            // Global admins have no restrictions.
            $projectIds = DB::table('project_volume')
                ->where('volume_id', $video->volume_id)
                ->pluck('project_id');
        } else {
            // Array of all project IDs that the user and the video have in common
            // and where the user is editor, expert or admin.
            $projectIds = Project::inCommon($user, $video->volume_id, [
                Role::editorId(),
                Role::expertId(),
                Role::adminId(),
            ])->pluck('id');
        }

        // All label trees that are used by all projects which are visible to the user.
        $labelTrees = LabelTree::select('id', 'name', 'version_id')
            ->with('labels', 'version')
            ->whereIn('id', function ($query) use ($projectIds) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', $projectIds);
            })
            ->get();

        $annotationSessions = $volume->annotationSessions()
            ->select('id', 'name', 'starts_at', 'ends_at')
            ->with('users')
            ->get();

        $videos = $volume->videos()
            ->orderBy('filename', 'asc')
            ->pluck('filename', 'id');

        $errors = collect([
            'not-found' => Video::ERROR_NOT_FOUND,
            'mimetype' => Video::ERROR_MIME_TYPE,
            'codec' => Video::ERROR_CODEC,
            'malformed' => VIDEO::ERROR_MALFORMED,
            'too-large' => VIDEO::ERROR_TOO_LARGE,
        ]);

        return view('videos.show', compact(
            'user',
            'video',
            'volume',
            'videos',
            'shapes',
            'labelTrees',
            'annotationSessions',
            'errors'
        ));
    }
}
