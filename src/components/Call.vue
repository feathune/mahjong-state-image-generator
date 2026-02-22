<script setup>
const { data } = defineProps(['data'])
let tileData = []
if (data.includes('C') || data.includes('P') || data.includes('M')) {
  for (const match of data.matchAll(/([CPM]?)([1-7][mpsz]|[089][mps])/g)) {
    if (match[1] === '') {
      tileData.push(match[2])
    } else {
      tileData.push(match[2] + 'r')
    }
  }
} else if (data.includes('A')) {
  const ankanTile = data.match(/[1-7][mpsz]|[089][mps]/)[0]
  if (ankanTile === '5m' || ankanTile === '5p' || ankanTile === '5s' ||
      ankanTile === '0m' || ankanTile === '0p' || ankanTile === '0s') {
    tileData.push('back', '0' + ankanTile[1], '5' + ankanTile[1], 'back')
  } else {
    tileData.push('back', ankanTile, ankanTile, 'back')
  }
} else if (data.includes('K')) {
  const kakanTiles = data.match(/[1-7][mpsz]|[089][mps]/g)
  const idx = data.search('K')
  if (idx === 0) {
    tileData.push(kakanTiles[1] + 'r', kakanTiles[0] + 'rf', kakanTiles[2], kakanTiles[3])
  } else if (idx === 2) {
    tileData.push(kakanTiles[0], kakanTiles[2] + 'r', kakanTiles[1] + 'rf', kakanTiles[3])
  } else if (idx === 6) {
    tileData.push(kakanTiles[0], kakanTiles[1], kakanTiles[2] + 'r', kakanTiles[3] + 'rf')
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