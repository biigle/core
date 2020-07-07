@extends('app')

@section('title', 'Manual')

@section('content')
<div class="container">
    <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        <div class="row">
            <h1>Manual</h1>
            <p class="lead">
                This is the application manual of BIIGLE. Here you can find articles on how to use the application as well as reference publications and the developer documentation.
            </p>
        </div>
        <div class="row">
            <h3>
                <a href="{{route('manual-tutorials', 'login-and-account-settings')}}">Account settings</a>
            </h3>

            <p>
                Learn how you can manage your user account.
            </p>

            <h3>
                <a href="{{route('manual-tutorials', 'notifications')}}">Notifications</a>
            </h3>

            <p>
                View and manage BIIGLE notifications in the notification center.
            </p>

            <h3><a href="{{route('manual-tutorials', ['projects', 'about'])}}">Projects</a></h3>
            <p>
                Learn what projects are and how to manage them.
            </p>


            <h3>Label Trees</h3>
            <h4>
                <a href="{{route('manual-tutorials', ['label-trees', 'about'])}}">About Label Trees</a>
            </h4>
            <p>
                Learn what label trees are and how you can manage them.
            </p>
            <h4>
                <a href="{{route('manual-tutorials', ['label-trees', 'manage-labels'])}}">Manage Labels</a>
            </h4>
            <p>
                Learn how to create, modify or delete labels of a label tree.
            </p>
            <h4>
                <a href="{{route('manual-tutorials', ['label-trees', 'label-tree-versions'])}}">Label Tree Versions</a>
            </h4>
            <p>
                Everything you need to know about versioned label trees.
            </p>
            <h4>
                <a href="{{route('manual-tutorials', ['label-trees', 'merge-label-trees'])}}">Merge Label Trees</a>
            </h4>
            <p>
                View and resolve differences between label trees.
            </p>
            @mixin('labelTreesManual')

            @mixin('manualTutorial')

            <h2><a name="references"></a>References</h2>

            <p>
                Reference publications that you should cite if you use BIIGLE for one of your studies.
            </p>
            <p>
                <strong>BIIGLE 2.0</strong><br>
                <a href="https://doi.org/10.3389/fmars.2017.00083">Langenkämper, D., Zurowietz, M., Schoening, T., & Nattkemper, T. W. (2017). Biigle 2.0-browsing and annotating large marine image collections.</a><br>Frontiers in Marine Science, 4, 83. doi: <code>10.3389/fmars.2017.00083</code>
            </p>
            @mixin('manualReferences')
        </div>
        <div class="row">
            <h2><a name="developer-documentation"></a>Developer Documentation</h2>

            <p>
                The source code of BIIGLE can be found at <a href="https://github.com/biigle">GitHub</a>.
            </p>
        </div>

        <div class="row">
            <h3>RESTful API</h3>
            <p>
                You may access most of the functionality of this application using the RESTful API. Most of the API requires user authentication via session cookie (being logged in to the website) but it is also available for external requests using a personal API token. You can manage your API tokens in the <a href="{{ route('settings-tokens') }}">user settings</a>.
            </p>
            <p>
                The API works with form (<code>x-www-form-urlencoded</code>) as well as JSON requests. For form requests, you can use <a href="http://laravel.com/docs/5.5/routing#form-method-spoofing">method spoofing</a> to use different HTTP methods. For the complete documentation, check out the link below.
            </p>
            <p>
                <a class="btn btn-default btn-lg btn-block" href="{{ url('doc/api/index.html') }}">RESTful API documentation</a>
            </p>
        </div>
        <div class="row">
            <h3>Server</h3>
            <p>
                The server application is written in PHP using the <a href="http://laravel.com/">Laravel</a> framework. Have a look at their <a href="http://laravel.com/docs/6.x">excellent documentation</a> for further information. For the class reference and API documentation, check out the link below.
            </p>
            <p>
                Laravel allows a modular application design using custom packages (or modules). In fact, the core of this application doesn't provide much more than user and database management as well as the RESTful API. Any additional functionality is added by a new module.
            </p>
            <p>
                We encourage you to add functionality by developing your own modules! There are some resources on package development in the <a href="http://laravel.com/docs/6.x/packages">Laravel documentation</a> but we have some tutorials here as well.
            </p>
            <p>
                <a class="btn btn-default btn-lg btn-block" href="{{ url('doc/server/index.html') }}">Server API documentation</a>
            </p>
        </div>
        <div class="row">
            <h3>Database</h3>
            <p>
                The database schema documentation can be found in the BIIGLE GitHub organization.
            </p>
            <p>
                <a class="btn btn-default btn-lg btn-block" href="https://biigle.github.io/schema/index.html">Database schema documentation</a>
            </p>
        </div>
        <div class="row">
            <h3><a name="developer-tutorials"></a>Developer Tutorials</h3>
            <h4><a href="{{ route('manual-documentation', 'package-development') }}">Package development</a></h4>
            <p>
                Learn about PHP package development and how to add custom functionality to your BIIGLE installation by developing your own modules.
            </p>

            <h4><a href="{{ route('manual-documentation', 'advanced-package-development') }}">Advanced package development</a></h4>
            <p>
                Learn how to add new views and routes with a custom package and how to properly test them using the BIIGLE testing environment.
            </p>

            <h4><a href="{{ route('manual-documentation', 'using-custom-assets-in-packages') }}">Using custom assets in packages</h4></a>
            <p>
                Learn how to handle custom assets like CSS and JavaScript in addition to the defaults provided by the core application.
            </p>

            <h4><a href="{{ route('manual-documentation', 'mastering-view-mixins') }}">Mastering view mixins</a></h4>
            <p>
                Building your custom extensions is nice but what about extending the extensions? Learn how to use the view mixin registry of BIIGLE, allowing other modules to extend yours.
            </p>
        </div>
    </div>
</div>
@include('partials.footer', [
    'links' => [
        'GitHub' => 'https://github.com/biigle',
    ],
])
@endsection
