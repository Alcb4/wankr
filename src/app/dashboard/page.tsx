"use client"

import { Web3Provider } from '../components/web3-provider'
import HomeNew from '../page-new'

export default function DashboardPage() {
  return (
    <Web3Provider>
      <HomeNew />
    </Web3Provider>
  )
}
