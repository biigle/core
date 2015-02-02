<?php

class Role extends Eloquent {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	public function projectUsers()
	{
		return $this->hasMany('User', 'project_user');
	}

}
