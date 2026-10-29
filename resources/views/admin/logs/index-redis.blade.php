@extends('admin.base')

@section('title', 'Error log')

@section('admin-content')
<form class="form-inline" style="padding-bottom: 1em;" action="{{url()->current()}}" method="get">
    <div class="form-group">
        <label>Minimum level:</label>
        <select class="form-control" onchange="this.form.submit()" name="level">
            @foreach (Biigle\Logging\LogManager::LEVELS as $l)
                <option value="{{$l}}" @selected($l === $logLevel)>{{$l}}</option>
            @endforeach
        </select>
    </div>
    <div class="form-group">
        <input type="search" class="form-control" name="q" value="{{$search}}" placeholder="Search">
    </div>
    <button type="submit" class="btn btn-default">Search</button>
</form>
@forelse ($paginator as $item)
<?php if (!config('app.env') !== 'testing') dump($item) ?>
@empty
No log entries.
@endforelse

    <div class="text-center">
        {{ $paginator->links() }}
    </div>
@endsection
