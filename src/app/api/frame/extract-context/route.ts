// src/app/api/frame/extract-context/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { farcasterApiService } from '../../../services/farcasterApiService'

interface ExtractedContext {
  targetAddress?: string
  targetHandle?: string
  targetDisplayName?: string
  authorFid?: string
  source?: 'post' | 'fid' | 'username'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    const castId = searchParams.get('castId')
    const fid = searchParams.get('fid')
    const username = searchParams.get('username')

    console.log('Frame context extraction request:', { postId, castId, fid, username })

    let context: ExtractedContext = {}

    // Extract context from post/cast
    if (postId || castId) {
      const authorInfo = await farcasterApiService.extractAuthorFromContext(postId || undefined, castId || undefined)
      if (authorInfo) {
        context = {
          ...context,
          targetAddress: authorInfo.address,
          targetHandle: authorInfo.handle,
          targetDisplayName: authorInfo.displayName,
          authorFid: authorInfo.fid,
          source: 'post'
        }
      }
    }

    // Extract context from FID
    if (fid && !context.targetAddress) {
      const userInfo = await farcasterApiService.getUserByFid(fid)
      if (userInfo) {
        context = {
          ...context,
          targetAddress: userInfo.address,
          targetHandle: userInfo.username,
          targetDisplayName: userInfo.displayName,
          authorFid: userInfo.fid,
          source: 'fid'
        }
      }
    }

    // Extract context from username
    if (username && !context.targetAddress) {
      const userInfo = await farcasterApiService.getUserByUsername(username)
      if (userInfo) {
        context = {
          ...context,
          targetAddress: userInfo.address,
          targetHandle: userInfo.username,
          targetDisplayName: userInfo.displayName,
          authorFid: userInfo.fid,
          source: 'username'
        }
      }
    }

    console.log('Extracted context:', context)

    return NextResponse.json({
      success: true,
      context
    })

  } catch (error) {
    console.error('Error extracting Frame context:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to extract context' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, castId, fid, username } = body

    console.log('Frame context extraction POST request:', { postId, castId, fid, username })

    let context: ExtractedContext = {}

    // Extract context from post/cast
    if (postId || castId) {
      const authorInfo = await farcasterApiService.extractAuthorFromContext(postId, castId)
      if (authorInfo) {
        context = {
          ...context,
          targetAddress: authorInfo.address,
          targetHandle: authorInfo.handle,
          targetDisplayName: authorInfo.displayName,
          authorFid: authorInfo.fid,
          source: 'post'
        }
      }
    }

    // Extract context from FID
    if (fid && !context.targetAddress) {
      const userInfo = await farcasterApiService.getUserByFid(fid)
      if (userInfo) {
        context = {
          ...context,
          targetAddress: userInfo.address,
          targetHandle: userInfo.username,
          targetDisplayName: userInfo.displayName,
          authorFid: userInfo.fid,
          source: 'fid'
        }
      }
    }

    // Extract context from username
    if (username && !context.targetAddress) {
      const userInfo = await farcasterApiService.getUserByUsername(username)
      if (userInfo) {
        context = {
          ...context,
          targetAddress: userInfo.address,
          targetHandle: userInfo.username,
          targetDisplayName: userInfo.displayName,
          authorFid: userInfo.fid,
          source: 'username'
        }
      }
    }

    console.log('Extracted context:', context)

    return NextResponse.json({
      success: true,
      context
    })

  } catch (error) {
    console.error('Error extracting Frame context:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to extract context' 
      },
      { status: 500 }
    )
  }
}
