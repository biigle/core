@extends('app')

@section('title') Package development @stop

@section('content')
<div class="container">
	<div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
		<div class="row">
			<h2>Package development</h2>

			<p class="lead">
				In this tutorial you will learn what PHP packages are, how they are developed and how you can create new DIAS modules by implementing your own packages.
			</p>

			<h3>Basics</h3>

			<p>
				DIAS is based on <a href="http://laravel.com/">Laravel</a>, a PHP framework for modern web applications. Laravel is designed in an object oriented and very modular fashion making it easily extensible with custom modules. DIAS is designed as a core application, providing user and database management, the RESTful API and some basic views (the dashboard or settings, for example). Any additional functionality - like project management - is added as a separate module, keeping the codebase clean and manageable.
			</p>
			<p>
				By implementing a custom module and installing or disabling modules developed by others, you can easily extend DIAS and shape it to your needs, without having to dig deep into the core application. Using <a href="https://getcomposer.org/">Composer</a>, the most popualar dependency manager for PHP packages, and <a href="https://packagist.org/">Packagist</a> you can even share your DIAS modules with others.
			</p>
			<p>
				So let's have a quick look at how PHP package development usually works.
			</p>

			<h4>Composer</h4>

			<p>
				In earlier days of PHP, you typically used libraries developed by others using the <code>require</code> keyword. When developing a large application having lots of dependencies, this method becomes very cumbersome an error-prone; not to mention the performance drawbacks of always loading every dependency. This is where Composer comes in.
			</p>
			<p>
				Composer is a dependency manager for PHP packages that makes managing dependencies of a large PHP application very easy. With a single <code>composer.json</code> configuration file, Composer takes care of downloading all the files and generating an <code>autoload.php</code> file. By <code>require</code>-ing this file, you are able to use all the depencencies you configured.
			</p>

			<h4>Package Development</h4>

			<p>
				The <code>conposer.json</code> is also used for developing new packages (similar to the <code>package.json</code> for Node.js modules). Each package has such a file, containing the dependencies of the package or the package name, for example. Take a look at the <code>composer.json</code> of the DIAS annotations package:
			</p>
<pre>
{
   "name": "dias/annotations",
   "require": {
      "dias/transects": "dev-master"
   },
   "autoload": {
      "psr-4": {
         "Dias\\Modules\\Annotations\\": "src"
      }
   }
}
</pre>
			<p>
				First, the name of the package is defined as <code>dias/annotations</code>. Packages are always namespaced like this, identifying the developer in the first part and the name of the package in the second. In this case the developer is <code>dias</code> because the annotations package is developed by the DIAS core team. For your own packages you might want to use your name or the name of your organization.
			</p>
			<p>
				Second, the dependencies of the package are delcared. Here, the annotations package requires the <code>dias/transects</code> package (since otherwise there is no way reaching the "annotator" application, but it can have other reasons, too).
			</p>
			<p>
				Last, the namespace of the PHP classes of this package is defined. The <code>autoload</code> section of this configuration tells composer that every file it finds in the <code>src</code> direcory belongs to the <code>Dias\Modules\Annotations\</code> namespace. Any further namespacing inside of this namespace is reflected by the directory structure in <code>src</code>.
			</p>
			<p>
				This is everything you need to understand the more detailed description of developing a package below; all you need for a new package is a directory containing a <code>composer.json</code> file.
			</p>

			<h4>Publishing Packages</h4>

			<p>
				By default, Composer looks for packages in the <a href="https://packagist.org/">Packagist</a> package repository. This is a convenient way of publishing packages to a broad audience. But you might want to keep your package private in some cases, either because it is still in development or you simply don't want to publish it. The good news is that you can still use Composer! The local/private alternative to Packagist is a version contol system like <a href="http://git-scm.com/">Git</a> that you should use for developing, anyway.
 			</p>
 			<p>
 				The VCS works just like the package repository, having master and develop branches as well as tagged versions. All you have to do is tell Composer to look at your private repository, too, while searching for packages. Have a look at the <a href="https://getcomposer.org/doc/05-repositories.md#vcs">Composer documentation</a> for further information.
 			</p>

			<h3>Setting Up A New Package</h3>

			<p>
				Having learned all the basics, let's now walk through the process of creating a new package. If you have a local installation of DIAS, you can follow along, implementing, and see how it works.
			</p>
			<p>
				Our new package should add a new panel to the DIAS dashboard and a new route/view, both displaying a random <a href="https://github.com/laravel/framework/blob/feb0cee6777daf487ef01b5a0c744d155ac8f057/src/Illuminate/Foundation/Inspiring.php">inspiring quote</a>.
			</p>
			<blockquote>
				<p>Well begun is half done.</p>
				<footer>Aristotle</footer>
			</blockquote>

			<h4>VCS and directory structure</h4>

			<p>
				In this tutorial we will use Git as VCS but you should be able to follow along with Mercurial or even Subversion just fine. So let's begin by creating a new repository for our package.
			</p>
<pre>
git init dias-quotes
</pre>
			<p>
				We then create the new directories <code>src</code> and <code>test</code>, and the <code>composer.json</code> file of the package with the following content:
			</p>
<pre>
{
   "name": "dias/quotes",
   "autoload": {
      "psr-4": {
         "Dias\\Modules\\Quotes\\": "src"
      }
   }
}
</pre>
			<p>
				You see, our new package is called <code>dias/quotes</code> but you are free to use your personal name prefix, too. In the autoload section, we define our package to reside in the <code>Dias\Modules\Quotes\</code> namespace. You can choose your own namespace here, too but <code>Dias\Modules\</code> is a good way to keep things organized.
			</p>
			<p>
				Normally you could start implementing now, but our new package still lacks a few things to integrate cleanly with Laravel.
			</p>

			<h4>Service Provider</h4>

			<p>
				Each package for Laravel contains one or more <a href="http://laravel.com/docs/5.0/providers">service provider</a> classes. These classes, among other things, tell Laravel where to find the package configuration, views or translation files. So let's create a file called <code>src/QuotesServiceProvider.php</code> with the following content:
			</p>
<pre>
&lt;?php namespace Dias\Modules\Quotes;

use Illuminate\Support\ServiceProvider;

class QuotesServiceProvider extends ServiceProvider {

   /**
   * Bootstrap the application events.
   *
   * @return void
   */
   public function boot()
   {
      //
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
</pre>
			<p>
				This skeleton is enough for now, we'll populate it later on. But it already enables us to require and install the new module to our DIAS application.
			</p>

			<h4>Installing the Package</h4>

			<p>
				Before the package can be installed, though, we need to make our first commit to the repository:
			</p>
<pre>
git add .
git commit -m "Initial commit"	
</pre>
			<p>
				When developing a real package (using Git), you now normally would create a bare remote repository on a server all developers can access, and push the first commit to this repository. But for this tutorial we can stick to the local repository, as well.
			</p>
			<p>
				Having the repository set up, let's switch to our DIAS installation and append it to the known repositories in the <code>composer.json</code>:
			</p>
<pre>
"repositories": [
   (...),
   {
      "type": "vcs",
      "url": "/local/path/to/dias-quotes"
   }
]
</pre>
			<p>
				Then add our new package to the required packages:
			</p>
<pre>
"require": {
   (...),
   "dias/quotes": "dev-master"
}
</pre>
			<p>
				Now you can let Composer install the package with <code>php composer.phar update dias/quotes</code> (get the <a href="https://getcomposer.org/composer.phar">composer.phar</a> if you don't have it already installed). That was it! You now can find a cloned copy of the package repository in the <code>vendors/dias/quotes</code> directory (the <code>dias/quotes</code> part is the package name, so the directory names may be different if your package name is different).
			</p>
			<p>
				Since the new directory is just a clone of the original repository, we can use it for development from now on. Like this you can see all the changes you make live in the application before committing or pushing them. Even more important: You can test the package in the complete application environment! But more on that later.
			</p>
			<p>
				We're not done with installing the new package, though. Laravel still has to be told, to <em>use</em> the package, too, since we want to add new routes and views and other Laravel specific stuff with the package. To activate the package, open the <code>config/app.php</code> file, scroll down to the <code>'providers'</code> array and append the service provider of our package:
			</p>
<pre>
'providers' => [
   (...),
   'Dias\Modules\Quotes\QuotesServiceProvider',
]
</pre>

			<p>
				Now we are finally done and the new package is installed and activated! Adding a new package to the <code>composer.json</code> and appending the service provider to the <code>app.php</code> is the usual procedure of installing a new DIAS module. To deactivate a module, simply comment out the line in the <code>'providers'</code> array (but be sure that this doesn't break any dependencies).
			</p>

			<h3>Developing the Package</h3>

			<h4>Testing</h4>
			Linking to main application for "live" testing, PHPUnit

			<h4>View Mixins</h4>

			<h4>Routes and Views</h4>

			<h4>Custom Assets</h4>
			publishing assets

			<h3>Conclusion</h3>

			<h3>Further reading</h3>

			<p>
				Laravel package developing documentation, Already implemented DIAS packages
			</p>
		</div>
	</div>
</div>
@endsection
