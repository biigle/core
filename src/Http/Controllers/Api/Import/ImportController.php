<?php

namespace Biigle\Modules\Sync\Http\Controllers\Api\Import;

use Exception;
use Biigle\Volume;
use Biigle\Project;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller;
use Illuminate\Validation\ValidationException;
use Biigle\Modules\Sync\Support\Import\UserImport;
use Biigle\Modules\Sync\Support\Import\VolumeImport;
use Biigle\Modules\Sync\Support\Import\ArchiveManager;
use Biigle\Modules\Sync\Support\Import\LabelTreeImport;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class ImportController extends Controller
{
    /**
     * Initiate a new import
     *
     * @api {post} import Initiate a new import
     * @apiGroup Import
     * @apiName StoreImport
     * @apiPermission admin
     * @apiDescription Redirects to the import page in the admin panel where the import can be edited and performed.
     *
     * @apiParam (Required parameters) {File} archive The export archive file.
     *
     * @param Request $request
     * @param ArchiveManager $manager
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, ArchiveManager $manager)
    {
        $this->validate($request, ['archive' => 'required|file|mimes:zip']);

        try {
            $token = $manager->store($request->file('archive'));
        } catch (Exception $e) {
            throw ValidationException::withMessages(['archive' => [$e->getMessage()]]);
        }

        return redirect()->route('admin-import-show', $token);
    }

    /**
     * @api {put} import/:token Perform an uploaded import
     * @apiGroup Import
     * @apiName UpdateImport
     * @apiPermission admin
     *
     * @param ArchiveManager $manager
     * @param  Request $request
     * @param string $token Import token
     * @return \Illuminate\Http\Response
     */
    public function update(ArchiveManager $manager, Request $request, $token)
    {
        $import = $manager->get($token);
        if (is_null($import)) {
            abort(404);
        }

        try {
            if ($import instanceof UserImport) {
                $this->updateUserImport($import, $request);
            } elseif ($import instanceof LabelTreeImport) {
                $this->updateLabelTreeImport($import, $request);
            } elseif ($import instanceof VolumeImport) {
                $this->updateVolumeImport($import, $request);
            } else {
                throw new Exception('Could not identify import type.');
            }

            $manager->delete($token);
        } catch (UnprocessableEntityHttpException $e) {
            throw ValidationException::withMessages(['import' => [$e->getMessage()]]);
        }
    }

    /**
     * @api {delete} import/:token Delete the temporary files of an import
     * @apiGroup Import
     * @apiName DestroyImport
     * @apiPermission admin
     *
     * @param ArchiveManager $manager
     * @param string $token Import token
     * @return \Illuminate\Http\Response
     */
    public function destroy(ArchiveManager $manager, $token)
    {
        if (!$manager->has($token)) {
            abort(404);
        }

        $manager->delete($token);

        return redirect()->route('admin-import');
    }

    /**
     * Perform a user import
     *
     * @param UserImport $import
     * @param Request $request
     */
    protected function updateUserImport(UserImport $import, Request $request)
    {
        $this->validate($request, [
            'only' => 'filled|array',
            'only.*' => 'int',
        ]);

        $import->perform($request->input('only'));
    }

    /**
     * Perform a label tree import
     *
     * @param LabelTreeImport $import
     * @param Request $request
     */
    protected function updateLabelTreeImport(LabelTreeImport $import, Request $request)
    {
        $this->validate($request, [
            'only_label_trees' => 'filled|array',
            'only_label_trees.*' => 'int',
            'only_labels' => 'filled|array',
            'only_labels.*' => 'int',
            'name_conflicts' => 'array',
            'name_conflicts.*' => 'in:import,existing',
            'parent_conflicts' => 'array',
            'parent_conflicts.*' => 'in:import,existing',
        ]);

        $import->perform(
            $request->input('only_label_trees'),
            $request->input('only_labels'),
            $request->input('name_conflicts', []),
            $request->input('parent_conflicts', [])
        );
    }

    /**
     * Perform a volume import
     *
     * @param VolumeImport $import
     * @param Request $request
     */
    protected function updateVolumeImport(VolumeImport $import, Request $request)
    {
        $this->validate($request, [
            'project_id' => 'required|int|exists:projects,id',
            'only' => 'filled|array',
            'only.*' => 'int',
            'new_urls' => 'array',
            'new_urls.*' => 'string',
            'name_conflicts' => 'array',
            'name_conflicts.*' => 'in:import,existing',
            'parent_conflicts' => 'array',
            'parent_conflicts.*' => 'in:import,existing',
        ]);

        $project = Project::findOrFail($request->input('project_id'));

        $import->perform(
            $project,
            auth()->user(),
            $request->input('only'),
            $request->input('new_urls', []),
            $request->input('name_conflicts', []),
            $request->input('parent_conflicts', [])
        );
    }
}
