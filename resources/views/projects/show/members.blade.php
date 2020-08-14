@extends('projects.show.base')

@push('scripts')
<script type="text/javascript">
    @can('update', $project)
        biigle.$declare('projects.canEdit', true);
    @else
        biigle.$declare('projects.canEdit', false);
    @endcan
    biigle.$declare('projects.roles', {!! $roles !!});
    biigle.$declare('projects.defaultRole', {!! Biigle\Role::guest() !!});
    biigle.$declare('projects.members', {!! $members !!});
</script>
@endpush

@section('project-content')
<div id="projects-show-members" class="project-members">
    <div class="row">
        <div class="col-xs-6">
            <member-list
                :members="members"
                :own-id="userId"
                :editable="canEdit"
                :roles="roles"
                v-on:remove="removeMember"
                v-on:update="updateMember"
                >
            </member-list>
        </div>
        @can('update', $project)
            <div class="col-xs-6">
                <span class="top-bar pull-right">
                    <loader :active="loading"></loader>
                    <add-member-form
                        class="inline-block-form"
                        :members="members"
                        :roles="roles"
                        :default-role="defaultRole"
                        :disabled="loading"
                        v-on:attach="attachMember"
                        ></add-member-form>
                </span>
            </div>
        @endcan
    </div>
</div>
@endsection
