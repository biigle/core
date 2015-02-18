<?php namespace Dias\Providers;

use Illuminate\Contracts\Events\Dispatcher as DispatcherContract;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider {

	/**
	 * The event handler mappings for the application.
	 *
	 * @var array
	 */
	protected $listen = [
		'Dias\Events\UserLoggedInEvent' => [
			'Dias\Handlers\Events\LoginEventHandler@handle',
		],
	];

	/**
	 * Register any other events for your application.
	 *
	 * @param  \Illuminate\Contracts\Events\Dispatcher  $events
	 * @return void
	 */
	public function boot(DispatcherContract $events)
	{
		parent::boot($events);

		\Dias\Project::observe(new \Dias\Observers\ProjectObserver);
		\Dias\User::observe(new \Dias\Observers\UserObserver);
	}

}
