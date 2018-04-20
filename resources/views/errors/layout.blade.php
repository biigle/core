@extends('app')

@push('styles')
<style>
    .row {
        display: flex;
        justify-content: center;
    }
    .panel {
        margin-top: 100px;
        text-align: center;
    }
    .lead {
        margin: 0;
    }
</style>
@endpush

@section('content')
<div class="container">
    <div class="row">
        <div class="panel panel-@yield('type', 'danger')">
            <div class="panel-body text-@yield('type', 'danger') lead">
                @yield('message')
            </div>
        </div>
    </div>
</div>
@endsection
