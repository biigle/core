<?php namespace Dias\Handlers\Events;

use Dias\Events\UserLoggedIn;

use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldBeQueued;

class LoginEventHandler {
	
	/**
	 * Handle the event.
	 *
	 * @param  UserLoggedIn  $event
	 * @return void
	 */
	public function handle(UserLoggedIn $event)
	{
		$event->user->login_at = $event->time;
		$event->user->save();
	}

}
