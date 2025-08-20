import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

// Net Protocol contract configuration
const NET_CONTRACT_ADDRESS = '0x00000000B24D62781dB359b07880a105cD0b64e6'
const NET_CONTRACT_ABI = [
  'function getMessageForAppTopic(address app, string topic) view returns (uint256[])',
  'function getMessagesByTopic(string topic, uint256 limit) view returns (uint256[])',
  'function getMessage(uint256 messageId) view returns (tuple(address sender, string text, string topic, bytes data, uint256 timestamp))'
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startTime = searchParams.get('startTime')
    const endTime = searchParams.get('endTime')
    const topic = searchParams.get('topic')

    if (!startTime || !endTime || !topic) {
      return NextResponse.json(
        { error: 'Missing required parameters: startTime, endTime, topic' },
        { status: 400 }
      )
    }

    const startTimestamp = parseInt(startTime) / 1000 // Convert to seconds
    const endTimestamp = parseInt(endTime) / 1000

    console.log('🔍 Fetching Net Protocol messages:', {
      topic,
      startTime: new Date(parseInt(startTime)).toISOString(),
      endTime: new Date(parseInt(endTime)).toISOString()
    })

    // Initialize provider and contract
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org')
    const netContract = new ethers.Contract(NET_CONTRACT_ADDRESS, NET_CONTRACT_ABI, provider)

    try {
      // Get message IDs for the topic - we need to get messages for all apps
      // Since we don't know which app sent the message, we'll try a different approach
      // Let's use getMessagesByTopic instead, which gets messages by topic regardless of app
      const messageIds = await netContract.getMessagesByTopic(topic, 100) // Get last 100 messages
      console.log(`📨 Found ${messageIds.length} messages for topic '${topic}'`)

      const messages = []

      // Fetch messages in the time range
      for (const messageId of messageIds) {
        try {
          const message = await netContract.getMessage(messageId)
          const messageTimestamp = Number(message.timestamp)

          // Filter by time range
          if (messageTimestamp >= startTimestamp && messageTimestamp <= endTimestamp) {
            messages.push({
              id: messageId.toString(),
              text: message.text,
              topic: message.topic,
              data: ethers.toUtf8String(message.data),
              timestamp: messageTimestamp * 1000, // Convert back to milliseconds
              sender: message.sender
            })
          }
        } catch (messageError) {
          console.error(`Failed to fetch message ${messageId}:`, messageError)
          // Continue with other messages
        }
      }

      console.log(`✅ Returning ${messages.length} messages in time range`)
      return NextResponse.json(messages)

    } catch (contractError) {
      // Clean up the error logging - only show relevant info
      const errorMessage = contractError instanceof Error ? contractError.message : 'Unknown error'
      
      if (errorMessage.includes('missing revert data') || errorMessage.includes('require(false)')) {
        console.log('📭 No Net Protocol messages found for topic (this is normal)')
      } else {
        console.log('⚠️ Net Protocol query failed:', errorMessage.split('(')[0]) // Only show main error, not full stack
      }
      
      // Return empty array instead of error to prevent breaking the UI
      return NextResponse.json([])
    }

  } catch (error) {
    console.error('API error in net-protocol/messages:', error)
    
    // Return empty array to prevent UI errors
    return NextResponse.json([])
  }
}
