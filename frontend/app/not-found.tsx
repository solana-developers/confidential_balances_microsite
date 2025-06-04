import './globals.css'

import Link from 'next/link'
import { Home, Wallet } from 'lucide-react'
import { SimpleLayout } from '@/app/simple-layout'

export default function NotFound() {
  return (
    <SimpleLayout className="min-h-[60vh] px-4">
      <div className="text-center">
        {/* Error code */}
        <div className="mb-6">
          <h1 className="font-family-geist-mono text-8xl font-bold text-[var(--muted-foreground)]">
            404
          </h1>
          <div className="mx-auto mt-2 h-1 w-24 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
        </div>

        <div className="mb-8 space-y-4">
          <h2 className="text-3xl font-bold text-[var(--foreground)]">Account Not Found</h2>
          <p className="mx-auto max-w-lg text-lg text-[var(--muted-foreground)]">
            The address you're looking for doesn't exist on this cluster, or the page has been moved
            to a different location.
          </p>
        </div>

        {/* Status indicators */}
        <div className="mb-8 flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-[var(--muted-foreground)]">Wallet Status</span>
          </div>
          <div className="flex items-center space-x-2">
            <Wallet className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted-foreground)]">Disconnected</span>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 rounded-sm border border-emerald-400 bg-emerald-400 px-6 py-3 text-sm font-medium text-teal-900 transition-colors hover:border-emerald-500 hover:bg-emerald-500"
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>

        {/* Additional help */}
        <div className="mt-12 rounded-lg border border-[var(--border)] bg-[var(--table-background)] p-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Need Help?</h3>
          <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
            <p>• Check if the account address is correctly formatted</p>
            <p>• Ensure you're connected to the right cluster</p>
            <p>• Try refreshing your wallet connection</p>
            <p>• Verify the account exists on the current network</p>
          </div>
        </div>

        <div className="mt-8">
          <p className="font-family-geist-mono text-xs text-[var(--muted-foreground)]">
            Error 404: Page not found
          </p>
        </div>
      </div>
    </SimpleLayout>
  )
}
