<script setup>
// import HelloWorld from './components/HelloWorld.vue'
// import TheWelcome from './components/TheWelcome.vue'
import {ref, computed} from "vue";

"use strict";

const round = ref('E1')
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
const discardInputs = ref([
  '1p 1p 9s 5z 7z 2z 3z 3z 9m 4m',
  '1p 1p 9s 5z 7z 2z 3z 3z 9m 4m',
  '1p 1p 9s 5z 7z 2z 3z 3z 9m 4m',
  '1p 1p 9s 5z 7z 2z 3z 3z 9m 4m'
])
const discards = computed(() => {
  return discardInputs.value.map(text =>
      text.trim().split(/\s+/)
  )
})

const activeCollapses = ref(['0', '1', '2', '3']);
</script>

<template>
  <main>
    <div class="outer">
      <div class="grid-main">
        <div class="grid-hand-p0-container">
          <span id="discard-bars" class="discard-bars"></span>
          <div class="grid-hand pov-p0 grid-hand-p0">
            <div class="pov-p0 hand-closed-p0">
              <div v-for="tile in selfHands" class="tileDiv">
                <img class="tileImg" :src="`src/assets/Regular_shortnames/${tile}.svg`" :alt="tile"/>
              </div>
            </div>
            <span class="pov-p0 hand-calls-p0"></span>
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
          <div v-for="tile in discards[0]" class="tileDiv">
            <img class="tileImg" :src="`src/assets/Regular_shortnames/${tile}.svg`" :alt="tile"/>
          </div>
        </div>
        <div class="grid-discard pov-p3 grid-discard-p3">
          <div v-for="tile in discards[3]" class="tileDiv">
            <img class="tileImg" :src="`src/assets/Regular_shortnames/${tile}.svg`" :alt="tile"/>
          </div>
        </div>
        <div class="grid-discard pov-p2 grid-discard-p2">
          <div v-for="tile in discards[2]" class="tileDiv">
            <img class="tileImg" :src="`src/assets/Regular_shortnames/${tile}.svg`" :alt="tile"/>
          </div>
        </div>
        <div class="grid-discard pov-p1 grid-discard-p1">
          <div v-for="tile in discards[1]" class="tileDiv">
            <img class="tileImg" :src="`src/assets/Regular_shortnames/${tile}.svg`" :alt="tile"/>
          </div>
        </div>
        <div class="grid-info">
          <button class="info-round">{{ round }}</button>
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
        <div class="panel">
          <h2>输入场况并渲染</h2>
          <label><input id="showOthersHands" type="checkbox"> Show others' hands</label>
          <label>Round
            <select v-model="round">
              <option value="E1">E1</option>
              <option value="E2">E2</option>
              <option value="E3">E3</option>
              <option value="E4">E4</option>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
              <option value="S3">S3</option>
              <option value="S4">S4</option>
            </select>
          </label>
          <el-collapse v-model="activeCollapses" expand-icon-position="left">
            <el-collapse-item title="Self" name="0">
              <label>Seat Wind
                <select v-model.number="selfWind">
                  <option value="0">E</option>
                  <option value="1">S</option>
                  <option value="2">W</option>
                  <option value="3">N</option>
                </select>
              </label>
              <label>Point
                <input type="number" step="100" v-model.number="points[0]"/>
              </label>
              <label>Hand (compact format: e.g. 227m45p55s0m means 2,2,7 man; 4,5 pin; 5,5 sou; red5 man)
                <input type="text" v-model="selfHandInput"/>
              </label>

              <label>Discard (space or newline separated)
                <textarea v-model="discardInputs[0]"></textarea>
              </label>
            </el-collapse-item>

            <el-collapse-item title="Right" name="1">
              <label>Point
                <input type="number" step="100" v-model.number="points[1]"/>
              </label>
              <label>Discard (space or newline separated)
                <textarea v-model="discardInputs[1]"></textarea>
              </label>
            </el-collapse-item>

            <el-collapse-item title="Opposite" name="2">
              <label>Point
                <input type="number" step="100" v-model.number="points[2]"/>
              </label>
              <label>Discard (space or newline separated)
                <textarea v-model="discardInputs[2]"></textarea>
              </label>
            </el-collapse-item>

            <el-collapse-item title="Left" name="3">
              <label>Point
                <input type="number" step="100" v-model.number="points[3]"/>
              </label>
              <label>Discard (space or newline separated)
                <textarea v-model="discardInputs[3]"></textarea>
              </label>
            </el-collapse-item>
          </el-collapse>

          <div class="row">
            <button class="btn" id="exportBtn">Export PNG</button>
          </div>
        </div>
      </div>
      <div class="opt-info">
      </div>
    </div>
  </main>
</template>

<style scoped>

</style>
