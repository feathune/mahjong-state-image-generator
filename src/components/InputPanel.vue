<script setup>
import {inject, reactive, ref, watch} from 'vue'
import {useImportExport} from "@/composables/useImportExport.js"

const gameState = inject('gameState')

const tileCnt = new Map()
function resetTileCnt() {
  for (let t of [
      '0m', '1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m',
      '0p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p',
      '0s', '1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s',
      '1z', '2z', '3z', '4z', '5z', '6z', '7z'
  ]) {
    tileCnt.set(t, [])
  }
}
resetTileCnt()

const activeCollapses = ref([0, 1, 2, 3])

const inputs = reactive({
  dora: {
    raw: gameState.doras.join(' '),
    parsed: [],
    valid: true,
    error: ''
  },
  selfClosedHand: {
    raw: compactClosedHand(gameState.closedHands[0]),
    parsed: [],
    valid: true,
    error: ''
  },
  call: {
    raw: gameState.calls.map(callArray => callArray.join(' ')),
    parsed: [[], [], [], []],
    valid: [true, true, true, true],
    errors: ['', '', '', '']
  },
  discard: {
    raw: gameState.discards.map(discardArray => stringifyDiscards(discardArray)),
    parsed: [[], [], [], []],
    valid: [true, true, true, true],
    errors: ['', '', '', '']
  }
})

function validateDora(input) {
  inputs.dora.error = ''
  inputs.dora.raw = input
  // validate syntax
  const doraRegex = /\s*([1-7][mpsz]|[089][mps])\s*/g
  const { result, valid } = parseInput(doraRegex, input)
  inputs.dora.parsed = result
  inputs.dora.valid = valid
  if (!valid) {
    inputs.dora.error = 'Text in red is invalid in syntax'
    return
  }
  // validate the number of doras
  if (inputs.dora.parsed.length < 1) {
    inputs.dora.valid = false
    inputs.dora.error = 'Too few doras'
    return
  }
  if (inputs.dora.parsed.length > 5) {
    inputs.dora.valid = false
    inputs.dora.error = 'Too many doras'
    return
  }
  const doras = inputs.dora.parsed.map(part => part.text.trim())
  for (let t of doras) {
    tileCnt.get(t).push({source: 'dora'})
  }
  return doras
}
function validateSelfClosedHand(input) {
  inputs.selfClosedHand.error = ''
  inputs.selfClosedHand.raw = input
  // validate syntax
  const closedHandRegex = /\s*([0-9]+[mps]|[1-7]+z)\s*/g
  const { result, valid } = parseInput(closedHandRegex, input)
  inputs.selfClosedHand.parsed = result
  inputs.selfClosedHand.valid = valid
  if (!valid) {
    inputs.selfClosedHand.error = 'Text in red is invalid in syntax'
    return
  }
  // validate the number of tiles   TODO:改！这个不能用单域检查
  const tileStrings = compactFormatToArray(input)
  // const expectedTileCnt = 14 - gameState.calls[0].length * 3
  // if (tileStrings.length < expectedTileCnt) {
  //   inputs.selfClosedHand.valid = false
  //   inputs.selfClosedHand.error =
  //       `Too few tiles for a 'which to discard' scenario. You should have ${expectedTileCnt} tiles in your closed hand`
  //   return
  // } else if (tileStrings.length > expectedTileCnt) {
  //   inputs.selfClosedHand.valid = false
  //   inputs.selfClosedHand.error =
  //       `Too many tiles for a 'which to discard' scenario. You should have ${expectedTileCnt} tiles in your closed hand`
  //   return
  // }
  for (let t of tileStrings) {
    tileCnt.get(t).push({source: 'selfClosedHand'})
  }
  // sort tiles (except last one)
  const lastTile = tileStrings.pop()
  const sorted = sortTiles(tileStrings)
  sorted.push(lastTile)
  return sorted
}
function validateCall(playerIdx, input) {
  inputs.call.errors[playerIdx] = ''
  inputs.call.raw[playerIdx] = input
  // validate syntax
  const callRegex = /\s*([1-7][mpsz]|[089][mps])*[CPAMK]([1-7][mpsz]|[089][mps])+\s*/g
  const { result, valid } = parseInput(callRegex, input)
  inputs.call.parsed[playerIdx] = result
  inputs.call.valid[playerIdx] = valid
  // validate call logic
  let callCnt = 0

  /**
   * @param tokens Tokens of the current call
   * @param i Index of the current call
   */
  function validateCallLogic(tokens, i) {
    if (tokens.includes('C')) {
      if (tokens.length < 4) {
        inputs.call.parsed[playerIdx][i].valid = false
        inputs.call.valid[playerIdx] = false
        inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
            `${inputs.call.parsed[playerIdx][i].text.trim()}: Too few tiles for a call of chi`
      } else if (tokens.length > 4) {
        inputs.call.parsed[playerIdx][i].valid = false
        inputs.call.valid[playerIdx] = false
        inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
            `${inputs.call.parsed[playerIdx][i].text.trim()}: Too many tiles for a call of chi. Do you forget a space?`
      } else if (tokens.indexOf('C') !== 0) {
        inputs.call.parsed[playerIdx][i].valid = false
        inputs.call.valid[playerIdx] = false
        inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
            `${inputs.call.parsed[playerIdx][i].text.trim()}: Chi can only be called on player to the left`
      } else {
        const nums = [tileStrToInt(tokens[1]), tileStrToInt(tokens[2]), tileStrToInt(tokens[3])]
        nums.sort()
        if (nums[2] > 40) {
          inputs.call.parsed[playerIdx][i].valid = false
          inputs.call.valid[playerIdx] = false
          inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
              `${inputs.call.parsed[playerIdx][i].text.trim()}: Honor tiles can not chi`
        } else if (nums[2] - nums[0] === 0) {
          inputs.call.parsed[playerIdx][i].valid = false
          inputs.call.valid[playerIdx] = false
          inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
              `${inputs.call.parsed[playerIdx][i].text.trim()}: A call of chi must be a sequence. Do you mean pon (P)?`
        } else if (nums[2] - nums[0] !== 2) {
          inputs.call.parsed[playerIdx][i].valid = false
          inputs.call.valid[playerIdx] = false
          inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
              `${inputs.call.parsed[playerIdx][i].text.trim()}: A call of chi must be a sequence`
        } else {
          callCnt++
        }
      }
    } else if (tokens.includes('P')) {
      if (tokens.length < 4) {
        inputs.call.parsed[playerIdx][i].valid = false
        inputs.call.valid[playerIdx] = false
        inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
            `${inputs.call.parsed[playerIdx][i].text.trim()}: Too few tiles for a call of pon`
      } else if (tokens.length > 4) {
        inputs.call.parsed[playerIdx][i].valid = false
        inputs.call.valid[playerIdx] = false
        inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
            `${inputs.call.parsed[playerIdx][i].text.trim()}: Too many tiles for a call of pon. Do you forget a space?`
      } else {
        const nums = []
        for (const token of tokens) {
          if (token === 'P') {
            continue
          }
          nums.push(tileStrToInt(token))
        }
        nums.sort()
        if (nums[2] - nums[0] === 2) {
          inputs.call.parsed[playerIdx][i].valid = false
          inputs.call.valid[playerIdx] = false
          inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
              `${inputs.call.parsed[playerIdx][i].text.trim()}: A call of pon must be a triplet. Do you mean chi (C)?`
        } else if (nums[2] - nums[0] !== 0) {
          inputs.call.parsed[playerIdx][i].valid = false
          inputs.call.valid[playerIdx] = false
          inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
              `${inputs.call.parsed[playerIdx][i].text.trim()}: A call of pon must be a triplet`
        } else {
          callCnt++
        }
      }
    } else if (tokens.includes('M')) {
      if (tokens.length < 5) {
        inputs.call.parsed[playerIdx][i].valid = false
        inputs.call.valid[playerIdx] = false
        inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
            `${inputs.call.parsed[playerIdx][i].text.trim()}: Too few tiles for a call of minkan`
      } else if (tokens.length > 5) {
        inputs.call.parsed[playerIdx][i].valid = false
        inputs.call.valid[playerIdx] = false
        inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
            `${inputs.call.parsed[playerIdx][i].text.trim()}: Too many tiles for a call of minkan. Do you forget a space?`
      } else if (tokens.indexOf('M') === 2) {
        inputs.call.parsed[playerIdx][i].valid = false
        inputs.call.valid[playerIdx] = false
        inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
            `${inputs.call.parsed[playerIdx][i].text.trim()}: Please enter --M------ to describe minkan player across`
      } else {
        const nums = []
        for (const token of tokens) {
          if (token === 'M') {
            continue
          }
          nums.push(tileStrToInt(token))
        }
        nums.sort()
        if (nums[3] - nums[0] !== 0) {
          inputs.call.parsed[playerIdx][i].valid = false
          inputs.call.valid[playerIdx] = false
          inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
              `${inputs.call.parsed[playerIdx][i].text.trim()}: A call of minkan must be a quad`
        } else {
          callCnt++
        }
      }
    } else if (tokens.includes('K')) {
      if (tokens.length < 5) {
        inputs.call.parsed[playerIdx][i].valid = false
        inputs.call.valid[playerIdx] = false
        inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
            `${inputs.call.parsed[playerIdx][i].text.trim()}: Too few tiles for a call of kakan`
      } else if (tokens.length > 5) {
        inputs.call.parsed[playerIdx][i].valid = false
        inputs.call.valid[playerIdx] = false
        inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
            `${inputs.call.parsed[playerIdx][i].text.trim()}: Too many tiles for a call of kakan. Do you forget a space?`
      } else if (tokens.indexOf('K') === 2) {
        inputs.call.parsed[playerIdx][i].valid = false
        inputs.call.valid[playerIdx] = false
        inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
            `${inputs.call.parsed[playerIdx][i].text.trim()}: Please enter --K------ to describe kakan player across`
      } else {
        const nums = []
        for (const token of tokens) {
          if (token === 'K') {
            continue
          }
          nums.push(tileStrToInt(token))
        }
        nums.sort()
        if (nums[3] - nums[0] !== 0) {
          inputs.call.parsed[playerIdx][i].valid = false
          inputs.call.valid[playerIdx] = false
          inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
              `${inputs.call.parsed[playerIdx][i].text.trim()}: A call of kakan must be a quad`
        } else {
          callCnt++
        }
      }
    } else if (tokens.includes('A')) {
      if (tokens.length > 2) {
        inputs.call.parsed[playerIdx][i].valid = false
        inputs.call.valid[playerIdx] = false
        inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] ||
            `${inputs.call.parsed[playerIdx][i].text.trim()}: You only need one tile to describe an ankan. Or do you forget a space?`
      } else {
        callCnt++
      }
    }
  }

  for (let i = 0; i < inputs.call.parsed[playerIdx].length; i++) {
    if (inputs.call.parsed[playerIdx][i].valid === false) {
      continue
    }
    const tokens = inputs.call.parsed[playerIdx][i].text.trim().match(/[CPAMK]|[1-7][mpsz]|[089][mps]/g)
    validateCallLogic(tokens, i);
    if (callCnt === 4) {
      if (i !== inputs.call.parsed[playerIdx].length - 1) {
        inputs.call.valid[playerIdx] = false
        for (let j = i + 1; j < inputs.call.parsed[playerIdx].length; j++) {
          inputs.call.parsed[playerIdx][j].valid = false
        }
        inputs.call.errors[playerIdx] = 'The number of calls should not exceed 4'
        return
      }
    }
  }

  if (!inputs.call.valid[playerIdx]) {
    inputs.call.errors[playerIdx] = inputs.call.errors[playerIdx] || 'Text in red is invalid in syntax'
  } else {
    const newCalls = []
    for (const part of inputs.call.parsed[playerIdx]) {
      newCalls.push(part.text.trim())
    }

    for (let c of newCalls) {
      if (c[0] === 'A') {
        const ankanTile = c.slice(1, 3)
        if (ankanTile[0] === '5' || ankanTile[0] === '0') {
          tileCnt.get(`0${ankanTile[1]}`).push({source: 'call', playerIdx: playerIdx})
          tileCnt.get(`5${ankanTile[1]}`).push({source: 'call', playerIdx: playerIdx})
          tileCnt.get(`5${ankanTile[1]}`).push({source: 'call', playerIdx: playerIdx})
          tileCnt.get(`5${ankanTile[1]}`).push({source: 'call', playerIdx: playerIdx})
        } else {
          tileCnt.get(ankanTile).push(...Array(4).fill({source: 'call', playerIdx: playerIdx}))
        }
      } else {
        const tiles = c.match(/[1-7][mpsz]|[089][mps]/g)
        for (const t of tiles) {
          tileCnt.get(t).push({source: 'call', playerIdx: playerIdx})
        }
      }
    }

    return newCalls
  }
}
function validateDiscard(playerIdx, input) {
  inputs.discard.errors[playerIdx] = ''
  inputs.discard.raw[playerIdx] = input
  // validate syntax
  const discardRegex = /\s*([1-7][mpsz]|[089][mps])[tcr]*\s*/g
  const { result, valid } = parseInput(discardRegex, input)
  inputs.discard.parsed[playerIdx] = result
  inputs.discard.valid[playerIdx] = valid
  if (!valid) {
    inputs.discard.errors[playerIdx] = 'Text in red is invalid in syntax'
    return
  }
  const discards = inputs.discard.parsed[playerIdx].map(part => part.text.trim())
  const tiles = discards.reduce((acc, d) => {
    if (!d.includes('c')) {
      acc.push(d.slice(0, 2))
    }
    return acc
  }, [])
  for (const t of tiles) {
    tileCnt.get(t).push({source: 'discard', playerIdx: playerIdx})
  }
  return discards
}

function validateTileCnt() {
  const exceededTiles = {
    dora: new Set(),
    selfClosedHand: new Set(),
    call: [new Set(), new Set(), new Set(), new Set()],
    discard: [new Set(), new Set(), new Set(), new Set()]
  }
  for (const [tile, sources] of tileCnt) {
    if (sources.length > 4) {
      for (const s of sources) {
        if (s.source === 'dora' || s.source === 'selfClosedHand') {
          exceededTiles[s.source].add(tile)
        } else {
          exceededTiles[s.source][s.playerIdx].add(tile)
        }
      }
    }
  }
  for (const tile of exceededTiles.dora) {
    inputs.dora.error += `Too many ${tile} on the table! `
  }
  for (const tile of exceededTiles.selfClosedHand) {
    inputs.selfClosedHand.error += `Too many ${tile} on the table! `
  }
  for (let i = 0; i < 4; i++) {
    for (const tile of exceededTiles.call[i]) {
      inputs.call.errors[i] += `Too many ${tile} on the table! `
    }
    for (const tile of exceededTiles.discard[i]) {
      inputs.discard.errors[i] += `Too many ${tile} on the table! `
    }
  }
}

function validate() {
  resetTileCnt()

  const doras = validateDora(inputs.dora.raw)
  const selfClosedHand = validateSelfClosedHand(inputs.selfClosedHand.raw)
  const calls = []
  const discards = []
  for (let i = 0; i < 4; i++) {
    calls.push(validateCall(i, inputs.call.raw[i]))
    discards.push(validateDiscard(i, inputs.discard.raw[i]))
  }

  validateTileCnt()

  if (isStateValid()) {
    gameState.doras = doras
    gameState.closedHands[0] = selfClosedHand
    gameState.calls = calls
    for (let i = 1; i < 4; i++) {
      gameState.closedHands[i] = 13 - gameState.calls[i].length * 3
    }
    gameState.discards = discards
  }
}

function isStateValid() {
  if (inputs.dora.error) {
    return false
  }
  if (inputs.selfClosedHand.error) {
    return false
  }
  for (let i = 0; i < 4; i++) {
    if (inputs.call.errors[i]) {
      return false
    }
    if (inputs.discard.errors[i]) {
      return false
    }
  }
  return true
}

watch([
  () => inputs.dora.raw,
  () => inputs.selfClosedHand.raw,
  () => inputs.call.raw,
  () => inputs.discard.raw,
], () => validate(), {deep: true})

// Converts ['4m', '5m', '5m', '6m', '7m', '7m', '8m', '7m'] (already sorted) into '4556778m7m'
function compactClosedHand(closedHandArray) {
  const parts = []
  let currentSuit = ''
  // ['4m', '5m', '5m', '6m', '7m', '7m'] => '455677'
  for (let i = 0; i < closedHandArray.length - 2; i++) {
    if (closedHandArray[i][1] !== currentSuit) {
      parts.push(currentSuit)
      currentSuit = closedHandArray[i][1]
    }
    parts.push(closedHandArray[i][0])
  }
  parts.push(closedHandArray[closedHandArray.length - 2])
  parts.push(closedHandArray[closedHandArray.length - 1])
  return parts.join('')
}

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

function sortTiles(tileStrArray) {
  const tileNums = tileStrArray.map(str => tileStrToFloat(str))
  tileNums.sort()
  return tileNums.map(float => floatToTileStr(float))
}

function tileStrToFloat(str) {
  switch (str) {
    case '0m':
      return 15.5
    case '0p':
      return 25.5
    case '0s':
      return 35.5
  }
  const suitMap = {'m': 1, 'p': 2, 's': 3, 'z': 4}
  return 10 * suitMap[str[1]] + parseInt(str[0])
}

function floatToTileStr(float) {
  switch (float) {
    case 15.5:
      return '0m'
    case 25.5:
      return '0p'
    case 35.5:
      return '0s'
  }
  const suits = ['', 'm', 'p', 's', 'z']
  return float % 10 + suits[Math.floor(float / 10)]
}

function tileStrToInt(str) {
  switch (str) {
    case '0m':
      return 15
    case '0p':
      return 25
    case '0s':
      return 35
  }
  const suitMap = {'m': 1, 'p': 2, 's': 3, 'z': 4}
  return 10 * suitMap[str[1]] + parseInt(str[0])
}

function stringifyDiscards(discardArray) {
  const parts = []
  for (let i = 0; i < discardArray.length; i++) {
    parts.push(discardArray[i])
    if (i % 6 === 5) {
      parts.push('\n')
    } else {
      parts.push(' ')
    }
  }
  return parts.join('').trim()
}

function parseInput(regex, input) {
  let lastIdx = 0
  let match
  let result = []
  let valid = true
  regex.lastIndex = 0
  while ((match = regex.exec(input)) != null) {
    if (match.index > lastIdx) {
      valid = false
      result.push({
        text: input.slice(lastIdx, match.index),
        valid: false
      })
    }
    result.push({
      text: match[0],
      valid: true
    })
    lastIdx = regex.lastIndex
  }
  if (lastIdx < input.length) {
    valid = false
    result.push({
      text: input.slice(lastIdx),
      valid: false
    })
  }
  return { result, valid }
}

const {importMetadataFromPNG, exportPngWithMetadata} = useImportExport(gameState)

function exportPNG() {
  if (!isStateValid()) {
    alert('Input panel contains errors. Please fix them before export')
    return
  }
  exportPngWithMetadata()
}

async function importPNG(event) {
  await importMetadataFromPNG(event)
  resetInputPanel()
}

function resetInputPanel() {
  inputs.dora = {
    raw: gameState.doras.join(' '),
    parsed: [],
    valid: true,
    error: ''
  }
  inputs.selfClosedHand = {
    raw: compactClosedHand(gameState.closedHands[0]),
    parsed: [],
    valid: true,
    error: ''
  }
  inputs.call = {
    raw: gameState.calls.map(callArray => callArray.join(' ')),
    parsed: [[], [], [], []],
    valid: [true, true, true, true],
    errors: ['', '', '', '']
  }
  inputs.discard = {
    raw: gameState.discards.map(discardArray => stringifyDiscards(discardArray)),
    parsed: [[], [], [], []],
    valid: [true, true, true, true],
    errors: ['', '', '', '']
  }
  // inputs.discard.raw = gameState.discards.map(discardArray => stringifyDiscards(discardArray))
  // console.log('done')
}
</script>

<template>
  <div class="panel">
<!--    <h2>Maybe we don't need a heading..</h2>-->
<!--    TODO -->
<!--    <label><input id="showOthersHands" type="checkbox"> Show others' hands</label>-->
    <el-form label-width="auto">
      <el-form-item label="Round">
        <el-select v-model="gameState.round">
          <el-option v-for="r in ['E1', 'E2', 'E3', 'E4', 'S1', 'S2', 'S3', 'S4']" :value="r"/>
        </el-select>
      </el-form-item>
      <el-form-item label="Honba">
        <el-input-number v-model.number="gameState.honba" :min="0"/>
      </el-form-item>
      <el-form-item label="Stored Riichi Stick">
        <el-input-number v-model.number="gameState.storedStick" :min="0"/>
      </el-form-item>

      <el-form-item label="Dora Indicator" :error="inputs.dora.error">
        <el-input v-model="inputs.dora.raw"/>
        <div v-if="!inputs.dora.valid" class="input-mirror">
              <span v-for="part in inputs.dora.parsed" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
        </div>
      </el-form-item>
      <el-divider v-if="inputs.dora.error" border-style="none"/>

      <el-collapse v-model="activeCollapses" expand-icon-position="left">
        <el-collapse-item title="Self" :name="0">
          <el-form-item label="Seat Wind">
            <el-select v-model.number="gameState.selfWind">
              <el-option v-for="w in [[0, 'E'], [1, 'S'], [2, 'W'], [3, 'N']]" :value="w[0]" :label="w[1]"/>
            </el-select>
          </el-form-item>
          <el-form-item label="Point">
            <el-input-number v-model.number="gameState.points[0]" :step="100" step-strictly/>
          </el-form-item>

          <el-form-item label="Closed Hand" label-position="top" :error="inputs.selfClosedHand.error">
            <el-input v-model="inputs.selfClosedHand.raw"/>
            <div v-if="!inputs.selfClosedHand.valid" class="input-mirror">
              <span v-for="part in inputs.selfClosedHand.parsed" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="inputs.selfClosedHand.error" border-style="none"/>

          <el-form-item label="Call" label-position="top" :error="inputs.call.errors[0]">
            <el-input v-model="inputs.call.raw[0]"/>
            <div v-if="!inputs.call.valid[0]" class="input-mirror">
              <span v-for="part in inputs.call.parsed[0]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="inputs.call.errors[0]" border-style="none"/>

          <el-form-item label="Discard" label-position="top" :error="inputs.discard.errors[0]">
            <el-input type="textarea" v-model="inputs.discard.raw[0]"/>
            <div v-if="!inputs.discard.valid[0]" class="input-mirror">
              <span v-for="part in inputs.discard.parsed[0]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="inputs.discard.errors[0]" border-style="none"/>
        </el-collapse-item>

        <el-collapse-item title="Right" :name="1">
          <el-form-item label="Point">
            <el-input-number v-model.number="gameState.points[1]" :step="100" step-strictly/>
          </el-form-item>

          <el-form-item label="Call" label-position="top" :error="inputs.call.errors[1]">
            <el-input v-model="inputs.call.raw[1]"/>
            <div v-if="!inputs.call.valid[1]" class="input-mirror">
              <span v-for="part in inputs.call.parsed[1]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="inputs.call.errors[1]" border-style="none"/>

          <el-form-item label="Discard" label-position="top" :error="inputs.discard.errors[1]">
            <el-input type="textarea" v-model="inputs.discard.raw[1]"/>
            <div v-if="!inputs.discard.valid[1]" class="input-mirror">
              <span v-for="part in inputs.discard.parsed[1]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="inputs.discard.errors[1]" border-style="none"/>
        </el-collapse-item>

        <el-collapse-item title="Opposite" :name="2">
          <el-form-item label="Point">
            <el-input-number v-model.number="gameState.points[2]" :step="100" step-strictly/>
          </el-form-item>

          <el-form-item label="Call" label-position="top" :error="inputs.call.errors[2]">
            <el-input v-model="inputs.call.raw[2]"/>
            <div v-if="!inputs.call.valid[2]" class="input-mirror">
              <span v-for="part in inputs.call.parsed[2]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="inputs.call.errors[2]" border-style="none"/>

          <el-form-item label="Discard" label-position="top" :error="inputs.discard.errors[2]">
            <el-input type="textarea" v-model="inputs.discard.raw[2]"/>
            <div v-if="!inputs.discard.valid[2]" class="input-mirror">
              <span v-for="part in inputs.discard.parsed[2]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="inputs.discard.errors[2]" border-style="none"/>
        </el-collapse-item>

        <el-collapse-item title="Left" :name="3">
          <el-form-item label="Point">
            <el-input-number v-model.number="gameState.points[3]" :step="100" step-strictly/>
          </el-form-item>

          <el-form-item label="Call" label-position="top" :error="inputs.call.errors[3]">
            <el-input v-model="inputs.call.raw[3]"/>
            <div v-if="!inputs.call.valid[3]" class="input-mirror">
              <span v-for="part in inputs.call.parsed[3]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="inputs.call.errors[3]" border-style="none"/>

          <el-form-item label="Discard" label-position="top" :error="inputs.discard.errors[3]">
            <el-input type="textarea" v-model="inputs.discard.raw[3]"/>
            <div v-if="!inputs.discard.valid[3]" class="input-mirror">
              <span v-for="part in inputs.discard.parsed[3]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="inputs.discard.errors[3]" border-style="none"/>
        </el-collapse-item>
      </el-collapse>
    </el-form>





    <div class="row">
      <!--            <button class="btn" id="importBtn">Import PNG</button>-->
      <label class="btn">
        Import PNG
        <input type="file" accept=".png" @change="importPNG" style="display: none;" />
      </label>
      <button class="btn" id="exportBtn" @click="exportPNG">Export PNG</button>
    </div>
  </div>
</template>

<style scoped>
.input-mirror {
  width: 100%;
  padding: 1px 11px;
  white-space: pre-wrap;
  line-height: 1.5;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}
.mirror-span {
  word-break: break-all;
}
.error {
  color: red;
}
</style>