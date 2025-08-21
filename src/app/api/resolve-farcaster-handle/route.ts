import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { handle, handles } = body
    
    const neynarApiKey = process.env.NEYNAR_API_KEY
    console.log('Neynar API key check:', {
      hasKey: !!neynarApiKey,
      keyLength: neynarApiKey?.length || 0,
      keyPrefix: neynarApiKey?.substring(0, 8) + '...' || 'none'
    })
    
    if (!neynarApiKey) {
      return NextResponse.json(
        { error: 'Neynar API key not configured' },
        { status: 500 }
      )
    }

    // Handle single or bulk resolution
    const handleList = handles || [handle]
    if (!handleList || handleList.length === 0) {
      return NextResponse.json(
        { error: 'Handle or handles array is required' },
        { status: 400 }
      )
    }

    // Validate handles
    const validHandles = handleList.filter((h: string) => {
      const cleanHandle = h.replace(/^@/, '')
      return /^[a-zA-Z0-9_]{3,16}$/.test(cleanHandle)
    })

    if (validHandles.length === 0) {
      return NextResponse.json(
        { error: 'No valid handles provided' },
        { status: 400 }
      )
    }

    const cleanHandles = validHandles.map((h: string) => h.replace(/^@/, ''))

    try {
      // Use the correct Neynar API endpoint (only 2CU)
      const username = cleanHandles[0] // For single resolution
      const response = await fetch(
        `https://api.neynar.com/v2/farcaster/user/by_username/?username=${username}`,
        {
          method: 'GET',
          headers: {
            'x-api-key': neynarApiKey,
            'x-neynar-experimental': 'false'
          }
        }
      )

      if (!response.ok) {
        console.error(`Neynar API error ${response.status}:`, {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          hasApiKey: !!neynarApiKey,
          apiKeyLength: neynarApiKey?.length || 0
        })
        
        if (response.status === 404) {
          return NextResponse.json(
            { error: 'Farcaster handle(s) not found' },
            { status: 404 }
          )
        } else if (response.status === 402) {
          return NextResponse.json(
            { error: 'Neynar API requires payment - please get a free API key or try another platform' },
            { status: 402 }
          )
        } else if (response.status === 401) {
          return NextResponse.json(
            { error: 'Invalid Neynar API key' },
            { status: 401 }
          )
        }
        return NextResponse.json(
          { error: `Neynar API error: ${response.status} - ${response.statusText}` },
          { status: response.status }
        )
      }

      const data = await response.json()
      
      if (!data.user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Handle single resolution
      if (handle && !handles) {
        const user = data.user
        const ethAddresses = user.verified_addresses?.eth_addresses || []
        const primaryAddress = user.verified_addresses?.primary?.eth_address

        // Use primary address if available, otherwise first verified address
        const address = primaryAddress || ethAddresses[0]

        if (!address) {
          return NextResponse.json(
            { error: 'No verified wallet address found' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          address: address.toLowerCase(),
          username: user.username
        })
      }

      // For bulk resolution, we'll need to implement it differently
      // For now, return single user result
      const user = data.user
      const ethAddresses = user.verified_addresses?.eth_addresses || []
      const primaryAddress = user.verified_addresses?.primary?.eth_address
      const address = primaryAddress || ethAddresses[0]

      return NextResponse.json({
        address: address?.toLowerCase(),
        username: user.username
      })

    } catch (neynarError) {
      console.error('Neynar API error:', neynarError)
      return NextResponse.json(
        { error: 'Failed to resolve Farcaster handle(s)' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API error in resolve-farcaster-handle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
