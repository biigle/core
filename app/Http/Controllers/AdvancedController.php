<?php

namespace Dias\Http\Controllers;

use Dias\Http\Controllers\Controller as BaseController;
use Dias\Contracts\BelongsToProjectContract as BelongsToProject;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

/**
 * A controller with extended attributes and methods.
 */
abstract class AdvancedController extends BaseController
{
    /**
     * The authenticated user.
     *
     * @var \Dias\User
     */
    protected $user;

    /**
     * The request.
     *
     * @var Request
     */
    protected $request;

    /**
     * Creates a new AdvancedController instance.
     *
     * @param Request $request
     */
    public function __construct(Request $request)
    {
        $this->user = auth()->user();
        $this->request = $request;
    }

    /**
     * Requires the requesting user to be able to see the thing.
     *
     * @param BelongsToProject $thing a thing that belongs to a project
     * @return void
     */
    protected function requireCanSee(BelongsToProject $thing)
    {
        if (!$this->user->canSeeOneOfProjects($thing->projectIds())) {
            abort(401, 'You are not allowed to see this.');
        }
    }

    /**
     * Requires the requesting user to be able to edit the thing.
     *
     * @param BelongsToProject $thing a thing that belongs to a project
     * @return void
     */
    protected function requireCanEdit(BelongsToProject $thing)
    {
        if (!$this->user->canEditInOneOfProjects($thing->projectIds())) {
            abort(401, 'You need editor privileges to perform this operation.');
        }
    }

    /**
     * Requires the requesting user to be able to admin the thing.
     *
     * @param BelongsToProject $thing a thing that belongs to a project
     * @return void
     */
    protected function requireCanAdmin(BelongsToProject $thing)
    {
        if (!$this->user->canAdminOneOfProjects($thing->projectIds())) {
            abort(401, 'You need admin privileges to perform this operation.');
        }
    }

    protected function requireAdmin()
    {
        if (!$this->user->isAdmin) {
            abort(401, 'You need admin privileges to perform this operation.');
        }
    }
}
