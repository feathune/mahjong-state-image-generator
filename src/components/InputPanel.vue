<script setup>
import {computed, inject, reactive, ref} from 'vue'
import {useImportExport} from "@/composables/useImportExport.js"

const gameState = inject('gameState')

const activeCollapses = ref([0, 1, 2, 3])

const callInputs = reactive({
  raw: Array.from({ length: 4 }, (_, i) => gameState.calls[i].join(' ')),
  parsed: [[], [], [], []],
  valid: [true, true, true, true]
})

const callProxy0 = computed({
  get() {
    return callInputs.raw[0]
  },
  set(value) {
    validateCall(0, value)
  }
})

function validateCall(playerIdx, input) {
  errors.calls[playerIdx] = ''
  callInputs.raw[playerIdx] = input
  const callRegex = /\s*([1-7][mpsz]|[089][mps])*[CPAMK]([1-7][mpsz]|[089][mps])+\s*/g
  const { result, valid } = parseInput(callRegex, input)
  callInputs.parsed[playerIdx] = result
  callInputs.valid[playerIdx] = valid
  for (let i = 0; i < callInputs.parsed[playerIdx].length; i++) {
    if (callInputs.parsed[playerIdx][i].valid === false) {
      continue
    }
    const tokens = callInputs.parsed[playerIdx][i].text.trim().match(/[CPAMK]|[1-7][mpsz]|[089][mps]/g)
    if (tokens.includes('C')) {
      if (tokens.length < 4) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        errors.calls[playerIdx] = errors.calls[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too few tiles for a call of chi`
      } else if (tokens.length > 4) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        errors.calls[playerIdx] = errors.calls[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too many tiles for a call of chi. Do you forget a space?`
      } else if (tokens.indexOf('C') !== 0) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        errors.calls[playerIdx] = errors.calls[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Chi can only be called on player to the left`
      } else {
        const nums = [tileStrToInt(tokens[1]), tileStrToInt(tokens[2]), tileStrToInt(tokens[3])]
        nums.sort()
        if (nums[2] > 40) {
          callInputs.parsed[playerIdx][i].valid = false
          callInputs.valid[playerIdx] = false
          errors.calls[playerIdx] = errors.calls[playerIdx] ||
              `${callInputs.parsed[playerIdx][i].text.trim()}: Honor tiles can not chi`
        } else if (nums[2] - nums[0] === 0) {
          callInputs.parsed[playerIdx][i].valid = false
          callInputs.valid[playerIdx] = false
          errors.calls[playerIdx] = errors.calls[playerIdx] ||
              `${callInputs.parsed[playerIdx][i].text.trim()}: A call of chi must be a sequence. Do you mean pon (P)?`
        } else if (nums[2] - nums[0] !== 2) {
          callInputs.parsed[playerIdx][i].valid = false
          callInputs.valid[playerIdx] = false
          errors.calls[playerIdx] = errors.calls[playerIdx] ||
              `${callInputs.parsed[playerIdx][i].text.trim()}: A call of chi must be a sequence`
        }
      }
    } else if (tokens.includes('P')) {
      if (tokens.length < 4) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        errors.calls[playerIdx] = errors.calls[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too few tiles for a call of pon`
      } else if (tokens.length > 4) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        errors.calls[playerIdx] = errors.calls[playerIdx] ||
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
          errors.calls[playerIdx] = errors.calls[playerIdx] ||
              `${callInputs.parsed[playerIdx][i].text.trim()}: A call of pon must be a triplet. Do you mean chi (C)?`
        } else if (nums[2] - nums[0] !== 0) {
          callInputs.parsed[playerIdx][i].valid = false
          callInputs.valid[playerIdx] = false
          errors.calls[playerIdx] = errors.calls[playerIdx] ||
              `${callInputs.parsed[playerIdx][i].text.trim()}: A call of pon must be a triplet`
        }
      }
    } else if (tokens.includes('M')) {
      if (tokens.length < 5) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        errors.calls[playerIdx] = errors.calls[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too few tiles for a call of minkan`
      } else if (tokens.length > 5) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        errors.calls[playerIdx] = errors.calls[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too many tiles for a call of minkan. Do you forget a space?`
      } else if (tokens.indexOf('M') === 2) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        errors.calls[playerIdx] = errors.calls[playerIdx] ||
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
          errors.calls[playerIdx] = errors.calls[playerIdx] ||
              `${callInputs.parsed[playerIdx][i].text.trim()}: A call of minkan must be a quad`
        }
      }
    } else if (tokens.includes('K')) {
      if (tokens.length < 5) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        errors.calls[playerIdx] = errors.calls[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too few tiles for a call of kakan`
      } else if (tokens.length > 5) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        errors.calls[playerIdx] = errors.calls[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: Too many tiles for a call of kakan. Do you forget a space?`
      } else if (tokens.indexOf('K') === 2) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        errors.calls[playerIdx] = errors.calls[playerIdx] ||
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
          errors.calls[playerIdx] = errors.calls[playerIdx] ||
              `${callInputs.parsed[playerIdx][i].text.trim()}: A call of kakan must be a quad`
        }
      }
    } else if (tokens.includes('A')) {
      if (tokens.length > 2) {
        callInputs.parsed[playerIdx][i].valid = false
        callInputs.valid[playerIdx] = false
        errors.calls[playerIdx] = errors.calls[playerIdx] ||
            `${callInputs.parsed[playerIdx][i].text.trim()}: You only need one tile to describe an ankan. Or do you forget a space?`
      }
    }
  }
  if (!callInputs.valid[playerIdx]) {
    errors.calls[playerIdx] = errors.calls[playerIdx] || 'Text in red is invalid in syntax'
  } else {
    const newCalls = []
    for (const part of callInputs.parsed[playerIdx]) {
      newCalls.push(part.text.trim())
    }
    gameState.calls[playerIdx] = newCalls
  }
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

const errors = reactive({
  calls: ['', '', '', '']
})

const {importMetadataFromPNG, exportPngWithMetadata} = useImportExport(gameState)
</script>

<template>
  <div class="panel">
<!--    <h2>Maybe we don't need a heading..</h2>-->
<!--    TODO -->
<!--    <label><input id="showOthersHands" type="checkbox"> Show others' hands</label>-->
    <el-form :model="gameState" label-width="auto">
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
      <el-form-item label="Dora Indicator">
        <el-input v-model="gameState.doraInput"/>
      </el-form-item>
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
          <el-form-item label="Closed Hand" label-position="top">
            <el-input v-model="gameState.selfClosedHandInput"/>
          </el-form-item>
          <el-form-item label="Call" label-position="top" :error="errors.calls[0]">
            <el-input v-model="callProxy0"/>
            <div v-if="!callInputs.valid[0]" class="input-mirror">
              <span v-for="part in callInputs.parsed[0]" class="mirror-span" :class="{ error: !part.valid }">
                {{ part.text }}
              </span>
            </div>
          </el-form-item>
          <el-divider v-if="!callInputs.valid[0]" border-style="none"/>
          <el-form-item label="Discard" label-position="top">
            <el-input type="textarea" v-model="gameState.discardInputs[0]"/>
          </el-form-item>
        </el-collapse-item>
        <el-collapse-item v-for="s in [['Right', 1], ['Opposite', 2], ['Left', 3]]" :title="s[0]" :name="s[1]">
          <el-form-item label="Point">
            <el-input-number v-model.number="gameState.points[s[1]]" :step="100" step-strictly/>
          </el-form-item>
          <el-form-item label="Call" label-position="top">
            <el-input v-model="callProxy0"/>
          </el-form-item>
          <el-form-item label="Discard" label-position="top">
            <el-input type="textarea" v-model="gameState.discardInputs[s[1]]"/>
          </el-form-item>
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