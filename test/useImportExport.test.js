import { describe, beforeEach, it, expect, vi } from 'vitest'
import { useImportExport } from '@/composables/useImportExport.js'

// mock external library
vi.mock('meta-png', () => ({
    getMetadata: () => JSON.stringify({ round: 'E3' })
}))

describe('useImportExport', () => {
    let gameState

    beforeEach(() => {
        gameState = {
            round: 'E1',
            score: [25000, 25000, 25000, 25000]
        }
    })

    it('should export gameState to JSON string', () => {
        const { exportToJson } = useImportExport(gameState)
        const json = exportToJson()

        expect(typeof json).toBe('string')
        expect(json).toContain('E1')
    })

    it('should import JSON and update gameState', () => {
        const { importFromJson } = useImportExport(gameState)

        const newJson = JSON.stringify({
            round: 'E2',
            score: [30000, 20000, 25000, 25000]
        })

        importFromJson(newJson)

        expect(gameState.round).toBe('E2')
        expect(gameState.score[0]).toBe(30000)
    })

    it('should call metadata extraction when importing PNG', async () => {
        const mockFile = new Blob(['fake'], { type: 'image/png' })
        const event = {
            target: {
                files: [mockFile],
                value: ''
            }
        }

        const { importMetadataFromPNG } = useImportExport(gameState)

        await importMetadataFromPNG(event)

        expect(gameState.round).toBe('E3')
    })
})