<?php

namespace Biigle\Modules\Annotations\Http\Controllers;

use DB;
use Biigle\Role;
use Biigle\Shape;
use Biigle\Image;
use Biigle\LabelTree;
use Biigle\Annotation;
use Illuminate\Contracts\Auth\Guard;
use Biigle\Http\Controllers\Views\Controller;

class AnnotationController extends Controller
{
    /**
     * Shows the annotation index page.
     *
     * @param Guard $auth
     * @param int $id the image ID
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Guard $auth, $id)
    {
        $image = Image::with('volume')->findOrFail($id);
        $this->authorize('access', $image);
        $user = $auth->user();

        if ($user->isAdmin) {
            // admins have no restrictions
            $projectIds = DB::table('project_volume')
                ->where('volume_id', $image->volume_id)
                ->pluck('project_id');
        } else {
            // array of all project IDs that the user and the image have in common
            // and where the user is editor or admin
            $projectIds = DB::table('project_user')
                ->where('user_id', $user->id)
                ->whereIn('project_id', function ($query) use ($image) {
                    $query->select('project_volume.project_id')
                        ->from('project_volume')
                        ->join('project_user', 'project_volume.project_id', '=', 'project_user.project_id')
                        ->where('project_volume.volume_id', $image->volume_id)
                        ->whereIn('project_user.project_role_id', [Role::$editor->id, Role::$admin->id]);
                })
                ->pluck('project_id');
        }

        $images = Image::where('volume_id', $image->volume_id)
            ->orderBy('filename', 'asc')
            ->pluck('filename', 'id');

        // all label trees that are used by all projects which are visible to the user
        $trees = LabelTree::with('labels')
            ->select('id', 'name')
            ->whereIn('id', function ($query) use ($projectIds) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', $projectIds);
            })
            ->get();

        $shapes = Shape::all();

        $annotationSessions = $image->volume->annotationSessions()
            ->select('id', 'name', 'starts_at', 'ends_at')
            ->with('users')
            ->get();

        return view('annotations::index', [
            'user' => $user,
            'image' => $image,
            'volume' => $image->volume,
            'editMode' => $user->can('add-annotation', $image),
            'images' => $images,
            'labelTrees' => $trees,
            'shapes' => $shapes,
            'annotationSessions' => $annotationSessions,
        ]);
    }

    /**
     * Shows the annotation index page.
     *
     * @param Guard $auth
     * @param int $id the image ID
     *
     * @return \Illuminate\Http\Response
     */
    public function showVue(Guard $auth, $id)
    {
        $image = Image::with('volume')->findOrFail($id);
        $this->authorize('access', $image);
        $user = $auth->user();

        if ($user->isAdmin) {
            // admins have no restrictions
            $projectIds = DB::table('project_volume')
                ->where('volume_id', $image->volume_id)
                ->pluck('project_id');
        } else {
            // array of all project IDs that the user and the image have in common
            // and where the user is editor or admin
            $projectIds = DB::table('project_user')
                ->where('user_id', $user->id)
                ->whereIn('project_id', function ($query) use ($image) {
                    $query->select('project_volume.project_id')
                        ->from('project_volume')
                        ->join('project_user', 'project_volume.project_id', '=', 'project_user.project_id')
                        ->where('project_volume.volume_id', $image->volume_id)
                        ->whereIn('project_user.project_role_id', [Role::$editor->id, Role::$admin->id]);
                })
                ->pluck('project_id');
        }

        $images = Image::where('volume_id', $image->volume_id)
            ->orderBy('filename', 'asc')
            ->pluck('filename', 'id');

        // all label trees that are used by all projects which are visible to the user
        $trees = LabelTree::with('labels')
            ->select('id', 'name')
            ->whereIn('id', function ($query) use ($projectIds) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', $projectIds);
            })
            ->get();

        $shapes = Shape::pluck('name', 'id');

        $annotationSessions = $image->volume->annotationSessions()
            ->select('id', 'name', 'starts_at', 'ends_at')
            ->with('users')
            ->get();

        return view('annotations::show', [
            'user' => $user,
            'image' => $image,
            'volume' => $image->volume,
            'editMode' => $user->can('add-annotation', $image),
            'images' => $images,
            'labelTrees' => $trees,
            'shapes' => $shapes,
            'annotationSessions' => $annotationSessions,
        ]);
    }

    /**
     * Redirect to the annotator link that shows a specified annotation.
     *
     * @param int $id Annotation ID
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $annotation = Annotation::select('id', 'image_id')->findOrFail($id);
        $this->authorize('access', $annotation);

        return redirect()->route('annotate', [
            'id' => $annotation->image_id,
            'annotation' => $annotation->id,
        ]);
    }

    /**
     * Show a tutorials article.
     *
     * @param string $name Article name
     * @return \Illuminate\Http\Response
     */
    public function tutorial($name)
    {
        if (view()->exists('annotations::manual.tutorials.'.$name)) {
            return view('annotations::manual.tutorials.'.$name);
        } else {
            abort(404);
        }
    }
}
