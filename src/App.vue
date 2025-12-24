<script setup>
// import HelloWorld from './components/HelloWorld.vue'
// import TheWelcome from './components/TheWelcome.vue'
import {ref, onMounted} from "vue";

"use strict";

const activeCollapses = ref(['1', '2', '3', '4']);
onMounted(() => {

  const windStr = ['E', 'S', 'W', 'N']
  document.getElementById('renderBtn').addEventListener('click', renderFromForm)

  function reset() {
    document.querySelector('.hand-closed-p0').replaceChildren()
    document.querySelector('.hand-closed-p1').replaceChildren()
    document.querySelector('.hand-closed-p2').replaceChildren()
    document.querySelector('.hand-closed-p3').replaceChildren()
    document.querySelector('.grid-discard-p0').replaceChildren()
    document.querySelector('.grid-discard-p1').replaceChildren()
    document.querySelector('.grid-discard-p2').replaceChildren()
    document.querySelector('.grid-discard-p3').replaceChildren()
  }

  function renderFromForm() {
    reset()
    document.querySelector('.info-round').textContent = document.querySelector('#roundSel').value
    for (let i = 0; i < 4; i++) {
      document.querySelector(`.gi-p${i}`).textContent = windStr[(parseInt(document.querySelector('#selfSeatWind').value) + i) % 4]
    }
    document.querySelector('.gi-p0').append(' ', document.querySelector('#selfPoint').value)
    const selfHand = document.querySelector('#selfHand').value.trim().split(/\s+/)
    for (const t of selfHand) {
      document.querySelector('.hand-closed-p0').appendChild(createTile(t))
    }
    const selfDiscard = document.querySelector('#selfDiscard').value.trim().split(/\s+/)
    for (const t of selfDiscard) {
      document.querySelector('.grid-discard-p0').appendChild(createTile(t))
    }
    document.querySelector('.gi-p1').append(' ', document.querySelector('#rightPoint').value)
    const rightDiscard = document.querySelector('#rightDiscard').value.trim().split(/\s+/)
    for (const t of rightDiscard) {
      document.querySelector('.grid-discard-p1').appendChild(createTile(t))
    }
    document.querySelector('.gi-p2').append(' ', document.querySelector('#oppositePoint').value)
    const oppositeDiscard = document.querySelector('#oppositeDiscard').value.trim().split(/\s+/)
    for (const t of oppositeDiscard) {
      document.querySelector('.grid-discard-p2').appendChild(createTile(t))
    }
    document.querySelector('.gi-p3').append(' ', document.querySelector('#leftPoint').value)
    const leftDiscard = document.querySelector('#leftDiscard').value.trim().split(/\s+/)
    for (const t of leftDiscard) {
      document.querySelector('.grid-discard-p3').appendChild(createTile(t))
    }
    for (let i = 0; i < 13; i++) {
      document.querySelector('.hand-closed-p1').appendChild(createTile('back'))
      document.querySelector('.hand-closed-p2').appendChild(createTile('back'))
      document.querySelector('.hand-closed-p3').appendChild(createTile('back'))
    }
  }

  function createTile(tileStr) {
    if (!tileStr || tileStr == null || tileStr.length > 5) {
      console.log('error', tileStr)
      throw new Error()
    }
    const tileDiv = document.createElement('div')
    const tileImg = document.createElement('img')
    tileDiv.append(tileImg)
    tileDiv.classList.add('tileDiv')
    tileImg.src = `src/assets/Regular_shortnames/${tileStr}.svg`
    tileImg.classList.add('tileImg')
    return tileDiv
  }

})
</script>

<template>
  <main>
    <div class="outer">
      <div class="grid-main">
                <span class="grid-hand-p0-container">
                    <span id="discard-bars" class="discard-bars"></span>
                    <span class="grid-hand pov-p0 grid-hand-p0">
                        <span class="pov-p0 hand-closed-p0"></span>
                        <span class="pov-p0 hand-calls-p0"></span>
                    </span>
                </span>
        <span class="grid-hand pov-p3 grid-hand-p3">
                    <span class="pov-p3 hand-closed-p3"></span>
                    <span class="pov-p3 hand-calls-p3"></span>
                </span>
        <span class="grid-hand pov-p2 grid-hand-p2">
                    <span class="pov-p2 hand-closed-p2"></span>
                    <span class="pov-p2 hand-calls-p2"></span>
                </span>
        <span class="grid-hand pov-p1 grid-hand-p1">
                    <span class="pov-p1 hand-closed-p1"></span>
                    <span class="pov-p1 hand-calls-p1"></span>
                </span>
        <span class="grid-discard pov-p0 grid-discard-p0"></span>
        <span class="grid-discard pov-p3 grid-discard-p3"></span>
        <span class="grid-discard pov-p2 grid-discard-p2"></span>
        <span class="grid-discard pov-p1 grid-discard-p1"></span>
        <div class="grid-info">
          <button class="info-round"></button>
          <span class="info-tiles-left"></span>
          <span class="info-honbas"></span>
          <span class="info-doras"></span>
          <span class="gi-p0-outer"><span class="gi-p0"></span><span class="gi-p0-result"></span></span>
          <span class="gi-p1-outer"><span class="gi-p1"></span><span class="gi-p1-result"></span></span>
          <span class="gi-p2-outer"><span class="gi-p2"></span><span class="gi-p2-result"></span></span>
          <span class="gi-p3-outer"><span class="gi-p3"></span><span class="gi-p3-result"></span></span>
        </div>
      </div>
      <div class="sidebar">
        <div class="panel">
          <h2>输入场况并渲染</h2>
          <label><input id="showOthersHands" type="checkbox"> Show others' hands</label>
          <label>Round
            <select id="roundSel">
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
            <el-collapse-item title="Self" name="1">
              <label>Seat Wind
                <select id="selfSeatWind">
                  <option value="0">E</option>
                  <option value="1">S</option>
                  <option value="2">W</option>
                  <option value="3">N</option>
                </select>
              </label>
              <label>Point
                <input id="selfPoint" type="text" value="25000"/>
              </label>
              <label>Hand (compact format: e.g. 227m45p55s0m means 2,2,7 man; 4,5 pin; 5,5 sou; red5 man)
                <input id="selfHand" type="text" value="1m 1m 1m 2m 3m 4m 0m 5m 6m 7m 8m 9m 9m 9m"/>
              </label>

              <label>Discard (space or newline separated)
                <textarea id="selfDiscard">1p 1p 9s 5z 7z 2z 3z 3z 9m 4m</textarea>
              </label>
            </el-collapse-item>

            <el-collapse-item title="Right" name="2">
              <label>Point
                <input id="rightPoint" type="text" value="25000"/>
              </label>
              <label>Discard (space or newline separated)
                <textarea id="rightDiscard">1p 1p 9s 5z 7z 2z 3z 3z 9m 4m</textarea>
              </label>
            </el-collapse-item>

            <el-collapse-item title="Opposite" name="3">
              <label>Point
                <input id="oppositePoint" type="text" value="25000"/>
              </label>
              <label>Discard (space or newline separated)
                <textarea id="oppositeDiscard">1p 1p 9s 5z 7z 2z 3z 3z 9m 4m</textarea>
              </label>
            </el-collapse-item>

            <el-collapse-item title="Left" name="4">
              <label>Point
                <input id="leftPoint" type="text" value="25000"/>
              </label>
              <label>Discard (space or newline separated)
                <textarea id="leftDiscard">1p 1p 9s 5z 7z 2z 3z 3z 9m 4m</textarea>
              </label>
            </el-collapse-item>
          </el-collapse>

          <div class="row">
            <button class="btn" id="renderBtn">Render</button>
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
