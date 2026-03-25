<script setup>
const { data } = defineProps(['data'])
let tileName
let tsumogiri = false, rotate = false, called = false, float = false
if (data === 'back') {
  tileName = 'back'
} else {
  tileName = data.slice(0, 2)
  const status = data.slice(2).split('')
  for (const c of status) {
    switch (c) {
      case 't':
        tsumogiri = true
        break
      case 'r':
        rotate = true
        break
      case 'c':
        called = true
        break
      case 'f':
        float = true
        break
    }
  }
}
</script>

<template>
  <div class="tileDiv">
    <img class="tileImg" :class="{'tsumogiri': tsumogiri, 'rotate': rotate, 'called': called, 'float': float}"
         :src="`/Regular_shortnames/${tileName}.svg`" :alt="tileName"/>
  </div>
</template>

<style scoped>

</style>