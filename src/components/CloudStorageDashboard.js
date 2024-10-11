import React, { useState, useEffect } from 'react';
import COS from 'cos-js-sdk-v5';
import { File, Folder, Home, Plus, Search, Settings, Upload } from "lucide-react";

const cos = new COS({
  SecretId: process.env.NEXT_PUBLIC_COS_SECRET_ID,
  SecretKey: process.env.NEXT_PUBLIC_COS_SECRET_KEY,
});

export default function CloudStorageDashboard() {
  const [files, setFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    fetchFiles();
  }, [currentPath]);

  const fetchFiles = () => {
    cos.getBucket({
      Bucket: process.env.NEXT_PUBLIC_COS_BUCKET,
      Region: process.env.NEXT_PUBLIC_COS_REGION,
      Prefix: currentPath,
      Delimiter: '/'
    }, (err, data) => {
      if (err) {
        console.error('Error fetching files:', err);
      } else {
        const formattedFiles = [
          ...data.CommonPrefixes.map(prefix => ({
            name: prefix.Prefix.split('/').slice(-2)[0],
            type: 'folder',
            size: '-',
            lastModified: '-'
          })),
          ...data.Contents.map(file => ({
            name: file.Key.split('/').pop(),
            type: 'file',
            size: formatFileSize(file.Size),
            lastModified: new Date(file.LastModified).toLocaleDateString()
          }))
        ];
        setFiles(formattedFiles);
      }
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      cos.putObject({
        Bucket: process.env.NEXT_PUBLIC_COS_BUCKET,
        Region: process.env.NEXT_PUBLIC_COS_REGION,
        Key: currentPath + file.name,
        Body: file
      }, (err, data) => {
        if (err) {
          console.error('Error uploading file:', err);
        } else {
          console.log('File uploaded successfully');
          fetchFiles();
        }
      });
    }
  };

  const handleCreateFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      cos.putObject({
        Bucket: process.env.NEXT_PUBLIC_COS_BUCKET,
        Region: process.env.NEXT_PUBLIC_COS_REGION,
        Key: currentPath + folderName + '/',
        Body: ''
      }, (err, data) => {
        if (err) {
          console.error('Error creating folder:', err);
        } else {
          console.log('Folder created successfully');
          fetchFiles();
        }
      });
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileAction = (file) => {
    if (file.type === 'folder') {
      setCurrentPath(currentPath + file.name + '/');
    } else {
      // For files, initiate download
      cos.getObjectUrl({
        Bucket: process.env.NEXT_PUBLIC_COS_BUCKET,
        Region: process.env.NEXT_PUBLIC_COS_REGION,
        Key: currentPath + file.name,
        Sign: true
      }, (err, data) => {
        if (err) {
          console.error('Error getting file URL:', err);
        } else {
          window.open(data.Url, '_blank');
        }
      });
    }
  };

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
            我的文件
          </a>
          <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
            <Folder className="w-5 h-5 mr-2" />
            共享文件
          </a>
          <a href="#" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100">
            <Settings className="w-5 h-5 mr-2" />
            设置
          </a>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">我的文件</h2>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => document.getElementById('fileInput').click()}>
              <Upload className="w-4 h-4 mr-2 inline" />
              上传
            </button>
            <input
              id="fileInput"
              type="file"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={handleCreateFolder}>
              <Plus className="w-4 h-4 mr-2 inline" />
              新建文件夹
            </button>
          </div>
        </div>
        <div className="mb-6">
          <input
            type="text"
            placeholder="搜索文件..."
            className="px-4 py-2 border rounded"
            value={searchTerm}
            onChange={handleSearch}
          />
          <Search className="w-4 h-4 inline ml-2" />
        </div>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">名称</th>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">大小</th>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">修改日期</th>
              <th className="px-6 py-3 border-b-2 border-gray-300 text-right text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">操作</th>
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
                    {file.type === 'folder' ? '查看' : '下载'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
