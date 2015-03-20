<?php namespace Dias\Http\Controllers;

use Dias\Http\Controllers\Controller as BaseController;
use Dias\Contracts\BelongsToProjectContract as BelongsToProject;

use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;

/**
 * A controller with extended attributes and methods.
 */
abstract class AdvancedController extends BaseController {

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
	 * @param Guard $auth
	 * @param Request $request
	 */
	public function __construct(Guard $auth, Request $request)
	{
		$this->user = $auth->user();
		$this->request = $request;
	}

	/**
	 * Requires the thing to be not `null` or aborts with 404.
	 * 
	 * @param mixed $thing
	 * @return mixed the thing if it is not `null`
	 */
	protected function requireNotNull($thing)
	{
		if ($thing === null)
		{
			abort(404);
		}

		return $thing;
	}
	
	/**
	 * Requires the requesting user to be able to see the thing.
	 * 
	 * @param BelongsToProject $thing a thing that belongs to a project
	 * @return void
	 */
	protected function requireCanSee(BelongsToProject $thing)
	{
		if (!$this->user->canSeeOneOfProjects($thing->projectIds()))
		{
			abort(401);
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
		if (!$this->user->canEditInOneOfProjects($thing->projectIds()))
		{
			abort(401);
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
		if (!$this->user->canAdminOneOfProjects($thing->projectIds()))
		{
			abort(401);
		}
	}
}
