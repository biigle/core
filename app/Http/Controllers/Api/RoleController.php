<?php namespace Dias\Http\Controllers\Api;

use Dias\Http\Controllers\ApiController;
use Dias\Role;

class RoleController extends ApiController {

	/**
	 * Shows all roles.
	 *
	 * @return Response
	 */
	public function index()
	{
		return Role::all();
	}

	/**
	 * Displays the specified role.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function show($id)
	{
		return Role::find($id);
	}
}
