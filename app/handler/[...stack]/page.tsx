'use client'

import { StackHandler } from '@stackframe/stack'
import { stackServerApp } from '@/lib/stack'

export default function Handler(props: { params: Promise<unknown>; searchParams: Promise<unknown> }) {
  return <StackHandler app={stackServerApp} routeProps={props} fullPage />
}
