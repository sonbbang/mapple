export function getSlicePath(
  index: number,
  total: number,
  cx: number,
  cy: number,
  r: number
): string {
  const anglePerSlice = (2 * Math.PI) / total
  const startAngle = index * anglePerSlice - Math.PI / 2
  const endAngle = (index + 1) * anglePerSlice - Math.PI / 2
  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)
  const largeArcFlag = anglePerSlice > Math.PI ? 1 : 0
  return `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
}

export function getLabelPosition(
  index: number,
  total: number,
  cx: number,
  cy: number,
  r: number
): { x: number; y: number; rotation: number } {
  const sliceDeg = 360 / total
  const midAngleDeg = (index + 0.5) * sliceDeg - 90
  const midAngleRad = (midAngleDeg * Math.PI) / 180
  const labelR = r * 0.65
  return {
    x: cx + labelR * Math.cos(midAngleRad),
    y: cy + labelR * Math.sin(midAngleRad),
    rotation: midAngleDeg + 90,
  }
}

export function computeTargetRotation(
  winnerIndex: number,
  total: number,
  currentRotation: number
): number {
  const sliceDeg = 360 / total
  const winnerMidDeg = winnerIndex * sliceDeg + sliceDeg / 2
  const delta =
    ((360 - winnerMidDeg - (currentRotation % 360)) % 360 + 360) % 360
  return currentRotation + 4 * 360 + (delta === 0 ? 360 : delta)
}
