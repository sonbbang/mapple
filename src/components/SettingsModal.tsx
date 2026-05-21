'use client'

interface Props {
  wheelCount: 3 | 5 | 8
  mapProvider: 'kakao' | 'naver'
  onWheelCountChange: (n: 3 | 5 | 8) => void
  onMapProviderChange: (p: 'kakao' | 'naver') => void
  onClose: () => void
}

export default function SettingsModal({
  wheelCount,
  mapProvider,
  onWheelCountChange,
  onMapProviderChange,
  onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-slate-800 rounded-t-2xl p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">⚙️ 설정</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div>
          <p className="text-slate-300 text-sm mb-2">룰렛 개수</p>
          <div className="flex gap-2">
            {([3, 5, 8] as const).map((n) => (
              <button
                key={n}
                onClick={() => onWheelCountChange(n)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  wheelCount === n
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {n}개
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-slate-300 text-sm mb-2">지도 연동</p>
          <div className="flex gap-2">
            <button
              onClick={() => onMapProviderChange('kakao')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mapProvider === 'kakao'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              카카오맵
            </button>
            <button
              onClick={() => onMapProviderChange('naver')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mapProvider === 'naver'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              네이버지도
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
