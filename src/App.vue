<script setup>
import {ref, computed, reactive, provide} from "vue";
import {useImportExport} from "@/composables/useImportExport.js";
import InputPanel from "@/components/InputPanel.vue";
import Tile from "@/components/Tile.vue";
import Call from "@/components/Call.vue";

"use strict";

const windStr = ['E', 'S', 'W', 'N']
const selfWind = ref(0)   // 0:E 1:S 2:W 3:N
const playerWinds = computed(() => {
  return Array.from({length: 4}, (_, i) =>
      windStr[(selfWind.value + i) % 4]
  )
})
const points = ref([25000, 25000, 25000, 25000])
const selfHandInput = ref('1m 1m 1m 2m 3m 4m 0m 5m 6m 7m 8m 9m 9m 9m')
const selfHands = computed(() =>
    selfHandInput.value.trim().split(/\s+/)
)

const gameState = reactive({
  round: 'S4',
  honba: 1,
  storedStick: 1,
  doraInput: '9p 2p',
  selfWind: 2,   // 0:E 1:S 2:W 3:N
  points: [40200, 46700, 8300, 2800],
  selfClosedHandInput: '4556778m7m',
  callInputs: ['C2m3m4m 6z6zP6z', 'C2p3p4p C7p6p8p', '7s7s7sA7s', ''],
  discardInputs: [
      '4z 1z 2s 9p 5zt 7pc\n2pc 1p 3zt 9pt 2z 2st\n2pt 6st 4pt 2mt 9pt 4pt',
      '3z 7z 6zc 1st 9mt 1m\n1m 7zt 9st 3zt 1st 4z\n5z 3s 3s 1pt 1s 8pt',
      '2z 1z 8p 6p 1zt 9s\n9s 7pt 7zt 2zt 5st 2mr\n3st 2pt 7pt 7pt 1st 2zt',
      '2s 7z 2st 1m 5zt 5p\n8p 5pt 3s 2mc 0pt 9sr\n1pt 1pt 9mt 3zt 1mt 6pt'
  ]
})

function compactFormatToArray(str) {
  let output = []
  let suit = ''
  for (let i = str.length - 1; i >= 0; i --) {
    if (isNaN(str[i])) {
      suit = str[i]
    } else {
      output.push(str[i] + suit)
    }
  }
  output.reverse()
  return output
}

const selfClosedHands = computed(() =>
    compactFormatToArray(gameState.selfClosedHandInput)
)

const discards = computed(() => {
  return gameState.discardInputs.map(text =>
      text.trim().match(/([1-7][mpsz]|[089][mps])[tcr]*/g)
  )
})

provide('gameState', gameState)
</script>

<template>
  <main>
    <div class="outer">
      <div class="grid-main">
        <div class="grid-hand pov-p0 grid-hand-p0">
          <div class="pov-p0 hand-closed-p0">
            <div v-for="(tile, index) in selfClosedHands" :key="tile" style="display: flex">
              <Tile v-if="index === selfClosedHands.length - 1" data="back" class="narrow" style="visibility: hidden"/>
              <Tile :data="tile"/>
            </div>
          </div>
          <div class="pov-p0 hand-calls-p0">
            <Call v-for="call in gameState.callInputs[0].split(' ')" :key="call" :data="call"/>
          </div>
        </div>
        <div class="grid-hand pov-p3 grid-hand-p3">
          <div class="pov-p3 hand-closed-p3">
            <div v-for="_ in 13" class="tileDiv">
            <img class="tileImg" src="@/assets/Regular_shortnames/back.svg" alt="Tile back"/>
            </div>
          </div>
          <span class="pov-p3 hand-calls-p3"></span>
        </div>
        <div class="grid-hand pov-p2 grid-hand-p2">
          <div class="pov-p2 hand-closed-p2">
            <div v-for="_ in 13" class="tileDiv">
            <img class="tileImg" src="@/assets/Regular_shortnames/back.svg" alt="Tile back"/>
            </div>
          </div>
          <span class="pov-p2 hand-calls-p2"></span>
        </div>
        <div class="grid-hand pov-p1 grid-hand-p1">
          <div class="pov-p1 hand-closed-p1">
            <div v-for="_ in 13" class="tileDiv">
            <img class="tileImg" src="@/assets/Regular_shortnames/back.svg" alt="Tile back"/>
            </div>
          </div>
          <span class="pov-p1 hand-calls-p1"></span>
        </div>
        <div class="grid-discard pov-p0 grid-discard-p0">
          <Tile v-for="tile in discards[0]" :key="tile" :data="tile"></Tile>
        </div>
        <div class="grid-discard pov-p3 grid-discard-p3">
          <Tile v-for="tile in discards[3]" :key="tile" :data="tile"></Tile>
        </div>
        <div class="grid-discard pov-p2 grid-discard-p2">
          <Tile v-for="tile in discards[2]" :key="tile" :data="tile"></Tile>
        </div>
        <div class="grid-discard pov-p1 grid-discard-p1">
          <Tile v-for="tile in discards[1]" :key="tile" :data="tile"></Tile>
        </div>
        <div class="grid-info">
          <button class="info-round">{{ gameState.round }}</button>
          <span class="info-tiles-left"></span>
          <span class="info-honbas"></span>
          <span class="info-doras"></span>
          <span class="gi-p0-outer"><span class="gi-p0">{{ playerWinds[0] }} {{ points[0] }}</span><span class="gi-p0-result"></span></span>
          <span class="gi-p1-outer"><span class="gi-p1">{{ playerWinds[1] }} {{ points[1] }}</span><span class="gi-p1-result"></span></span>
          <span class="gi-p2-outer"><span class="gi-p2">{{ playerWinds[2] }} {{ points[2] }}</span><span class="gi-p2-result"></span></span>
          <span class="gi-p3-outer"><span class="gi-p3">{{ playerWinds[3] }} {{ points[3] }}</span><span class="gi-p3-result"></span></span>
        </div>
      </div>
      <div class="sidebar">
        <InputPanel></InputPanel>
      </div>
    </div>
  </main>
</template>

<style scoped>

</style>
