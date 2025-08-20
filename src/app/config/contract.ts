import { ethers } from 'ethers'

// WANKR Contract Configuration
export const WANKR_CONTRACT_ADDRESS = '0xa207c6e67cea08641503947ac05c65748bb9bb07'
export const STANDARD_SHAME_AMOUNT = ethers.parseUnits('10', 18) // 10 WANKR

// Net Protocol Contract Configuration
export const NET_CONTRACT_ADDRESS = '0x00000000b24d62781db359b07880a105cd0b64e6'

// Contract ABI for the functions we need (standard ERC-20 + Net Protocol)
export const WANKR_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
]

// Net Protocol ABI (from Etherscan)
export const NET_ABI = [
  'function sendMessage(string text, string topic, bytes data) external',
  'function sendMessageViaApp(address sender, string text, string topic, bytes data) external',
  'function getMessage(uint256 messageId) external view returns (string text, string topic, bytes data, uint256 timestamp)',
  'function getMessagesByTopic(string topic, uint256 limit) external view returns (uint256[] messageIds)',
  'function getMessageForApp(address app) external view returns (uint256[] messageIds)',
  'function getMessageForAppUser(address app, address user) external view returns (uint256[] messageIds)',
  'function getMessageForAppTopic(address app, string topic) external view returns (uint256[] messageIds)',
  'function getMessageForAppUserTopic(address app, address user, string topic) external view returns (uint256[] messageIds)',
  'event MessageSent(address indexed sender, string indexed topic, uint256 messageIndex)'
]
