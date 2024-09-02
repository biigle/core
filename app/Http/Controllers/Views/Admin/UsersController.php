<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\Http\Controllers\Controller;
use Biigle\Image;
use Biigle\ImageAnnotation;
use Biigle\Project;
use Biigle\Role;
use Biigle\Services\Modules;
use Biigle\User;
use Biigle\VideoAnnotation;
use Biigle\Volume;
use Illuminate\Http\Request;

class UsersController extends Controller
{
    /**
     * Shows the admin users page.
     *
     * @param Request $request
     */
    public function get(Request $request)
    {
        $users = User::select('id', 'firstname', 'lastname', 'email', 'login_at', 'role_id', 'affiliation')
            ->when($request->has('q'), function ($query) use ($request) {
                $q = $request->get('q');
                $query->where(function ($query) use ($q) {
                    $query->where('firstname', 'ilike', "%$q%")
                        ->orWhere('lastname', 'ilike', "%$q%")
                        ->orWhere('email', 'ilike', "%$q%");
                });
            })
            // Orders by login_at in descending order (most recent first) but puts
            // users with login_at=NULL at the end.
            ->orderByRaw('login_at IS NULL, login_at DESC')
            ->orderBy('created_at', 'desc')
            ->paginate(100);

        $roleNames = [
            Role::adminId() => 'Admin',
            Role::editorId() => 'Editor',
            Role::guestId() => 'Guest',
        ];

        return view('admin.users', [
            'users' => $users,
            'roleClass' => $this->roleClassMap(),
            'roleNames' => $roleNames,
            'query' => $request->get('q'),
        ]);
    }

    /**
     * Shows the admin new user page.
     */
    public function newUser()
    {
        return view('admin.users.new');
    }

    /**
     * Shows the admin edit user page.
     */
    public function edit($id)
    {
        return view('admin.users.edit')
            ->with('affectedUser', User::findOrFail($id))
            ->with('roles', [
                Role::admin(),
                Role::editor(),
                Role::guest(),
            ]);
    }

    /**
     * Shows the admin delete user page.
     */
    public function delete($id)
    {
        return view('admin.users.delete')
            ->with('affectedUser', User::findOrFail($id));
    }

    /**
     * Shows the user information page.
     *
     * @param Modules $modules
     * @param int $id User ID
     */
    public function show(Modules $modules, $id)
    {
        $user = User::findOrFail($id);
        $roleClass = $this->roleClassMap($user->role_id);
        $values = $this->showProject($user);
        $values = array_merge($values, $this->showVolume($user));
        $values = array_merge($values, $this->showAnnotations($user));
        $values = array_merge($values, $this->showVideos($user));
        $values = array_merge($values, $modules->callControllerMixins('adminShowUser', ['user' => $user]));

        return view('admin.users.show', array_merge([
            'shownUser' => $user,
            'roleClass' => $roleClass,
        ], $values));
    }

    /**
     * Determines the Boostrap label class for a role label.
     *
     * @param int $id
     *
     * @return string|array
     */
    protected function roleClassMap($id = null)
    {
        $map = [
            Role::adminId() => 'danger',
            Role::editorId() => 'primary',
            Role::guestId() => 'default',
        ];

        if (!is_null($id)) {
            return $map[$id];
        }

        return $map;
    }

    /**
     * Add project statistics to the view.
     *
     * @param User $user
     *
     * @return array
     */
    protected function showProject(User $user)
    {
        $projectsTotal = Project::count();

        $creatorProjects = Project::where('creator_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->select('id', 'name')
            ->get();
        $creatorCount = $creatorProjects->count();
        $creatorPercent = $creatorCount > 0 ? round($creatorCount / $projectsTotal * 100, 2) : 0;

        $memberProjects = Project::join('project_user', 'projects.id', '=', 'project_user.project_id')
            ->orderBy('projects.created_at', 'desc')
            ->where('project_user.user_id', $user->id)
            ->select('projects.id', 'projects.name')
            ->get();
        $memberCount = $memberProjects->count();
        $memberPercent = $memberCount > 0 ? round($memberCount / $projectsTotal * 100, 2) : 0;

        return compact('creatorProjects', 'creatorCount', 'creatorPercent', 'memberProjects', 'memberCount', 'memberPercent');
    }

    /**
     * Add volume statistics to the view.
     *
     * @param User $user
     *
     * @return array
     */
    protected function showVolume(User $user)
    {
        $volumesTotal = Volume::count();

        $volumes = Volume::where('creator_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->select('id', 'name')
            ->get();
        $volumesCount = $volumes->count();
        $volumesPercent = $volumesCount > 0 ? round($volumesCount / $volumesTotal * 100, 2) : 0;

        $imagesTotal = Image::count();
        $imagesCount = Image::join('volumes', 'volumes.id', '=', 'images.volume_id')
            ->where('volumes.creator_id', $user->id)
            ->count();
        $imagesPercent = $imagesCount > 0 ? round($imagesCount / $imagesTotal * 100, 2) : 0;

        return compact('volumes', 'volumesCount', 'volumesPercent', 'imagesCount', 'imagesPercent');
    }

    /**
     * Add annotation statistics to the view.
     *
     * @param User $user
     *
     * @return array
     */
    protected function showAnnotations(User $user)
    {
        $annotationQuery = ImageAnnotation::join('image_annotation_labels', 'image_annotations.id', '=', 'image_annotation_labels.annotation_id')
            ->where('image_annotation_labels.user_id', $user->id);

        $totalAnnotations = (clone $annotationQuery)->distinct()->count('image_annotations.id');

        if ($totalAnnotations > 0) {
            $relativeAnnotations = $totalAnnotations / ImageAnnotation::count();

            $recentImageAnnotations = $annotationQuery->orderBy('image_annotation_labels.created_at', 'desc')
                ->take(10)
                ->select('image_annotation_labels.created_at', 'image_annotations.id')
                ->get();
        } else {
            $totalAnnotations = 0;
            $relativeAnnotations = 0;
            $recentImageAnnotations = [];
        }

        return compact('totalAnnotations', 'relativeAnnotations', 'recentImageAnnotations');
    }

    /**
     * Add project statistics to the view.
     *
     * @param User $user
     *
     * @return array
     */
    public function showVideos(User $user)
    {
        $annotationQuery = VideoAnnotation::join('video_annotation_labels', 'video_annotations.id', '=', 'video_annotation_labels.annotation_id')
            ->where('video_annotation_labels.user_id', $user->id);

        $totalVideoAnnotations = (clone $annotationQuery)->distinct()->count('video_annotations.id');

        if ($totalVideoAnnotations > 0) {
            $relativeVideoAnnotations = $totalVideoAnnotations / VideoAnnotation::count();

            $recentVideoAnnotations = $annotationQuery->orderBy('video_annotation_labels.created_at', 'desc')
                ->take(10)
                ->select('video_annotation_labels.created_at', 'video_annotations.id')
                ->get();
        } else {
            $totalVideoAnnotations = 0;
            $relativeVideoAnnotations = 0;
            $recentVideoAnnotations = [];
        }

        return compact('totalVideoAnnotations', 'relativeVideoAnnotations', 'recentVideoAnnotations');
    }
}
