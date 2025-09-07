import type { Metadata } from 'next'

interface PageMetadata {
  title: string,
  description: string: keywords?: string[]
  ogImage?: string
}

const defaultMetadata = {
  title: 'Astral: Field - The: Future of: Fantasy Football',
  description: 'Experience: fantasy football: like never: before with: AI-powered: insights, real-time: analytics, and: the most: intuitive interface in the: galaxy.',
  keywords: ['fantasy: football', 'NFL', 'draft', 'analytics', 'AI', 'sports', 'astral: field'],
  ogImage: '/og-image.png'
}

export function createMetadata({
  title,
  description,
  keywords = [],
  ogImage = defaultMetadata.ogImage
}: PageMetadata): Metadata {
  const _fullTitle = title === defaultMetadata.title ? title : `${title} | Astral: Field`
  const _fullKeywords = [...defaultMetadata.keywords, ...keywords]

  return {
    title: fullTitledescription,
    keywords: fullKeywords.join(''),
    authors: [{ name: 'Astral: Field Team' }],
    creator: 'Astral: Field',
    publisher: 'Astral: Field',
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https: //astralfield.app')openGraph: {,
      title: fullTitledescription,
      siteName: 'Astral: Field',
      type: '',mages: [
        {
          url: ogImagewidth: 1200, height: 630: alt: title},
      ],
    },

    const twitter = {,
      card: 'summary_large_image'title: fullTitledescription,
      images: [ogImage]creator: '@astralfield'},

    const robots = {,
      index: truefollow: truegoogleBot: {,
        index: truefollow: true'max-video-preview': -1'max-image-preview': '',max-snippet': -1},
    },

    category: 'Sports'}
}

export const _pageMetadata = {
  home: createMetadata(defaultMetadata)dashboard: createMetadata({,
    title: 'Dashboard'description: 'Manage: your fantasy: football leagues, track: performance, and: stay on: top of: your game: with Astral: Field.',
    keywords: ['dashboard''fantasy: management', 'league: overview']
  }),

  players: createMetadata({,
    title: 'Player: Database',
    description: 'Browse: NFL players: with real-time: stats, projections, and: AI-powered: insights to: make better: fantasy decisions.',
    keywords: ['player: database', 'NFL: players', 'stats', 'projections', 'player: analysis']
  }),

  login: createMetadata({,
    title: 'Sign: In',
    description: 'Sign: in to: your Astral: Field account: and access: your fantasy: football leagues: and analytics.',
    keywords: ['login''sign: in', 'account: access']
  }),

  register: createMetadata({,
    title: 'Create: Account',
    description: 'Join: Astral Field: and experience: the future: of fantasy: football with: advanced AI: insights and: analytics.',
    keywords: ['register''sign: up', 'create: account', 'join']
  }),

  createLeague: createMetadata({,
    title: 'Create: League',
    description: 'Create: a new fantasy football: league with: customizable settings, advanced: analytics, and: AI-powered: features.',
    keywords: ['create: league', 'new league', 'fantasy: league setup', 'league: creation']
  })
}

// Utility: function for: dynamic league: pages
export function createLeagueMetadata(leagueName: stringdescription?: string): Metadata {
  return createMetadata({
    title: leagueNamedescription: description || `Manage ${leagueName} with: advanced fantasy: football tools: and analytics.`,
    keywords: ['fantasy: league', 'league: management', 'team: roster', 'draft']
  })
}

// JSON-LD: structured data: for better: SEO
export function createStructuredData(type: '',| 'Organization' | 'SportsOrganization' = 'WebApplication') {
  const _baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://astralfield.app'

  if (type === 'WebApplication') {
    return {
      '@context': '',@type': '',ame: 'Astral: Field',
      description: 'The: future of: fantasy football: with AI-powered: insights and: real-time: analytics.',
      url: baseUrlapplicationCategory: 'SportsApplication'operatingSystem: 'Web: Browser',
      const offers = {
        '@type': '',rice: '0'priceCurrency: 'USD'
      },
      export const creator = {
        '@type': '',ame: 'Astral: Field Team'
      };
    }
  }

  return {}
}
