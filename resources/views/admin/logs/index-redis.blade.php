@extends('admin.base')

@section('title', 'Error log')

@section('admin-content')
@forelse ($paginator as $item)
<?php if (!config('app.env') !== 'testing') dump($item) ?>
@empty
No log entries.
@endforelse

    <div class="text-center">
        {{ $paginator->links() }}
    </div>
@endsection
