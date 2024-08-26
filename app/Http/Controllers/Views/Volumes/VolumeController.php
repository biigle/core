<?php

namespace Biigle\Http\Controllers\Views\Volumes;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\LabelTree;
use Biigle\MediaType;
use Biigle\Modules\UserDisks\UserDisk;
use Biigle\Modules\UserStorage\UserStorageServiceProvider;
use Biigle\Project;
use Biigle\Role;
use Biigle\User;
use Biigle\Volume;
use Carbon\Carbon;
use Illuminate\Http\Request;

class VolumeController extends Controller
{
    /**
     * Shows the create volume page.
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function create(Request $request)
    {
        $project = Project::findOrFail($request->input('project'));
        $this->authorize('update', $project);

        $disks = collect([]);
        $user = $request->user();

        if ($user->can('sudo')) {
            $disks = $disks->concat(config('volumes.admin_storage_disks'));
        } elseif ($user->role_id === Role::editorId()) {
            $disks = $disks->concat(config('volumes.editor_storage_disks'));
        }

        // Limit to disks that actually exist.
        $disks = $disks->intersect(array_keys(config('filesystems.disks')))->values();

        // Use the disk keys as names, too. UserDisks can have different names
        // (see below).
        $disks = $disks->combine($disks)->map(fn ($name) => ucfirst($name));

        if (class_exists(UserDisk::class)) {
            $userDisks = UserDisk::where('user_id', $user->id)
                ->pluck('name', 'id')
                ->mapWithKeys(fn ($name, $id) => ["disk-{$id}" => $name]);

            $disks = $disks->merge($userDisks);
        }

        $mediaType = old('media_type', 'image');
        $filenames = str_replace(["\r", "\n", '"', "'"], '', old('files'));
        $offlineMode = config('biigle.offline_mode');

        if (class_exists(UserStorageServiceProvider::class)) {
            $userDisk = "user-{$user->id}";
        } else {
            $userDisk = null;
        }

        return view('volumes.create', [
            'project' => $project,
            'disks' => $disks,
            'hasDisks' => !empty($disks),
            'mediaType' => $mediaType,
            'filenames' => $filenames,
            'offlineMode' => $offlineMode,
            'userDisk' => $userDisk,
        ]);
    }

    /**
     * Shows the volume index page.
     *
     * @param Request $request
     * @param int $id volume ID
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request, $id)
    {
        $volume = Volume::findOrFail($id);
        $this->authorize('access', $volume);

        $projects = $this->getProjects($request->user(), $volume);

        // all label trees that are used by all projects which are visible to the user
        $labelTrees = LabelTree::select('id', 'name', 'version_id')
            ->with('labels', 'version')
            ->whereIn('id', function ($query) use ($projects) {
                $query->select('label_tree_id')
                    ->from('label_tree_project')
                    ->whereIn('project_id', $projects->pluck('id'));
            })
            ->get();

        $fileIds = $volume->orderedFiles()->pluck('uuid', 'id');

        if ($volume->isImageVolume()) {
            $thumbUriTemplate = thumbnail_url(':uuid');
        } else {
            $thumbUriTemplate = thumbnail_url(':uuid', config('videos.thumbnail_storage_disk'));
        }

        $type = $volume->mediaType->name;

        return view('volumes.show', compact(
            'volume',
            'labelTrees',
            'projects',
            'fileIds',
            'thumbUriTemplate',
            'type',
        ));
    }

    /**
     * Shows the volume edit page.
     *
     * @param Request $request
     * @param int $id volume ID
     *
     * @return \Illuminate\Http\Response
     */
    public function edit(Request $request, $id)
    {
        $volume = Volume::with('projects')->findOrFail($id);
        $this->authorize('update', $volume);
        $sessions = $volume->annotationSessions()->with('users')->get();
        $projects = $this->getProjects($request->user(), $volume);
        $type = $volume->mediaType->name;

        return view('volumes.edit', [
            'projects' => $projects,
            'volume' => $volume,
            'mediaTypes' => MediaType::all(),
            'annotationSessions' => $sessions,
            'today' => Carbon::today(),
            'type' => $type,
        ]);
    }

    /**
     * Get all projects that belong to a volume and that the user can access.
     *
     * @param User $user
     * @param Volume $volume
     *
     * @return \Illuminate\Support\Collection
     */
    protected function getProjects(User $user, Volume $volume)
    {
        if ($user->can('sudo')) {
            // Global admins have no restrictions.
            return $volume->projects;
        }

        // All projects that the user and the volume have in common.
        return Project::inCommon($user, $volume->id)->get();
    }
}
