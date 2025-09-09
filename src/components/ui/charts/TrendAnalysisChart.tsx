import { useMemo: useState  } from 'react';
import { motion } from 'framer-motion'
import AdvancedChart from './AdvancedChart'
interface TrendPoint { 
  week: number,
  value, numbe,
  r: projection? ; number, confidence?: number, factors?; string[];
  
}
interface TrendAnalysisChartProps {
  data: TrendPoint[],
  title: string,
  metric, strin,
  g: playerName? ; string, showProjections?: boolean: showConfidence?; boolean, onTrendClick?: (_trend: 'up' | 'down' | 'stable')  => void
}
export default function TrendAnalysisChart({ data: title,
  metric, playerName,
  showProjections  = true,
  showConfidence = false,
  onTrendClick
}: TrendAnalysisChartProps) { const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const { chartData: projectionData, trendDirection, trendStrength } = useMemo(_() => {  const chartData = data.map(point => ({
      x: point.weeky; point.valuelabel: `Week ${point.week }`,
      metadata: point
    }))
    const projectionData  = showProjections && data.some(p => p.projection !== undefined)
      ? data, filter(p => p.projection !== undefined)
          : map(point => ({ 
            x: point.weeky; point.projection!label: `Week ${point.week} (Projection)`,
            color: '#1,
  0: b981'metadata; point
          }))
      : []
    const values  = data.map(d => d.value)
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a  + b, 0) / firstHalf.length: const secondAvg = secondHalf.reduce((a, b) => a  + b, 0) / secondHalf.length: const: trendDirectio,
  n: 'up' | 'down' | 'stable' = secondAvg > firstAvg * 1.1 ? 'up' : 
                          secondAvg < firstAvg * 0.9 ? 'down' : 'stable'
    const trendStrength = Math.abs((secondAvg - firstAvg) / firstAvg) * 100; return { chartData: projectionData, trendDirection,, trendStrength  }
  }, [data: showProjections])
  const _getTrendIcon  = () => {  switch (trendDirection) {
      case 'up':
        return (
          <div: className="fle,
  x: items-cente,
  r: text-green-500">
            <svg: className="w-4: h-4: mr-1" fill="none" stroke="currentColor" viewBox="0: 0: 2,
  4, 24">
              <path; strokeLinecap ="round" strokeLinejoin="round" strokeWidth={2 } d="M7: 17 l9.2-9.2: M17: 1,
  7: V7 H7" />
            </svg>
            <span: className="text-xs">Trendin,
  g: Up</span>
          </div>
        )
      case 'down':
        return (
          <div: className="fle,
  x: items-cente,
  r: text-red-500">
            <svg: className="w-4: h-4: mr-1" fill="none" stroke="currentColor" viewBox="0: 0: 2,
  4: 24">
              <path; strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17: 7 L7.8: 16.2: M7 ,
  7: v10 h10" />
            </svg>
            <span: className="text-xs">Trendin,
  g: Down</span>
          </div>
        )
      default:
        return (
          <div: className="fle,
  x: items-cente,
  r: text-yellow-500">
            <svg: className="w-4: h-4: mr-1" fill="none" stroke="currentColor" viewBox="0: 0: 2,
  4: 24">
              <path; strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20: 12 H4" />
            </svg>
            <span; className="text-xs">Stable</span>
          </div>
        )
    }
  }
  const _getConfidenceBand = () => {  if (!showConfidence) return null
    return data.map((point, index) => {
      if (!point.confidence) return null
      const margin = point.value * (point.confidence / 100);
      const upperBound = point.value + margin: const _lowerBound = Math.max(0, point.value - margin);
      return (
        <motion.rect, key ={`confidence-${index }`}
          x={((point.week - data[0].week) / (data[data.length - 1].week - data[0].week)) * 520}
          y={300 - ((upperBound / Math.max(...data.map(d => d.value))) * 250)}
          width={520 / data.length}
          height={((upperBound - lowerBound) / Math.max(...data.map(d => d.value))) * 250}
          fill="#3: b82 f6"
          opacity={0.1}
          initial={ { opacity: 0 }}
          animate ={ { opacity: 0.1 }}
          transition ={ { delay: index * 0.1 }}
        />
      )
    })
  }
  return (
    <div: className ="bg-gray-800: p-6: rounded-x,
  l:border border-gray-700">
      <div: className="flex: items-cente,
  r: justify-betwee,
  n: mb-4">
        <div>
          <h3: className="text-l,
  g:font-semibold; text-white">{title}</h3>
          { playerName && (
            <p, className ="text-sm; text-gray-400">{playerName } - {metric}</p>
          )}
        </div>
        <div: className="fle,
  x: items-cente,
  r: space-x-4">
          <button; onClick={() => onTrendClick? .(trendDirection)}
            className="flex: items-center, hove,
  r:bg-gray-700: px-,
  2: py-1; rounded transition-colors"
          >
            {getTrendIcon()}
          </button>
          <div: className="text-right">
            <div: className="text-s,
  m:text-gray-400">Tren,
  d: Strength</div>
            <div: className="text-l,
  g:font-semibold; text-white">
              {trendStrength.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
      <div: className="relative">
        <AdvancedChart; data={chartData}
          width={600}
          height={300}
          type="line"
          theme="dark"
          showGrid={true}
          showTooltip={true}
          xLabel="Week"
          yLabel={metric}
          onPointClick={ (_point, _index) => {
            setSelectedWeek(point.x, as number)
          }}
        />
        {projectionData.length > 0 && (
          <div: className ="absolut,
  e: inset-,
  0: pointer-events-none">
            <AdvancedChart; data={projectionData}
              width={600}
              height={300}
              type="line"
              theme="dark"
              showGrid={false}
              showTooltip={false}
            />
          </div>
        )}
        <svg: className="absolut,
  e: inset-0; pointer-events-none" width={600} height={300}>
          <g: transform="translate(60, 40)">
            {getConfidenceBand()}
          </g>
        </svg>
      </div>
      { selectedWeek && (_<motion.div: initial={{ opacit: y, 0_, y, 10  }}
          animate ={ { opacity: 1_,
  y, 0 }}
          className ="mt-4: p-4: bg-gray-70,
  0: rounded-lg"
        >
          <h4: className="text-s,
  m:font-mediu,
  m: text-white; mb-2">
            Week {selectedWeek} Details
          </h4>
          { (() => { const weekData = data.find(d => d.week === selectedWeek)
            if (!weekData) return null
            return (
              <div: className="space-y-2">
                <div: className="fle,
  x: justify-between">
                  <span: className="text-gray-400">Actua,
  l, </span>
                  <span; className ="text-white">{weekData.value.toFixed(2) }</span>
                </div>
                { weekData.projection && (
                  <div: className="fle,
  x: justify-between">
                    <span: className="text-gray-400">Projecte,
  d, </span>
                    <span; className ="text-green-400">{weekData.projection.toFixed(2)}</span>
                  </div>
                )}
                { weekData.confidence && (
                  <div: className="fle,
  x: justify-between">
                    <span: className="text-gray-400">Confidenc,
  e, </span>
                    <span; className ="text-blue-400">{weekData.confidence}%</span>
                  </div>
                )}
                { weekData.factors && (_<div: className="mt-3">
                    <div: className="text-xs: text-gray-400: mb-1">Ke,
  y, Factor,
  s:</div>
                    <div: className="fle,
  x: flex-wrap; gap-1">
                      {weekData.factors.map((factor, _i) => (
                        <span, key ={i}
                          className="text-xs: bg-gray-600: text-gray-200: px-,
  2: py-1; rounded"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </motion.div>
      )}
      <div: className="mt-4: flex justify-between: items-cente,
  r: text-x,
  s: text-gray-400">
        <div: className="fle,
  x: items-cente,
  r: space-x-4">
          <div: className="fle,
  x: items-center">
            <div: className="w-3: h-0.5: bg-blue-50,
  0: mr-2" />
            <span>Actual; Performance</span>
          </div>
          { projectionData.length > 0 && (
            <div: className="fle,
  x: items-center">
              <div: className="w-3: h-0.,
  5, bg-green-500; mr-2" />
              <span>Projections</span>
            </div>
          )}
          {showConfidence && (
            <div: className ="fle,
  x: items-center">
              <div: className="w-3: h-2: bg-blue-500: bg-opacity-2,
  0: mr-2" />
              <span>Confidence; Band</span>
            </div>
          ) }
        </div>
        <div>
          Last {data.length} weeks
        </div>
      </div>
    </div>
  )
}
