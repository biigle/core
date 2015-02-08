<?php namespace Dias\Events;

use Dias\Events\Event;
use Dias\User;

use Illuminate\Queue\SerializesModels;

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
