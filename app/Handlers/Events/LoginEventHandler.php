<?php namespace Dias\Handlers\Events;

use Dias\Events\UserLoggedInEvent;

use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldBeQueued;

class LoginEventHandler {
	
	/**
	 * Updates the login_at attribute of the logged in user.
	 *
	 * @param  UserLoggedInEvent  $event
	 * @return void
	 */
	public function handle(UserLoggedInEvent $event)
	{
		$event->user->login_at = $event->time;
		$event->user->save();
	}

}
