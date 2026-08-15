// 分类 → 占位图标 与 柔和渐变（全类名写死，保证 Tailwind 可编译）

const CATEGORY_EMOJI: Record<string, string> = {
  旅行: '✈️',
  美食: '🍜',
  摄影: '📷',
  科技: '💻',
  生活: '🌿',
  设计: '🎨',
}

const GRADIENTS = [
  'bg-gradient-to-br from-indigo-100 to-sky-100',
  'bg-gradient-to-br from-violet-100 to-fuchsia-100',
  'bg-gradient-to-br from-amber-100 to-orange-100',
  'bg-gradient-to-br from-emerald-100 to-teal-100',
  'bg-gradient-to-br from-rose-100 to-pink-100',
  'bg-gradient-to-br from-blue-100 to-cyan-100',
]

export function categoryEmoji(name?: string): string {
  if (!name) return '🖼️'
  return CATEGORY_EMOJI[name] || '🖼️'
}

export function categoryGradient(name?: string): string {
  if (!name) return GRADIENTS[0]
  // 简单 hash：同名分类颜色稳定
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}
