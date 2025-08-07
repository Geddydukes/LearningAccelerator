import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { cert_id } = req.query

  if (!cert_id || typeof cert_id !== 'string') {
    return res.status(400).json({ error: 'Certificate ID is required' })
  }

  try {
    // Look up certificate
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        cert_id,
        user_id,
        track,
        issued_at,
        url,
        users!inner(name, email)
      `)
      .eq('cert_id', cert_id)
      .single()

    if (error || !certificate) {
      return res.status(404).json({ error: 'Certificate not found' })
    }

    // Generate verification hashes
    const certificateData = {
      cert_id: certificate.cert_id,
      user_id: certificate.user_id,
      track: certificate.track,
      issued_at: certificate.issued_at,
      user_name: certificate.users.name,
      user_email: certificate.users.email
    }

    // Create digital signature
    const signature = crypto
      .createHmac('sha256', process.env.CERTIFICATE_SECRET || 'default-secret')
      .update(JSON.stringify(certificateData))
      .digest('hex')

    // Create verification hash
    const verificationHash = crypto
      .createHash('sha256')
      .update(`${certificate.cert_id}${certificate.user_id}${certificate.issued_at}`)
      .digest('hex')

    return res.status(200).json({
      success: true,
      certificate: {
        cert_id: certificate.cert_id,
        track: certificate.track,
        issued_at: certificate.issued_at,
        user_name: certificate.users.name,
        url: certificate.url
      },
      verification: {
        signature,
        verification_hash: verificationHash,
        verified_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Certificate verification error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
} 