"use client"

import { useState } from "react"
import useSWR from 'swr'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Activity,
  Database,
  HardDrive,
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Wrench
} from "lucide-react"

interface HealthCheckReport {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  database: {
    status: string
    tables: number
    expectedTables: number
    missingTables: string[]
    rlsEnabled: boolean
  }
  storage: {
    status: string
    bucket: string
    folders: number
    expectedFolders: number
    missingFolders: string[]
    totalFiles: number
  }
  integration: {
    status: string
    libraryApiResponseTime: number | null
    cacheHitRate: number
  }
  dataConsistency: {
    status: string
    orphanedLibraryItems: number
    stuckProcessing: number
  }
  allIssues: Array<{
    severity: 'critical' | 'warning' | 'info'
    category: string
    message: string
    autoHealable: boolean
  }>
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function HealthDashboard() {
  const [isHealing, setIsHealing] = useState(false)
  const [healResult, setHealResult] = useState<string | null>(null)

  // Poll health status every 30 seconds
  const { data: health, error, isLoading, mutate } = useSWR<HealthCheckReport>(
    '/api/health',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: false
    }
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50'
      case 'degraded': return 'text-yellow-600 bg-yellow-50'
      case 'unhealthy': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'unhealthy': return <XCircle className="h-5 w-5 text-red-600" />
      default: return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const handleHeal = async (categories?: string[]) => {
    setIsHealing(true)
    setHealResult(null)

    try {
      const response = await fetch('/api/health/heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories, dryRun: false })
      })

      const result = await response.json()
      
      if (result.success) {
        setHealResult(`✅ Healed ${result.totalItemsHealed} item(s)`)
      } else {
        setHealResult(`❌ Healing failed: ${result.results[0]?.message || 'Unknown error'}`)
      }

      // Refresh health status
      mutate()
    } catch (error) {
      setHealResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsHealing(false)
    }
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Health Check Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Failed to load health status</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Health Status...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(health.status)}
                System Health
              </CardTitle>
              <CardDescription>
                Last checked: {new Date(health.timestamp).toLocaleString()}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(health.status)}>
              {health.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={() => mutate()}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => handleHeal()}
              variant="default"
              size="sm"
              disabled={isHealing}
            >
              <Wrench className="h-4 w-4 mr-2" />
              {isHealing ? 'Healing...' : 'Auto-Heal All'}
            </Button>
          </div>
          {healResult && (
            <Alert className="mt-4">
              <AlertDescription>{healResult}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Component Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Database */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tables</span>
                <span className="text-sm font-medium">
                  {health.database.tables}/{health.database.expectedTables}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">RLS</span>
                <Badge variant={health.database.rlsEnabled ? "default" : "destructive"}>
                  {health.database.rlsEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              {health.database.missingTables.length > 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Missing: {health.database.missingTables.join(', ')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Folders</span>
                <span className="text-sm font-medium">
                  {health.storage.folders}/{health.storage.expectedFolders}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Files</span>
                <span className="text-sm font-medium">{health.storage.totalFiles}</span>
              </div>
              {health.storage.missingFolders.length > 0 && (
                <Button
                  onClick={() => handleHeal(['storage_folders'])}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  disabled={isHealing}
                >
                  Fix Folders
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Integration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Time</span>
                <span className="text-sm font-medium">
                  {health.integration.libraryApiResponseTime || 'N/A'}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cache Hit</span>
                <span className="text-sm font-medium">
                  {health.integration.cacheHitRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Consistency */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Data Consistency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Orphaned</span>
                <span className="text-sm font-medium">
                  {health.dataConsistency.orphanedLibraryItems}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Stuck</span>
                <span className="text-sm font-medium">
                  {health.dataConsistency.stuckProcessing}
                </span>
              </div>
              {health.dataConsistency.orphanedLibraryItems > 0 && (
                <Button
                  onClick={() => handleHeal(['orphaned_items'])}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  disabled={isHealing}
                >
                  Clean Up
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues List */}
      {health.allIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detected Issues ({health.allIssues.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health.allIssues.map((issue, index) => (
                <Alert key={index} variant={issue.severity === 'critical' ? 'destructive' : 'default'}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{issue.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {issue.category} • {issue.severity}
                      </p>
                    </div>
                    {issue.autoHealable && (
                      <Badge variant="outline" className="ml-2">
                        Auto-healable
                      </Badge>
                    )}
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

