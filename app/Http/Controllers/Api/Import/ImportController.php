<?php

namespace Biigle\Http\Controllers\Api\Import;

use Biigle\Http\Controllers\Api\Controller;
use Biigle\Project;
use Biigle\Services\Import\ArchiveManager;
use Biigle\Services\Import\LabelTreeImport;
use Biigle\Services\Import\UserImport;
use Biigle\Services\Import\VolumeImport;
use Biigle\Volume;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class ImportController extends Controller
{
    /**
     * Creates a new instance.
     */
    public function __construct()
    {
        $this->middleware('can:sudo');
    }

    /**
     * Initiate a new import.
     *
     * @api {post} import Initiate a new import
     * @apiGroup Sync
     * @apiName StoreImport
     * @apiPermission admin
     * @apiDescription Redirects to the import page in the admin panel where the import can be edited and performed.
     *
     * @apiParam (Required parameters) {File} archive The export archive file.
     *
     * @param Request $request
     * @param ArchiveManager $manager
     * @return \Illuminate\Http\RedirectResponse
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
     * @api {put} import/:token Perform an import
     * @apiGroup Sync
     * @apiName UpdateImport
     * @apiPermission admin
     *
     * @apiParam {string} token The import token.
     *
     * @apiParam (User import parameters) {array} only (optional) Array of user IDs to import.
     *
     * @apiParam (Label tree import parameters) {array} only_label_trees (optional) Array of label trees IDs to import.
     * @apiParam (Label tree import parameters) {array} only_labels (optional) Array of label IDs to import.
     * @apiParam (Label tree import parameters) {array} name_conflicts (optional) Array that specifies how label name conflicts should be resolved either `'import'` or `'existing'` for each conflicting label. Example: `[10 => 'import']` uses the imported name of the label with ID 10.
     * @apiParam (Label tree import parameters) {array} parent_conflicts (optional) Array that specifies how label parent conflicts should be resolved either `'import'` or `'existing'` for each conflict. See `name_conflicts` for an example.
     *
     * @apiParam (Volume import parameters) {array} project_id ID of the project to attach the imported volumes to.
     * @apiParam (Volume import parameters) {array} only (optional) Array of volume IDs to import.
     * @apiParam (Volume import parameters) {array} new_urls (optional) New volume URLs to use for each volume. Example: `[10 => 'local://my/volume']` changes the URL for the volume with impoer ID 10.
     * @apiParam (Volume import parameters) {array} name_conflicts (optional) See the label tree import parameters.
     * @apiParam (Volume import parameters) {array} parent_conflicts (optional) See the label tree import parameters.
     *
     * @param ArchiveManager $manager
     * @param  Request $request
     * @param string $token Import token
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
     * @api {delete} import/:token Abort an import
     * @apiGroup Sync
     * @apiName DestroyImport
     * @apiPermission admin
     *
     * @apiParam {string} token The import token.
     *
     * @param ArchiveManager $manager
     * @param string $token Import token
     * @return \Illuminate\Http\RedirectResponse
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
     * Perform a user import.
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
     * Perform a label tree import.
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
     * Perform a volume import.
     *
     * @param VolumeImport $import
     * @param Request $request
     */
    protected function updateVolumeImport(VolumeImport $import, Request $request)
    {
        $this->validate($request, [
            'project_id' => 'required|integer|exists:projects,id',
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
