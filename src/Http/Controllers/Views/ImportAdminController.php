<?php

namespace Biigle\Modules\Sync\Http\Controllers\Views;

use Biigle\User;
use Biigle\Http\Controllers\Views\Controller;
use Biigle\Modules\Sync\Support\Import\UserImport;
use Biigle\Modules\Sync\Support\Import\VolumeImport;
use Biigle\Modules\Sync\Support\Import\ArchiveManager;
use Biigle\Modules\Sync\Support\Import\LabelTreeImport;

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
        $conflictingImportUsers = $import->getConflicts();
        if ($conflictingImportUsers->isNotEmpty()) {
            $conflictingExistingUsers = User::whereIn('email', $conflictingImportUsers->pluck('email'))
                ->get()
                ->keyBy('email');

            return view('sync::import.showUserConflicts', compact(
                'conflictingImportUsers',
                'conflictingExistingUsers',
                'token'
            ));
        }

        $importUsersCount = $import->getImportUsers()->count();
        $importCandidates = $import->getUserImportCandidates()
            ->map(function ($user) {
                // Only return relevant information here. Do NOT return the password hashes!
                return [
                    'id' => $user['id'],
                    'firstname' => $user['firstname'],
                    'lastname' => $user['lastname'],
                    'email' => $user['email'],
                ];
            });
        $importCandidatesCount = $importCandidates->count();

        return view('sync::import.showUser', compact(
            'importUsersCount',
            'importCandidates',
            'importCandidatesCount',
            'token'
        ));
    }
}
