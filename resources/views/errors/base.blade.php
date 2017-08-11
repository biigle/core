@extends('app')

@push('styles')
    @if ($debug)
        <style type="text/css">
            {!! str_replace('body {', '.debug-printout {', $css) !!}
        </style>
    @endif
@endpush

@section('content')
<div class="container">
    <div class="row">
        @yield('error-content')
    </div>
    @if ($debug)
        <div class="row">
            <div class="debug-printout">
                {!!$content!!}
            </div>
        </div>
    @endif
</div>
@endsection
