@extends('app')

@section('title', 'Dashboard')

@push('styles')
    @mixin('dashboardStyles')
@endpush

@push('scripts')
    @mixin('dashboardScripts')
@endpush

@section('content')
<div class="container">
    @if (session('welcomeMessage'))
        <div class="row">
            <div class="col-md-8 col-md-offset-2">
                <div class="panel panel-success">
                    <div class="panel-body text-success text-center">
                        <p class="lead">
                            Welcome to BIIGLE! Take a look around and make yourself at home.
                        </p>
                        @if (config('biigle.user_registration_confirmation'))
                            <p>
                                You will be able to create new projects or label trees once an admin has accepted your sign up.
                            </p>
                        @endif
                    </div>
                </div>
            </div>
        </div>
    @endif
    <div class="row">
        <div class="col-xs-12">
            <div class="pull-right">
                @mixin('dashboardButtons')
            </div>
            @if ($activityItems->isNotEmpty())
                <div class="lead">
                    Your recent activity
                </div>
            @else
                <div class="lead text-muted">
                    No recent activity
                </div>
            @endif
        </div>
    </div>
    @if ($activityItems->isNotEmpty())
        <div class="row">
            @foreach ($activityItems as $item)
                <div class="col-xs-6 col-md-3">
                    @include($item['include'], $item)
                </div>
            @endforeach
        </div>
    @endif
    @mixin('dashboardMain')
</div>
@endsection
