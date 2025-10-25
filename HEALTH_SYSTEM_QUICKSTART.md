# Health Maintenance System - Quick Start Guide

## 🚀 Getting Started

The health maintenance system is now operational and ready to use! Here's how to get started immediately.

## 1. Check System Health

### Via API
```bash
curl http://localhost:3000/api/health
```

### Via UI (Create Admin Page)
Create `app/admin/health/page.tsx`:
```tsx
import { HealthDashboard } from '@/components/health-dashboard'

export default function HealthPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">System Health</h1>
      <HealthDashboard />
    </div>
  )
}
```

Visit: `http://localhost:3000/admin/health`

## 2. Generate Test Content

### Via API
```bash
# Generate test illustration
curl -X POST http://localhost:3000/api/test/generate/illustrations

# Generate test explainer video
curl -X POST http://localhost:3000/api/test/generate/explainers

# Generate test voiceover
curl -X POST http://localhost:3000/api/test/generate/voiceovers
```

### Via UI (Create Test Page)
Create `app/admin/test/page.tsx`:
```tsx
import { TestGenerator } from '@/components/test-generator'

export default function TestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Test Content Generator</h1>
      <TestGenerator />
    </div>
  )
}
```

Visit: `http://localhost:3000/admin/test`

## 3. Auto-Heal Issues

### Heal All Issues
```bash
curl -X POST http://localhost:3000/api/health/heal \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

### Dry Run (Preview Only)
```bash
curl -X POST http://localhost:3000/api/health/heal \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

### Heal Specific Categories
```bash
curl -X POST http://localhost:3000/api/health/heal \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["orphaned_items", "storage_folders"],
    "dryRun": false
  }'
```

## 4. Test All Content Types at Once

Use the Test Generator UI:
1. Go to `/admin/test`
2. Click "Quick Test: Generate All Types"
3. Wait ~30-40 seconds
4. Check your library - you'll have 17 test items!

## 5. Monitor Health Continuously

The Health Dashboard automatically refreshes every 30 seconds. Keep it open to monitor:
- Database status
- Storage health
- API performance
- Data consistency
- Cache hit rates

## Common Use Cases

### Testing Content Generation Flow
1. Generate test content for a specific type
2. Check library to see if it appears
3. Verify storage path is correct
4. Test signed URL generation

### Cleaning Up Test Data
```bash
# Health system doesn't delete test data automatically
# To clean up, use the library UI to delete test items
# Or add custom cleanup endpoint if needed
```

### Fixing Orphaned Library Items
1. Open Health Dashboard
2. See "Orphaned Items" count in Data Consistency card
3. Click "Clean Up" button
4. Confirm and wait for completion

### Creating Missing Storage Folders
1. Open Health Dashboard
2. Check Storage card for missing folders
3. Click "Fix Folders" button
4. Folders will be created automatically

## Available Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Get health status |
| `/api/health/heal` | POST | Trigger auto-heal |
| `/api/test/generate/[type]` | POST | Generate test content |
| `/api/test/generate/[type]` | GET | Get test info |

## Health Status Levels

- 🟢 **Healthy**: Everything working perfectly
- 🟡 **Degraded**: Minor issues detected, but operational
- 🔴 **Unhealthy**: Critical issues requiring attention

## Auto-Heal Categories

- `orphaned_items` - Remove library items without content
- `storage_folders` - Create missing storage folders
- `broken_references` - Fix invalid content references
- `stuck_processing` - Reset stuck processing records
- `cache` - Clear stale cache entries

## Performance Tips

1. **Use Dry Run First**: Test healing with `dryRun: true` before applying
2. **Batch Test Generation**: Use "Generate All Types" for comprehensive testing
3. **Monitor Cache Hit Rate**: Aim for > 80% cache hit rate
4. **Check Health Regularly**: Set up daily health check routine

## Troubleshooting

### Health Check Fails
- Verify Supabase connection
- Check auth credentials
- Ensure database tables exist

### Test Generation Fails
- Check user authentication
- Verify storage bucket access
- Check table schemas match expected structure

### Auto-Heal Doesn't Work
- Verify RLS policies allow modifications
- Check user has proper permissions
- Review error messages in heal response

## Next Steps

1. ✅ **Verify Health**: Check `/api/health` returns "healthy"
2. ✅ **Generate Tests**: Create test content for each type
3. ✅ **Check Library**: Verify test items appear in library
4. ✅ **Run Auto-Heal**: Clean up any issues found
5. 🔄 **Schedule Checks**: Set up cron jobs (future phase)

## Need Help?

Check these files for implementation details:
- `lib/health/health-checker.ts` - Health check logic
- `lib/health/auto-heal.ts` - Self-healing logic
- `lib/test/mock-data.ts` - Mock data generation
- `HEALTH_MAINTENANCE_IMPLEMENTATION.md` - Full documentation

---

**Ready to use!** Start with the Health Dashboard at `/admin/health` 🎉
