@extends('admin.base')

@section('title')Transects admin area @stop

@section('admin-content')
<table class="table">
    <thead>
        <tr>
            <th>Name</th>
            <th>Projects</th>
            <th>Last update</th>
        </tr>
    </thead>
    <tbody>
         @foreach ($transects as $transect)
            <tr>
                <td><a href="{{route('transect', $transect->id)}}" title="Show {{ $transect->name }}">{{$transect->name}}</a></td>
                <td>
                    <ul>
                        @foreach ($transect->projects as $project)
                            <li><a href="{{route('project', $project->id)}}" title="Show {{ $project->name }}">{{$project->name}}</a></li>
                        @endforeach
                    </ul>
                </td>
                <td>{{$transect->updated_at}}</td>
            </tr>
        @endforeach
    </tbody>
</table>
@endsection
