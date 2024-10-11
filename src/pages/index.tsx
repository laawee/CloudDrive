import dynamic from 'next/dynamic'

const CloudStorageDashboard = dynamic(() => import('../components/CloudStorageDashboard'), { ssr: false })

export default function Home() {
  return <CloudStorageDashboard />
}
