@extends('app')

@section('title') Mastering view mixins @stop

@section('content')
<div class="container">
	<div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
		<div class="row">
			<h2>Mastering view mixins</h2>

			<p class="lead">
				In this tutorial we will look at how to register areas for view mixins, enabling other packages to extend your views. We then look at some advanced use cases of view mixins.
			</p>
			<p>
				You have <a href="{{ route('documentation').'/package-development' }}">used view mixins before</a> to extend existing views with a new package (if you haven't, <a href="{{ route('documentation').'/package-development' }}">start there</a> and come back later). But how can you enable others to extend the views of <em>your</em> package? Let's have a look at how registering new areas for mixins works.
			</p>

			<h3>Implementing a new area for view mixins</h3>

			<p>
				Implementing a new area for view mixins is not a great deal. Everything happens in the view so no controllers need to be changed if new mixins are added (especially handy for mixins in the global navbar)!
			</p>

			<h4>Handling the mixins in the view</h4>

			<p>
				View mixins are basically no more than a dynamic usage of the <code>&#64;include</code> control structure of the <a href="http://laravel.com/docs/5.0/templates">Blade templating engine</a>. With <code>&#64;include</code> you can take a view and insert it into another view making view modularization and separation of concerns possible. Adding a view mixin to a view is nothing else than <code>&#64;include</code>-ing it, except the name of the view to load is dynamically fetched from the <code>Dias\Services\Modules</code> service.
			</p>
			<p>
                But first we need to <a href="http://laravel.com/docs/5.1/blade#service-injection">inject</a> the <code>Modules</code> service into the view like this:
            </p>
<pre>
&#64;inject('modules', 'Dias\Services\Modules')
</pre>
            <p>
				Now the service can be used to fetch the names of all views that should be included as a mixin. Let's take a look at how the dashboard view handles including the mixins:
			</p>
<pre>
&#64;forelse ($modules->getMixins('dashboard') as $module => $nestedMixins)
   &#64;include($module.'::dashboard', array('mixins' => $nestedMixins))
&#64;empty
   &lt;p class="alert alert-info"&gt;
      You don't have any dashboard modules activated yet.
   &lt;/p&gt;
&#64;endforelse
</pre>
			<p>
				First, it makes use of the <code>&#64;forelse</code> Blade control structure to display a message if there are no view mixins. Otherwise it loops over all the content of the array returned by the modules service. Each item is a key-value pair called <code>$module</code> as the key and <code>$nestedMixins</code> as the value. We'll set aside the nested mixins for the next section.
			</p>
			<p>
				The <code>$module</code> variable for each item contains the view namespace of the package that registered the mixin. If your package were called <code>quotes</code> and you wanted to load the <code>dashboard</code> view from it, you'd access it with <code>quotes::dashboard</code>. The part before the <code>::</code> is the view namespace of the package (the namaspace is defined by the <code>loadViewsFrom</code> method, really, not by the package name but you should always use the same identifiers).
			</p>
			<p>
				Following the <a href="http://en.wikipedia.org/wiki/Convention_over_configuration">convention over configuration</a> paradigm, if a package wants to add a mixin to the <code>dashboard</code> view, the mixin should be called <code>dashboard</code>, too (resulting in <code>views/dashboard.blade.php</code> in the package). If a view has multiple areas reserved for mixins, these identifiers can differ. We'll cover that in a later section.
			</p>
			<p>
				Now you know how view mixins essentially work. Using the code snippets from above as an example, you are able to allow view mixins to be added to a view of your own package. Let's now have a look at some advanced use cases for view mixins.
			</p>

			<h3>Nested mixins</h3>

			<p>
				Let's stay in the dashboard example. If you fiddle with the providers array of DIAS' <code>config/app.php</code> and disable the transects module, you'll notice on the dashboard that the transect thumbnail images inside of the project boxes disappear. If you then disable the projects module as well, the project boxes will disappear, too. So the transect thumbnails and project boxes <em>both</em> must be view mixins. But the thumbnails are inside of the project boxes so there must be a mechanism for nesting view mixins.
			</p>

			<h4>Displaying nested mixins</h4>

			<p>
				We have already seen the <code>$nestedMixins</code> variable in the code snippet above. Let's take a closer look at it:
			</p>
<pre>
&#64;forelse ($modules->getMixins('dashboard') as $module => <strong>$nestedMixins</strong>)
   &#64;include($module.'::dashboard', <strong>array('mixins' => $nestedMixins)</strong>)
</pre>
			<p>
				Previously we only talked about keys of the mixins array (<code>$module</code>). The values of the array (<code>$nestedMixins</code>) contain an array of <em>nested</em> view mixins that should be inserted into the current mixin. Let's take the transects thumbnails and project boxes as an example.
			</p>
			<p>
				The project boxes are the first level of mixins that are added to the dashboard; this works just as described in the previous section. Now the transect thumbnails should be added to <em>each</em> project box. These are the second level of mixins, supplied to the project box mixin as an additional argument of <code>&#64;include</code>. The structure can be visualized in a tree like this:
			</p>
<pre>
$modules->getMixins('dashboard')
├─ <strong>projects</strong> (the project boxes)
│  └─ <strong>transects</strong> (the transect thumbnails for each box)
│     └─ empty
└─ <strong>quotes</strong> (the inspiring quotes box)
   └─ empty
</pre>
			<p>
				Like this, the mixins could theoretically be nested infinitely deep. But how do we register one of those nested mixins in a package?
			</p>

			<h4>Registering nested mixins</h4>

			<p>
				If your Laravel application has lots of views you should <a href="http://laravel.com/docs/5.0/views">order them in different directories</a>. Views ordered like that can be accessed using the dot notation, e.g. the view <code>public/views/admin/profile.php</code> can be accessed with <code>view('admin.profile')</code>. Nested mixins make use of this method of accessing views; let's see how.
			</p>
			<p>
				The view mixin for the project boxes of the dashboard is registered as usual:
			</p>
<pre>
$modules->addMixin('projects', 'dashboard');
</pre>
			<p>
				The view mixin registration of the transect thumbnails looks a bit different, though:
			</p>
<pre>
$modules->addMixin('transects', 'dashboard.projects');
</pre>
			<p>
				Here, a mixin of the <code>transects</code> namespace is registered for the <code>projects</code> mixin on the <code>dashboard</code> view.
			</p>
			<p>
				While the project box mixin simply is the file <code>views/dashboard.blade.php</code>, the transect thumbnail mixin has to be the file <code>views/dashboard/projects.blade.php</code>. So here, again following convention over configuration, the <code>dashboard.projects</code> identifier is used both to determine the area, the mixin should be inserted into, and the source file.
			</p>
			<p>
				Registration and serving of nested mixins is handled by the <code>Modules</code> service so nested mixins work out of the box. For a "live" example take a look at the projects and transects modules mentioned in this tutorial.
			</p>

			<h3>Asset mixins and multiple mixins per view</h3>

			<p>
				Until now we have only talked about registering <em>one</em> area for view mixins per page. There are use cases, though, where you'd want or are even required to have multiple of those areas on one page. Let's take a look at one of the situations where multiple areas for view mixins are necessary.
			</p>
			<p>
				Having the example of the project box mixins containing transect thumbnail mixins still in mind, think about what whould happen if we tried to add a custom style to the transect thumbnails. "Of course", you'd say, "there is the <a href="{{ route('documentation').'/using-custom-assets-in-packages#publishing-css' }}"><code>styles</code> stack</a> we can append our CSS to." But the downside of this approach is: the custom <code>style</code> tag is appended <em>each time</em> the mixin is included. While this is fine for the project box mixin that is included only once, it becomes a problem with nested mixins like the transect thumbnails that are included multiple times. So for each project box on the dashboard, one custom style tag woul be appended to the page. There is a better way to do this.
			</p>
			<p>
				In fact there is nothing preventing us to implement a separate "style" mixin and add it to the dashboard. That's exactly what is already provided by the dashboard, looking like this:
			</p>
<pre>
&#64;push('styles')
   &#64;foreach ($modules->getMixins('dashboardStyles') as $module => $nestedMixins)
      &#64;include($module.'::dashboardStyles')
   &#64;endforeach
&#64;endpush
</pre>
			<p>
				Any mixin registered for <code>dashboardStyles</code> will be appended once to the <code>styles</code> section of the dashboard. Since nested mixins don't make any sense in this case, they are not passed on to the first level mixin.
			</p>
			<p>
				Now, if we wanted to add a custom style to the transects thumbnails we would create a mixin called <code>views/dashboardStyles.blade.php</code> looking like this:
			</p>
<pre>
&lt;link href="@{{ asset('vendor/transects/styles/main.css') }}" rel="stylesheet"&gt;
</pre>
			<p>
				And - in the service provider - register it to the dashboard styles section:
			</p>
<pre>
$modules->addMixin('transects', 'dashboardStyles');
</pre>
			<p>
				Now the custom style for the transect thumbnails is included only once in the dashboard but available to all the multiple instances of the thumbnail mixin. The same holds for custom scripts (there is a <code>dashboardScripts</code> mixin area). Aside from styles and scripts of nested mixins, you can use this technique to specify multiple arbitrary areas for view mixins on one page, e.g. one for a sidebar, title bar or the content each.
			</p>

			<h3>Conclusion</h3>

			<p>
				Now we have de-mystified the mechanisms behind view mixins and you know how to register areas for view mixins, use nested mixins and in which situations asset mixins are required. You can now consider yourself a fully qualified DIAS package developer!
			</p>

			<p>
				<a href="{{ route('documentation') }}" class="btn btn-default" title="Back to the documentation center"><span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span> back</a>
			</p>
		</div>
	</div>
</div>
@endsection
