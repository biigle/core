@extends('projects.show.base')

@push('scripts')
<script type="text/javascript">
    @can('update', $project)
        biigle.$declare('projects.canEdit', true);
        biigle.$declare('projects.invitations', {!! $invitations !!});
    @else
        biigle.$declare('projects.canEdit', false);
        biigle.$declare('projects.invitations', []);
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
        <div class="col-xs-6">
            @can('update', $project)
                <div class="clearfix">
                    <span class="pull-right">
                        <loader :active="loading"></loader>
                        <button id="member-btn" class="btn btn-default" title="Add a new member to the project"><i class="fa fa-user-plus"></i> Add member</button>
                        <button id="invitation-btn" class="btn btn-default" title="Create a new project invitation"><i class="fa fa-envelope"></i> Create invitation</button>
                    </span>
                </div>
                <popover target="#member-btn" placement="left" v-model="memberPopoverOpen">
                    <template slot="popover">
                        <add-member-form
                            :members="members"
                            :roles="roles"
                            :default-role="defaultRole"
                            :disabled="loading"
                            v-on:attach="attachMember"
                            ></add-member-form>
                    </template>
                </popover>
                <popover target="#invitation-btn" placement="left" v-model="invitationPopoverOpen">
                    <template slot="popover">
                        <create-invitation-form
                            :project="project"
                            :roles="rolesWithoutAdmin"
                            :default-role="defaultRole"
                            v-on:created="handleCreatedInvitation"
                            ></create-invitation-form>
                    </template>
                </popover>

                <div v-for="invitation in invitations" v-text="invitation.uuid"></div>
            @else
                <span class="text-muted">Project admins can add and remove members.</span>
            @endcan
        </div>
    </div>
</div>
@endsection
