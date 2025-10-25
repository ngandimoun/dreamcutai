import { createClient } from '@/lib/supabase/server';

export interface BugReport {
  type: 'manim_render_failure';
  userPrompt: string;
  generatedCode: string;
  technicalError: string;
  errorCategory: string;
  errorSeverity: string;
  userId: string;
  attemptNumber: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export async function reportBug(report: BugReport): Promise<void> {
  try {
    const supabase = createClient();
    
    // Store in bug_reports table
    const { error } = await supabase
      .from('bug_reports')
      .insert({
        type: report.type,
        user_prompt: report.userPrompt,
        generated_code: report.generatedCode,
        technical_error: report.technicalError,
        error_category: report.errorCategory,
        error_severity: report.errorSeverity,
        user_id: report.userId,
        attempt_number: report.attemptNumber,
        created_at: report.timestamp.toISOString(),
        metadata: report.metadata
      });
    
    if (error) {
      console.error('Failed to report bug:', error);
    } else {
      console.log('✅ Bug reported successfully');
    }
  } catch (error) {
    console.error('Bug reporting system error:', error);
    // Don't throw - bug reporting failure shouldn't break the app
  }
}

export async function getBugPatterns(category?: string, limit = 100): Promise<any[]> {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('bug_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (category) {
      query = query.eq('error_category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Failed to fetch bug patterns:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching bug patterns:', error);
    return [];
  }
}

export async function getBugStats(): Promise<{
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  recentTrends: any[];
}> {
  try {
    const supabase = createClient();
    
    // Get all bugs from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { data: bugs } = await supabase
      .from('bug_reports')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    if (!bugs) {
      return { total: 0, byCategory: {}, bySeverity: {}, recentTrends: [] };
    }
    
    // Group by category
    const byCategory = bugs.reduce((acc, bug) => {
      acc[bug.error_category] = (acc[bug.error_category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Group by severity
    const bySeverity = bugs.reduce((acc, bug) => {
      acc[bug.error_severity] = (acc[bug.error_severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total: bugs.length,
      byCategory,
      bySeverity,
      recentTrends: bugs.slice(0, 10)
    };
  } catch (error) {
    console.error('Error fetching bug stats:', error);
    return { total: 0, byCategory: {}, bySeverity: {}, recentTrends: [] };
  }
}


