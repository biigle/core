<template>
    <div class="filtering-tab">
        <div class="list-group filter-list-group">
            <button
                class="list-group-item"
                title="Filter by annotation type"
                @click="filterAnnotation"
                >
                Filter by annotation type
            </button>
        </div>

    </div>
</template>
<script>
export default {
    methods: {
        filterAnnotation() {
            console.log("Test")
        },
            }
            };
</script>
