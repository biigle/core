<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\Label;
use Biigle\Services\Import\ArchiveManager;
use Biigle\Services\Import\LabelTreeImport;
use Biigle\Services\Import\UserImport;
use Biigle\Services\Import\VolumeImport;
use Biigle\Role;
use Biigle\User;

class ImportController extends Controller
{
    /**
     * Shows the import admin page.
     *
     * @return \Illuminate\View\View
     */
    public function index()
    {
        // $allowedImports = config('sync.allowed_imports');
        // if (empty($allowedImports)) {
        //     abort(404);
        // }

        return view('import.index');
    }

    /**
     * Shows the import admin page for a specific import which wasn't completed yet.
     *
     * @param ArchiveManager $manager
     * @param string $token Import token
     *
     * @return \Illuminate\View\View
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
     * @return \Illuminate\View\View
     */
    protected function showUserImport(UserImport $import, $token)
    {
        $importUsersCount = $import->getImportUsers()->count();
        $importCandidates = $import->getUserImportCandidates()
            ->map([$this, 'hideUserCredentials']);
        $importCandidatesCount = $importCandidates->count();
        $excludedCandidatesCount = $importUsersCount - $importCandidatesCount;

        return view('import.showUser', compact(
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
     * @return \Illuminate\View\View
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

        return view('import.showLabelTree', compact(
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
     * @return \Illuminate\View\View
     */
    protected function showVolumeImport(VolumeImport $import, string $token)
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

        return view('import.showVolume', compact(
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
