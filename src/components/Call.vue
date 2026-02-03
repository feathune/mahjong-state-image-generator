<script setup>
const { data } = defineProps(['data'])
let tileData = []
if (data.includes('C') || data.includes('P')) {
  for (const match of data.matchAll(/([CP]?)([1-7][mpsz]|[089][mps])/g)) {
    if (match[1] === '') {
      tileData.push(match[2])
    } else {
      tileData.push(match[2] + 'r')
    }
  }
} else if (data.includes('A')) {
  const ankanTile = data.match(/([1-7][mpsz]|[089][mps])/)[0]
  if (ankanTile[0] === '5' || ankanTile[0] === '0') {
    tileData.push('back', '0' + ankanTile[1], '5' + ankanTile[1], 'back')
  } else {
    tileData.push('back', ankanTile, ankanTile, 'back')
  }
} else if (data.includes('K')) {
  const kakanTile = data.match(/([1-7][mpsz]|[089][mps])/)[0]
  const idx = data.search('K')
  if (idx === 0) {
    tileData.push(kakanTile + 'r', kakanTile + 'rf', kakanTile, kakanTile)
  } else if (idx === 6) {
    tileData.push(kakanTile, kakanTile, kakanTile + 'r', kakanTile + 'rf')
  } else {
    tileData.push(kakanTile, kakanTile + 'r', kakanTile + 'rf', kakanTile)
  }
}
</script>

<template>
  <div class="root">
    <Tile v-for="tile in tileData" :key="tile" :data="tile"/>
  </div>
</template>

<style scoped>
.root {
  display: flex;
}
</style>