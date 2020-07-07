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
        <div class="col-xs-12">
            <div class="pull-right">
                @can('create', \Biigle\LabelTree::class)
                    <a href="{{route('label-trees-create')}}" class="btn btn-default" title="Create a new label tree">
                        <i class="fa fa-tags"></i> Create Label Tree
                    </a>
                @else
                    <button class="btn btn-default" title="Guests are not allowed to create new label trees" disabled>
                        <i class="fa fa-tags"></i> Create Label Tree
                    </button>
                @endcan

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
        <div class="row activity-items">
            <div class="col-xs-12">
                <div class="well well-sm">
                    <div class="row">
                        @foreach ($activityItems as $item)
                            <div class="col-xs-6 col-md-3">
                                @include($item['include'], $item)
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    @endif
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
    @mixin('dashboardMain')
</div>
@endsection
