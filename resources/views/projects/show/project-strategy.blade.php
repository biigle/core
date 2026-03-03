@extends('projects.show.base')

@push('scripts')
<script type="module">
</script>
@endpush

@section('project-content')
<div id="project-strategy-container">
    <div class="row">
        <div class="col-xs-6">
    <project-strategy isAdmin={{ $isAdmin }}></project-strategy>
    </div>
    </div>
</div>
@endsection
