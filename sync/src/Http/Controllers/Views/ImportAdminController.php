<?php

namespace Biigle\Modules\Sync\Http\Controllers\Views;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Label;
use Biigle\Modules\Sync\Support\Import\ArchiveManager;
use Biigle\Modules\Sync\Support\Import\LabelTreeImport;
use Biigle\Modules\Sync\Support\Import\UserImport;
use Biigle\Modules\Sync\Support\Import\VolumeImport;
use Biigle\Role;
use Biigle\User;

class ImportAdminController extends Controller
{
    /**
     * Shows the import admin page.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        // $allowedImports = config('sync.allowed_imports');
        // if (empty($allowedImports)) {
        //     abort(404);
        // }

        return view('sync::import.index');
    }

    /**
     * Shows the import admin page for a specific import which wasn't completed yet.
     *
     * @param ArchiveManager $manager
     * @param string $token Import token
     *
     * @return \Illuminate\Http\Response
     */
    public function show(ArchiveManager $manager, $token)
    {
        $import = $manager->get($token);

        if (is_object($import)) {
            if ($import instanceof UserImport) {
                return $this->showUserImport($import, $token);
            } elseif ($import instanceof LabelTreeImport) {
                return $this->showLabelTreeImport($import, $token);
            } elseif ($import instanceof VolumeImport) {
                return $this->showVolumeImport($import, $token);
            }
        }

        abort(404);
    }

    /**
     * Show the view for an unfinished user import.
     *
     * @param UserImport $import
     * @param string $token
     *
     * @return Illuminate\Http\Response
     */
    protected function showUserImport(UserImport $import, $token)
    {
        $importUsersCount = $import->getImportUsers()->count();
        $importCandidates = $import->getUserImportCandidates()
            ->map([$this, 'hideUserCredentials']);
        $importCandidatesCount = $importCandidates->count();
        $excludedCandidatesCount = $importUsersCount - $importCandidatesCount;

        return view('sync::import.showUser', compact(
            'importUsersCount',
            'importCandidates',
            'importCandidatesCount',
            'excludedCandidatesCount',
            'token'
        ));
    }

    /**
     * Show the view for an unfinished label tree import.
     *
     * @param LabelTreeImport $import
     * @param string $token
     *
     * @return Illuminate\Http\Response
     */
    protected function showLabelTreeImport(LabelTreeImport $import, $token)
    {
        $importLabelTreesCount = $import->getImportLabelTrees()->count();

        $labelTreeCandidates = $import->getLabelTreeImportCandidates()
            ->map(function ($item) {
                unset($item['labels']);

                return $item;
            });
        $labelTreeCandidatesCount = $labelTreeCandidates->count();

        $importLabels = $import->getImportLabelTrees()->pluck('labels')->collapse();
        $labelCandidates = $import->getLabelImportCandidates();
        $labelCandidatesCount = $labelCandidates->count();
        $conflictingParentIds = $labelCandidates->pluck('conflicting_parent_id')
            ->reject(function ($id) {
                return is_null($id);
            });
        if ($conflictingParentIds->isNotEmpty()) {
            $conflictingParents = Label::whereIn('id', $conflictingParentIds)->get();
        } else {
            $conflictingParents = collect();
        }

        $userCandidates = $import->getUserImportCandidates()
            ->map([$this, 'hideUserCredentials']);

        $excludedLabelTreeCandidatesCount = $importLabelTreesCount - $labelTreeCandidatesCount;

        $adminRoleId = Role::adminId();

        return view('sync::import.showLabelTree', compact(
            'importLabelTreesCount',
            'labelTreeCandidates',
            'labelTreeCandidatesCount',
            'importLabels',
            'labelCandidates',
            'labelCandidatesCount',
            'conflictingParents',
            'excludedLabelTreeCandidatesCount',
            'userCandidates',
            'adminRoleId',
            'token'
        ));
    }

    /**
     * Show the view for an unfinished volume tree import.
     *
     * @param LabelTreeImport $import
     * @param string $token
     *
     * @return Illuminate\Http\Response
     */
    protected function showVolumeImport(VolumeImport $import, $token)
    {
        $volumeCandidates = $import->getVolumeImportCandidates();

        $labelTreeCandidates = $import->getLabelTreeImportCandidates()
            ->map(function ($item) {
                unset($item['labels']);

                return $item;
            });

        $importLabels = $import->getImportLabelTrees()->pluck('labels')->collapse();

        $labelCandidates = $import->getLabelImportCandidates();
        $conflictingParentIds = $labelCandidates->pluck('conflicting_parent_id')
            ->reject(function ($id) {
                return is_null($id);
            });
        if ($conflictingParentIds->isNotEmpty()) {
            $conflictingParents = Label::whereIn('id', $conflictingParentIds)->get();
        } else {
            $conflictingParents = collect();
        }

        $userCandidates = $import->getUserImportCandidates()
            ->map([$this, 'hideUserCredentials']);

        $adminRoleId = Role::adminId();

        return view('sync::import.showVolume', compact(
            'volumeCandidates',
            'labelTreeCandidates',
            'importLabels',
            'labelCandidates',
            'conflictingParents',
            'userCandidates',
            'adminRoleId',
            'token'
        ));
    }

    /**
     * Hides sensitive user credentials that should not be returned to the frontend.
     * Must be public to be used as a callable in map().
     *
     * @param array $user
     *
     * @return array
     */
    public function hideUserCredentials($user)
    {
        return [
            'id' => $user['id'],
            'firstname' => $user['firstname'],
            'lastname' => $user['lastname'],
            'email' => $user['email'],
        ];
    }
}
