<?php

namespace Biigle\Http\Controllers\Views\LabelTrees;

use Biigle\Http\Controllers\Views\Controller;
use Biigle\LabelTree;
use Biigle\Role;
use Biigle\Visibility;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class LabelTreeMembersController extends Controller
{
    /**
     * Shows the label tree members.
     *
     * @param Request $request
     * @param int $id project ID
     * @return \Illuminate\Http\Response
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $tree = LabelTree::findOrFail($id);
        if (!is_null($tree->version_id)) {
            abort(Response::HTTP_NOT_FOUND);
        }

        $this->authorize('update', $tree);

        $roles = collect([Role::admin(), Role::editor()]);

        $roleOrder = [
            Role::editorId(),
            Role::adminId(),
        ];

        $members = $tree->members()
            ->select('id', 'firstname', 'lastname', 'label_tree_user.role_id', 'affiliation')
            ->get()
            ->sort(function ($a, $b) use ($roleOrder) {
                return array_search($b->role_id, $roleOrder) - array_search($a->role_id, $roleOrder);
            })
            ->values();


        $visibilities = collect([
            Visibility::publicId() => Visibility::public()->name,
            Visibility::privateId() => Visibility::private()->name,
        ]);

        return view('label-trees.show.members', [
            'tree' => $tree,
            'members' => $members,
            'roles' => $roles,
            'visibilities' => $visibilities,
            'private' => $tree->visibility_id === Visibility::privateId(),
            'activeTab' => 'members',
        ]);
    }
}
