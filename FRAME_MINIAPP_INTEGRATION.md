# Farcaster Frame & Mini App Integration

## Overview

This document explains how the WANKR app handles Farcaster Frame integration and Mini App behavior, specifically focusing on target population and context extraction.

## Frame vs Mini App Behavior

### Frame (Farcaster Post Integration)
- **Target Source**: Automatically extracted from Farcaster post context
- **User Experience**: No manual input needed - target is pre-filled from the Farcaster post
- **Context**: Includes post ID, cast ID, author FID, handle, and address
- **Button Text**: "Send Shame to @username" (dynamic based on context)

### Mini App (Standalone)
- **Target Source**: Manual input required from user
- **User Experience**: Users must enter target address or Farcaster handle themselves
- **Context**: No pre-filled target unless coming from a Frame
- **Button Text**: "Send Shame" (generic)

## Implementation Details

### 1. Frame Context Extraction

The Frame extracts context from Farcaster using multiple methods:

#### A. Header-based Context (Primary)
Farcaster passes context via HTTP headers when a Frame is clicked:
```typescript
// Headers that Farcaster may send
x-farcaster-post-id: "post_123"
x-farcaster-cast-id: "cast_hash_abc"
x-farcaster-author-fid: "12345"
x-farcaster-author-handle: "username"
x-farcaster-author-address: "0x1234..."
```

#### B. URL Parameter Context (Fallback)
Manual parameters can be passed for testing:
```
/frame/shame?postId=post_123&castId=cast_hash_abc
```

#### C. API-based Context Extraction
When headers are not available, we use the Farcaster API to extract context:

```typescript
// Extract author from post/cast
const authorInfo = await farcasterApiService.extractAuthorFromContext(postId, castId)
```

### 2. Target Population Logic

The system follows this priority order for target determination:

1. **Manual Target** (highest priority) - if explicitly provided
2. **Farcaster Context** - extracted from post/cast author
3. **Fallback** - empty target field for manual input

```typescript
const targetAddress = manualTarget || farcasterContext.authorAddress
const targetHandle = farcasterContext.authorHandle
```

### 3. Frame State Management

Frame state is passed through the `fc:frame:state` meta tag:

```typescript
const frameState = {
  targetAddress,
  targetHandle,
  postId: farcasterContext.postId,
  castId: farcasterContext.castId,
  authorFid: farcasterContext.authorFid,
  context: 'frame'
}

const encodedState = encodeURIComponent(JSON.stringify(frameState))
```

### 4. Mini App Integration

The Mini App receives context via URL parameters:

```
/farcaster/miniapp/shame?target=0x1234&handle=username&postId=post_123&context=frame
```

## API Endpoints

### Frame Context Extraction
- **GET/POST** `/api/frame/extract-context`
- **Purpose**: Extract author information from post/cast IDs
- **Parameters**: `postId`, `castId`, `fid`, `username`
- **Returns**: Author context with address, handle, display name, FID

### Frame Routes
- **GET** `/api/frame/shame` - Frame HTML with context
- **POST** `/api/frame/shame` - Frame action handling
- **POST** `/api/frame/shame/action` - Frame action processing

## Component Integration

### SendWankr Component
Updated to accept initial target and frame context:

```typescript
<SendWankr 
  initialTarget={frameContext.targetHandle || frameContext.targetAddress}
  frameContext={frameContext}
/>
```

Features:
- Auto-resolves initial target using multiple platforms
- Pre-fills target field when coming from Frame
- Maintains manual input capability for standalone use

### Mini App Pages
Both shame and clean Mini Apps handle context:

```typescript
const frameContext: FrameContext = {
  targetAddress: searchParams.get('target'),
  targetHandle: searchParams.get('handle'),
  postId: searchParams.get('postId'),
  castId: searchParams.get('castId'),
  authorFid: searchParams.get('authorFid'),
  context: searchParams.get('context') || 'standalone'
}
```

## User Experience Flow

### Frame Flow
1. User clicks Frame on Farcaster post
2. Frame extracts post author context
3. Frame shows "Send Shame to @username"
4. User clicks button → opens Mini App with pre-filled target
5. User can modify target or proceed with shame

### Standalone Mini App Flow
1. User opens Mini App directly
2. No pre-filled target
3. User must manually enter target address/handle
4. User proceeds with shame

## Testing

### Frame Testing
```bash
# Test with manual context
curl "https://your-domain.com/api/frame/shame?postId=test_post&castId=test_cast"

# Test with headers (simulate Farcaster)
curl -H "x-farcaster-post-id: test_post" \
     -H "x-farcaster-author-handle: testuser" \
     "https://your-domain.com/api/frame/shame"
```

### Mini App Testing
```bash
# Test with Frame context
curl "https://your-domain.com/farcaster/miniapp/shame?target=0x1234&handle=testuser&context=frame"

# Test standalone
curl "https://your-domain.com/farcaster/miniapp/shame"
```

## Environment Variables

Required for Farcaster API integration:
```env
NEYNAR_API_KEY=your_neynar_api_key_here
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## Future Enhancements

1. **Real-time Context**: Use Farcaster's real-time APIs for live context
2. **Batch Processing**: Handle multiple targets from thread context
3. **Enhanced Validation**: Validate Frame context authenticity
4. **Analytics**: Track Frame vs standalone usage patterns
5. **Caching**: Cache frequently accessed user information

## Troubleshooting

### Common Issues

1. **No Target Population**
   - Check if Neynar API key is configured
   - Verify post/cast IDs are valid
   - Check browser console for API errors

2. **Frame Not Loading**
   - Validate Frame HTML meta tags
   - Check Frame validator at https://warpcast.com/~/developers/frames
   - Verify base URL configuration

3. **Context Not Passing**
   - Check URL encoding of state parameters
   - Verify Mini App route parameters
   - Check browser network tab for redirects

### Debug Logging

Enable debug logging by checking console output:
- Frame context extraction
- Target resolution
- API calls to Farcaster
- State management
