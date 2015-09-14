@extends('admin.base')

@section('title')Projects admin area @stop

@section('admin-content')
<table class="table">
    <thead>
        <tr>
            <th>Name</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
         @foreach ($projects as $project)
            <tr>
                <td><a href="{{route('project', $project->id)}}" title="Show {{ $project->name }}">{{$project->name}}</a></td>
                <td>{{$project->description}}</td>
            </tr>
        @endforeach
    </tbody>
</table>
@endsection
