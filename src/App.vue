<script setup>
import {ref, computed, reactive, provide} from "vue";
import {useImportExport} from "@/composables/useImportExport.js";
import InputPanel from "@/components/InputPanel.vue";
import Tile from "@/components/Tile.vue";
import Call from "@/components/Call.vue";

"use strict";

const gameState = reactive({
  round: 'S4',
  honba: 1,
  storedStick: 1,
  doras:['9p', '2p'],
  selfWind: 2,   // 0:E 1:S 2:W 3:N
  points: [40200, 46700, 8300, 2800],
  closedHands: [['4m', '5m', '5m', '6m', '7m', '7m', '8m', '7m'], 7, 10, 13],
  calls: [['C2m3m4m', '6z6zP6z'], ['C2p3p4p', 'C7p6p8p'], ['A7s'], []],
  discards: [
      ['4z', '1z', '2s', '9p', '5zt', '7pc', '2pc', '1p', '3zt', '9pt', '2z', '2st', '2pt', '6st', '4pt', '2mt', '9pt', '4pt'],
      ['3z', '7z', '6zc', '1st', '9mt', '1m', '1m', '7zt', '9st', '3zt', '1st', '4z', '5z', '3s', '3s', '1pt', '1s', '8pt'],
      ['2z', '1z', '8p', '6p', '1zt', '9s', '9s', '7pt', '7zt', '2zt', '5st', '2mr', '3st', '2pt', '7pt', '7pt', '1st', '2zt'],
      ['2s', '7z', '2st', '1m', '5zt', '5p', '8p', '5pt', '3s', '2mc', '0pt', '9sr', '1pt', '1pt', '9mt', '3zt', '1mt', '6pt']
  ]
})

provide('gameState', gameState)

const paddedDoras = computed(() => gameState.doras.concat(Array(5 - gameState.doras.length).fill('back')))
const windStr = ['E', 'S', 'W', 'N']
const playerWinds = computed(() => Array.from({length: 4}, (_, i) => windStr[(gameState.selfWind + i) % 4]))
</script>

<template>
  <main>
    <div class="outer">
      <div class="grid-main">
        <div class="grid-hand pov-p0 grid-hand-p0">
          <div class="pov-p0 hand-closed-p0" :key="JSON.stringify(gameState.closedHands[0])">
            <div v-for="(tile, index) in gameState.closedHands[0]" style="display: flex">
              <Tile v-if="index === gameState.closedHands[0].length - 1" data="back" class="narrow" style="visibility: hidden"/>
              <Tile :data="tile"/>
            </div>
          </div>
          <div class="pov-p0 hand-calls-p0">
            <Call v-for="call in gameState.calls[0]" :key="call" :data="call"/>
          </div>
        </div>
        <div class="grid-hand pov-p3 grid-hand-p3">
          <div class="pov-p3 hand-closed-p3">
            <div v-for="_ in gameState.closedHands[3]" class="tileDiv">
            <img class="tileImg" src="@/assets/Regular_shortnames/back.svg" alt="Tile back"/>
            </div>
          </div>
          <div class="pov-p3 hand-calls-p3">
            <Call v-for="call in gameState.calls[3]" :key="call" :data="call"/>
          </div>
        </div>
        <div class="grid-hand pov-p2 grid-hand-p2">
          <div class="pov-p2 hand-closed-p2">
            <div v-for="_ in gameState.closedHands[2]" class="tileDiv">
            <img class="tileImg" src="@/assets/Regular_shortnames/back.svg" alt="Tile back"/>
            </div>
          </div>
          <div class="pov-p2 hand-calls-p2">
            <Call v-for="call in gameState.calls[2]" :key="call" :data="call"/>
          </div>
        </div>
        <div class="grid-hand pov-p1 grid-hand-p1">
          <div class="pov-p1 hand-closed-p1">
            <div v-for="_ in gameState.closedHands[1]" class="tileDiv">
            <img class="tileImg" src="@/assets/Regular_shortnames/back.svg" alt="Tile back"/>
            </div>
          </div>
          <div class="pov-p1 hand-calls-p1">
            <Call v-for="call in gameState.calls[1]" :key="call" :data="call"/>
          </div>
        </div>
        <div class="grid-discard pov-p0 grid-discard-p0">
          <Tile v-for="tile in gameState.discards[0]" :key="tile" :data="tile"></Tile>
        </div>
        <div class="grid-discard pov-p3 grid-discard-p3">
          <Tile v-for="tile in gameState.discards[3]" :key="tile" :data="tile"></Tile>
        </div>
        <div class="grid-discard pov-p2 grid-discard-p2">
          <Tile v-for="tile in gameState.discards[2]" :key="tile" :data="tile"></Tile>
        </div>
        <div class="grid-discard pov-p1 grid-discard-p1">
          <Tile v-for="tile in gameState.discards[1]" :key="tile" :data="tile"></Tile>
        </div>
        <div class="grid-info">
          <button class="info-round">
            {{ gameState.round }}-{{ gameState.honba }}{{ gameState.storedStick > 0 ? ' +' + gameState.storedStick * 1000 : '' }}
          </button>
          <span class="info-tiles-left"></span>
          <div class="info-doras">
            <Tile v-for="tile in paddedDoras" :key="tile" :data="tile"/>
          </div>
          <span class="gi-p0-outer"><span class="gi-p0">{{ playerWinds[0] }} {{ gameState.points[0] }}</span><span class="gi-p0-result"></span></span>
          <span class="gi-p1-outer"><span class="gi-p1">{{ playerWinds[1] }} {{ gameState.points[1] }}</span><span class="gi-p1-result"></span></span>
          <span class="gi-p2-outer"><span class="gi-p2">{{ playerWinds[2] }} {{ gameState.points[2] }}</span><span class="gi-p2-result"></span></span>
          <span class="gi-p3-outer"><span class="gi-p3">{{ playerWinds[3] }} {{ gameState.points[3] }}</span><span class="gi-p3-result"></span></span>
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
