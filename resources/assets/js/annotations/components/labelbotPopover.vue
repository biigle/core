<template>
  <ul class="labelbot-labels">
    <li class="labelbot-labels-label" v-for="(label, index) in labelBOTLabels" :key="index">
      <div v-if="index === 0" class="labelbot-labels-label__nameProgress">
        <!-- Progress bar -->
        <div class="labelbot-labels-label__progress-bar" :style="{ width: progressWidth + '%' }"></div>
        <!-- Label name -->
        <div class="labelbot-labels-label__nameProgressColor">
          <span class="labelbot-labels-label__color" :style="{ backgroundColor: label.color }"></span>
          <span>{{ label.name }}</span>
        </div> 
      </div>
      <div v-else class="labelbot-labels-label__name">
        <span class="labelbot-labels-label__color" :style="{ backgroundColor: label.color }"></span>
        <span>{{ label.name }}</span>
      </div>
    </li>
    <li class="labelbot-labels-label">
      <input class="form-control" placeholder="type...">
    </li>
  </ul>
</template>

<script>
export default {
  data() {
    return {
      annotationPoints: { x: 222, y: 200 },
      labelBOTLabels: [
        { name: "Label 1", color: "red" },
        { name: "Label 2", color: "blue" },
        { name: "Label 3", color: "green" }
      ],
      progressWidth: 0
    };
  },
  methods: {
    startAnimation() {
      this.progressWidth = 100;
    }
  },
  mounted() {
    this.startAnimation();
  }
};
</script>