<?php namespace Dias\Events;

use Dias\User;

use Illuminate\Queue\SerializesModels;

/**
 * This event will be created when a user was logged in.
 */
class UserLoggedIn extends Event {

	use SerializesModels;

	public $user;

	/**
	 * Create a new event instance.
	 *
	 * @return void
	 */
	public function __construct(User $user)
	{
		parent::__construct();
		$this->user = $user;
	}

}
