@extends('admin.base')

@section('title')Avaliable logfiles @stop

@section('admin-content')
    <table class="table table-hover">
        <tbody>
            @forelse($logs as $log)
                <tr>
                    <td><a href="{{route('admin-logs-show', $log)}}">{{$log}}</a></td>
                </tr>
            @empty
                <tr>
                    <td>No logfiles available</td>
                </tr>
            @endforelse
        </tbody>
    </table>
@endsection
