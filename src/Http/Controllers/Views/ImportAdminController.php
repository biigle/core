<?php

namespace Biigle\Modules\Sync\Http\Controllers\Views;

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
                return $this->showUserImport($import);
            } elseif ($import instanceof LabelTreeImport) {
                return $this->showLabelTreeImport($import);
            } elseif ($import instanceof VolumeImport) {
                return $this->showVolumeImport($import);
            }
        }

        abort(404);
    }

    /**
     * Show the view for an unfinished user import.
     *
     * @param UserImport $import
     *
     * @return Illuminate\Http\Response
     */
    protected function showUserImport(UserImport $import)
    {
        return view('sync::import.showUser');
    }
}
