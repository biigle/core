@extends('app')
@inject('modules', 'Dias\Services\Modules')

@section('title') Manual @stop

@section('content')
<div class="container">
    <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        <div class="row">
            <h2>Manual</h2>
            <p class="lead">
                This is the application manual of BIIGLE DIAS. Here you can find tutorials and videos on how to use the application as well as the developer documentation and API.
            </p>
        </div>
        <div class="row">
            <h3>Tutorials</h3>

            <p>
                Learn more about the different functions and tools of BIIGLE DIAS for an efficient workflow.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', 'whole-playlist')}}">Biigle Dias Tutorial Playlist</a>
            </h4>

            <p>
                The Biigle Dias Tutorial playlist.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', 'login-and-account-settings')}}">Login and account settings</a>
            </h4>

            <p>
                Learn how you can manage your user account.
            </p>

            <h4>
                <a href="{{route('manual-tutorials', 'notifications')}}">Notifications</a>
            </h4>

            <p>
                Everything about the notification center.
            </p>

            @foreach ($modules->getMixins('manualTutorial') as $module => $nestedMixins)
                @include($module.'::manualTutorial')
            @endforeach
        </div>
        <div class="row">
            <h3>Developer Documentation</h3>

            <p>
                BIIGLE DIAS consists of different modules, each of which provides their own set of functions. Here you can find the developer documentation of each module that this instance has installed.
            </p>

            <h4>
                <a href="{{route('manual-documentation')}}">Core</a>
            </h4>

            <p>
                The BIIGLE DIAS core provides the basic functions and framework for each instance. This documentation also describes how to use the API or develop custom DIAS modules.
            </p>

            @foreach ($modules->getMixins('manualDocumentation') as $module => $nestedMixins)
                @include($module.'::manualDocumentation')
            @endforeach
        </div>
    </div>
</div>
@endsection
