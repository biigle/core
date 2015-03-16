<?php namespace Dias\Modules\Transects;

use Illuminate\Support\ServiceProvider;
use Dias\Services\Modules;

class TransectsServiceProvider extends ServiceProvider {

	/**
	* Bootstrap the application events.
	*
	* @return void
	*/
	public function boot(Modules $modules)
	{
		$this->loadViewsFrom(__DIR__.'/resources/views', 'transects');
		$modules->addMixin('transects', 'dashboard.projects');
	}

	/**
	* Register the service provider.
	*
	* @return void
	*/
	public function register()
	{
		//
	}
}