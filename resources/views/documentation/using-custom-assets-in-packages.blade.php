@extends('app')

@section('title') Using custom assets in packages @stop

@section('content')
<div class="container">
	<div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
		<div class="row">
			<h2>Using custom assets in packages</h2>
			
			{{-- USE THE QUOTES VIEW, STYLE IT AND USE JS TO REFRESH IT INTERACIVELY --}}

			<p class="lead">
				In this tutorial you will master custom package development by learning how to use custom assets like CSS and JavaScript and how to build upon the defaults provided by the core application.
			</p>
			<p>
				In previous tutorials on package development you've always used assets provided by the core application, like Bootstrap for styling. In this tutorial we'll talk about what assets are provided by default and how you can add to them with your own. If you haven't done the previous tutorialy yet, <a href="{{ route('documentation').'/package-development' }}">start there</a> and come back later.
			</p>

			<h3>What's already there</h3>

			<p>
				The DIAS frontend is built upon two frameworks, <a href="http://getbootstrap.com/">Bootstrap</a> for CSS and <a href="https://angularjs.org/">AngularJS</a> (exdended with the <a href="https://docs.angularjs.org/api/ngResource">ngResource</a> module) for JavaScript. Using <a href="https://angular-ui.github.io/bootstrap/">Angular UI Bootstrap</a> you can use the interactive components of Bootstrap, too.
			</p>
			<p>
				In addition to the basic frameworks, the DIAS core application also provides AngularJS modules e.g. for easy interaction with the RESTful API. Check out the <a href="{{url('/doc/client/index.html') }}">client side documentation</a> for which resources are available.
			</p>
			<p>
				Each view extending the base <code>app</code> template automatically has all these assets available. While you are able to ignore them and use your own frameworks for package development, you are highly encouraged to stick to the default frameworks, keeping the application lean and consistent.
			</p>

			<h4>Using the defaults</h4>

			<p>
				Using Bootstrap for styling is really simple. Just use the <a href="http://getbootstrap.com/css/">documentation</a> as reference for what classes and components are available and you are done. You'll recall having used it already, implementing a <a href="http://getbootstrap.com/components/#panels">panel</a> in the dashboard view mixin or using the <a href="http://getbootstrap.com/css/#grid">grid system</a> in the new view of your <code>quotes</code> module.
			</p>
			<p>
				For using AngularJS you can stick to their documentation as well. If you are not familiar with it, you should <a href="https://thinkster.io/a-better-way-to-learn-angularjs/">learn about it</a> first since we can't give you a crash course in the scope of this tutorial. If you already have some experience with AngularJS you should be able to follow along fine. And maybe reading this tutorial will help you understanding the basics of AngularJS, too.
			</p>

			<h4>Building upon the API</h4>

			<p>
				While showing you how to use the provided client side API and how to extend it with custom assets, we will extend the previously developed <code>quotes</code> module yet again. First we will implement a button that should interactively refresh the displayed quote in the quotes view and then we will add some custom styling.
			</p>
			<p>
				To give an example on how to use the provided client side API we would like our refresh button to simply display a user feedback message through the integrated messaging system first, without interacting with the backend. This will show you how to add core DIAS modules as a dependency to your custom AngularJS modules and how to use the provided services.
			</p>
			<p>
				To add custom JavaScript to a view, we need to add to the scripts section of the base <code>app</code> template. The scripts are usually located at the bottom of a page body so if we wanted to use the default assets already in the <code>content</code> section of the template it wouldn't work. To append our JavaScript to the scripts section, add the following to the <code>index.blade.php</code> template of our <code>quotes</code> package:
			</p>
<pre>
&#64;section('scripts')
&lt;script type="text/javascript"&gt;
   // your script goes here
&lt;/script&gt;
&#64;append
</pre>
			<p>
				Looking at the HTML of the rendered page, you'll notice that the new <code>script</code> tag is already appended at the right position following all default scripts. So let's populate the tag with the following script:
			</p>
<pre>
angular.module('dias.quotes', ['dias.ui.messages']);
angular.module('dias.quotes').controller('QuotesController', function($scope, msg) {
   $scope.refreshQuote = function () {
      msg.info("I don't do anything yet!");
   };
});
</pre>
			<p>
				We create a new Angular module called <code>dias.quotes</code> and add the <code><a href="{{ url('doc/client/dias.ui.messages.html') }}">dias.ui.messages</a></code> module as a dependency. This enables us to inject the <code><a href="{{ url('doc/client/dias.ui.messages.msg.html') }}">msg</a></code> service into the controller function of the <code>QuotesController</code> we subsequently define. We then add the <code>refreshQuote</code> function to the scope of the controller that will display an info message when called.
			</p>
			<p>
				Let's edit the <code>content</code> section of our quotes view to see if everything works:
			</p>
<pre>
&lt;div class="container" data-ng-app="dias.quotes" data-ng-controller="QuotesController"&gt;
   &lt;div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3"&gt;
      &lt;blockquote&gt;
         @{{ Inspiring::quote() }}
      &lt;/blockquote&gt;
      &lt;button class="btn btn-default" data-ng-click="refreshQuote()"&gt;refresh&lt;/button&gt;
   &lt;/div&gt;
&lt;/div&gt;
</pre>
			<p>
				Here we tell AngularJS to load the <code>dias.quotes</code> module and to use the <code>QuotesController</code> as the controller for the entire container. We also add a button and define the <code>refreshQuote</code> function to be called whenever the button is clicked. Try it out; click the new button and see how the <code>msg</code> service works.
			</p>
			<p>
				Now you know how to use the provided AngularJS modules in your own modules and how to access the services and factories. Let's go on to extend the new <code>dias.quotes</code> module and include it as custom asset.
			</p>

			<h3>Adding your own assets</h3>

			<p>
				In the little JavaScript example above we implemented a new AngularJS module using the <code>script</code> tag, putting the code directly into the HTML. Working with real JavaScript and CSS you usually load these assets as external files. Now, all public files - including CSS and JavaScript assets - reside in the <code>public</code> directory of a Laravel application. When custom packages like to use their own assets there needs to be a mechanism to <em>publish</em> the package assets to the public directory.
			</p>
			<p>
				Let's see how this works by extending our AngularJS module to asynchronously refresh the quotes.
			</p>
			{{-- publishing custom assets --}}
			{{-- publish because of public directory --}}
			{{-- dont overwrite assets of others --}}

			<h4>Publishing JavaScript</h4>

			<p>
				First, we want to outsource the code written above to its own JavaScript file. Create a new file <code>src/public/assets/scripts/main.js</code> and populate it with the previously written code. Then remove the <code>script</code> tag from the view (not the section, though).
			</p>
			<p>
				Now we have to tell Laravel that our <code>quotes</code> package has some assets to publish. This is done by adding the following to the <code>boot</code> function of the <code>QuotesServiceProvider</code>:
			</p>
<pre>
$this->publishes([
   __DIR__.'/public/assets' => public_path('vendor/quotes'),
], 'public');
</pre>
			<p>
				Now Laravel can copy anything located in <code>src/public/assets</code> to <code>public/vendor/quotes</code>, making the assets of the package available for use in the frontend. If you take a look at the <code>public/vendor</code> directory, you'll see assets of other packages there, too. Let's add our <code>quotes</code> assets by running the <code>artisan</code> utility from the root of the DIAS installation:
			</p>
<pre>
 php artisan vendor:publish --provider="Dias\Modules\Quotes\QuotesServiceProvider" --force
</pre>
			<p>
				We tell <code>artisan</code> to publish <strong>only</strong> the assets of our package so it doesn't overwrite the assets (e.g. configuration files) of other packages. It would do so because we used the <code>force</code> flag, since we want the files to be replaced during developing the JavaScript application. From now on you always have to run this command again after any changes to the JavaScript application, otherwise the public files wouldn't be refreshed.
			</p>
			<p>
				Our JavaScript is now publicly available so let's re-populate the <code>scripts</code> section of the view template and everything should be back working again:
			</p>
<pre>
&#64;section('scripts')
&lt;script src="@{{ asset('vendor/quotes/scripts/main.js') }}"&gt;&lt;/script&gt;
&#64;append
</pre>
			<p>
				The <code>asset</code> helper function is a convenient way to generate URLs to files located in the <code>public</code> directory of the application.
			</p>
			<p>
				To asynchronously load new qutes from the server, we need a new route and controller method. Since you already know about routes and controllers, let's make it quick:
			</p>
			<p>
				The test in <code>QuotesControllerTest.php</code>:
			</p>
<pre>
public function testQuoteProvider()
{
   $user = UserTest::create();
   $user->save();

   $this->call('GET', 'quotes/new');
   // redirect to login page
   $this->assertResponseStatus(302);

   $this->be($user);
   $this->call('GET', 'quotes/new');
   $this->assertResponseOk();
}
</pre>
			<p>
				The route in <code>routes.php</code>:
			</p>
<pre>
Route::get('quotes/new', array(
   'middleware' => 'auth',
   'uses' => '\Dias\Modules\Quotes\Http\Controllers\QuotesController@quote'
));
</pre>
			<p>
				The controller function in <code>QuotesController.php</code>:
			</p>
<pre>
/**
 * Returns a new inspiring quote.
 * 
 * @return \Illuminate\Http\Response
 */
public function quote()
{
   return \Illuminate\Foundation\Inspiring::quote();
}
</pre>
			<p>
				When all tests pass, you have done everything right! Now let's rewrite our little AngularJS module in <code>main.js</code> of the package:
			</p>
<pre>
angular.module('dias.quotes', ['dias.api']);
angular.module('dias.quotes').controller('QuotesController', function($scope, URL, $http) {
   $scope.refreshQuote = function () {
      $http.get(URL + '/quotes/new').success(function (quote) {
         $scope.quote = quote;
      });
   };
   $scope.refreshQuote();
});
</pre>
			<p>
				We now require the <code><a href="{{ url('doc/client/dias.api.html') }}">dias.api</a></code> module so we can use the <code><a href="{{ url('doc/client/dias.api.URL.html') }}">URL</a></code> constant, containing the base URL of the application. We then use the <code><a href="https://docs.angularjs.org/api/ng/service/$http">$http</a></code> service of the AngularJS core to call the new <code>quotes/new</code> route whenever the button is clicked. The response is written into the <code>quote</code> property of the controller scope. This is done once when the controller is initialized, too, to get an initial quote without having to click the button.
			</p>
			<p>
				Finally, we have to rewire the view a little bit to display the dynamicly loaded quote. To do so, replace the old <code>blockquote</code> element by this one:
			</p>
<pre>
&lt;blockquote data-ng-bind="quote"&gt;&lt;/blockquote&gt;
</pre>
			<p>
				This dynamically sets the content of the element to whatever the content of the <code>quote</code> scope property is. Now publish the new JavaScript file, refresh the view and enjoy your asyncronously reloaded quote!
			</p>

			<h4>Publishing CSS</h4>

			<p>
				Publishing custom CSS files is very similar to publishing JavaScript. Having the <code>boot</code> method of the service provider already prepared, we now only have to create a new CSS file and include it in the view template. So let's see if we can style the displayed quote a little.
			</p>
			<p>
				Create a new <code>public/assets/styles/main.css</code> file for your package and add the style:
			</p>
<pre>
blockquote {
   border-color: #398439;
}
</pre>
			<p>
				Then add the new asset to the <code>styles</code> section of the view template:
			</p>
<pre>
&#64;section('styles')
&lt;link href="@{{ asset('vendor/quotes/styles/main.css') }}" rel="stylesheet"&gt;
&#64;append
</pre>
			<p>
				Publish the assets (the command stays the same) and reload the page. Stylish, isn't it?
			</p>

			<h3>Conclusion</h3>

			<p>
				Congratulations! Now you know (almost) anything there is to know about developing custom packages for DIAS. What's still left is how you can implement your views so they can be extended yet by others. You have done it yourself, implementing the dashboard view mixin. There are a few things to keep in mind when registering your own spaces for view mixins but we'll cover that in another tutorial.
			</p>
			
			<p>
				<a href="{{ route('documentation') }}" class="btn btn-default" title="Back to the documentation center"><span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span> back</a>
			</p>
		</div>
	</div>
</div>
@endsection
