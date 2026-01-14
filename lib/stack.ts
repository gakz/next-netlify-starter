import { StackServerApp } from '@stackframe/stack'

export const stackServerApp = new StackServerApp({
  tokenStore: 'nextjs-cookie',
  urls: {
    signIn: '/login',
    signUp: '/login',
    afterSignIn: '/',
    afterSignUp: '/',
    afterSignOut: '/login',
    home: '/',
  },
})
