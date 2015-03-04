<?php namespace Dias\Http\Controllers\Api;

use Dias\Role;

class RoleController extends Controller {

	/**
	 * Shows all roles.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{
		return Role::all();
	}

	/**
	 * Displays the specified role.
	 *
	 * @param  int  $id
	 * @return Role
	 */
	public function show($id)
	{
		return Role::find($id);
	}
}
