<?php

namespace Biigle\Http\Controllers\Views\Volumes;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\MediaType;
use Biigle\Modules\UserDisks\UserDisk;
use Biigle\Modules\UserStorage\UserStorageServiceProvider;
use Biigle\PendingVolume;
use Biigle\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

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

        $offlineMode = config('biigle.offline_mode');

        if (class_exists(UserStorageServiceProvider::class)) {
            $userDisk = "user-{$user->id}";
        } else {
            $userDisk = null;
        }

        $isImageMediaType = $pv->media_type_id === MediaType::imageId();
        $mediaType = $isImageMediaType ? 'image' : 'video';

        $restored = session()->has('restored');

        $metadata = null;
        $oldName = '';
        $oldUrl = '';
        $oldHandle = '';
        if ($pv->hasMetadata()) {
            $metadata = $pv->getMetadata();
            $oldName = $metadata->name;
            $oldUrl = $metadata->url;
            $oldHandle = $metadata->handle;
        }

        $oldName = old('name', $oldName);
        $oldUrl = old('url', $oldUrl);
        $oldHandle = old('handle', $oldHandle);

        $filenamesFromMeta = false;
        if ($filenames = old('files')) {
            $filenames = str_replace(["\r", "\n", '"', "'"], '', old('files'));
        } elseif ($metadata) {
            $filenames = $metadata->getFiles()->pluck('name')->join(',');
            $filenamesFromMeta = !empty($filenames);
        }

        $hasAnnotations = $metadata && $metadata->hasAnnotations();
        $hasFileLabels = $metadata && $metadata->hasFileLabels();

        return view('volumes.create.step2', [
            'pv' => $pv,
            'project' => $pv->project,
            'disks' => $disks,
            'hasDisks' => !empty($disks),
            'filenames' => $filenames,
            'offlineMode' => $offlineMode,
            'userDisk' => $userDisk,
            'mediaType' => $mediaType,
            'isImageMediaType' => $isImageMediaType,
            'restored' => $restored,
            'oldName' => $oldName,
            'oldUrl' => $oldUrl,
            'oldHandle' => $oldHandle,
            'filenamesFromMeta' => $filenamesFromMeta,
            'hasAnnotations' => $hasAnnotations,
            'hasFileLabels' => $hasFileLabels,
        ]);
    }

    /**
     * Show the form to select labels of metadata annotations to import.
     *
     * @param Request $request
     */
    public function showAnnotationLabels(Request $request)
    {
        $pv = PendingVolume::findOrFail($request->route('id'));
        $this->authorize('update', $pv);

        if (is_null($pv->volume_id)) {
            return redirect()->route('pending-volume', $pv->id);
        }

        if (!$pv->hasMetadata()) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $metadata = $pv->getMetadata();

        if (!$metadata->hasAnnotations()) {
            abort(Response::HTTP_NOT_FOUND);
        }

        // Use values() for a more compact JSON representation.
        $labels = collect($metadata->getAnnotationLabels())->values();

        return view('volumes.create.annotationLabels', [
            'pv' => $pv,
            'labels' => $labels,
        ]);
    }
}
