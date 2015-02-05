<?php

class UserProjectsAPIController extends \BaseController {

	private function getIfAllowedOrFail($id)
	{
		$user = Auth::user();
		if ((string) $user->id !== $id) App::abort(403);
		return $user;
	}

	/**
	 * Display the specified resource.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function index($id)
	{		
		return $this->getIfAllowedOrFail($id)->projects()->get();
	}

	/**
	 * Display the specified resource.
	 *
	 * @param  int  $id
	 * @return Response
	 */
	public function show($userId, $projectId)
	{
		return $this->getIfAllowedOrFail($userId)->projects()->find($projectId);
	}


}
