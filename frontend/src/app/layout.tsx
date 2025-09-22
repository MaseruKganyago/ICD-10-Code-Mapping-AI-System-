import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ConfigProvider } from 'antd'
import { theme } from 'antd'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ICD-10 Code Mapping API',
  description: 'AI-powered ICD-10 medical code mapping system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#1890ff',
              borderRadius: 6,
            },
            algorithm: theme.defaultAlgorithm,
          }}
        >
          {children}
        </ConfigProvider>
      </body>
    </html>
  )
}