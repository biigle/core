@extends('app')

@section('title', 'Manual')

@section('content')
<div class="container">
    <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        <div class="row">
            <h1>Manual</h1>
            <p class="lead">
                This is the application manual of BIIGLE. Here you can find tutorials and videos on how to use the application as well as the developer documentation and API.
            </p>
        </div>
        <div class="row">
            <h2>Tutorials</h2>

            <p>
                Learn more about the different functions and tools of BIIGLE for an efficient workflow.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', 'login-and-account-settings')}}">Account settings</a>
            </h4>

            <p>
                Learn how you can manage your user account.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', 'notifications')}}">Notifications</a>
            </h4>

            <p>
                View and manage BIIGLE notifications in the notification center.
            </p>

            @mixin('manualTutorial')
        </div>
        <div class="row">
            <h2>Developer Documentation</h2>

            <p>
                BIIGLE consists of different modules, each of which provides their own set of functions. Here you can find the developer documentation of each module that this instance has installed.
            </p>

            <h4>
                <a href="{{route('manual-documentation')}}">Core</a>
            </h4>

            <p>
                The BIIGLE core provides the basic functions and framework for each instance. This documentation also describes how to use the API or develop custom BIIGLE modules.
            </p>

            @mixin('manualDocumentation')
        </div>
    </div>
</div>
@endsection
