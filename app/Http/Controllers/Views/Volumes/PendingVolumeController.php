<?php

namespace Biigle\Http\Controllers\Views\Volumes;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\LabelTree;
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

        // If the volume was already created, we have to redirect to one of the subsequent
        // steps.
        if (!is_null($pv->volume_id)) {
            if ($pv->import_annotations && empty($pv->only_annotation_labels) && empty($pv->only_file_labels) && empty($pv->label_map) && empty($pv->user_map)) {
                $redirect = redirect()->route('pending-volume-annotation-labels', $pv->id);
            } elseif ($pv->import_file_labels && empty($pv->only_file_labels) && empty($pv->label_map) && empty($pv->user_map)) {
                $redirect = redirect()->route('pending-volume-file-labels', $pv->id);
            } elseif (empty($pv->label_map) && empty($pv->user_map)) {
                $redirect = redirect()->route('pending-volume-label-map', $pv->id);
            } else {
                $redirect = redirect()->route('pending-volume-user-map', $pv->id);
            }

            return $redirect
                ->with('message', 'This is a pending volume that you did not finish before.')
                ->with('messageType', 'info');
        }

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

    /**
     * Show the form to select labels of metadata file labels to import.
     *
     * @param Request $request
     */
    public function showFileLabels(Request $request)
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

        if (!$metadata->hasFileLabels()) {
            abort(Response::HTTP_NOT_FOUND);
        }

        // Use values() for a more compact JSON representation.
        $labels = collect($metadata->getFileLabels())->values();

        return view('volumes.create.fileLabels', [
            'pv' => $pv,
            'labels' => $labels,
        ]);
    }

    /**
     * Show the form to select the label map for the metadata import.
     *
     * @param Request $request
     */
    public function showLabelMap(Request $request)
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

        $onlyLabels = $pv->only_annotation_labels + $pv->only_file_labels;
        $labelMap = collect($metadata->getMatchingLabels(onlyLabels: $onlyLabels));

        if ($labelMap->isEmpty()) {
            abort(Response::HTTP_NOT_FOUND);
        }

        // Merge with previously selected map on error.
        $oldMap = collect(old('label_map', []))->map(fn ($v) => intval($v));
        $labelMap = $oldMap->union($labelMap);

        $labels = [];

        if ($pv->import_file_labels) {
            $labels += $metadata->getFileLabels($pv->only_file_labels);
        }

        if ($pv->import_annotations) {
            $labels += $metadata->getAnnotationLabels($pv->only_annotation_labels);
        }

        $labels = collect($labels)->values();

        $project = $pv->project;

        // These label trees are required to display the pre-mapped labels.
        $labelTrees =
            LabelTree::whereIn(
                'id',
                fn ($query) =>
                $query->select('label_tree_id')
                    ->from('labels')
                    ->whereIn('id', $labelMap->values()->unique()->filter())
            )->get()->keyBy('id');

        // These trees can also be used for manual mapping.
        $labelTrees = $labelTrees->union($project->labelTrees->keyBy('id'))->values();

        $labelTrees->load('labels');

        // Hide attributes for a more compact JSON representation.
        $labelTrees->each(function ($tree) {
            $tree->makeHidden(['visibility_id', 'created_at', 'updated_at']);
            $tree->labels->each(function ($label) {
                $label->makeHidden(['source_id', 'label_source_id', 'label_tree_id', 'parent_id']);
            });
        });

        return view('volumes.create.labelMap', [
            'pv' => $pv,
            'labelMap' => $labelMap,
            'labels' => $labels,
            'labelTrees' => $labelTrees,
        ]);
    }

    /**
     * Show the form to select the user map for the metadata import.
     *
     * @param Request $request
     */
    public function showUserMap(Request $request)
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

        $onlyLabels = $pv->only_annotation_labels + $pv->only_file_labels;
        $userMap = collect($metadata->getMatchingUsers(onlyLabels: $onlyLabels));

        if ($userMap->isEmpty()) {
            abort(Response::HTTP_NOT_FOUND);
        }

        // Merge with previously selected map on error.
        $oldMap = collect(old('user_map', []))->map(fn ($v) => intval($v));
        $userMap = $oldMap->union($userMap);

        $users = collect($metadata->getUsers($onlyLabels))
            ->values()
            ->pluck('name', 'id');

        return view('volumes.create.userMap', [
            'pv' => $pv,
            'userMap' => $userMap,
            'users' => $users,
        ]);
    }

    /**
     * Show the view to finish the metadata import.
     *
     * @param Request $request
     */
    public function showFinish(Request $request)
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

        if (empty($metadata->getUsers())) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $onlyLabels = $pv->only_annotation_labels + $pv->only_file_labels;

        $labelMap = $metadata->getMatchingLabels($pv->label_map, $onlyLabels);
        $labelMapOk = array_search(null, $labelMap) === false;

        $userMap = $metadata->getMatchingUsers($pv->user_map, $onlyLabels);
        $userMapOk = array_search(null, $userMap) === false;

        return view('volumes.create.finish', [
            'pv' => $pv,
            'labelMapOk' => $labelMapOk,
            'userMapOk' => $userMapOk,
        ]);
    }
}
