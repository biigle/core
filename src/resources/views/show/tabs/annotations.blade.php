<sidebar-tab name="annotations" icon="map-marker-alt" title="Annotations" class="sidebar__tab--nopad" :highlight="hasAnnotationFilter">
    <annotations-tab :annotations="annotations" :filtered-annotations="filteredAnnotations" v-on:filter="handleFilter" ref="annotationsTab" v-cloak inline-template>
        <div class="annotations-tab">
            <annotations-filter :annotations="annotations" v-on:filter="bubbleFilter" inline-template>
                <form class="annotations-tab__filter form-inline" v-on:submit.prevent="activateFilter">
                    <select class="form-control" v-model="selectedFilter">
                        <option v-for="filter in availableFilters" :value="filter" v-text="filter"></option>
                    </select>
                    <component :is="typeaheadComponent" :items="data" :value="selectedDataName" :placeholder="placeholder" v-on:select="selectData"></component>
                    <button class="btn btn-info active" title="Clear annotation filter" v-if="active" v-on:click.prevent="deactivateFilter"><span class="fa fa-times" aria-hidden="true"></span></button>
                    <button type="submit" class="btn btn-default" title="Filter annotations" v-else><span class="fa fa-filter" aria-hidden="true"></span></button>
                </form>
            </annotations-filter>
            <ul class="annotations-tab__list list-unstyled" ref="scrollList">
                <label-item v-for="item in items" :key="item.label.id" :item="item" v-on:select="keepElementPosition" inline-template>
                    <li class="annotations-tab-item" :class="classObject" :title="title">
                        <div class="annotations-tab-item__title" v-on:click="toggleOpen">
                            <span class="pull-right badge" v-text="count" :title="countTitle"></span>
                            <span class="annotations-tab-item__color" :style="colorStyle"></span> <span v-text="label.name"></span>
                        </div>
                        <ul class="annotations-tab-item__list list-unstyled" v-show="isSelected">
                            <annotation-item v-for="annotation in annotationItems" :item="annotation" :user-id="{!! $user->id !!}" v-on:select="bubbleSelect" inline-template>
                                <li class="annotations-tab-item__sub-item" title="𝗗𝗼𝘂𝗯𝗹𝗲 𝗰𝗹𝗶𝗰𝗸 to zoom to the annotation" :class="classObject" :data-annotation-id="annotation.id" v-on:click="toggleSelect" v-on:dblclick="focus">
                                    @can('add-annotation', $image)
                                        <button type="button" class="close" title="Detach this label from the annotation" v-if="canBeDetached" v-on:click.stop="detach"><span aria-hidden="true">&times;</span></button>
                                    @endcan
                                    <span class="icon" :class="shapeClass"></span> <span v-text="username"></span>
                                </li>
                            </annotation-item>
                        </ul>
                    </li>
                </label-item>
            </ul>
            <div class="annotations-tab__plugins">
                @mixin('annotationsAnnotationsTab')
            </div>
        </div>
    </annotations-tab>
</sidebar-tab>
