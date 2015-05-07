@extends('app')

@section('title'){{ trans('dias.titles.doc') }}@stop

@section('content')
<div class="container">
	<div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
		<div class="row">
			<h2>Documentation</h2>
			<p class="lead">
				This is the documentation center where you can find the API documentation of the server and client applications, as well as the RESTful API. Additionally there are tutorials on custom module development and how-tos.
			</p>
		</div>
		<div class="row">
			<h3><a name="tutorials"></a>Tutorials</h3>

			<h4>Installing DIAS</h4>
			<p>
				Walking through the DIAS installation process, we'll show you how to get the application up and running on your own server.
				{{-- install the application / readme --}}
			</p>
			
			<h4><a href="{{ route('documentation').'/package-development' }}">Package development</a></h4>
			<p>
				Learn about PHP package development and how to add custom functionality to your DIAS installation by developing your own modules.
			</p>

			<h4><a href="{{ route('documentation').'/advanced-package-development' }}">Advanced package development</a></h4>
			<p>
				Learn how to add new views and routes with a custom package and how to properly test them using the DIAS testing environment.
			</p>

			<h4><a href="{{ route('documentation').'/using-custom-assets-in-packages' }}">Using custom assets in packages</h4></a>
			<p>
				Learn how to handle custom assets like CSS and JavaScript in addition to the defaults provided by the core application.
			</p>

			<h4>Mastering view mixins</h4>
			<p>
				Building your custom extensions is nice but what about extending the extensions? Learn how to use the view mixin registry of DIAS allowing other modules to extend yours.
			</p>

			{{-- defining view mixins using the View\Controller of DIAS --}}
			{{-- adding asset view mixins for repeating view mixins --}}
		</div>
		<div class="row">
			<h3>RESTful API</h3>
			<p>
				You may access most of the functionality of this application using the RESTful API. Most of the API requires user authentication via session cookie (being logged in to the website) but it is also available for external requests using a personal API key. You can manage your API key in the <a href="{{ route('settings') }}">user settings</a>.
			</p>
			<p>
				The API works with form (<code>x-www-form-urlencoded</code>) as well as JSON requests. For form requests, you can use <a href="http://laravel.com/docs/5.0/routing#method-spoofing">method spoofing</a> to use different HTTP methods. For the complete documentation, check out the link below.
			</p>
			<p>
				<a class="btn btn-default btn-lg btn-block" href="{{ url('doc/api/index.html') }}">RESTful API documentation</a>
			</p>
		</div>
		<div class="row">
			<h3>Server</h3>
			<p>
				The server application is written in PHP using the <a href="http://laravel.com/">Laravel</a> framework. Have a look at their <a href="http://laravel.com/docs/5.0">excellent documentation</a> for further information. For the class reference and API documentation, check out the link below.
			</p>
			<p>
				Laravel allows a modular application design using custom packages (or modules). In fact, the core of this application doesn't provide much more than user and database management as well as the RESTful API. Any additional functionality is added by a new module.
			</p>
			<p>
				We encourage you to add functionality by developing your own modules! There are some resources on package development in the <a href="http://laravel.com/docs/5.0/packages">Laravel documentation</a> but we have some <a href="#tutorials">tutorials</a> here as well.
			</p>
			<p>
				<a class="btn btn-default btn-lg btn-block" href="{{ url('doc/server/index.html') }}">Server API documentation</a>
			</p>
		</div>
		<div class="row">
			<h3>Client</h3>
			<p>
				The client side application is written in JavaScript using the <a href="https://angularjs.org/">AngularJS</a> framework. AngularJS, by default, wraps any application in a module, which works very well with the server side PHP modules for custom package development. The core modules of this application essentially provide utility functions like Angular resources for the RESTful API access or services for e.g. the user feedback <a onclick="window.$diasPostMessage('info', 'I am the user feedback messaging system!');">messaging system</a>.
			</p>
			<p>
				While custom server side modules are free to use any JavaScript framework (or none at all) for client side interactions, the AngularJS core modules are always available for convenient access to the RESTful API and integration in the application ecosystem. Therfore using AngularJS for custom module development is highly recommended.
			</p>
			<p>
				<a class="btn btn-default btn-lg btn-block" href="{{ url('doc/client/index.html') }}">Client API documentation</a>
			</p>
		</div>
		@foreach ($mixins as $module => $nestedMixins)
			@include($module.'::documentation', array('mixins' => $nestedMixins))
		@endforeach
	</div>
</div>
@endsection
