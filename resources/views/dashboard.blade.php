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
    <div class="row">
        <div class="col-md-10">
            <div class="row">
                @if (session('welcomeMessage'))
                    <div class="col-md-10 col-md-offset-2">
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
                @else
                    @if ($activityItems->isNotEmpty())
                        <div class="col-xs-12">
                            <div class="row">
                                <div class="lead col-xs-12">
                                    Your recent activity
                                </div>
                                @foreach ($activityItems as $item)
                                    <div class="col-md-4">
                                        @include($item['include'], $item)
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @else
                        <div class="lead col-xs-12 text-muted">
                            No recent activity
                        </div>
                    @endif
                @endif
            </div>
        </div>
        <div class="col-md-2">
            @mixin('dashboardButtons')
        </div>
    </div>
    @mixin('dashboardMain')
</div>
@endsection
