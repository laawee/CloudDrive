import React, { useState, useEffect } from 'react'
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

  const handleNavigateUp = () => {
    const newPath = currentPath.split('/').slice(0, -2).join('/') + '/'
    setCurrentPath(newPath)
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold">CloudDrive</h1>
      </header>
      <div className="flex flex-1">
        <nav className="w-48 border-r border-gray-200 p-4">
          <ul className="space-y-2">
            <li>
              <a href="#" className="flex items-center text-blue-600">
                <span className="mr-2">📁</span>
                我的文件
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center text-gray-700">
                <span className="mr-2">🔗</span>
                共享文件
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center text-gray-700">
                <span className="mr-2">⚙️</span>
                设置
              </a>
            </li>
          </ul>
        </nav>
        <main className="flex-1 p-4">
          <h2 className="text-xl font-semibold mb-4">我的文件</h2>
          <div className="flex space-x-2 mb-4">
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => document.getElementById('fileInput')?.click()}>
              上传
            </button>
            <input
              id="fileInput"
              type="file"
              className="hidden"
              onChange={handleUpload}
            />
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={handleCreateFolder}>
              新建文件夹
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={fetchFiles}>
              刷新
            </button>
          </div>
          <div className="flex items-center mb-4">
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded mr-2" onClick={handleNavigateUp}>
              上一级
            </button>
            <input
              type="text"
              placeholder="搜索文件..."
              className="flex-grow px-4 py-2 border rounded"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          {isLoading ? (
            <div className="text-center">加载中...</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">名称</th>
                  <th className="text-left p-2">大小</th>
                  <th className="text-left p-2">修改日期</th>
                  <th className="text-left p-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="p-2">
                      <span className="mr-2">{file.type === 'folder' ? '📁' : '📄'}</span>
                      {file.Key.split('/').pop()}
                    </td>
                    <td className="p-2">{file.Size} bytes</td>
                    <td className="p-2">{new Date(file.LastModified).toLocaleString()}</td>
                    <td className="p-2">
                      <button className="text-blue-600 mr-2" onClick={() => handleFileAction(file)}>
                        {file.type === 'folder' ? '打开' : '下载'}
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
