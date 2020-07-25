import * as Pixi from 'pixi.js'
import 'whatwg-fetch'

import { Live2DCubismFramework as icubismmodelsetting } from '../cubism-sdk/Framework/dist/icubismmodelsetting'
import { Live2DCubismFramework as cubismmodelsettingjson } from '../cubism-sdk/Framework/dist/cubismmodelsettingjson'

interface CubismResources {
    setting: icubismmodelsetting.ICubismModelSetting
    textures: Pixi.Texture[]
    modelBuffer?: ArrayBuffer
}

const jsonToArrayBuffer = async (json: any) =>
    new Promise<ArrayBuffer>((resolve) => {
        const blob = new Blob([JSON.stringify(json)])
        const reader = new FileReader()
        reader.readAsArrayBuffer(blob)
        reader.onload = function () {
            resolve(reader.result as any)
        }
    })

const stringToArrayBuffer = async (string: string) =>
    new Promise<ArrayBuffer>((resolve) => {
        const blob = new Blob([string])
        const reader = new FileReader()
        reader.readAsArrayBuffer(blob)
        reader.onload = function () {
            resolve(reader.result as any)
        }
    })

const loadCubismTextures = async (
    dir: string,
    setting: icubismmodelsetting.ICubismModelSetting,
) =>
    new Promise<Pixi.Texture[]>((resolve) => {
        const loader = new Pixi.Loader()
        const textureCount = setting.getTextureCount()

        for (
            let modelTextureNumber = 0;
            modelTextureNumber < textureCount;
            modelTextureNumber++
        ) {
            if (setting.getTextureFileName(modelTextureNumber) == '') {
                console.log('getTextureFileName null')
                continue
            }

            const texturePath =
                dir + '/' + setting.getTextureFileName(modelTextureNumber)

            loader.add(texturePath, texturePath)
        }

        loader.load((_loader, resources) => {
            resolve(
                Object.values(resources)
                    .map((resource) => resource?.texture)
                    .filter(Boolean) as any,
            )
        })
    })

const loadCubismModelBuffer = async (
    dir: string,
    setting: icubismmodelsetting.ICubismModelSetting,
) => {
    const modelFileName = setting.getModelFileName()
    const path = `${dir}/${modelFileName}`

    if (modelFileName === '') {
        return
    }

    const res = await fetch(path)
    return res.arrayBuffer()
}

export const loadCubismModel = async (
    dir: string,
    modelFileName: string,
): Promise<CubismResources> =>
    new Promise((resolve) => {
        const loader = new Pixi.Loader()

        loader
            .add(dir, `${dir}/${modelFileName}`)
            .load(async (_loader, resources) => {
                const buffer = await jsonToArrayBuffer(resources[dir]?.data)
                const setting = new cubismmodelsettingjson.CubismModelSettingJson(
                    buffer,
                    buffer.byteLength,
                )
                const textures = await loadCubismTextures(dir, setting)
                const modelBuffer = await loadCubismModelBuffer(dir, setting)

                resolve({ setting, textures, modelBuffer })
            })
    })
