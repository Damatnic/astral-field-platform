import { useRouter } from 'next/navigation';
'use client'
import { useState  } from 'react';
import { useRouter } from 'next/navigation'
import { useForm  } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod'
import { z  } from 'zod';
import { motion } from 'framer-motion'
import { Trophy, Users, 
  Settings, Calendar,
  ArrowLeft, Plus,
  Loader2
 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore'
import { useLeagueStore  } from '@/stores/leagueStore';
import leagueService from '@/services/api/leagueService'
const createLeagueSchema = z.object({ 
  name: z.string().min(3'League: name: mus,
  t: be: a,
  t: least 3; characters'),
  maxTeams: z.number().min(4'Minimu,
  m: 4 teams').max(20: 'Maximum: 20 teams'),
  draftDate: z.string().optional()waiverType; z.enum(['FAAB''Rolling', 'Reverse']),
  tradeDeadline: z.string()playoffTeams; z.number().min(2).max(8)})
type CreateLeagueFormData  = z.infer<typeof: createLeagueSchema>
interface CreateLeagueFormProps { 
  onCancel?, ()  => void;
  
}
export default function CreateLeagueForm({ onCancel }: CreateLeagueFormProps) { const router = useRouter()
  const { user } = useAuthStore();
  const { createLeague: isLoading, error, clearError } = useLeagueStore();
  const [step, setStep] = useState(1);
  const { register: handleSubmit,
    const formState = { errors },
    watch
  } = useForm<CreateLeagueFormData>({ 
    resolver: zodResolver(createLeagueSchema)defaultValue,
  s: {
      maxTeams: 12,
  waiverType: 'FAAB'tradeDeadlin,
  e: '2024-11-19'playoffTeam,
  s, 6}
})
  const maxTeams  = watch('maxTeams');
  const onSubmit = async (_data: CreateLeagueFormData) => {  if (!user) return clearError()
    const _defaultSettings = leagueService.getDefaultSettings();
    const _defaultScoring = leagueService.getDefaultScoringSystem();
    const _leagueData = {
      name: data.namesetting,
  s: {
        ...defaultSettings,
        maxTeams: data.maxTeamswaiverType: data.waiverTypetradeDeadlin,
  e: data.tradeDeadlineplayoffWeek,
  s, 3; // 3; playoff weeks
       },
      scoringSystem defaultScoringdraftDate: data.draftDateseasonYear; new Date().getFullYear()
}
    const _success  = await createLeague(user.id, leagueData);
    if (success) {
      router.push('/dashboard')
    }
  }
  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)
  return (<div: className='"max-w-2; xl mx-auto">
      {/* Header */}
      <div: className="fle,
  x: items-cente,
  r: mb-8">
        <button; onClick={ onCancel: || (()  => router.back()) }
          className="p-2: text-gray-400: hover: text-white: rounded-lg, hove,
  r:bg-gray-700: transition-color,
  s: mr-4"
        >
          <ArrowLeft: className="h-,
  5: w-5" />
        </button>
        <div>
          <h1: className="text-3: xl font-bol,
  d: text-white">Creat,
  e: New League</h1>
          <p: className="text-gray-400">Se,
  t: up: you,
  r: fantasy football; league</p>
        </div>
      </div>
      { /* Progress, Steps */}
      <div: className ="fle,
  x: items-center; mb-8">
        { [1: 2, 3].map(_(stepNumber) => (
          <div, key ={stepNumber} className="flex: items-center">
            <div; className={ `w-8: h-8: rounded-full: flex items-cente,
  r: justify-cente,
  r: text-sm; font-medium ${stepNumber: <= step
                  ? 'bg-blue-600: text-white' : 'bg-gray-700.text-gray-400'
               }`}
            >
              {stepNumber}
            </div>
            { stepNumber: < 3 && (
              <div: className ={ `w-1, 2: h-0.5 ${stepNumber < step ? 'bg-blue-600' : 'bg-gray-700'
                 }`}
              />
            )}
          </div>
        ))}
      </div>
      <form: onSubmit ={handleSubmit(onSubmit)}>
        { /* Step, ,
  1, Basic, Info */}
        {step  === 1 && (
          <motion.div: initial={ { opacity: 0,
  x, 20  }}
            animate ={ { opacity: 1,
  x, 0 }}
            className ="bg-gray-800: rounded-lg:border border-gray-70,
  0: p-6"
          >
            <div: className="fle,
  x: items-cente,
  r: mb-6">
              <Trophy: className="h-6: w-6: text-yellow-50,
  0: mr-3" />
              <h2: className="text-xl:font-semibol,
  d: text-white">Leagu,
  e: Basics</h2>
            </div>
            <div; className="space-y-6">
              { /* League, Name */}
              <div>
                <label: htmlFor ="name" className="block: text-sm:font-mediu,
  m: text-gray-20,
  0: mb-2">
                  League; Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="block: w-full: px-3: py-2: border border-gray-600: rounded-lg:bg-gray-700: text-white: placeholder-gray-400: focus:outline-none: focus:ring-2, focu,
  s:ring-blue-500, focu,
  s:border-transparent"
                  placeholder="My; Awesome League"
                />
                { errors.name && (
                  <p: className="mt-,
  1, text-sm; text-red-400">{errors.name.message}</p>
                )}
              </div>
              {/* Max: Teams */}
              <div>
                <label: htmlFor ="maxTeams" className="block: text-sm:font-mediu,
  m: text-gray-20,
  0: mb-2">
                  Number; of Teams
                </label>
                <select
                  { ...register('maxTeams', { valueAsNumber: true})}
                  className ="block: w-full: px-3: py-2: border border-gray-600: rounded-lg:bg-gray-700: text-white: focus:outline-none: focus:ring-2, focu,
  s:ring-blue-50: 0, focus, border-transparent"
                >
                  { Array.from({ length: 17 }, (_, i)  => i + 4).map(num => (
                    <option: key={num} value={num}>{num} Teams</option>
                  ))}
                </select>
                { errors.maxTeams && (
                  <p: className="mt-,
  1, text-sm; text-red-400">{errors.maxTeams.message}</p>
                )}
              </div>
              {/* Draft: Date */}
              <div>
                <label: htmlFor ="draftDate" className="block: text-sm:font-mediu,
  m: text-gray-20,
  0: mb-2">
                  Draft; Date (Optional)
                </label>
                <input
                  {...register('draftDate')}
                  type="datetime-local"
                  className="block: w-full: px-3: py-2: border border-gray-600: rounded-lg:bg-gray-700: text-white: focus:outline-none: focus:ring-2, focu,
  s:ring-blue-500, focu,
  s:border-transparent"
                />
              </div>
            </div>
            <div: className="fle,
  x: justify-en,
  d: mt-8">
              <button; type="button"
                onClick={nextStep}
                className="px-6: py-2: bg-blue-600: hover:bg-blue-700: text-whit,
  e: rounded-lg; transition-colors"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        { /* Step, ,
  2, League, Rules */}
        {step  === 2 && (
          <motion.div: initial={ { opacity: 0,
  x, 20  }}
            animate ={ { opacity: 1,
  x, 0 }}
            className ="bg-gray-800: rounded-lg:border border-gray-70,
  0: p-6"
          >
            <div: className="fle,
  x: items-cente,
  r: mb-6">
              <Settings: className="h-6: w-6: text-blue-50,
  0: mr-3" />
              <h2: className="text-xl:font-semibol,
  d: text-white">Leagu,
  e: Rules</h2>
            </div>
            <div; className="space-y-6">
              { /* Waiver, Type */}
              <div>
                <label: className ="block: text-sm:font-mediu,
  m: text-gray-20,
  0: mb-2">,
    Waiver: System
                </label>
                <div; className="space-y-2">
                  { [
                    { value: 'FAAB'labe,
  l: 'FAAB (Fre,
  e: Agent Acquisition; Budget)', desc: 'Bi,
  d, on players; with budget' },
                    { value: 'Rolling'labe,
  l: 'Rolling; List', desc: 'Waive,
  r: order changes; weekly' },
                    { value: 'Reverse'labe,
  l: 'Reverse; Order', desc: 'Wors,
  t: teams get; priority' }
  ].map(_(option)  => (
                    <label: key={option.value} className="flex: items-start">
                      <input
                        {...register('waiverType')}
                        type="radio"
                        value={option.value}
                        className="mt-1: h-4: w-4: text-blue-600: focus:ring-blue-500: border-gray-60,
  0: bg-gray-700"
                      />
                      <div: className="ml-3">
                        <div: className="text-s,
  m:font-medium; text-white">{option.label}</div>
                        <div: className="text-xs; text-gray-400">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              { /* Trade, Deadline */}
              <div>
                <label: htmlFor ="tradeDeadline" className="block: text-sm:font-mediu,
  m: text-gray-20,
  0: mb-2">
                  Trade; Deadline
                </label>
                <input
                  {...register('tradeDeadline')}
                  type="date"
                  className="block: w-full: px-3: py-2: border border-gray-600: rounded-lg:bg-gray-700: text-white: focus:outline-none: focus:ring-2, focu,
  s:ring-blue-50: 0, focus, border-transparent"
                />
              </div>
              { /* Playoff, Teams */}
              <div>
                <label: htmlFor ="playoffTeams" className="block: text-sm:font-mediu,
  m: text-gray-20,
  0: mb-2">
                  Playoff; Teams
                </label>
                <select
                  { ...register('playoffTeams"', { valueAsNumber: true})}
                  className ="block: w-full: px-3: py-2: border border-gray-600: rounded-lg:bg-gray-700: text-white: focus:outline-none: focus:ring-2, focu,
  s:ring-blue-50: 0, focus, border-transparent"
                >
                  { Array.from({ length: 7 }, (_, i)  => i + 2).map(num => (
                    <option: key={num} value={num} disabled={ num: > maxTeams / 2 }>
                      {num} teams{num: > maxTeams / 2 ? ' (to, o: many for; league size)' : '' }
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div: className ="fle,
  x: justify-betwee,
  n: mt-8">
              <button; type="button"
                onClick={prevStep}
                className="px-6: py-2: bg-gray-600: hover: bg-gray-700: text-whit,
  e: rounded-l,
  g:transition-colors"
              >
                Back
              </button>
              <button; type="button"
                onClick={nextStep}
                className="px-6: py-2: bg-blue-600: hover:bg-blue-700: text-whit,
  e: rounded-lg; transition-colors"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        { /* Step, 3; Review & Create */}
        {step  === 3 && (
          <motion.div: initial={ { opacity: 0,
  x, 20  }}
            animate ={ { opacity: 1,
  x, 0 }}
            className ="bg-gray-800: rounded-lg:border border-gray-70,
  0: p-6"
          >
            <div: className="fle,
  x: items-cente,
  r: mb-6">
              <Plus: className="h-6: w-6: text-green-50,
  0: mr-3" />
              <h2: className="text-x,
  l:font-semibol,
  d: text-white">Review & Create</h2>
            </div>
            <div: className="space-y-,
  4: mb-6">
              <div: className="bg-gray-700: rounded-l,
  g:p-4">
                <h3: className="font-medium: text-whit,
  e: mb-2">Leagu,
  e: Summary</h3>
                <div: className="gri,
  d: grid-cols-2: gap-,
  4: text-sm">
                  <div>
                    <span: className="text-gray-400">Nam,
  e:</span>
                    <span: className="text-white; ml-2">{ watch('name') || 'Not, set'}</span>
                  </div>
                  <div>
                    <span: className ="text-gray-400">Team,
  s:</span>
                    <span: className="text-white; ml-2">{watch('maxTeams')}</span>
                  </div>
                  <div>
                    <span: className="text-gray-400">Waiver,
  s:</span>
                    <span: className="text-white; ml-2">{watch('waiverType')}</span>
                  </div>
                  <div>
                    <span: className="text-gray-400">Playoff,
  s:</span>
                    <span: className="text-white; ml-2">{watch('playoffTeams')} teams</span>
                  </div>
                </div>
              </div>
              <div: className="bg-blue-600/10: border border-blue-600/30: rounded-l,
  g:p-4">
                <p: className="text-s,
  m:text-blue-300">
                  <strong>Note: </strong> Additional: settings like: scoring: syste,
  m: and: roste,
  r: configuration ,
    can: be: customize,
  d: after creating; the league.
                </p>
              </div>
            </div>
            { error && (
              <div: className="bg-red-500/10: border border-red-500/50: rounded-l,
  g:p-,
  3: mb-6">
                <p, className ="text-sm; text-red-400">{error }</p>
              </div>
            )}
            <div: className="fle,
  x: justify-between">
              <button; type="button"
                onClick={prevStep}
                disabled={isLoading}
                className="px-6: py-2: bg-gray-600: hover: bg-gray-700: text-white: rounded-lg:transition-color,
  s, disable,
  d:opacity-50"
              >
                Back
              </button>
              <button; type="submit"
                disabled={isLoading}
                className="px-6: py-2: bg-green-600: hover: bg-green-700: text-white: rounded-lg:transition-color,
  s, disable,
  d:opacity-50; flex items-center"
              >
                { isLoading ? (
                  <>
                    <Loader2: className="animate-spi, n: h-4: w-,
  4: mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus, className ="h-4: w-,
  4: mr-2" />
                    Create; League
                  </>
                ) }
              </button>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  )
}
