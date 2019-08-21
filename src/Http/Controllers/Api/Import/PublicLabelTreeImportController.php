<?php

namespace Biigle\Modules\Sync\Http\Controllers\Api\Import;

use DB;
use Exception;
use Biigle\Role;
use Biigle\LabelTree;
use Illuminate\Http\Request;
use Biigle\Http\Controllers\Api\Controller;
use Illuminate\Validation\ValidationException;
use Biigle\Modules\Sync\Support\Import\ArchiveManager;

class PublicLabelTreeImportController extends Controller
{
    /**
     * Perform a public label tree import.
     *
     * @api {post} label-trees/import Perform a public label tree import
     * @apiGroup Sync
     * @apiName StorePublicLabelTreeImport
     * @apiPermission user
     *
     * @apiParam (Required parameters) {File} archive The public label tree export archive file.
     *
     * @param Request $request
     * @param ArchiveManager $manager
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, ArchiveManager $manager)
    {
        $this->authorize('create', LabelTree::class);
        $this->validate($request, ['archive' => 'required|file|mimes:zip']);

        $token = $manager->store($request->file('archive'));

        try {
            $import = $manager->get($token);
            if ($import->treeExists()) {
                throw new Exception('The label tree already exists.');
            }
            $tree = DB::transaction(function () use ($import, $request) {
                $tree = $import->perform();
                $tree->addMember($request->user(), Role::admin());

                return $tree;
            });
        } catch (Exception $e) {
            throw ValidationException::withMessages(['archive' => [$e->getMessage()]]);
        } finally {
            $manager->delete($token);
        }

        if ($this->isAutomatedRequest()) {
            return $tree;
        }

        return $this->fuzzyRedirect('label-trees', $tree->id)
            ->with('message', 'Label tree imported.')
            ->with('messageType', 'success');
    }
}
