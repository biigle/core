<?php

namespace Biigle\Http\Controllers\Views\Volumes;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\MediaType;
use Biigle\Modules\UserDisks\UserDisk;
use Biigle\Modules\UserStorage\UserStorageServiceProvider;
use Biigle\PendingVolume;
use Biigle\Role;
use Illuminate\Http\Request;

class PendingVolumeController extends Controller
{
    /**
     * Shows the pending volume page to continue/finish a new volume.
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request)
    {
        $pv = PendingVolume::with('project')->findOrFail($request->route('id'));
        $this->authorize('access', $pv);

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

        $filenames = str_replace(["\r", "\n", '"', "'"], '', old('files'));
        $offlineMode = config('biigle.offline_mode');

        if (class_exists(UserStorageServiceProvider::class)) {
            $userDisk = "user-{$user->id}";
        } else {
            $userDisk = null;
        }

        $mediaType = match ($pv->media_type_id) {
            MediaType::videoId() => 'video',
            default => 'image',
        };

        return view('volumes.create.step2', [
            'pv' => $pv,
            'project' => $pv->project,
            'disks' => $disks,
            'hasDisks' => !empty($disks),
            'filenames' => $filenames,
            'offlineMode' => $offlineMode,
            'userDisk' => $userDisk,
            'mediaType' => $mediaType,
        ]);
    }
}
