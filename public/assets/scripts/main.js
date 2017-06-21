biigle={},biigle.$viewModel=function(e,t){window.addEventListener("load",function(){var i=document.getElementById(e);i&&t(i)})},biigle.$require=function(e){e=Array.isArray(e)?e:e.split(".");for(var t=biigle,i=0,n=e.length;i<n;i++)t.hasOwnProperty(e[i])||(t[e[i]]={}),t=t[e[i]];return t},biigle.$declare=function(e,t){e=e.split(".");var i=e.pop();return biigle.$require(e)[i]="function"==typeof t?t():t,t},biigle.$component=function(e,t){var i=biigle.$require(e);"function"==typeof t&&(t=t());for(var n in t)t.hasOwnProperty(n)&&(i[n]=t[n]);return i},biigle.$declare("events",new Vue),biigle.$declare("biigle.events",biigle.$require("events")),biigle.$declare("keyboard",new Vue({data:{charListeners:{},codeListeners:{},keyDownCodes:[8,9,27,33,34,35,36,37,38,39,40,46],keyDownListeners:{},ignoredTags:["input","textarea","select"]},methods:{isChar:function(e){return"string"==typeof e||e instanceof String},isKeyDownCode:function(e){return-1!==this.keyDownCodes.indexOf(e)},shouldIgnoreTarget:function(e){return-1!==this.ignoredTags.indexOf(e.target.tagName.toLowerCase())},handleKeyEvents:function(e){if(e=e||event,!this.shouldIgnoreTarget(e)){var t=e.charCode||e.keyCode,i=String.fromCharCode(void 0!==e.which?e.which:t).toLowerCase();this.codeListeners.hasOwnProperty(t)&&this.executeCallbacks(this.codeListeners[t],e),this.charListeners.hasOwnProperty(i)&&this.executeCallbacks(this.charListeners[i],e)}},handleKeyDownEvents:function(e){if(e=e||event,!this.shouldIgnoreTarget(e)){var t=e.charCode||e.keyCode;this.keyDownListeners.hasOwnProperty(t)&&this.executeCallbacks(this.keyDownListeners[t],e)}},executeCallbacks:function(e,t){for(var i=e.length-1;i>=0;i--)if(!1===e[i].callback(t))return},on:function(e,t,i){var n=this.codeListeners;this.isChar(e)?(n=this.charListeners,e=e.toLowerCase()):this.isKeyDownCode(e)&&(n=this.keyDownListeners),i=i||0;var s={callback:t,priority:i};if(n.hasOwnProperty(e)){var r,a=n[e];for(r=0;r<a.length&&!(a[r].priority>=i);r++);r===a.length-1?a.push(s):a.splice(r,0,s)}else n[e]=[s]},off:function(e,t){var i=this.codeListeners;if(this.isChar(e)?(i=this.charListeners,e=e.toLowerCase()):this.isKeyDownCode(e)&&(i=this.keyDownListeners),i.hasOwnProperty(e))for(var n=i[e],s=n.length-1;s>=0;s--)if(n[s].callback===t){n.splice(s,1);break}}},created:function(){document.body.addEventListener("keypress",this.handleKeyEvents),document.body.addEventListener("keydown",this.handleKeyDownEvents)}})),biigle.$declare("core.keyboard",biigle.$require("keyboard")),biigle.$declare("api.annotations",Vue.resource("api/v1/annotations{/id}",{},{attachLabel:{method:"POST",url:"api/v1/annotations{/id}/labels"},detachLabel:{method:"DELETE",url:"api/v1/annotation-labels{/annotation_label_id}"}})),biigle.$declare("api.images",Vue.resource("api/v1/images{/id}",{},{getFile:{method:"GET",url:"api/v1/images{/id}/file"},getAnnotations:{method:"GET",url:"api/v1/images{/id}/annotations"},saveAnnotations:{method:"POST",url:"api/v1/images{/id}/annotations"}})),biigle.$declare("api.labelSource",Vue.resource("api/v1/label-sources{/id}/find")),biigle.$declare("api.labelTree",Vue.resource("api/v1/label-trees{/id}",{},{addAuthorizedProject:{method:"POST",url:"api/v1/label-trees{/id}/authorized-projects"},removeAuthorizedProject:{method:"DELETE",url:"api/v1/label-trees{/id}/authorized-projects{/project_id}"},addUser:{method:"POST",url:"api/v1/label-trees{/id}/users"},updateUser:{method:"PUT",url:"api/v1/label-trees{/id}/users{/user_id}"},removeUser:{method:"DELETE",url:"api/v1/label-trees{/id}/users{/user_id}"}})),biigle.$declare("api.labels",Vue.resource("api/v1/labels{/id}",{},{save:{method:"POST",url:"api/v1/label-trees{/label_tree_id}/labels"}})),biigle.$declare("api.notifications",Vue.resource("api/v1/notifications{/id}",{},{markRead:{method:"PUT"}})),biigle.$declare("api.projects",Vue.resource("api/v1/projects{/id}",{},{query:{url:"api/v1/projects/my"},queryVolumes:{method:"GET",url:"api/v1/projects{/id}/volumes"},saveVolume:{method:"POST",url:"api/v1/projects{/id}/volumes"},attachVolume:{method:"POST",url:"api/v1/projects{/id}/volumes{/volume_id}"},detachVolume:{method:"DELETE",url:"api/v1/projects{/id}/volumes{/volume_id}"},addUser:{method:"POST",url:"api/v1/projects{/id}/users{/user_id}"},updateUser:{method:"PUT",url:"api/v1/projects{/id}/users{/user_id}"},removeUser:{method:"DELETE",url:"api/v1/projects{/id}/users{/user_id}"},queryAvailableLabelTrees:{method:"GET",url:"api/v1/projects{/id}/label-trees/available"},attachLabelTree:{method:"POST",url:"api/v1/projects{/id}/label-trees"},detachLabelTree:{method:"DELETE",url:"api/v1/projects{/id}/label-trees{/label_tree_id}"}})),biigle.$declare("api.users",Vue.resource("api/v1/users{/id}",{},{find:{method:"GET",url:"api/v1/users/find{/query}"}})),biigle.$component("core.components.loader",{template:"<span class=\"loader\" :class=\"{'loader--active': active, 'loader--fancy': fancy}\"></span>",props:{active:{type:Boolean,required:!0},fancy:{type:Boolean,default:!1}}}),biigle.$component("core.components.loaderBlock",{template:'<div class="loader-block" :class="{\'loader-block--active\': active}"><loader :active="active" :fancy="true"></loader></div>',components:{loader:biigle.$require("core.components.loader")},props:{active:{type:Boolean,required:!0}}}),biigle.$component("core.components.memberListItem",{template:'<li class="list-group-item clearfix"><span class="pull-right"><span v-if="editing && !isOwnUser"><form class="form-inline"><select class="form-control input-sm" :title="\'Change the role of \' + name" v-model="roleId" @change="changeRole"><option v-for="role in roles" :value="role.id" v-text="role.name"></option></select> <button type="button" class="btn btn-default btn-sm" :title="\'Remove \' + name" @click="removeMember">Remove</button></form></span><span v-else><span class="text-muted" v-text="role.name"></span></span></span><span v-text="name"></span> <span class="text-muted" v-if="isOwnUser">(you)</span></li>',props:{member:{type:Object,required:!0},ownId:{type:Number,required:!0},editing:{type:Boolean,required:!0},roles:{type:Array,required:!0}},data:function(){return{roleId:null}},computed:{isOwnUser:function(){return this.member.id===this.ownId},name:function(){return this.member.firstname+" "+this.member.lastname},role:function(){var e=this;return this.roles.find(function(t){return e.member.role_id===t.id})}},methods:{removeMember:function(){this.$emit("remove",this.member)},changeRole:function(){this.$emit("update",this.member,{role_id:this.roleId})}},created:function(){this.roleId=this.member.role_id}}),biigle.$component("core.components.membersPanel",function(){var e=biigle.$require("messages.store"),t=biigle.$require("api.users");return{template:'<div class="panel panel-default" :class="classObject"><div class="panel-heading">Members<span class="pull-right"><loader :active="loading"></loader> <button class="btn btn-default btn-xs" title="Edit members" @click="toggleEditing" :class="{active: editing}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button></span></div><div class="panel-body" v-if="editing"><form class="form-inline" @submit.prevent="attachMember"><div class="form-group"><typeahead :items="availableUsers" placeholder="User name" @select="selectMember" :value="selectedMemberName"></typeahead> <select class="form-control" title="Role of the new user" v-model="selectedRole"><option v-for="role in roles" :value="role.id" v-text="role.name"></option></select> <button class="btn btn-default" type="submit" :disabled="!canAttachMember">Add</button></div></form></div><ul class="list-group list-group-restricted"><member-list-item v-for="member in members" :key="member.id" :member="member" :own-id="ownId" :editing="editing" :roles="roles" @update="updateMember" @remove="removeMember"></member-list-item><li class="list-group-item list-group-item-info" v-if="!hasMembers"><slot></slot></li></ul></div>',mixins:[biigle.$require("core.mixins.editor")],components:{typeahead:biigle.$require("core.components.typeahead"),memberListItem:biigle.$require("core.components.memberListItem"),loader:biigle.$require("core.components.loader")},data:function(){return{selectedMember:null,selectedRole:null,users:[]}},props:{members:{type:Array,required:!0},roles:{type:Array,required:!0},ownId:{type:Number,required:!0},defaultRole:{type:Number},loading:{type:Boolean,default:!1}},computed:{classObject:function(){return{"panel-warning":this.editing}},availableUsers:function(){return this.users.filter(this.isntMember)},canAttachMember:function(){return!this.loading&&this.selectedMember&&this.selectedRole},hasMembers:function(){return this.members.length>0},selectedMemberName:function(){return this.selectedMember?this.selectedMember.name:""},memberIds:function(){return this.members.map(function(e){return e.id})}},methods:{selectMember:function(e){this.selectedMember=e},attachMember:function(){var e={id:this.selectedMember.id,role_id:this.selectedRole,firstname:this.selectedMember.firstname,lastname:this.selectedMember.lastname};this.$emit("attach",e),this.selectedMember=null},updateMember:function(e,t){this.$emit("update",e,t)},removeMember:function(e){this.$emit("remove",e)},loadUsers:function(){t.query().then(this.usersLoaded,e.handleResponseError)},usersLoaded:function(e){e.data.forEach(function(e){e.name=e.firstname+" "+e.lastname}),Vue.set(this,"users",e.data)},isntMember:function(e){return-1===this.memberIds.indexOf(e.id)}},created:function(){this.defaultRole?this.selectedRole=this.defaultRole:this.selectedRole=this.roles[0].id,this.$once("editing.start",this.loadUsers)}}}),biigle.$component("core.components.sidebar",{template:'<aside class="sidebar" :class="classObject"><div class="sidebar__buttons" v-if="showButtons"><sidebar-button v-for="tab in tabs" :tab="tab" :direction="direction"></sidebar-button></div><div class="sidebar__tabs"><slot></slot></div></aside>',components:{sidebarButton:biigle.$require("core.components.sidebarButton")},data:function(){return{open:!1,tabs:[],lastOpenedTab:null}},props:{openTab:{type:String},showButtons:{type:Boolean,default:!0},direction:{type:String,default:"right",validator:function(e){return"left"===e||"right"===e}},toggleOnKeyboard:{type:Boolean,default:!1}},computed:{events:function(){return biigle.$require("events")},classObject:function(){return{"sidebar--open":this.open,"sidebar--left":this.isLeft,"sidebar--right":!this.isLeft}},isLeft:function(){return"left"===this.direction}},methods:{registerTab:function(e){this.tabs.push(e)},handleOpenTab:function(e){this.open=!0,this.lastOpenedTab=e,this.$emit("toggle",e),this.events.$emit("sidebar.toggle",e),this.events.$emit("sidebar.open."+e)},handleCloseTab:function(e){this.open=!1,this.$emit("toggle",e),this.events.$emit("sidebar.toggle",e),this.events.$emit("sidebar.close."+e)},toggleLastOpenedTab:function(e){this.lastOpenedTab&&(e.preventDefault(),this.open?this.$emit("close",this.lastOpenedTab):this.$emit("open",this.lastOpenedTab))}},created:function(){this.$on("open",this.handleOpenTab),this.$on("close",this.handleCloseTab),this.toggleOnKeyboard&&biigle.$require("keyboard").on(9,this.toggleLastOpenedTab)},mounted:function(){this.openTab&&this.$emit("open",this.openTab)}}),biigle.$component("core.components.sidebarButton",{template:'<a :href="href" :disabled="disabled" class="sidebar__button btn btn-default btn-lg" :class="classObject" @click="toggle" :title="tab.title"><span v-if="open" :class="chevronClass" aria-hidden="true"></span><span v-else :class="iconClass" aria-hidden="true"></span></a>',props:{tab:{type:Object,required:!0},direction:{type:String,default:"right",validator:function(e){return"left"===e||"right"===e}}},computed:{iconClass:function(){return this.tab.icon.startsWith("fa-")?"fa "+this.tab.icon:"glyphicon glyphicon-"+this.tab.icon},chevronClass:function(){return"fa fa-chevron-"+this.direction},classObject:function(){return{active:this.open,"btn-info":this.tab.highlight}},disabled:function(){return this.tab.disabled},href:function(){return this.disabled?null:this.tab.href},open:function(){return this.tab.open}},methods:{toggle:function(e){this.disabled||this.href||(e.preventDefault(),this.open?this.$parent.$emit("close",this.tab.name):this.$parent.$emit("open",this.tab.name))}}}),biigle.$component("core.components.sidebarTab",{template:'<div class="sidebar__tab" :class="classObject"><slot></slot></div>',data:function(){return{open:!1}},props:{name:{type:String,required:!0},icon:{type:String,required:!0},title:{type:String},href:{type:String},disabled:{type:Boolean,default:!1},highlight:{type:Boolean,default:!1}},computed:{classObject:function(){return{"sidebar__tab--open":this.open}}},beforeCreate:function(){var e=this;this.$parent.$on("open",function(t){e.open=t===e.name}),this.$parent.$on("close",function(){e.open=!1}),this.$parent.registerTab(this)}}),biigle.$component("core.components.typeahead",{template:'<typeahead ref="typeahead" class="typeahead clearfix" :data="items" :placeholder="placeholder" :on-hit="selectItem" :template="template" :disabled="disabled" match-property="name" @clear="clear"></typeahead>',data:function(){return{template:"{{item.name}}"}},components:{typeahead:VueStrap.typeahead},props:{items:{type:Array,required:!0},placeholder:{type:String,default:"Item name"},disabled:{type:Boolean,default:!1},value:{type:String,default:""},clearOnSelect:{type:Boolean,defeult:!1}},methods:{selectItem:function(e,t){if(e)return this.$emit("select",e),this.clearOnSelect?null:e.name},clear:function(){this.$emit("select",void 0)}},watch:{value:function(e){this.$refs.typeahead.setValue(e)}}}),biigle.$component("core.mixins.editor",{data:function(){return{editing:!1}},methods:{startEditing:function(){this.editing=!0,this.$emit("editing.start")},finishEditing:function(){this.editing=!1,this.$emit("editing.stop")},toggleEditing:function(){this.editing?this.finishEditing():this.startEditing()}}}),biigle.$component("core.mixins.loader",{components:{loader:biigle.$require("core.components.loader"),loaderBlock:biigle.$require("core.components.loaderBlock")},data:function(){return{loading:!1}},watch:{loading:function(e){this.$emit("loading",e)}},methods:{startLoading:function(){this.loading=!0},finishLoading:function(){this.loading=!1}}}),biigle.$viewModel("notifications-list",function(e){var t=biigle.$require("api.notifications"),i=biigle.$require("notifications.store"),n=biigle.$require("messages.store"),s={props:["item","removeItem"],data:function(){return{isLoading:!1}},computed:{classObject:function(){return this.item.data.type?"panel-"+this.item.data.type:"panel-default"},isUnread:function(){return null===this.item.read_at}},methods:{markRead:function(){var e=this;return this.isLoading=!0,t.markRead({id:this.item.id},{}).then(function(t){e.item.read_at=new Date,e.removeItem&&i.remove(e.item.id)}).catch(n.handleErrorResponse).finally(function(){e.isLoading=!1})},markReadAndOpenLink:function(){var e=this.item.data.actionLink;this.item.read_at?window.location=e:this.markRead().finally(function(){window.location=e})}}};new Vue({el:e,components:{notification:s},data:{notifications:i.all},methods:{hasNotifications:function(){return i.count()>0}}})}),biigle.$viewModel("notifications-navbar-indicator",function(e){var t=biigle.$require("notifications.store");new Vue({el:e,computed:{unread:function(){return t.isInitialized()?t.hasUnread():"true"===this.$el.attributes.unread.value}}})}),biigle.$declare("notifications.store",new Vue({data:{_all:null,initialized:!1},computed:{all:{get:function(){return this._all||[]},set:function(e){this.initialized=!0,this._all=e}},unread:function(){return this.all.filter(function(e){return null===e.read_at})}},methods:{isInitialized:function(){return this.initialized},count:function(){return this.all.length},countUnread:function(){return this.unread.length},hasUnread:function(){for(var e=this.all.length-1;e>=0;e--)if(null===this.all[e].read_at)return!0;return!1},remove:function(e){for(var t=this.all.length-1;t>=0;t--)this.all[t].id===e&&this.all.splice(t,1)}}})),biigle.$viewModel("notifications-unread-count",function(e){var t=biigle.$require("notifications.store");new Vue({el:e,computed:{count:t.countUnread}})}),biigle.$viewModel("messages-display",function(e){var t=biigle.$require("messages.store"),i={props:["message"],computed:{typeClass:function(){return this.message.type?"alert-"+this.message.type:"alert-info"}},methods:{close:function(){this.message?t.close(this.message.id):this.$el.remove()}}};new Vue({el:e,components:{message:i},data:{messages:t.all}})}),biigle.$declare("messages.store",new Vue({data:{max:1,all:[]},methods:{post:function(e,t){biigle.$require("utils.cb").exitFullscreen(),this.all.unshift({id:Date.now(),type:e,text:t}),this.all.length>this.max&&this.all.pop()},danger:function(e){this.post("danger",e)},warning:function(e){this.post("warning",e)},success:function(e){this.post("success",e)},info:function(e){this.post("info",e)},close:function(e){for(var t=this.all.length-1;t>=0;t--)this.all[t].id===e&&this.all.splice(t,1)},handleErrorResponse:function(e){var t=e.body;if(t){if(t.message)return void this.danger(t.message);if("string"==typeof t)return void this.danger(t)}if(422===e.status)for(var i in t)this.danger(t[i][0]);else 403===e.status?this.danger("You have no permission to do that."):401===e.status?this.danger("Please log in (again)."):this.danger("The server didn't respond, sorry.")},handleResponseError:function(e){return this.handleErrorResponse(e)}}})),$biiglePostMessage=biigle.$require("messages.store.post"),biigle.$viewModel("system-messages-edit-form",function(e){var t=e.querySelector('textarea[name="body"]'),i="";t&&(i=t.value,t.innerHTML=""),new Vue({el:e,data:{body:i}})}),biigle.$declare("utils.cb",{exitFullscreen:function(){document.exitFullscreen?document.exitFullscreen():document.msExitFullscreen?document.msExitFullscreen():document.mozCancelFullScreen?document.mozCancelFullScreen():document.webkitExitFullscreen&&document.webkitExitFullscreen()}});