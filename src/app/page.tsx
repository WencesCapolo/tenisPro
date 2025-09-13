"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

const suggestions = [
  "a new order",
  "tennis balls",
  "just seconds"
]

export default function HomePage() {
  const [currentSuggestion, setCurrentSuggestion] = useState(0)

  const handleSuggestionClick = () => {
    setCurrentSuggestion((prev) => (prev + 1) % suggestions.length)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Main Content */}
      <div className="relative z-10 text-center max-w-6xl mx-auto px-4 py-10">
        {/* Main Heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
          <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Orders + Automation 
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
          in seconds, not days
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-700 mb-16 max-w-4xl mx-auto">
        A simple portal that helps teams manage orders faster and smarter
        </p>

        {/* Suggestion Component */}
        <div className="max-w-xl mx-auto">
          <div 
            className="bg-slate-700 rounded-2xl p-6 shadow-2xl cursor-pointer transition-all duration-300 hover:shadow-3xl"
            onClick={handleSuggestionClick}
          >
            {/* Get suggestions Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-slate-600/60 text-white px-4 py-2 rounded-full text-sm border border-slate-500/50">
                <Sparkles className="h-4 w-4" />
                <span className="font-mono">I may not have an auth, but I really trust people ;)</span>
              </div>
            </div>

            {/* Suggestion Text */}
            <div className="text-white text-lg md:text-xl leading-relaxed mb-8 text-center font-mono">
              <span className="text-gray-300">Create </span>
              <span className="text-white font-medium border-b-2 border-cyan-400">
                {suggestions[0]}
              </span>
              <br />
              <span className="text-gray-300">for </span>
              <span className="text-white font-medium border-b-2 border-purple-400">
                {suggestions[1]}
              </span>
              <br />
              <span className="text-gray-300">in </span>
              <span className="text-white font-medium border-b-2 border-green-400">
                {suggestions[2]}
              </span>
            </div>

            {/* CTA Button inside component */}
            <div className="flex justify-center">
              <Link href="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-white text-slate-800 hover:bg-gray-100 px-10 py-3 text-lg font-semibold font-mono rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Ingreso al dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements for Visual Interest */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-cyan-300/20 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute top-1/3 right-10 w-16 h-16 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-500" />
    </div>
  )
}

