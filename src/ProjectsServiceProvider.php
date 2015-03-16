<?php namespace Dias\Modules\Projects;

use Illuminate\Support\ServiceProvider;
use Dias\Services\Modules;

class ProjectsServiceProvider extends ServiceProvider {

	/**
	* Bootstrap the application events.
	*
	* @return void
	*/
	public function boot(Modules $modules)
	{
		$this->loadViewsFrom(__DIR__.'/resources/views', 'projects');
		$modules->addMixin('projects', 'dashboard');
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