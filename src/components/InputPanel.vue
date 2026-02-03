<script setup>
import {inject, ref} from 'vue'
import {useImportExport} from "@/composables/useImportExport.js"

const gameState = inject('gameState')

const activeCollapses = ref([0, 1, 2, 3])

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
          <el-form-item label="Call" label-position="top">
            <el-input v-model="gameState.callInputs[0]"/>
          </el-form-item>
          <el-form-item label="Discard" label-position="top">
            <el-input type="textarea" v-model="gameState.discardInputs[0]"/>
          </el-form-item>
        </el-collapse-item>
        <el-collapse-item v-for="s in [['Right', 1], ['Opposite', 2], ['Left', 3]]" :title="s[0]" :name="s[1]">
          <el-form-item label="Point">
            <el-input-number v-model.number="gameState.points[s[1]]" :step="100" step-strictly/>
          </el-form-item>
          <el-form-item label="Call" label-position="top">
            <el-input v-model="gameState.callInputs[s[1]]"/>
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

</style>