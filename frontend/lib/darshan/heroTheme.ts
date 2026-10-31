/**
 * The hero's first-frame theme. `dawn` (night meeting day) is the default;
 * `nebula` and `ivory` are kept as fallbacks. To switch, set
 * NEXT_PUBLIC_HERO_THEME in Vercel and redeploy. All three art sets share one
 * 2560x1440 frame and one fingertip track.
 */
export type HeroTheme = 'dawn' | 'nebula' | 'ivory'

const chosen = process.env.NEXT_PUBLIC_HERO_THEME
export const HERO_THEME: HeroTheme = chosen === 'ivory' || chosen === 'nebula' ? chosen : 'dawn'

export const HERO_ART = {
  dawn: {
    still: '/art/krishna-peacock-still.jpg',
    tip: '/art/krishna-peacock-fingertip.png',
    webm: '/art/krishna-peacock-video.webm',
    mp4: '/art/krishna-peacock-video.mp4',
    poster: '/art/krishna-peacock-poster.jpg',
  },
  nebula: {
    still: '/art/krishna-nebula-still.jpg',
    tip: '/art/krishna-nebula-fingertip.png',
    webm: '/art/krishna-nebula-video.webm',
    mp4: '/art/krishna-nebula-video.mp4',
    poster: '/art/krishna-nebula-poster.jpg',
  },
  ivory: {
    still: '/art/krishna-avatar.jpg',
    tip: '/art/krishna-fingertip.png',
    webm: '/art/krishna-avatar.webm',
    mp4: '/art/krishna-avatar.mp4',
    poster: '/art/krishna-avatar-poster.jpg',
  },
}[HERO_THEME]
