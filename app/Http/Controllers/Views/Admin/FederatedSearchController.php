<?php

namespace Biigle\Http\Controllers\Views\Admin;

use Biigle\FederatedSearchInstance;
use Biigle\Http\Controllers\Views\Controller;
use Illuminate\Http\Request;

class FederatedSearchController extends Controller
{
    /**
     * Show the federated search admin page.
     *
     * @param Request $request
     */
    public function index(Request $request)
    {
        $instances = FederatedSearchInstance::get();

        if ($request->has('edit')) {
            $editInstance = $instances->firstWhere('id', $request->input('edit'));
        } else {
            $editInstance = null;
        }

        return view('admin.federated-search', [
            'instances' => $instances,
            'editInstance' => $editInstance,
        ]);
    }
}
