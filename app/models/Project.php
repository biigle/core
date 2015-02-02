<?php

class Project extends Eloquent {

	public function users()
	{
		return $this->belongsToMany('User')
			->withPivot('role_id');
	}

	public function creator()
	{
		return $this->belongsTo('User', 'user_id');
	}

	public function usersWithRole($roleName)
	{
		$role = Role::where('name', '=', $roleName)
			->firstOrFail();

		return $this->users()
			->where('role_id', '=', $role->id);
	}

}
