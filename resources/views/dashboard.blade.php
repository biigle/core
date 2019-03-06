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
            @endif
            <div class="col-md-6">
                @mixin('dashboardHotBoxLeft')
            </div>
            <div class="col-md-6">
                @mixin('dashboardHotBoxRight')
            </div>
        </div>
        <div class="col-md-2">
            @mixin('dashboardButtons')
        </div>
    </div>
    @mixin('dashboardMain')
</div>
@endsection
