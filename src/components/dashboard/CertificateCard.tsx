import React, { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Download, Share2, ExternalLink, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface Certificate {
  cert_id: string
  track: string
  issued_at: string
  url: string
}

interface CertificateCardProps {
  className?: string
}

export const CertificateCard: React.FC<CertificateCardProps> = ({ className }) => {
  const { user } = useAuth()
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)



  useEffect(() => {
    if (user) {
      fetchCertificate()
    }
  }, [user])

  const fetchCertificate = async () => {
    if (!user?.id) {
      console.warn('No user ID available for fetching certificate')
      return
    }

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // If the table doesn't exist, just return without error
        if (error.code === '42P01') {
          console.warn('Certificates table not found')
          return
        }
        // Handle 406 error specifically
        if (error.code === '406') {
          console.warn('Authentication issue with certificates table')
          return
        }
        if (error.code !== 'PGRST116') {
          console.error('Error fetching certificate:', error)
          return
        }
      }

      if (data) {
        setCertificate(data)
      }
    } catch (error) {
      console.error('Error fetching certificate:', error)
    }
  }

  const generateCertificate = async () => {
    if (!user) return

    setGenerating(true)
    try {
      const response = await fetch('/api/functions/v1/certificate/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Certificate generated successfully!')
        await fetchCertificate()
      } else {
        toast.error(result.error || 'Failed to generate certificate')
      }
    } catch (error) {
      console.error('Error generating certificate:', error)
      toast.error('Failed to generate certificate')
    } finally {
      setGenerating(false)
    }
  }

  const downloadCertificate = async () => {
    if (!certificate?.url) return

    try {
      const response = await fetch(certificate.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${certificate.cert_id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Certificate downloaded!')
    } catch (error) {
      console.error('Error downloading certificate:', error)
      toast.error('Failed to download certificate')
    }
  }

  const shareCertificate = async () => {
    if (!certificate) return

    const shareData = {
      title: 'Employment-Ready Certificate',
      text: `I've earned my Employment-Ready Certificate in ${certificate.track} from Learning Accelerator!`,
      url: `${window.location.origin}/api/verify/${certificate.cert_id}`
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        toast.success('Certificate shared!')
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url)
        toast.success('Verification link copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing certificate:', error)
      toast.error('Failed to share certificate')
    }
  }

  const openVerification = () => {
    if (!certificate) return
    window.open(`/api/verify/${certificate.cert_id}`, '_blank')
  }

  if (!certificate) {
    return (
      <Card className={className} data-testid="certificate-card">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Employment-Ready Certificate
            </h3>
          </div>
          <div className="text-center py-8">
            <div className="mb-4">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ready to Earn Your Certificate?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Complete your learning journey and demonstrate employment-ready competencies to earn your certificate.
              </p>
            </div>
            <Button 
              onClick={generateCertificate} 
              disabled={generating}
              className="w-full"
            >
              {generating ? 'Generating...' : 'Generate Certificate'}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className} data-testid="certificate-card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Employment-Ready Certificate
            </h3>
          </div>
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            Verified
          </span>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track</p>
              <p className="font-medium">{certificate.track}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Issued</p>
              <p className="font-medium">
                {new Date(certificate.issued_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={downloadCertificate} 
              variant="outline" 
              size="sm"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              onClick={shareCertificate} 
              variant="outline" 
              size="sm"
              className="flex-1"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button 
              onClick={openVerification} 
              variant="outline" 
              size="sm"
              aria-label="Open verification"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Certificate ID: {certificate.cert_id}
          </div>
        </div>
      </div>
    </Card>
  )
} 