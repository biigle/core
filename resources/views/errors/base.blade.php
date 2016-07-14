@extends('app')

@push('styles')
    @if ($debug)
        <style type="text/css">
            {!!$css!!}
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
            {!!$content!!}
        </div>
    @endif
</div>
@endsection
