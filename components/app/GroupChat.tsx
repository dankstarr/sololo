'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { m } from 'framer-motion'
import {
  Send,
  Pin,
  MapPin,
  Users,
  Calendar,
  MessageCircle,
  Coffee,
  Headphones,
  Radio,
  Navigation,
  ArrowLeft,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

interface Message {
  id: string
  user: string
  text: string
  timestamp: string
  type?: 'icebreaker' | 'audio' | 'meetup'
  audioUrl?: string
  meetupDistance?: string
}

export default function GroupChat() {
  const router = useRouter()
  const params = useParams()
  const { currentGroup } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      user: 'Alex',
      text: 'Hey everyone! Excited to explore Tokyo together 🗾',
      timestamp: '10:30 AM',
    },
    {
      id: '2',
      user: 'Sarah',
      text: 'Same! I found a great ramen place near Senso-ji. Want to meet there?',
      timestamp: '10:32 AM',
    },
    {
      id: '3',
      user: 'System',
      text: 'Coffee near Senso-ji Temple at 3pm?',
      timestamp: '10:35 AM',
      type: 'icebreaker',
    },
    {
      id: '4',
      user: 'Alex',
      text: 'Shared audio guide for Senso-ji Temple',
      timestamp: '10:40 AM',
      type: 'audio',
      audioUrl: '/audio/sensoji-guide.mp3',
    },
    {
      id: '5',
      user: 'Sarah',
      text: 'Meetup suggested: ~200m away',
      timestamp: '10:42 AM',
      type: 'meetup',
      meetupDistance: '~200m',
    },
  ])
  const [newMessage, setNewMessage] = useState('')
  const [meetupMode, setMeetupMode] = useState(false)

  const handleSend = () => {
    if (!newMessage.trim()) return
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        user: 'You',
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ])
    setNewMessage('')
  }

  const group = currentGroup || {
    id: params?.id as string || 'default',
    destination: 'Tokyo, Japan',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    memberCount: 5,
    maxMembers: 10,
    description: 'Group exploring Tokyo',
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="container mx-auto">
          <button
            onClick={() => router.push('/app/groups')}
            className="text-gray-600 hover:text-gray-900 mb-3 flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Groups
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {group.destination} Group
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{group.destination}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{group.startDate} - {group.endDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{group.memberCount}/{group.maxMembers} members</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto w-full flex">
        {/* Chat */}
        <div className="flex-1 flex flex-col">
          {/* Pinned Itinerary */}
          <div className="bg-primary-50 border-b border-primary-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pin className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-900">
                Pinned Itinerary
              </span>
            </div>
            <p className="text-sm text-primary-700">
              Day 1: Senso-ji Temple → Tsukiji Market → Tokyo Skytree
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.user === 'You' ? 'justify-end' : 'justify-start'
                } animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.user === 'You'
                      ? 'bg-primary-600 text-white'
                      : message.type === 'icebreaker'
                      ? 'bg-orange-100 text-orange-900 border-2 border-orange-300'
                      : message.type === 'audio'
                      ? 'bg-purple-100 text-purple-900 border-2 border-purple-300'
                      : message.type === 'meetup'
                      ? 'bg-green-100 text-green-900 border-2 border-green-300'
                      : 'bg-white text-gray-900 shadow'
                  }`}
                >
                  {message.user !== 'You' && (
                    <div className="font-semibold text-sm mb-1">
                      {message.user}
                    </div>
                  )}
                  {message.type === 'audio' ? (
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4" />
                      <span className="text-sm">{message.text}</span>
                      <button className="ml-2 px-3 py-1 bg-white/20 rounded-lg text-xs font-semibold hover:bg-white/30 transition-colors">
                        Play
                      </button>
                    </div>
                  ) : message.type === 'meetup' ? (
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      <div>
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs opacity-75 mt-1">
                          Approximate distance only
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm">{message.text}</p>
                  )}
                  <div
                    className={`text-xs mt-1 ${
                      message.user === 'You'
                        ? 'text-primary-200'
                        : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent text-base"
              />
              <button
                onClick={handleSend}
                className="px-4 sm:px-6 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all flex items-center gap-2 min-h-[44px] min-w-[44px] justify-center"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <button
                onClick={() => {
                  const meetupMessage: Message = {
                    id: Date.now().toString(),
                    user: 'You',
                    text: `Meetup suggested: ~${Math.floor(Math.random() * 500)}m away`,
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    type: 'meetup',
                    meetupDistance: `~${Math.floor(Math.random() * 500)}m`,
                  }
                  setMessages([...messages, meetupMessage])
                }}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Coffee className="w-4 h-4" />
                Suggest meetup
              </button>
              <button
                onClick={() => {
                  const audioMessage: Message = {
                    id: Date.now().toString(),
                    user: 'You',
                    text: 'Shared audio guide for Senso-ji Temple',
                    timestamp: new Date().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    type: 'audio',
                    audioUrl: '/audio/sensoji-guide.mp3',
                  }
                  setMessages([...messages, audioMessage])
                }}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <Headphones className="w-4 h-4" />
                Share audio
              </button>
              <button
                onClick={() => setMeetupMode(!meetupMode)}
                className={`text-sm flex items-center gap-1 ${
                  meetupMode
                    ? 'text-green-600 hover:text-green-700'
                    : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                <Radio className="w-4 h-4" />
                {meetupMode ? 'Meetup mode: ON' : 'Meetup mode: OFF'}
              </button>
            </div>
            {meetupMode && (
              <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-700">
                Meetup mode active: Showing approximate distances only for
                privacy
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-80 bg-white border-l border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Shared Locations</h3>
          <div className="space-y-2 mb-6">
            {['Senso-ji Temple', 'Tsukiji Market', 'Shibuya Crossing'].map(
              (location) => (
                <div
                  key={location}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    <span className="text-sm text-gray-700">{location}</span>
                  </div>
                </div>
              )
            )}
          </div>

          <h3 className="font-semibold text-gray-900 mb-4">Group Members</h3>
          <div className="space-y-2">
            {['Alex', 'Sarah', 'You'].map((member) => (
              <div
                key={member}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {member[0]}
                </div>
                <span className="text-sm text-gray-700">{member}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
