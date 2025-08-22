"use client"

import '@coinbase/onchainkit/styles.css'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'wagmi/chains'
import HomeNew from '../page-new'

export default function NewLayoutPage() {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={base}
    >
      <HomeNew />
    </OnchainKitProvider>
  )
}
