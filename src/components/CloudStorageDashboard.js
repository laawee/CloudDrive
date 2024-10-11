import React, { useState, useEffect } from 'react';
import COS from 'cos-js-sdk-v5';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
            <Button variant="outline" onClick={() => document.getElementById('fileInput').click()}>
              <Upload className="w-4 h-4 mr-2" />
              上传
            </Button>
            <input
              id="fileInput"
              type="file"
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <Button onClick={handleCreateFolder}>
              <Plus className="w-4 h-4 mr-2" />
              新建文件夹
            </Button>
          </div>
        </div>
        <div className="mb-6">
          <Input
            type="text"
            placeholder="搜索文件..."
            className="max-w-sm"
            icon={<Search className="w-4 h-4" />}
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">名称</TableHead>
              <TableHead>大小</TableHead>
              <TableHead>修改日期</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFiles.map((file, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {file.type === 'folder' ? (
                      <Folder className="w-5 h-5 mr-2 text-blue-500" />
                    ) : (
                      <File className="w-5 h-5 mr-2 text-gray-500" />
                    )}
                    {file.name}
                  </div>
                </TableCell>
                <TableCell>{file.size}</TableCell>
                <TableCell>{file.lastModified}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleFileAction(file)}>
                    {file.type === 'folder' ? '查看' : '下载'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}
