@extends('manual.base')

@section('manual-title', 'Using custom assets in packages')

@section('manual-content')
<div class="row">
    <p class="lead">
        In this tutorial you will master custom package development by learning how to use custom assets like CSS and JavaScript and how to build upon the defaults provided by the core application.
    </p>
    <p>
        In previous tutorials on package development you've always used assets provided by the core application, like Bootstrap for styling. In this tutorial we'll talk about what assets are provided by default and how you can add to them with your own. If you haven't done the previous tutorials yet, <a href="{{ route('manual-documentation', 'package-development') }}">start there</a> and come back later.
    </p>

    <h3><a name="whats-already-there"></a>What's already there</h3>

    <p>
        The BIIGLE frontend is built upon two frameworks, <a href="http://getbootstrap.com/docs/3.4/">Bootstrap 3</a> for CSS and <a href="https://vuejs.org/">Vue.js</a> (exdended with the <a href="https://github.com/pagekit/vue-resource">vue-resource</a> plugin) for JavaScript. Using <a href="https://github.com/biigle/vue-strap">vue-strap</a> you can use <a href="https://github.com/biigle/vue-strap/blob/v2/src/index.js">some</a> interactive components of Bootstrap, too.
    </p>
    <p>
        In addition to the basic frameworks, the BIIGLE core application also provides Vue components and other objects e.g. for easy interaction with the RESTful API.
    </p>
    <p>
        Each view extending the base <code>app</code> template automatically has all these assets available. While you are able to ignore them and use your own frameworks for package development, you are highly encouraged to stick to the default frameworks, keeping the application lean and consistent.
    </p>

    <h4><a name="using-the-defaults"></a>Using the defaults</h4>

    <p>
        Using Bootstrap for styling is really simple. Just use the <a href="http://getbootstrap.com/docs/3.4/css/">documentation</a> as reference for what classes and components are available and you are done. You'll recall having used it already, implementing a <a href="http://getbootstrap.com/docs/3.4/components/#panels">panel</a> in the dashboard view mixin or using the <a href="http://getbootstrap.com/docs/3.4/css/#grid">grid system</a> in the new view of your <code>quotes</code> module.
    </p>
    <p>
        For using Vue.js you can stick to their documentation as well. If you are not familiar with it, you should <a href="https://vuejs.org/v2/guide/">start here</a> first since we can't give you a crash course in the scope of this tutorial. If you already have some experience with Vue.js you should be able to follow along fine. And maybe reading this tutorial will help you understanding the basics of Vue.js, too.
    </p>

    <h4><a name="building-upon-the-api"></a>Building upon the API</h4>

    <p>
        To show you how to use the provided JavaScript codebase and how to extend it with custom assets, we will extend the previously developed <code>quotes</code> module yet again. First we will implement a button that should interactively refresh the displayed quote in the quotes view and then we will add some custom styling.
    </p>
    <p>
        To give an example on how to use the provided codebase we would like our refresh button to simply display a user feedback message through the integrated messaging system first, without interacting with the backend. This will show you how to add core BIIGLE code as a dependency to your custom Vue.js components.
    </p>
    <p>
        To add custom JavaScript to a view, we need to add to the scripts section of the base <code>app</code> template. The scripts are usually located at the bottom of a page body so if we wanted to use the default assets already in the <code>content</code> section of the template it wouldn't work. To append our JavaScript to the scripts section, add the following to the <code>index.blade.php</code> template of our <code>quotes</code> package:
    </p>
<pre>
&#64;push('scripts')
&lt;script type="text/javascript"&gt;
   // your script goes here
&lt;/script&gt;
&#64;endpush
</pre>
    <p>
        Looking at the HTML of the rendered page, you'll notice that the new <code>script</code> tag is already appended at the correct location following all default scripts. So let's populate the tag with the following script:
    </p>
<pre>
biigle.$viewModel('quotes-container', function (element) {
    var messages = biigle.$require('messages.store');
    new Vue({
        el: element,
        methods: {
            refreshQuote: function () {
                messages.info("I don't do anything yet!");
            },
        },
    });
});
</pre>
    <p>
        The script already shows two of the <a href="https://github.com/biigle/core/blob/master/resources/assets/js/main.js">special functions</a> that BIIGLE uses for its JavaScript code <code>$viewModel</code> and <code>$require</code>. These functions make sure that the code is executed at the right time and in the right order. Modern JavaScript has different techniques to accomplish this but this is how BIIGLE evolved and it works well for BIIGLEs module system.
    </p>
    <p>
        The <code>$viewModel</code> function is used whenever a new Vue instance should be mounted to the DOM of a view. It accepts the ID of the DOM element as a first argument and a callback function that is executed when this element is encountered in the DOM as second argument. Most importantly, it dies <em>not</em> create the Vue instance if the specified element is not found in the DOM. This way you can have many BIIGLE modules active on the same page without them interfering with their Vue instances.
    </p>
    <p>
        The <code>$require</code> function returns an object that has been registered using the <code>$declare</code> function before. That's basically all you need to know about it. Take a look at the <a href="https://github.com/biigle/core/blob/master/resources/assets/js/main.js">source code</a> if you want to know more about these functions.
    </p>
    <p>
        The script above creates a new Vue instance when a DOM element with ID <code>quotes-container</code> is encountered. It also uses the object that has been registered as <code>messages.store</code>. The Vue instance has a single method which calls the <code>info</code> function of the messages object.
    </p>
    <p>
        Let's edit the <code>content</code> section of our quotes view to connect the <code>refreshQuote</code> function with a button and see if everything works:
    </p>
<pre>
&lt;div id="quotes-container" class="container"&gt;
   &lt;div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3"&gt;
      &lt;blockquote&gt;
         @{{ Inspiring::quote() }}
      &lt;/blockquote&gt;
      &lt;button class="btn btn-default" v-on:click="refreshQuote"&gt;refresh&lt;/button&gt;
   &lt;/div&gt;
&lt;/div&gt;
</pre>
    <p>
        We add the expected ID to the container element so the Vue instance is created on this page and we tell the Vue instance to call the <code>refreshQuote</code> function whenever a button is pressed. Try it out; press the new button and see how the <code>messages</code> object works.
    </p>
    <p>
        Now you know how to add your own JavaScript code to BIIGLE, how to create new Vue instances and how to make use of the JavaScript codebase that is already there. Let's go on to extend the new Vue instance and include it as custom asset.
    </p>

    <h3><a name="adding-your-own-assets"></a>Adding your own assets</h3>

    <p>
        In the little JavaScript example above we implemented a new Vue instance using the <code>script</code> tag, putting the code directly into the HTML. When working with real JavaScript and CSS you usually load these assets as external files. Now all public files - including CSS and JavaScript assets - reside in the <code>public</code> directory of a Laravel application. When custom packages like to use their own assets there needs to be a mechanism to <em>publish</em> the package assets to the public directory.
    </p>
    <p>
        Let's see how this works by extending our Vue instance to asynchronously refresh the quotes.
    </p>

    <h4><a name="publishing-javascript"></a>Publishing JavaScript</h4>

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
        Now Laravel can copy anything located in <code>src/public/assets</code> (of the module) to <code>public/vendor/quotes</code> (of the core), making the assets of the package available for use in the frontend. If you take a look at the <code>public/vendor</code> directory, you'll see assets of other packages there, too. Let's add our <code>quotes</code> assets by running the <code>artisan</code> utility from the root of the BIIGLE installation:
    </p>
<pre>
 php artisan vendor:publish --tag=public --provider="Biigle\Modules\Quotes\QuotesServiceProvider" --force
</pre>
    <p>
        We tell <code>artisan</code> to publish <strong>only</strong> the assets of our package so it doesn't overwrite the assets (e.g. configuration files) of other packages. It would do so because we used the <code>force</code> flag, since we want the files to be replaced during developing the JavaScript application. From now on you always have to run this command again after any changes to the JavaScript application, otherwise the public files wouldn't be refreshed.
    </p>
    <p>
        Our JavaScript is now publicly available so let's re-populate the <code>scripts</code> stack of the view template and everything should be back working again:
    </p>
<pre>
&#64;push('scripts')
&lt;script src="@{{ cachebust_asset('vendor/quotes/scripts/main.js') }}"&gt;&lt;/script&gt;
&#64;endpush
</pre>
    <p>
        The <code>cachebust_asset</code> helper function is a convenient way to generate URLs to files located in the <code>public</code> directory of the application. It also automatically appends a timestamp to the URL so browser caches are renewed when the file is updated.
    </p>
    <p>
        To asynchronously load new quotes from the server, we need a new route and controller method. Since you already know about routes and controllers, let's make it quick:
    </p>
    <p>
        The test in <code>QuotesControllerTest.php</code>:
    </p>
<pre>
public function testQuoteProvider()
{
   $user = UserTest::create();

   // Redirect to login page.
   $this->get('quotes/new')->assertStatus(302);

   $this->be($user);
   $this->get('quotes/new')->assertStatus(200);
}
</pre>
    <p>
        The route in <code>routes.php</code>:
    </p>
<pre>
$router->get('quotes/new', [
   'middleware' => 'auth',
   'uses' => 'QuotesController@quote',
]);
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
        When all tests pass, you have done everything right! Now let's rewrite our little Vue instance in <code>main.js</code> of the package:
    </p>
<pre>
biigle.$viewModel('quotes-container', function (element) {
    var messages = biigle.$require('messages.store');
    new Vue({
        el: element,
        data: {
            quote: '',
        },
        methods: {
            refreshQuote: function () {
                this.$http.get('quotes/new')
                    .then(this.handleResponse, messages.handleErrorResponse)
            },
            handleResponse: function (response) {
                this.quote = response.body;
            },
        },
        created: function () {
            this.refreshQuote();
        },
    });
});
</pre>
    <p>
        We now use the <code>$http.get</code> function of vue-resource to call the new <code>quotes/new</code> route whenever the refresh button is clicked. The response is written to the reactive property <code>quote</code>. If the response is an error, the <code>handleErrorResponse</code> function of the messages object is used to do error handling. In addition to the click on the button, the quote is also initially refreshed when the Vue instance is created.
    </p>
    <p>
        Finally, we have to rewire the view a little bit to display the dynamically loaded quote. To do so, replace the old <code>blockquote</code> element by this one:
    </p>
<pre>
&lt;blockquote v-text="quote"&gt;&lt;/blockquote&gt;
</pre>
    <p>
        This reactively sets the content of the element to whatever the content of the <code>quote</code> property is. Now publish the new JavaScript file, refresh the view and enjoy your asynchronously reloaded quote!
    </p>

    <h4><a name="publishing-css"></a>Publishing CSS</h4>

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
&#64;push('styles')
&lt;link href="@{{ cachebust_asset('vendor/quotes/styles/main.css') }}" rel="stylesheet"&gt;
&#64;endpush
</pre>
    <p>
        Publish the assets (the command stays the same) and reload the page. Stylish, isn't it?
    </p>

    <h4><a name="build-systems"></a>Build Systems</h4>

    <p>
        You probably noticed that manually publishing your assets every time you make a change can be very annoying. Also, it's common to publish JavaScript and CSS as <em>minified</em> files that are smaller and can be transferred faster to the clients. Build systems can do this automatically for you. A thorough explanation of build systems would be out of scope of this tutorial. Look for examples in the official BIIGLE modules on how to configure and use a build system. The BIIGLE modules use <a href="https://gulpjs.com/">gulp.js</a> with a <a href="https://github.com/mzur/gulp-helpers">custom extension</a> that was written specially for BIIGLE module development.
    </p>

    <h3><a name="conclusion"></a>Conclusion</h3>

    <p>
        Congratulations! Now you know (almost) anything there is to know about developing custom packages for BIIGLE. What's still left is how you can implement your views so they can be extended yet by others. You have done it yourself, implementing the dashboard view mixin. There are a few things to keep in mind when registering your own areas for view mixins but we'll cover that in another tutorial.
    </p>
</div>
@endsection
