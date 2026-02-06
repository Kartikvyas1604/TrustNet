'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function OrganizationDetailsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    organizationName: '',
    legalBusinessName: '',
    registrationNumber: '',
    country: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    industry: '',
    websiteUrl: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminJobTitle: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const orgType = sessionStorage.getItem('orgType')
      const response = await fetch('/api/organization/register/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationType: orgType,
          businessAddress: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        sessionStorage.setItem('organizationId', data.data.organizationId)
        router.push('/organization/register/license')
      } else {
        alert(data.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-4xl font-bold mb-4">Organization Information</h1>
          <p className="text-vault-slate text-lg">
            Please provide accurate information for verification
          </p>
        </motion.div>

        <Card className="p-8 border-vault-slate/20 bg-vault-slate/5">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Business Information */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-vault-green">Business Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organizationName">Organization Name *</Label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    required
                    placeholder="Acme Corporation"
                  />
                </div>
                <div>
                  <Label htmlFor="legalBusinessName">Legal Business Name *</Label>
                  <Input
                    id="legalBusinessName"
                    name="legalBusinessName"
                    value={formData.legalBusinessName}
                    onChange={handleChange}
                    required
                    placeholder="Acme Corporation Inc."
                  />
                </div>
                <div>
                  <Label htmlFor="registrationNumber">Business Registration Number *</Label>
                  <Input
                    id="registrationNumber"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    required
                    placeholder="EIN, Company Number"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country of Registration *</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    placeholder="United States"
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry/Sector</Label>
                  <Input
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    placeholder="Technology, Finance, Healthcare"
                  />
                </div>
                <div>
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    name="websiteUrl"
                    type="url"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Business Address */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-vault-green">Business Address</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    required
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder="California"
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP/Postal Code *</Label>
                  <Input
                    id="zip"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    required
                    placeholder="94102"
                  />
                </div>
              </div>
            </div>

            {/* Admin Contact */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-vault-green">Admin Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adminName">Full Name *</Label>
                  <Input
                    id="adminName"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="adminJobTitle">Job Title *</Label>
                  <Input
                    id="adminJobTitle"
                    name="adminJobTitle"
                    value={formData.adminJobTitle}
                    onChange={handleChange}
                    required
                    placeholder="CEO, CFO, HR Manager"
                  />
                </div>
                <div>
                  <Label htmlFor="adminEmail">Email Address *</Label>
                  <Input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="adminPhone">Phone Number *</Label>
                  <Input
                    id="adminPhone"
                    name="adminPhone"
                    type="tel"
                    value={formData.adminPhone}
                    onChange={handleChange}
                    required
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="cyber"
                disabled={loading}
                className="px-8"
              >
                {loading ? 'Processing...' : 'Continue to License Selection'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
