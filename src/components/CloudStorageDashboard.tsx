'use client'

import React, { useState, useEffect } from 'react'
import { File, Folder, Home, Plus, Search, Settings, Upload } from "lucide-react"

// Mock COS SDK for client-side usage
const mockCOS = {
  getBucket: (params: any, callback: (err: any, data: any) => void) => {
    // Simulate API call
    setTimeout(() => {
      callback(null, {
        CommonPrefixes: [{ Prefix: 'folder1/' }, { Prefix: 'folder2/' }],
        Contents: [
          { Key: 'file1.txt', Size: 1024, LastModified: new Date() },
          { Key: 'file2.pdf', Size: 2048, LastModified: new Date() }
        ]
      })
    }, 500)
  },
  putObject: (params: any, callback: (err: any, data: any) => void) => {
    // Simulate file upload
    setTimeout(() => {
      callback(null, { ETag: '"mockETag"' })
    }, 1000)
  },
  getObjectUrl: (params: any, callback: (err: any, data: any) => void) => {
    // Simulate getting object URL
    callback(null, { Url: `https://example.com/${params.Key}` })
  }
}

export default function CloudStorageDashboard() {
  const [files, setFiles] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPath, setCurrentPath] = useState('/')

  useEffect(() => {
    fetchFiles()
  }, [currentPath])

  const fetchFiles = () => {
    mockCOS.getBucket({
      Bucket: 'your-bucket-name',
      Region: 'your-region',
      Prefix: currentPath,
      Delimiter: '/'
    }, (err, data) => {
      if (err) {
        console.error('Error fetching files:', err)
      } else {
        const formattedFiles = [
          ...data.CommonPrefixes.map((prefix: any) => ({
            name: prefix.Prefix.split('/').slice(-2)[0],
            type: 'folder',
            size: '-',
            lastModified: '-'
          })),
          ...data.Contents.map((file: any) => ({
            name: file.Key.split('/').pop(),
            type: 'file',
            size: formatFileSize(file.Size),
            lastModified: new Date(file.LastModified).toLocaleDateString()
          }))
        ]
        setFiles(formattedFiles)
      }
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      mockCOS.putObject({
        Bucket: 'your-bucket-name',
        Region: 'your-region',
        Key: currentPath + file.name,
        Body: file
      }, (err, data) => {
        if (err) {
          console.error('Error uploading file:', err)
        } else {
          console.log('File uploaded successfully')
          fetchFiles()
        }
      })
    }
  }

  const handleCreateFolder = () => {
    const folderName = prompt('Enter folder name:')
    if (folderName) {
      mockCOS.putObject({
        Bucket: 'your-bucket-name',
        Region: 'your-region',
        Key: currentPath + folderName + '/',
        Body: ''
      }, (err, data) => {
        if (err) {
          console.error('Error creating folder:', err)
        } else {
          console.log('Folder created successfully')
          fetchFiles()
        }
      })
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleFileAction = (file: { type: string; name: string }) => {
    if (file.type === 'folder') {
      setCurrentPath(currentPath + file.name + '/')
    } else {
      // For files, initiate download
      mockCOS.getObjectUrl({
        Bucket: 'your-bucket-name',
        Region: 'your-region',
        Key: currentPath + file.name,
        Sign: true
      }, (err, data) => {
        if (err) {
          console.error('Error getting file URL:', err)
        } else {
          window.open(data.Url, '_blank')
        }
      })
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-primary">CloudDrive</h1>
        </div>
        <nav className="mt-6">
          <a href="#" className="flex items-center px-4 py-2 text-gray-700 bg-gray-100">
            <Home className="w-5 h-5 mr-2" />
            My Files
          </a>
          <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
            <Folder className="w-5 h-5 mr-2" />
            Shared Files
          </a>
          <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
            <Settings className="w-5 h-5 mr-2" />
            Settings
          </a>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">My Files</h2>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => document.getElementById('fileInput')?.click()}>
              <Upload className="w-4 h-4 mr-2 inline" />
              Upload
            </button>
            <input
              id="fileInput"
              type="file"
              className="hidden"
              onChange={handleUpload}
            />
            <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={handleCreateFolder}>
              <Plus className="w-4 h-4 mr-2 inline" />
              New Folder
            </button>
          </div>
        </div>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search files..."
            className="px-4 py-2 border rounded"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Modified</th>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-right text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-300">
                  <div className="flex items-center">
                    {file.type === 'folder' ? (
                      <Folder className="w-5 h-5 mr-2 text-blue-500" />
                    ) : (
                      <File className="w-5 h-5 mr-2 text-gray-500" />
                    )}
                    {file.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-300">{file.size}</td>
                <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-300">{file.lastModified}</td>
                <td className="px-6 py-4 whitespace-no-wrap border-b border-gray-300 text-right">
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => handleFileAction(file)}>
                    {file.type === 'folder' ? 'Open' : 'Download'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  )
}
