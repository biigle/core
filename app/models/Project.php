<?php

class Project extends Eloquent {

	public function users()
	{
		return $this->belongsToMany('User');
	}

	public function creator()
	{
		return $this->belongsTo('User');
	}

	public function usersWithRole($roleName)
	{
		$role = Role::where('name', '=', $roleName)
			->firstOrFail();

		return $this->users()->where('role_id', '=', $role->id);
	}

	public function transects()
	{
		return $this->belongsToMany('Transect');
	}
}
