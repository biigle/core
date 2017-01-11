@extends('app')

@section('title') Advanced package development @stop

@section('content')
<div class="container">
	<div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
		<div class="row">
			<h2>Advanced package development</h2>

			<p class="lead">
				In this tutorial you will learn some advanced techniques in package development for BIIGLE, like creating new routes and views, and how to test them using the BIIGLE testing environment.
			</p>

			<p>
				In a previous tutorial you have learned what PHP package development is all about and how to start developing your own BIIGLE module. If you haven't done the tutorial yet, <a href="{{ route('manual-documentation') }}/package-development">start there</a> and come back later, since we'll build upon that.
			</p>

			<p>
				Now we would like to take our <code>quotes</code> module and add a new route as well as a new view to the BIIGLE core application. Following the name of the package, the new view should display a random quote. We'll use the existing dashboard panel to add a link to the new view (otherwise the users will be unable to reach it).
			</p>

			<p>
				But before writing any production code, there always comes the testing. If you never heard of Test Driven Development, go <a href="http://butunclebob.com/ArticleS.UncleBob.TheThreeRulesOfTdd">ask Uncle Bob</a> and come back afterwards. Having a server application with restricted access and sensitive data thoroughly tested is always essential!
			</p>

			<h3><a name="testing"></a>Testing</h3>

			<p>
				Testing our <code>quotes</code> package on its own doesn't work for us, since we need Laravel for the routes, views and controllers we intend to implement. The core application has its testing environment already set up with all functional/unit tests residing in <code>tests/unit</code>. All you have to do is run <code>phpunit</code> in the root directory of the BIIGLE installation and the tests run. It would be best if we were able to test our package just like it would belong to the core application and fortunately there is a very easy way to do so.
			</p>
			<p>
				As already mentioned in the previous tutorial, we are now able to develop the package right out of the cloned repository in <code>vendor/biigle/quotes</code>. This is where we now create a new <code>tests</code> directory besides the existing <code>src</code>. Now all we have to do is to create a simple symlink from the <code>tests/unit</code> directory of the core application to the new <code>tests</code> directory of our package:
			</p>
<pre>
cd tests/unit
ln -s ../../vendor/biigle/quotes/tests/ quotes-module
</pre>
			<p>
				Now the tests of our package are just like any other part of the core application and will be run with <code>phpunit</code> as well. Let's try testing a new test! Create a new test class in <code>vendor/biigle/quotes/tests</code> called <code>QuotesServiceProvider.php</code> with the following content:
			</p>
<pre>
&lt;?php

class QuotesServiceProviderTest extends TestCase {

   public function testServiceProvider()
   {
      $this->assertTrue(
         class_exists('Biigle\Modules\Quotes\QuotesServiceProvider')
      );
   }
}
</pre>
			<p>
				You see, the test class looks just like all the other test classes of the core application. You'll find lots of examples on testing there, too. For more information, see the <a href="http://laravel.com/docs/5.0/testing">Laravel</a> and <a href="https://phpunit.de/manual/current/en/appendixes.assertions.html">PHPUnit</a> documentations. But does our test even pass? Check it by running PHPUnit in the root directory of the core application:
			</p>
<pre>
> phpunit --filter QuotesServiceProviderTest
PHPUnit 4.5.0 by Sebastian Bergmann and contributors.

Configuration read from /your/local/path/to/biigle/phpunit.xml

.

Time: 380 ms, Memory: 24.50Mb

OK (1 test, 1 assertion)
</pre>
			<p>
				Great! Now on to production code.
			</p>

			<h3><a name="a-new-route"></a>A new route</h3>

			<p>
				Usually, when creating a new view, we also need to create a new route. Routes are all possible URLs your web application can respond to; all RESTful API endpoints are routes, for example, and even the URL of this simple tutorial view is a route, too. What we would like to create is a <code>quotes</code> route, like <code>{{ url('quotes') }}</code>. Additionally only logged in users should be allowed to visit this route.
			</p>

			<h4><a name="adding-routes-with-a-custom-package"></a>Adding routes with a custom package</h4>

			<p>
				All routes of the core application are declared in the <code>app/Http/routes.php</code> file. If you take a look at this file, you'll see that route definition can get quite complex. Fortunately being able to add routes with custom packages, too, is a great way of keeping things organized.
			</p>
			<p>
				So just like the core application, we'll create a new <code>src/Http</code> directory for our package and add an empty <code>routes.php</code> file to it. For Laravel to load the routes declared in this file, we have to extend the <code>boot</code> method of our <code>QuotesServiceProvider</code> yet again and add the following line:
			</p>
<pre>
include __DIR__.'/Http/routes.php';
</pre>
			<p>
				Now we can start implementing our first route.
			</p>

			<h4><a name="implementing-a-new-route"></a>Implementing a new route</h4>

			<p>
				But first come the tests! Since it is very handy to have the tests for routes, controllers and views in one place (those three always belong together), we'll create a new test class already called <code>tests/QuotesControllerTest.php</code> looking like this:
			</p>
<pre>
&lt;?php

class QuotesControllerTest extends TestCase {

   public function testRoute()
   {
      $this->call('GET', 'quotes');
      $this->assertResponseOk();
   }
}
</pre>
			<p>
				With the single test function, we call the <code>quotes</code> route, we intend to implement, and check if the response is HTTP <code>200</code>. Let's check what PHPunit has to say about this:
			</p>
<pre>
> phpunit --filter QuotesControllerTest
PHPUnit 4.5.0 by Sebastian Bergmann and contributors.

Configuration read from /your/local/path/to/biigle/phpunit.xml

F

Time: 437 ms, Memory: 26.50Mb

There was 1 failure:

1) QuotesControllerTest::testRoutes
Expected status code 200, got 404
Failed asserting that false is true.

/your/local/path/to/biigle/vendor/laravel/framework/src/Illuminate/Foundation/Testing/AssertionsTrait.php:17
/your/local/path/to/biigle/vendor/biigle/quotes/tests/QuotesControllerTest.php:7

FAILURES!
Tests: 1, Assertions: 1, Failures: 1.
</pre>
			<p>
				Of course the test fails with a <code>404</code> since we haven't implemented the route yet and it can't be found by Laravel. But that's the spirit of developing TDD-like! To create the route, populate the new <code>routes.php</code> with the following content:
			</p>
<pre>
&lt;?php

Route::get('quotes', array(
   'as'   => 'quotes',
   'uses' => '\Biigle\Modules\Quotes\Http\Controllers\QuotesController@index'
));
</pre>
			<p>
				Here we tell Laravel that the <code>index</code> method of the <code>QuotesController</code> class of our package is responsible to handle <code>GET</code> requests to the <code>{{ url('quotes') }}</code> route. We also give the route the name <code>quotes</code> which will come in handy when we want to create links to it. Let's run the test again:
			</p>
<pre>
[...]
1) QuotesControllerTest::testRoute
Expected status code 200, got 500
Failed asserting that false is true.
[...]
</pre>
			<p>
				Now we get a <code>500</code>; that's an improvement, isn't it? You might have already guessed why we get the internal server error here: The controller for handling the request is still missing.
			</p>

			<h3><a name="a-new-controller"></a>A new controller</h3>

			<p>
				Controllers typically reside in the <code>Http/Controllers</code> namespace of a Laravel application. We defined the <code>src</code> directory of our package to be the root of the <code>Biigle\Modules\Quotes</code> namespace so we now create the new <code>src/Http/Controllers</code> directory to reflect the <code>Biigle\Modules\Quotes\Http\Controllers</code> namespace of our new controller.
			</p>

			<h4><a name="creating-a-controller"></a>Creating a controller</h4>

			<p>
				Let's create the controller by adding a new <code>QuotesController.php</code> to the <code>Controllers</code> directory, containing:
			</p>
<pre>
&lt;?php namespace Biigle\Modules\Quotes\Http\Controllers;

use Biigle\Http\Controllers\Views\Controller;

class QuotesController extends Controller {

	/**
	 * Shows the quotes page.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function index()
	{
	}
}
</pre>
			<p>
				The controller already extends the <code>Controller</code> class of the BIIGLE core application instead of the default Laravel controller, which will come in handy in a next tutorial. Let's have a look at our test:
			</p>
<pre>
> phpunit --filter QuotesControllerTest
PHPUnit 4.5.0 by Sebastian Bergmann and contributors.

Configuration read from /your/local/path/to/biigle/phpunit.xml

.

Time: 529 ms, Memory: 26.50Mb

OK (1 test, 1 assertion)
</pre>
			<p>
				Neat! You can now call the <code>quotes</code> route in your BIIGLE application whithout causing any errors. But wait, shouldn't the route have restricted access? If the user is not logged in, they should be redirected to the login page instead of seeing the quotes. Let's adjust our test:
			</p>
<pre>
$user = UserTest::create();
$user->save();

$this->call('GET', 'quotes');
// redirect to login page
$this->assertResponseStatus(302);

$this->be($user);
$this->call('GET', 'quotes');
$this->assertResponseOk();
</pre>
			<p>
				We first create a new test user (the <code>UserTest</code> class takes care of this), save them to the testing database and check if the route is only available if the user is authenticated. Now the test should fail again because the route is public:
			</p>
<pre>
[...]
1) QuotesControllerTest::testRoute
Failed asserting that 200 matches expected 302.
[...]
</pre>

			<h4><a name="middleware"></a>Middleware</h4>

			<p>
				Restricting the route to authenticated users is really simple since BIIGLE has everything already implemented. User authentication in Laravel is done using <a href="http://laravel.com/docs/5.0/middleware">middleware</a>, methods that are run before or after each request and are able to intercept it when needed.
			</p>
			<p>
				In BIIGLE, user authentication is checked by the <code>auth</code> middleware. To add the <code>auth</code> middleware to our route, we extend the route definition:
			</p>
<pre>
Route::get('quotes', array(
   'middleware' => 'auth',
   'as'         => 'quotes',
   'uses'       => '\Biigle\Modules\Quotes\Http\Controllers\QuotesController@index'
));
</pre>
			<p>
				That was it. The <code>auth</code> middleware takes care of checking for authentication and redirecting to the login page if needed. Run the test and see it pass to confirm this for yourself.
			</p>

			<h3><a name="a-new-view"></a>A new view</h3>

			<p>
				While the route and authentication works, there still is no content on our page. From the previous tutorial we already know how to implement a view, so let's create <code>src/resources/views/index.blade.php</code>:
			</p>
<pre>
&lt;blockquote&gt;
   @{{ Inspiring::quote() }}
&lt;/blockquote&gt;
</pre>
		<p>
			Now all we have to do is to tell the <code>index</code> method of our <code>QuotesController</code> to use this view as response of a request:
		</p>
<pre>
public function index()
{
   return view('quotes::index');
}
</pre>
			<p>
				Here, the <code>quotes::</code> view namespace is used which we defined in the <code>boot</code> method of our service provider in the previous tutorial. If we didn't use it, Laravel would look for the <code>index</code> view of the core application. Now you can call the route and see the quote.
			</p>
			<p>
				Pretty ugly, isn't it? The view doesn't look like the other BIIGLE views at all and, in fact, isn't even valid HTML. It displays only the code we defined in the view template and nothing else. This is where view inheritance comes in.
			</p>

			<h4><a name="inheriting-views"></a>Inheriting views</h4>

			<p>
				The BIIGLE core application has an <code>app</code> view template containing all the scaffolding of a HTML page and loading the default assets. This <code>app</code> template is what makes all BIIGLE views look alike.
			</p>
			</p>
				The Blade templating engine allows for view inheritance so you can create new views, building upon existing ones. When inheriting a view, you need to specify view <em>sections</em>, defining which part of the new view should be inserted into which part of the parent view. Let's see this in action by applying it to the <code>index.blade.php</code> view of our package:
			</p>
<pre>
&#64;extends('app')
&#64;section('title') Inspiring quotes &#64;stop
&#64;section('content')
&lt;div class="container"&gt;
   &lt;div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3"&gt;
      &lt;blockquote&gt;
         @{{ Inspiring::quote() }}
      &lt;/blockquote&gt;
   &lt;/div&gt;
&lt;/div&gt;
&#64;endsection
</pre>
			<p>
				Here we tell the templating engine that our view should extend the <code>app</code> view, inheriting all its content. The <code>app</code> view has two sections we can use, <code>title</code> and <code>content</code>. The <code>title</code> section is the content of the title tag in the HTML header. The <code>content</code> section is the "body" of the BIIGLE view. Since styling the body of the page is entirely up to the child view, we have to use the Bootstrap grid to get adequate spacing.
			</p>
			<p>
				Take a look at the page again. Now we are talking!
			</p>
			<p>
				To finish up, we quickly add a link to the new route to the previously developed view mixin of the dashboard. Open the <code>dashboardMain</code> view and edit the panel heading:
			</p>
<pre>
&lt;div class="panel-heading"&gt;
   &lt;a href="@{{ route('quotes') }}"&gt;&lt;h3 class="panel-title"&gt;Inspiring Quote&lt;/h3&gt;&lt;/a&gt;
&lt;/div&gt;
</pre>
			<p>
				The <code>route</code> helper function is an easy way to link to routes with a name. Even if the URL of the route changes, you don't have to change any code in the views.
			</p>

			<h3><a name="conclusion"></a>Conclusion</h3>

			<p>
				That's it! Now you have learned how to create new routes, controllers and views, and how to test them. This is everything you need to develop complex custom modules where all the content is rendered by the server.
			</p>
			<p>
				But there is still one step left for you to master package development: Custom assets. Besides using custom CSS to style the content beyond Bootstrap's capabilities, you need to be able to use custom JavaScript for interactive client side applications as well. In a next tutorial, we'll discuss how to include and publish custom assets and how to use the already provided functionality of the BIIGLE core client side application.
			</p>
			<p>
				<a href="{{ route('manual-documentation') }}" class="btn btn-default" title="Back to the core documentation"><span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span> back</a>
			</p>
		</div>
	</div>
</div>
@endsection
