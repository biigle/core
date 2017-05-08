<sidebar-tab name="annotations" icon="map-marker" title="Toggle the annotations list" class="sidebar__tab--nopad">
    <annotations-tab :annotations="currentAnnotations" v-cloak inline-template>
        <div class="annotations-tab">
            <ul class="list-unstyled">
                <label-item v-for="item in items" :key="item.label.id" :item="item" inline-template>
                    <li class="annotations-tab-item" :class="classObject" :title="title">
                        <div class="annotations-tab-item__title" v-on:click="toggleOpen">
                            <span class="pull-right" v-text="count" :title="countTitle"></span>
                            <span class="annotations-tab-item__color" :style="colorStyle"></span> <span v-text="label.name"></span>
                        </div>
                        <ul class="annotations-tab-item__list list-unstyled" v-show="isSelected">
                            <annotation-item v-for="annotation in annotationItems" :item="annotation" inline-template>
                                <li class="annotations-tab-item__sub-item" title="𝗗𝗼𝘂𝗯𝗹𝗲 𝗰𝗹𝗶𝗰𝗸 to zoom to the annotation" :class="classObject" v-on:click="toggleSelect" v-on:dblclick="focus">
                                    @can('add-annotation', $image)
                                        <button type="button" class="close" title="Detach this label from the annotation" v-if="canBeDetached" v-on:click="detach"><span aria-hidden="true">&times;</span></button>
                                    @endcan
                                    <span class="icon" :class="shapeClass"></span> <span v-text="username"></span>
                                </li>
                            </annotation-item>
                        </ul>
                    </li>
                </label-item>
            </ul>
        </div>
    </annotations-tab>
</sidebar-tab>
