@extends('app')

@section('title') @yield('manual-title') @stop

@section('content')
<div class="container">
    <div class="col-sm-8 col-sm-offset-2 col-lg-6 col-lg-offset-3">
        <div class="row">
            <h2 class="clearfix">
                <a href="{{route('manual')}}" class="btn btn-default pull-right" title="Go back to the manual">back</a>
                @yield('manual-title')
            </h2>
        </div>
        @yield('manual-content')
    </div>
</div>
@endsection
