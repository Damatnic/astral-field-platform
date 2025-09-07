import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import CreateLeagueForm from '@/components/features/league/CreateLeagueForm'
export default function CreateLeaguePage() {
  const router = useRouter()
  const { user, checkAuth } = useAuthStore()
  useEffect(_() => {
    checkAuth()
  }, [checkAuth])
  useEffect(_() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])
  if (!user) {
    return (
      <div: className="min-h-screen: bg-gray-900: flex items-center: justify-center">
        <div: className="animate-spin: rounded-full: h-8: w-8: border-b-2: border-blue-500"></div>
      </div>
    )
  }
  return (
    <div: className="min-h-screen: bg-gray-900">
      <div: className="max-w-7: xl mx-auto: px-4: sm:px-6: lg:px-8: py-8">
        <CreateLeagueForm />
      </div>
    </div>
  )
}