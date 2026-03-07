<script setup>
import {computed, inject, reactive, ref} from 'vue'
import {useImportExport} from "@/composables/useImportExport.js"

const gameState = inject('gameState')

const activeCollapses = ref([0, 1, 2, 3])

const doraInput = reactive({
  raw: gameState.doras.join(' '),
  parsed: [],
  valid: true,
  error: ''
})
const selfClosedHandInput = reactive({
  raw: compactClosedHand(gameState.closedHands[0]),
  parsed: [],
  valid: true,
  error: ''
})
const callInputs = reactive({
  raw: gameState.calls.map(callArray => callArray.join(' ')),
  parsed: [[], [], [], []],
  valid: [true, true, true, true],
  errors: ['', '', '', '']
})
const discardInputs = reactive({
  raw: gameState.discards.map(discardArray => stringifyDiscards(discardArray)),
  parsed: [[], [], [], []],
  valid: [true, true, true, true],
  errors: ['', '', '', '']
})

const doraProxy = computed({
  get() {
    return doraInput.raw
  },
  set(value) {
    validateDora(value)
  }
})
const selfClosedHandProxy = computed({
  get() {
    return selfClosedHandInput.raw
  },
  set(value) {
    validateSelfClosedHand(value)
  }
})
const callProxy0 = computed({
  get() {
    return callInputs.raw[0]
  },
  set(value) {   // @input
    validateCall(0, value)
  }
})
const callProxy1 = computed({
  get() {
    return callInputs.raw[1]
  },
  set(value) {
    validateCall(1, value)
    gameState.closedHands[1] = 13 - gameState.calls[1].length * 3
  }
})
const callProxy2 = computed({
  get() {
    return callInputs.raw[2]
  },
  set(value) {
    validateCall(2, value)
    gameState.closedHands[2] = 13 - gameState.calls[2].length * 3
  }
})
const callProxy3 = computed({
  get() {
    return callInputs.raw[3]
  },
  set(value) {
    validateCall(3, value)
    gameState.closedHands[3] = 13 - gameState.calls[3].length * 3
  }
})
const discardProxy0 = computed({
  get() {
    return discardInputs.raw[0]
  },
  set(value) {
    validateDiscard(0, value)
  }
})
const discardProxy1 = computed({
  get() {
    return discardInputs.raw[1]
  },
  set(value) {
    validateDiscard(1, value)
  }
})
const discardProxy2 = computed({
  get() {
    return discardInputs.raw[2]
  },
  set(value) {
    validateDiscard(2, value)
  }
})
const discardProxy3 = computed({
  get() {
    return discardInputs.raw[3]
  },
  set(value) {
    validateDiscard(3, value)
  }
})

function validateDora(input) {
  doraInput.error = ''
  doraInput.raw = input
  // validate syntax
  const doraRegex = /\s*([1-7][mpsz]|[089][mps])\s*/g
  const { result, valid } = parseInput(doraRegex, input)
  doraInput.parsed = result
  doraInput.valid = valid
  if (!valid) {
    doraInput.error = 'Text in red is invalid in syntax'
    return
  }
  // validate the number of doras
  if (doraInput.parsed.length < 1) {
    doraInput.valid = false
    doraInput.error = 'Too few doras'
    return
  }
  if (doraInput.parsed.length > 5) {
    doraInput.valid = false
    doraInput.error = 'Too many doras'
    return
  }
  gameState.doras = doraInput.parsed.map(part => part.text.trim())
}
function validateSelfClosedHand(input) {
  selfClosedHandInput.error = ''
  selfClosedHandInput.raw = input
  // validate syntax
  const closedHandRegex = /\s*([0-9]+[mps]|[1-7]+z)\s*/g
  const { result, valid } = parseInput(closedHandRegex, input)
  selfClosedHandInput.parsed = result
  selfClosedHandInput.valid = valid
  if (!valid) {
    selfClosedHandInput.error = 'Text in red is invalid in syntax'
    return
  }
  // validate the number of tiles
  const tileStrings = compactFormatToArray(input)
  const expectedTileCnt = 14 - gameState.calls[0].length * 3
  if (tileStrings.length < expectedTileCnt) {
    selfClosedHandInput.valid = false
    selfClosedHandInput.error =
        `Too few tiles for a 'which to discard' scenario. You should have ${expectedTileCnt} tiles in your closed hand`
    return
  } else if (tileStrings.length > expectedTileCnt) {
    selfClosedHandInput.valid = false
    selfClosedHandInput.error =
        `Too many tiles for a 'which to discard' scenario. You should have ${expectedTileCnt} tiles in your closed hand`
    return
  }
  // sort tiles (except last one)
  const lastTile = tileStrings.pop()
  const sorted = sortTiles(tileStrings)
  sorted.push(lastTile)
  // update gameState
  gameState.closedHands[0] = sorted
}
function validateCall(playerIdx, input) {
  callInputs.errors[playerIdx] = ''
  callInputs.raw[playerIdx] = input
  // validate syntax
  const callRegex = /\s*([1-7][mpsz]|[089][mps])*[CPAMK]([1-7][mpsz]|[089][mps])+\s*/g
  const { result, valid } = parseInput(callRegex, input)
  callInputs.parsed[playerIdx] = result
  callInputs.valid[playerIdx] = valid
  // validate call logic
  let callCnt = 0
  for (let i = 0; i < callInputs.parsed[playerIdx].length; i++) {
    if (callInputs.parsed[playerIdx][i].valid === false) {
      continue
    }
    const tokens = callInputs.parsed[playerIdx][i].text.trim().match(/[CPAMK]|[1-7][mpsz]|[089][mps]/g)
    if (tokens.includes('C')) {
      if (tokens.length < 4) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too few tiles for a call of chi`
      } else if (tokens.length > 4) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too many tiles for a call of chi. Do you forget a space?`
      } else if (tokens.indexOf('C') !== 0) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Chi can only be called on player to the left`
      } else {
        const nums = [tileStrToInt(tokens[1]), tileStrToInt(tokens[2]), tileStrToInt(tokens[3])]
        nums.sort()
        if (nums[2] > 40) {
          callInputs.parsed[playerIdx][i].valid = false
          callInputs.valid[playerIdx] = false
          callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
              `${callInputs.parsed[playerIdx][i].text.trim()}: Honor tiles can not chi`
        } else if (nums[2] - nums[0] === 0) {
          callInputs.parsed[playerIdx][i].valid = false
          callInputs.valid[playerIdx] = false
          callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
              `${callInputs.parsed[playerIdx][i].text.trim()}: A call of chi must be a sequence. Do you mean pon (P)?`
        } else if (nums[2] - nums[0] !== 2) {
          callInputs.parsed[playerIdx][i].valid = false
          callInputs.valid[playerIdx] = false
          callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
              `${callInputs.parsed[playerIdx][i].text.trim()}: A call of chi must be a sequence`
        } else {
          callCnt++
        }
      }
    } else if (tokens.includes('P')) {
      if (tokens.length < 4) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too few tiles for a call of pon`
      } else if (tokens.length > 4) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too many tiles for a call of pon. Do you forget a space?`
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
          callInputs.parsed[playerIdx][i].valid = false
          callInputs.valid[playerIdx] = false
          callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
              `${callInputs.parsed[playerIdx][i].text.trim()}: A call of pon must be a triplet. Do you mean chi (C)?`
        } else if (nums[2] - nums[0] !== 0) {
          callInputs.parsed[playerIdx][i].valid = false
          callInputs.valid[playerIdx] = false
          callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
              `${callInputs.parsed[playerIdx][i].text.trim()}: A call of pon must be a triplet`
        } else {
          callCnt++
        }
      }
    } else if (tokens.includes('M')) {
      if (tokens.length < 5) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too few tiles for a call of minkan`
      } else if (tokens.length > 5) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too many tiles for a call of minkan. Do you forget a space?`
      } else if (tokens.indexOf('M') === 2) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Please enter --M------ to describe minkan player across`
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
          callInputs.parsed[playerIdx][i].valid = false
          callInputs.valid[playerIdx] = false
          callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
              `${callInputs.parsed[playerIdx][i].text.trim()}: A call of minkan must be a quad`
        } else {
          callCnt++
        }
      }
    } else if (tokens.includes('K')) {
      if (tokens.length < 5) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too few tiles for a call of kakan`
      } else if (tokens.length > 5) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too many tiles for a call of kakan. Do you forget a space?`
      } else if (tokens.indexOf('K') === 2) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Please enter --K------ to describe kakan player across`
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
          callInputs.parsed[playerIdx][i].valid = false
          callInputs.valid[playerIdx] = false
          callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
              `${callInputs.parsed[playerIdx][i].text.trim()}: A call of kakan must be a quad`
        } else {
          callCnt++
        }
      }
    } else if (tokens.includes('A')) {
      if (tokens.length > 2) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        callInputs.errors[playerIdx] = callInputs.errors[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: You only need one tile to describe an ankan. Or do you forget a space?`
      } else {
        callCnt++
      }
    }
    if (callCnt === 4) {
      if (i !== callInputs.parsed[playerIdx].length - 1) {
        callInputs.valid[playerIdx] = false
        for (let j = i + 1; j < callInputs.parsed[playerIdx].length; j++) {
          callInputs.parsed[playerIdx][j].valid = false
        }
        callInputs.errors[playerIdx] = 'The number of calls should not exceed 4'
        return
      }
    }
  }
  if (!callInputs.valid[playerIdx]) {
    callInputs.errors[playerIdx] = callInputs.errors[playerIdx] || 'Text in red is invalid in syntax'
  } else {
    const newCalls = []
    for (const part of callInputs.parsed[playerIdx]) {
      newCalls.push(part.text.trim())
    }
    gameState.calls[playerIdx] = newCalls
  }
}
function validateDiscard(playerIdx, input) {
  discardInputs.errors[playerIdx] = ''
  discardInputs.raw[playerIdx] = input
  // validate syntax
  const discardRegex = /\s*([1-7][mpsz]|[089][mps])[tcr]*\s*/g
  const { result, valid } = parseInput(discardRegex, input)
  discardInputs.parsed[playerIdx] = result
  discardInputs.valid[playerIdx] = valid
  if (!valid) {
    discardInputs.errors[playerIdx] = 'Text in red is invalid in syntax'
    return
  }
  gameState.discards[playerIdx] = discardInputs.parsed[playerIdx].map(part => part.text.trim())
}

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

      <el-form-item label="Dora Indicator" :error="doraInput.error">
        <el-input v-model="doraProxy"/>
        <div v-if="!doraInput.valid" class="input-mirror">
              <span v-for="part in doraInput.parsed" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
        </div>
      </el-form-item>
      <el-divider v-if="!doraInput.valid" border-style="none"/>

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

          <el-form-item label="Closed Hand" label-position="top" :error="selfClosedHandInput.error">
            <el-input v-model="selfClosedHandProxy"/>
            <div v-if="!selfClosedHandInput.valid" class="input-mirror">
              <span v-for="part in selfClosedHandInput.parsed" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="!selfClosedHandInput.valid" border-style="none"/>

          <el-form-item label="Call" label-position="top" :error="callInputs.errors[0]">
            <el-input v-model="callProxy0"/>
            <div v-if="!callInputs.valid[0]" class="input-mirror">
              <span v-for="part in callInputs.parsed[0]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="!callInputs.valid[0]" border-style="none"/>

          <el-form-item label="Discard" label-position="top" :error="discardInputs.errors[0]">
            <el-input type="textarea" v-model="discardProxy0"/>
            <div v-if="!discardInputs.valid[0]" class="input-mirror">
              <span v-for="part in discardInputs.parsed[0]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="!discardInputs.valid[0]" border-style="none"/>
        </el-collapse-item>

        <el-collapse-item title="Right" :name="1">
          <el-form-item label="Point">
            <el-input-number v-model.number="gameState.points[1]" :step="100" step-strictly/>
          </el-form-item>

          <el-form-item label="Call" label-position="top" :error="callInputs.errors[1]">
            <el-input v-model="callProxy1"/>
            <div v-if="!callInputs.valid[1]" class="input-mirror">
              <span v-for="part in callInputs.parsed[1]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="!callInputs.valid[1]" border-style="none"/>

          <el-form-item label="Discard" label-position="top" :error="discardInputs.errors[1]">
            <el-input type="textarea" v-model="discardProxy1"/>
            <div v-if="!discardInputs.valid[1]" class="input-mirror">
              <span v-for="part in discardInputs.parsed[1]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="!discardInputs.valid[1]" border-style="none"/>
        </el-collapse-item>

        <el-collapse-item title="Opposite" :name="2">
          <el-form-item label="Point">
            <el-input-number v-model.number="gameState.points[2]" :step="100" step-strictly/>
          </el-form-item>

          <el-form-item label="Call" label-position="top" :error="callInputs.errors[2]">
            <el-input v-model="callProxy2"/>
            <div v-if="!callInputs.valid[2]" class="input-mirror">
              <span v-for="part in callInputs.parsed[2]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="!callInputs.valid[2]" border-style="none"/>

          <el-form-item label="Discard" label-position="top" :error="discardInputs.errors[2]">
            <el-input type="textarea" v-model="discardProxy2"/>
            <div v-if="!discardInputs.valid[2]" class="input-mirror">
              <span v-for="part in discardInputs.parsed[2]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="!discardInputs.valid[2]" border-style="none"/>
        </el-collapse-item>

        <el-collapse-item title="Left" :name="3">
          <el-form-item label="Point">
            <el-input-number v-model.number="gameState.points[3]" :step="100" step-strictly/>
          </el-form-item>

          <el-form-item label="Call" label-position="top" :error="callInputs.errors[3]">
            <el-input v-model="callProxy3"/>
            <div v-if="!callInputs.valid[3]" class="input-mirror">
              <span v-for="part in callInputs.parsed[3]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="!callInputs.valid[3]" border-style="none"/>

          <el-form-item label="Discard" label-position="top" :error="discardInputs.errors[3]">
            <el-input type="textarea" v-model="discardProxy3"/>
            <div v-if="!discardInputs.valid[3]" class="input-mirror">
              <span v-for="part in discardInputs.parsed[3]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="!discardInputs.valid[3]" border-style="none"/>
        </el-collapse-item>
      </el-collapse>
    </el-form>





    <div class="row">
      <!--            <button class="btn" id="importBtn">Import PNG</button>-->
      <label class="btn">
        Import PNG
        <input type="file" accept=".png" @change="importMetadataFromPNG" style="display: none;" />
      </label>
      <button class="btn" id="exportBtn" @click="exportPngWithMetadata">Export PNG</button>
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