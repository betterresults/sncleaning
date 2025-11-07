import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'
import Jimp from 'npm:jimp@0.22.10'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessingRequest {
  filePaths: string[];
  bookingId: number;
  photoType: string;
  customerId: number;
  cleanerId: number;
  postcode: string;
  bookingDate: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { filePaths, bookingId, photoType, customerId, cleanerId, postcode, bookingDate }: ProcessingRequest = await req.json()

    console.log(`Starting background processing for ${filePaths.length} files`)

    // Insert processing status records
    const statusRecords = filePaths.map(filePath => ({
      booking_id: bookingId,
      file_path: filePath,
      status: 'pending'
    }))

    await supabase.from('photo_processing_status').insert(statusRecords)

    // Start background processing
    EdgeRuntime.waitUntil(
      processPhotos(supabase, filePaths, bookingId, photoType, customerId, cleanerId, postcode, bookingDate)
    )

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Processing started', 
        fileCount: filePaths.length 
      }),
      { 
        status: 202, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error starting photo processing:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function processPhotos(
  supabase: any,
  filePaths: string[],
  bookingId: number,
  photoType: string,
  customerId: number,
  cleanerId: number,
  postcode: string,
  bookingDate: string
) {
  console.log(`Processing ${filePaths.length} photos in background`)

  for (const filePath of filePaths) {
    try {
      // Update status to processing
      await supabase
        .from('photo_processing_status')
        .update({ status: 'processing' })
        .eq('file_path', filePath)

      // Download original file from storage
      const { data: originalFile, error: downloadError } = await supabase.storage
        .from('cleaning.photos')
        .download(filePath)

      if (downloadError) {
        throw new Error(`Download failed: ${downloadError.message}`)
      }

      // For images, compress them
      let processedFile = originalFile
      const isImage = filePath.match(/\.(jpg|jpeg|png|webp)$/i)
      
      if (isImage) {
        try {
          processedFile = await compressImage(originalFile)
          console.log(`✓ Compressed ${filePath}`)
        } catch (compError) {
          console.error(`✗ Compression failed for ${filePath}, using original:`, compError)
        }
      }

      // Replace with processed version
      const { error: uploadError } = await supabase.storage
        .from('cleaning.photos')
        .upload(filePath, processedFile, { upsert: true })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Insert metadata into cleaning_photos table
      const fileName = filePath.split('/').pop() || 'unknown'
      const { error: insertError } = await supabase
        .from('cleaning_photos')
        .insert({
          booking_id: bookingId,
          customer_id: customerId,
          cleaner_id: cleanerId,
          file_path: filePath,
          photo_type: photoType,
          postcode: postcode,
          booking_date: bookingDate,
          caption: fileName
        })

      if (insertError) {
        throw new Error(`Metadata insert failed: ${insertError.message}`)
      }

      // Mark as completed
      await supabase
        .from('photo_processing_status')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('file_path', filePath)

      console.log(`✓ Completed processing ${filePath}`)

    } catch (error) {
      console.error(`✗ Failed to process ${filePath}:`, error)
      
      // Mark as failed
      await supabase
        .from('photo_processing_status')
        .update({ 
          status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('file_path', filePath)
    }
  }

  console.log(`Background processing complete for booking ${bookingId}`)
}

async function compressImage(file: Blob): Promise<Blob> {
  const startTime = Date.now()
  const originalSize = file.size
  
  // Skip small files (already optimized)
  if (originalSize < 500 * 1024) {
    console.log(`Skipping compression for small file (${(originalSize/1024).toFixed(0)}KB)`)
    return file
  }

  try {
    // Convert blob to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Load image with Jimp
    const image = await Jimp.read(buffer)
    console.log(`Original dimensions: ${image.bitmap.width}x${image.bitmap.height}`)
    
    // Calculate new dimensions (max 1920px)
    const maxDimension = 1920
    const width = image.bitmap.width
    const height = image.bitmap.height
    
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        image.resize(maxDimension, Jimp.AUTO)
      } else {
        image.resize(Jimp.AUTO, maxDimension)
      }
      console.log(`Resized to: ${image.bitmap.width}x${image.bitmap.height}`)
    }
    
    // Set JPEG quality to 80%
    image.quality(80)
    
    // Convert to buffer
    const compressedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG)
    const compressedBlob = new Blob([compressedBuffer], { type: 'image/jpeg' })
    
    const compressionTime = Date.now() - startTime
    const compressionRatio = ((1 - compressedBlob.size / originalSize) * 100).toFixed(1)
    
    console.log(`✓ Compression complete:`)
    console.log(`  Original: ${(originalSize/1024/1024).toFixed(2)}MB`)
    console.log(`  Compressed: ${(compressedBlob.size/1024/1024).toFixed(2)}MB`)
    console.log(`  Saved: ${compressionRatio}% in ${compressionTime}ms`)
    
    return compressedBlob
    
  } catch (error) {
    console.error('Compression failed, using original file:', error)
    return file
  }
}