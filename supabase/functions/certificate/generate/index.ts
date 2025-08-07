import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1'
import QRCode from 'https://esm.sh/qrcode@1.5.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CertificateData {
  cert_id: string;
  user_id: string;
  track: string;
  issued_at: string;
  user_name: string;
  user_email: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from auth header
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is employable
    const { data: employableResult, error: employableError } = await supabaseClient
      .rpc('check_employable', { user_id: user.id })

    if (employableError) {
      return new Response(
        JSON.stringify({ error: 'Failed to check employability', details: employableError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!employableResult) {
      return new Response(
        JSON.stringify({ error: 'User does not meet employment criteria' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if certificate already exists
    const { data: existingCert, error: existingError } = await supabaseClient
      .from('certificates')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingCert) {
      return new Response(
        JSON.stringify({ 
          error: 'Certificate already exists',
          cert_id: existingCert.cert_id,
          url: existingCert.url
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Failed to get user profile', details: profileError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate certificate ID
    const cert_id = crypto.randomUUID()
    const track = 'Software Engineering' // Default track, could be made dynamic
    const issued_at = new Date().toISOString()

    // Generate QR code
    const verificationUrl = `${Deno.env.get('SITE_URL') || 'https://learning-accelerator.com'}/api/verify/${cert_id}`
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl)

    // Generate PDF certificate
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    // Set up PDF styling
    pdf.setFontSize(24)
    pdf.setTextColor(44, 62, 80)
    
    // Add certificate title
    pdf.text('Certificate of Employment Readiness', 105, 40, { align: 'center' })
    
    // Add decorative line
    pdf.setDrawColor(52, 152, 219)
    pdf.setLineWidth(2)
    pdf.line(30, 50, 180, 50)
    
    // Add certificate content
    pdf.setFontSize(16)
    pdf.text('This is to certify that', 105, 70, { align: 'center' })
    
    pdf.setFontSize(20)
    pdf.setFont(undefined, 'bold')
    pdf.text(profile.name || 'Learner', 105, 85, { align: 'center' })
    
    pdf.setFontSize(16)
    pdf.setFont(undefined, 'normal')
    pdf.text('has successfully completed the Learning Accelerator program', 105, 100, { align: 'center' })
    pdf.text(`in ${track} and has demonstrated employment-ready competencies.`, 105, 110, { align: 'center' })
    
    // Add certificate details
    pdf.setFontSize(12)
    pdf.text(`Certificate ID: ${cert_id}`, 30, 140)
    pdf.text(`Issued: ${new Date(issued_at).toLocaleDateString()}`, 30, 150)
    pdf.text(`Track: ${track}`, 30, 160)
    
    // Add QR code
    const qrSize = 30
    const qrX = 160
    const qrY = 130
    pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
    
    // Add verification text
    pdf.setFontSize(10)
    pdf.setTextColor(128, 128, 128)
    pdf.text('Scan QR code to verify certificate', qrX + qrSize/2, qrY + qrSize + 10, { align: 'center' })
    
    // Add footer
    pdf.setFontSize(10)
    pdf.text('Learning Accelerator - Empowering Digital Learning', 105, 190, { align: 'center' })
    
    // Convert PDF to buffer
    const pdfBuffer = pdf.output('arraybuffer')
    
    // Upload PDF to storage
    const fileName = `certificates/${user.id}/${cert_id}.pdf`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('certificates')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Failed to upload certificate', details: uploadError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('certificates')
      .getPublicUrl(fileName)

    // Insert certificate record
    const { data: certData, error: insertError } = await supabaseClient
      .from('certificates')
      .insert({
        cert_id,
        user_id: user.id,
        track,
        url: urlData.publicUrl
      })
      .select()
      .single()

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Failed to save certificate record', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        cert_id,
        url: urlData.publicUrl,
        message: 'Certificate generated successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 