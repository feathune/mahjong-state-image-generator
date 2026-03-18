import { toPng, toJpeg, toBlob, toPixelData, toSvg } from 'html-to-image';
import { addMetadata, getMetadata } from 'meta-png';

export function useImportExport(gameState) {

    const exportToJson = () => {
        return JSON.stringify(gameState, null, 2)
    }

    const importFromJson = (jsonStr) => {
        const data = JSON.parse(jsonStr)
        for (const key in data) {
            gameState[key] = data[key]
        }
    }

    const importMetadataFromPNG = async (event) => {
        const file = event.target.files?.[0]
        const pngBytes = new Uint8Array(await file.arrayBuffer())
        const metadata = getMetadata(pngBytes, 'stateJSON')
        importFromJson(metadata)
        event.target.value = ''
    }

    const exportPngWithMetadata = async () => {
        // 1. Screenshot
        const element = document.querySelector('.grid-main')
        let pngBlob = await toBlob(element, {backgroundColor: '#002229'})

        // 2. Embed JSON
        let pngBytes = new Uint8Array(await pngBlob.arrayBuffer())
        pngBytes = addMetadata(pngBytes, 'stateJSON', exportToJson())
        console.log(getMetadata(pngBytes, 'stateJSON'))
        pngBlob = new Blob([pngBytes], { type: 'image/png' })

        // 3. Download
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
        importMetadataFromPNG,
        exportPngWithMetadata
    }
}