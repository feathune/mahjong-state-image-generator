import { toPng, toJpeg, toBlob, toPixelData, toSvg } from 'html-to-image';
import { addMetadata, getMetadata } from 'meta-png';

export function useImportExport(gameState) {

    const exportToJson = () => {
        const data = {
            round: stateRefs.round.value,
            selfWind: stateRefs.selfWind.value,
            points: stateRefs.points.value,
            selfHandInput: stateRefs.selfHandInput.value,
            discardInputs: stateRefs.discardInputs.value,
            // 可扩展其他字段
        }
        return JSON.stringify(data, null, 2)
    }

    const importFromJson = (jsonStr) => {
        try {
            const data = JSON.parse(jsonStr)

            // 安全赋值，避免结构不匹配导致崩溃
            if (typeof data.round === 'string') stateRefs.round.value = data.round
            if (typeof data.selfWind === 'number') stateRefs.selfWind.value = data.selfWind
            if (Array.isArray(data.points)) stateRefs.points.value = [...data.points]
            if (typeof data.selfHandInput === 'string')
                stateRefs.selfHandInput.value = data.selfHandInput
            if (Array.isArray(data.discardInputs))
                stateRefs.discardInputs.value = [...data.discardInputs]

            return { success: true }
        } catch (e) {
            console.error('Failed to parse JSON:', e)
            return { success: false, error: e.message }
        }
    }

    // 提供下载 JSON 文件的功能（可选）
    const downloadJson = () => {
        const jsonStr = exportToJson()
        const blob = new Blob([jsonStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'mahjong-state.json'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // 提供从文件读取 JSON 的功能（用于“导入文件”）
    const importMetadataFromPNG = async (event) => {
        const file = event.target.files?.[0]
        const pngBytes = new Uint8Array(await file.arrayBuffer())
        const metadata = getMetadata(pngBytes, 'stateJSON')
        importFromJson(metadata)
    }

    const exportPngWithMetadata = async () => {
        // 1. 截图
        const element = document.querySelector('.grid-main')
        let pngBlob = await toBlob(element, {backgroundColor: '#002229'})

        // 2. 嵌入 JSON
        let pngBytes = new Uint8Array(await pngBlob.arrayBuffer())
        pngBytes = addMetadata(pngBytes, 'stateJSON', exportToJson())
        console.log(getMetadata(pngBytes, 'stateJSON'))
        pngBlob = new Blob([pngBytes], { type: 'image/png' })

        // 3. 下载
        const url = URL.createObjectURL(pngBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'state.png'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return {
        exportToJson,
        importFromJson,
        downloadJson,
        importMetadataFromPNG,
        exportPngWithMetadata
    }
}