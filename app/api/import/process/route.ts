import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OptimizedImportProcessor } from '@/lib/import/optimized/optimizedProcessor'
import { validateCompanySession } from '@/lib/auth/validateSession'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max

interface ImportJobData {
  jobId: string
  establishmentId: string
  fileName: string
  fileSize: number
}

export async function POST(request: NextRequest) {
  try {
    // Validate company session
    const session = await validateCompanySession(request)
    if (!session.valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const establishmentId = formData.get('establishmentId') as string

    if (!file || !establishmentId) {
      return NextResponse.json(
        { error: 'File and establishmentId are required' },
        { status: 400 }
      )
    }

    // File size validation
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      return NextResponse.json(
        { error: 'File too large. Maximum size: 100MB' },
        { status: 413 }
      )
    }

    // Create job record
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const supabase = await createClient()
    
    await supabase.from('import_jobs').insert({
      id: jobId,
      etablissement_id: establishmentId,
      file_name: file.name,
      file_size: file.size,
      status: 'queued',
      progress: 0,
      created_by: session.company_id
    })

    // Process import in background (non-blocking)
    processImportInBackground({
      jobId,
      establishmentId,
      fileName: file.name,
      fileSize: file.size
    }, file)

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Import started in background'
    })

  } catch (error) {
    console.error('Import API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processImportInBackground(jobData: ImportJobData, file: File) {
  const supabase = await createClient()
  
  try {
    // Update job status
    await supabase.from('import_jobs').update({
      status: 'processing',
      started_at: new Date().toISOString()
    }).eq('id', jobData.jobId)

    // Create optimized processor
    const processor = new OptimizedImportProcessor(jobData.jobId)
    
    // Process the import
    const result = await processor.processImport(file, jobData.establishmentId)
    
    // Update job with success
    await supabase.from('import_jobs').update({
      status: 'completed',
      progress: 100,
      completed_at: new Date().toISOString(),
      result: {
        recordsImported: result.recordsImported,
        snapshotsCalculated: result.snapshotsCalculated,
        processingTime: result.processingTime
      }
    }).eq('id', jobData.jobId)

  } catch (error) {
    console.error('Background import error:', error)
    
    // Update job with error
    await supabase.from('import_jobs').update({
      status: 'failed',
      progress: 0,
      error_message: error instanceof Error ? error.message : 'Unknown error',
      completed_at: new Date().toISOString()
    }).eq('id', jobData.jobId)
  }
}