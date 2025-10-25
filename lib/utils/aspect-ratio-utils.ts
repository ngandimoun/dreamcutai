import { ASPECT_RATIO_MAPPING, FalModel } from './fal-generation'

export function getSupportedAspectRatios(model: FalModel): string[] {
  const mapping = ASPECT_RATIO_MAPPING[model]
  return Object.keys(mapping)
}

export function isAspectRatioSupported(model: FalModel, ratio: string): boolean {
  return getSupportedAspectRatios(model).includes(ratio)
}
