import React, { useState, useEffect } from 'react'
import { File, Folder, Home, Plus, Search, Settings, Upload, Trash2, RefreshCw } from "lucide-react"
import axios from 'axios'

interface FileItem {
  Key: string
  Size: number
  LastModified: string
  type: 'file' | 'folder'
}

export default function CloudStorageDashboard() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPath, setCurrentPath] = useState('/')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [currentPath])

  const fetchFiles = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`/api/files?prefix=${currentPath}`)
      setFiles(response.data)
    } catch (error) {
      console.error('Error fetching files:', error)
    }
    setIsLoading(false)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('path', currentPath)

      try {
        await axios.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        fetchFiles()
      } catch (error) {
        console.error('Error uploading file:', error)
        alert('文件上传失败，请重试。')
      }
    }
  }

  const handleCreateFolder = async () => {
    const folderName = prompt('请输入文件夹名称:')
    if (folderName) {
      try {
        await axios.post('/api/createFolder', { path: currentPath, folderName })
        fetchFiles()
      } catch (error) {
        console.error('Error creating folder:', error)
        alert('创建文件夹失败，请重试。')
      }
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredFiles = files.filter(file =>
    file.Key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleFileAction = (file: FileItem) => {
    if (file.type === 'folder') {
      setCurrentPath(currentPath + file.Key)
    } else {
      window.open(`/api/download?key=${encodeURIComponent(file.Key)}`, '_blank')
    }
  }

  const handleDelete = async (file: FileItem) => {
    if (confirm(`确定要删除 ${file.Key} 吗?`)) {
      try {
        await axios.delete(`/api/delete?key=${encodeURIComponent(file.Key)}`)
        fetchFiles()
      } catch (error) {
        console.error('Error deleting file:', error)
        alert('删除文件失败，请重试。')
      }
    }
  }

  const handleRefresh = () => {
    fetchFiles()
  }

  const handleNavigateUp = () => {
    const newPath = currentPath.split('/').slice(0, -2).join('/') + '/'
    setCurrentPath(newPath)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4">
        <h1 className="text-2xl font-bold text-gray-800">CloudDrive</h1>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white shadow-md p-4">
          <nav className="space-y-2">
            <a href="#" className="flex items-center px-4 py-2 text-gray-700 bg-gray-200 rounded">
              <Home className="w-5 h-5 mr-2" />
              我的文件
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              <Folder className="w-5 h-5 mr-2" />
              共享文件
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
              <Settings className="w-5 h-5 mr-2" />
              设置
            </a>
          </nav>
        </aside>
        <main className="flex-1 p-8 overflow-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">我的文件</h2>
            <div className="flex space-x-2 mb-4">
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200 flex items-center" onClick={() => document.getElementById('fileInput')?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                上传
              </button>
              <input
                id="fileInput"
                type="file"
                className="hidden"
                onChange={handleUpload}
              />
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-200 flex items-center" onClick={handleCreateFolder}>
                <Plus className="w-4 h-4 mr-2" />
                新建文件夹
              </button>
              <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-200 flex items-center" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新
              </button>
            </div>
            <div className="flex items-center mb-4">
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded mr-2" onClick={handleNavigateUp}>
                上一级
              </button>
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="搜索文件..."
                  className="w-full px-4 py-2 border rounded pr-10"
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
          {isLoading ? (
            <div className="text-center">加载中...</div>
          ) : (
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大小</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">修改日期</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFiles.map((file, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {file.type === 'folder' ? (
                          <Folder className="w-5 h-5 mr-2 text-blue-500" />
                        ) : (
                          <File className="w-5 h-5 mr-2 text-gray-500" />
                        )}
                        <span className="text-sm font-medium text-gray-900">{file.Key.split('/').pop()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatFileSize(file.Size)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(file.LastModified).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-2" onClick={() => handleFileAction(file)}>
                        {file.type === 'folder' ? '打开' : '下载'}
                      </button>
                      <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(file)}>
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>
    </div>
  )
}
