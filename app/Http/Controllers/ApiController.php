<?php namespace Dias\Http\Controllers;

use Illuminate\Contracts\Auth\Guard;
use Dias\Contracts\BelongsToProjectContract as BelongsToProject;
use Illuminate\Http\Request;

abstract class ApiController extends Controller {

	/**
	 * The authenticator.
	 * 
	 * @var Guard
	 */
	protected $auth;

	/**
	 * The request.
	 * 
	 * @var Request
	 */
	protected $request;

	/**
	 * Creates a new ApiController instance.
	 * 
	 * @param Guard $auth
	 * @param Request $request
	 */
	public function __construct(Guard $auth, Request $request)
	{
		$this->auth = $auth;
		$this->request = $request;
	}

	/**
	 * Checks if the given arguments are present or aborts with 400.
	 * 
	 * @param string|array $key required arguments
	 * @return void
	 */
	protected function requireArguments($key)
	{
		if (!$this->request->has(func_get_args()))
		{
			abort(400, 'Bad arguments.');
		}
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
		if (!$this->auth->user()->canSeeOneOfProjects($thing->projectIds()))
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
		if (!$this->auth->user()->canEditInOneOfProjects($thing->projectIds()))
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
		if (!$this->auth->user()->canAdminOneOfProjects($thing->projectIds()))
		{
			abort(401);
		}
	}
}
